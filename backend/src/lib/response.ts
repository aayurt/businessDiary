import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function sendSuccess<T>(
  c: Context,
  data: T,
  message?: string,
  statusCode: ContentfulStatusCode = 200,
) {
  const body: ApiResponse<T> = { success: true, data };
  if (message) body.message = message;
  return c.json(body, statusCode);
}

export function sendCreated<T>(c: Context, data: T, message?: string) {
  return sendSuccess(c, data, message ?? "Created successfully", 201);
}

export function sendNoContent(c: Context) {
  return c.body(null, 204);
}

export function sendPaginated<T>(
  c: Context,
  data: T[],
  total: number,
  page: number,
  limit: number,
) {
  const meta: PaginationMeta = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
  return c.json({ success: true, data, meta }, 200);
}

export function sendError(
  c: Context,
  statusCode: ContentfulStatusCode,
  message: string,
  errors?: Record<string, string[]>,
) {
  const body: ApiResponse = { success: false, message };
  if (errors) body.errors = errors;
  return c.json(body, statusCode);
}
