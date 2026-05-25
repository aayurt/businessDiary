import type { MiddlewareHandler } from "hono";
import { env } from "../config/env.js";

interface CorsOptions {
  origin?: string | string[];
  credentials?: boolean;
  exposeHeaders?: string[];
  maxAge?: number;
}

export function cors(options: CorsOptions = {}): MiddlewareHandler {
  const origins = options.origin ?? "*";
  const credentials = options.credentials ?? true;

  return async (c, next) => {
    const requestOrigin = c.req.header("origin") ?? "";

    const allowOrigin =
      origins === "*"
        ? "*"
        : Array.isArray(origins)
          ? origins.includes(requestOrigin)
            ? requestOrigin
            : "none"
          : origins === requestOrigin
            ? requestOrigin
            : "none";

    if (allowOrigin !== "none") {
      c.header("Access-Control-Allow-Origin", allowOrigin);
      if (credentials) {
        c.header("Access-Control-Allow-Credentials", "true");
      }
      c.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      );
      c.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With",
      );
      if (options.exposeHeaders?.length) {
        c.header("Access-Control-Expose-Headers", options.exposeHeaders.join(", "));
      }
      if (options.maxAge != null) {
        c.header("Access-Control-Max-Age", String(options.maxAge));
      }
    }

    if (c.req.method === "OPTIONS") {
      return c.body(null, 204);
    }

    await next();
  };
}

/**
 * Pre-configured CORS for production use.
 */
export function createCorsMiddleware(): MiddlewareHandler {
  if (env.NODE_ENV === "production") {
    return cors({
      origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
      credentials: true,
      maxAge: 86400,
    });
  }
  return cors();
}
