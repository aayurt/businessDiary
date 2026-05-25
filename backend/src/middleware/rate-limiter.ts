import type { Context, MiddlewareHandler } from "hono";
import { env } from "../config/env.js";

interface RateLimiterEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  statusCode?: number;
  keyGenerator?: (c: Context) => string;
}

const store = new Map<string, RateLimiterEntry>();

function cleanup(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function rateLimiter(options: RateLimiterOptions = {}): MiddlewareHandler {
  const windowMs = options.windowMs ?? env.RATE_LIMIT_WINDOW_MS;
  const max = options.max ?? env.RATE_LIMIT_MAX;
  const message = options.message ?? "Too many requests, please try again later";
  const statusCode = options.statusCode ?? 429;

  const keyGen =
    options.keyGenerator ??
    ((c: Context) => {
      const forwarded = c.req.header("x-forwarded-for");
      const ip = forwarded?.split(",")[0]?.trim();
      return ip ?? c.req.header("x-real-ip") ?? "unknown";
    });

  return async (c, next) => {
    cleanup();
    const key = keyGen(c);
    const now = Date.now();

    let entry = store.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    c.header("X-RateLimit-Limit", String(max));
    c.header("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)));
    c.header("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
      return c.json({ success: false, message }, statusCode as 429);
    }

    await next();
  };
}

export function authRateLimiter(): MiddlewareHandler {
  return rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many authentication attempts, please try again later",
  });
}
