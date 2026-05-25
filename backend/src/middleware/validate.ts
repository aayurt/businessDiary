import type { MiddlewareHandler } from "hono";
import type { ZodSchema } from "zod";
import { ValidationError } from "../lib/errors.js";

type ValidationTarget = "json" | "query" | "param";

interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

function formatZodErrors(
  errors: { path: (string | number)[]; message: string }[],
): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  for (const issue of errors) {
    const key = issue.path.join(".");
    if (!formatted[key]) formatted[key] = [];
    formatted[key].push(issue.message);
  }
  return formatted;
}

function validate(target: ValidationTarget, schema: ZodSchema): MiddlewareHandler {
  return async (c, next) => {
    let data: unknown;

    switch (target) {
      case "json":
        data = await c.req.json().catch(() => ({}));
        break;
      case "query":
        data = c.req.query();
        break;
      case "param":
        data = c.req.param();
        break;
    }

    const result = schema.safeParse(data);
    if (!result.success) {
      throw new ValidationError(formatZodErrors(result.error.errors));
    }

    const set = c.set as (key: string, value: unknown) => void;
    switch (target) {
      case "json":
        set("validated", result.data);
        break;
      case "query":
        set("validatedQuery", result.data);
        break;
      case "param":
        set("validatedParams", result.data);
        break;
    }

    await next();
  };
}

/**
 * Composite validator that can validate body, query, and params at once.
 */
export function validateRequest(options: ValidationOptions): MiddlewareHandler[] {
  const handlers: MiddlewareHandler[] = [];

  if (options.body) {
    handlers.push(validate("json", options.body));
  }
  if (options.query) {
    handlers.push(validate("query", options.query));
  }
  if (options.params) {
    handlers.push(validate("param", options.params));
  }

  return handlers;
}

export function validateBody(schema: ZodSchema): MiddlewareHandler {
  return validate("json", schema);
}

export function validateQuery(schema: ZodSchema): MiddlewareHandler {
  return validate("query", schema);
}

export function validateParams(schema: ZodSchema): MiddlewareHandler {
  return validate("param", schema);
}
