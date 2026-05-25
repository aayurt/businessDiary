import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";
import { ConflictError, NotFoundError, UnauthorizedError } from "../../lib/errors.js";
import type { JwtPayload } from "../../types/index.js";
import { userRepository } from "./user.repository.js";
import type { CreateUserInput, LoginInput, UpdateUserInput, UserQuery } from "../../schemas/user.js";
import type { User } from "@prisma/client";

const SALT_ROUNDS = 12;

function generateToken(user: User): string {
  const payload: Omit<JwtPayload, "iat" | "exp"> = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

function excludePassword(user: User): Omit<User, "password"> {
  const { password: _, ...rest } = user;
  return rest;
}

export const userService = {
  async create(input: CreateUserInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("A user with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await userRepository.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name,
      },
    });

    const token = generateToken(user);
    return { user: excludePassword(user), token };
  },

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isValid = await bcrypt.compare(input.password, user.password);
    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = generateToken(user);
    return { user: excludePassword(user), token };
  },

  async getAll(query: UserQuery) {
    const { page, limit, search, active } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (active !== undefined) where.active = active;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      userRepository.findAll({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      userRepository.count({ where }),
    ]);

    return { users: users.map(excludePassword), total, page, limit };
  },

  async getById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError("User");
    return excludePassword(user);
  },

  async update(id: string, input: UpdateUserInput) {
    const existing = await userRepository.findById(id);
    if (!existing) throw new NotFoundError("User");

    if (input.email && input.email !== existing.email) {
      const emailTaken = await userRepository.findByEmail(input.email);
      if (emailTaken) {
        throw new ConflictError("A user with this email already exists");
      }
    }

    const user = await userRepository.update({
      where: { id },
      data: input,
    });

    return excludePassword(user);
  },

  async delete(id: string) {
    const existing = await userRepository.findById(id);
    if (!existing) throw new NotFoundError("User");

    await userRepository.delete({ where: { id } });
  },

  async getProfile(userId: string) {
    const user = await userRepository.findActiveById(userId);
    if (!user) throw new NotFoundError("User");
    return excludePassword(user);
  },
};
