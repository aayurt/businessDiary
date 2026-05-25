import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
  name: z.string().min(1, "Name is required").max(255).optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  name: z.string().min(1, "Name is required").max(255).optional(),
  active: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const userIdSchema = z.object({
  id: z.string().cuid("Invalid user ID"),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  active: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;
