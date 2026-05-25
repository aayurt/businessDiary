import type { Context, ErrorHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { AppError, ValidationError } from "../lib/errors.js";
import { sendError } from "../lib/response.js";
import { env } from "../config/env.js";

export function errorHandler(): ErrorHandler {
  return (err: Error, c: Context) => {
    const requestId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    if (err instanceof ValidationError) {
      return sendError(c, err.statusCode as ContentfulStatusCode, err.message, err.errors);
    }

    if (err instanceof AppError) {
      return sendError(c, err.statusCode as ContentfulStatusCode, err.message);
    }

    if (err.name === "ZodError") {
      const zodError = err as unknown as {
        errors: Array<{ path: (string | number)[]; message: string }>;
      };
      const formatted: Record<string, string[]> = {};
      for (const issue of zodError.errors) {
        const key = issue.path.join(".");
        if (!formatted[key]) formatted[key] = [];
        formatted[key].push(issue.message);
      }
      return sendError(c, 422, "Validation failed", formatted);
    }

    if (err.name === "PrismaClientKnownRequestError") {
      const prismaErr = err as unknown as { code: string; meta?: Record<string, unknown> };
      if (prismaErr.code === "P2002") {
        return sendError(c, 409, "Resource already exists");
      }
      if (prismaErr.code === "P2025") {
        return sendError(c, 404, "Resource not found");
      }
    }

    const isProduction = env.NODE_ENV === "production";
    const logData = {
      requestId,
      method: c.req.method,
      path: c.req.path,
      error: err.message,
      stack: isProduction ? undefined : err.stack,
    };

    if (isProduction) {
      console.error(JSON.stringify({ level: "error", ...logData }));
    } else {
      console.error("[Error]", JSON.stringify(logData, null, 2));
    }

    return sendError(c, 500, "Internal server error");
  };
}
