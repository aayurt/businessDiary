import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendPaginated,
  sendError,
} from "../src/lib/response.js";

describe("Response helpers", () => {
  const app = new Hono();

  app.get("/success", (c) => sendSuccess(c, { id: 1 }, "Fetched"));
  app.get("/created", (c) => sendCreated(c, { id: 2 }));
  app.get("/no-content", (c) => sendNoContent(c));
  app.get("/paginated", (c) => sendPaginated(c, [{ id: 1 }], 100, 1, 20));
  app.get("/error", (c) => sendError(c, 400, "Bad request"));

  it("sendSuccess returns 200 with data", async () => {
    const res = await app.request("/success");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ id: 1 });
    expect(body.message).toBe("Fetched");
  });

  it("sendCreated returns 201", async () => {
    const res = await app.request("/created");
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ id: 2 });
    expect(body.message).toBe("Created successfully");
  });

  it("sendNoContent returns 204", async () => {
    const res = await app.request("/no-content");
    expect(res.status).toBe(204);
  });

  it("sendPaginated returns paginated response", async () => {
    const res = await app.request("/paginated");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.meta).toEqual({
      page: 1,
      limit: 20,
      total: 100,
      totalPages: 5,
    });
  });

  it("sendError returns error response", async () => {
    const res = await app.request("/error");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("Bad request");
  });
});
