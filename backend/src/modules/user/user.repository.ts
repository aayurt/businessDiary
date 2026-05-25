import { prisma } from "../../config/prisma.js";
import { BaseRepository } from "../../lib/repository.js";
import type { User } from "@prisma/client";

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(prisma.user as unknown as import("../../lib/repository.js").PrismaModel);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  async findActiveById(id: string): Promise<User | null> {
    return this.findOne({ where: { id, active: true } });
  }
}

export const userRepository = new UserRepository();
