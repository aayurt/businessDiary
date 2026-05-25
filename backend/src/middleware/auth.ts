import type { MiddlewareHandler } from "hono";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { UnauthorizedError, ForbiddenError } from "../lib/errors.js";
import type { JwtPayload, AuthenticatedUser } from "../types/index.js";

const BEARER_PREFIX = "Bearer ";

function extractToken(c: Parameters<MiddlewareHandler>[0]): string | null {
  const header = c.req.header("authorization");
  if (!header?.startsWith(BEARER_PREFIX)) return null;
  return header.slice(BEARER_PREFIX.length).trim();
}

function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}

/**
 * Middleware that requires a valid JWT token.
 * Attaches the decoded user to `c.var.user`.
 */
export function requireAuth(): MiddlewareHandler {
  return async (c, next) => {
    const token = extractToken(c);
    if (!token) {
      throw new UnauthorizedError("Missing authentication token");
    }

    const payload = verifyToken(token);
    const user: AuthenticatedUser = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    c.set("user", user);
    await next();
  };
}

/**
 * Middleware that restricts access to specific roles.
 * Must be used after `requireAuth`.
 */
export function requireRole(...roles: string[]): MiddlewareHandler {
  return async (c, next) => {
    const user = c.get("user") as AuthenticatedUser | undefined;
    if (!user) {
      throw new UnauthorizedError("Authentication required");
    }
    if (!roles.includes(user.role)) {
      throw new ForbiddenError("Insufficient permissions");
    }
    await next();
  };
}

/**
 * Optional auth — attaches user if token is present, but does not block.
 */
export function optionalAuth(): MiddlewareHandler {
  return async (c, next) => {
    const token = extractToken(c);
    if (token) {
      try {
        const payload = verifyToken(token);
        c.set("user", {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
        } satisfies AuthenticatedUser);
      } catch {
        // Token invalid — proceed without user
      }
    }
    await next();
  };
}
