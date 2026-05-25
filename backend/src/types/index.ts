import type { Role } from "@prisma/client";

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

export type AppVariables = {
  user: AuthenticatedUser;
  validated: unknown;
  validatedQuery: unknown;
  validatedParams: unknown;
};
