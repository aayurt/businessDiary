import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import jwt from "jsonwebtoken";
import { requireAuth, optionalAuth, requireRole } from "../src/middleware/auth.js";
import { AppError } from "../src/lib/errors.js";

function buildApp(...middleware: ReturnType<typeof requireAuth>[]) {
  const app = new Hono();
  app.get("/protected", ...middleware, (c) => {
    const user = c.get("user");
    return c.json({ success: true, user });
  });
  app.onError((err, c) => {
    if (err instanceof AppError) {
      return c.json({ success: false, message: err.message }, err.statusCode);
    }
    return c.json({ success: false, message: "Internal server error" }, 500);
  });
  return app;
}

const validToken = jwt.sign(
  { sub: "user-1", email: "test@test.com", role: "USER" },
  process.env.JWT_SECRET!,
  { expiresIn: "1h" },
);

const adminToken = jwt.sign(
  { sub: "admin-1", email: "admin@test.com", role: "ADMIN" },
  process.env.JWT_SECRET!,
  { expiresIn: "1h" },
);

describe("requireAuth", () => {
  it("passes with valid token", async () => {
    const app = buildApp(requireAuth());
    const res = await app.request("/protected", {
      headers: { authorization: `Bearer ${validToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe("test@test.com");
  });

  it("rejects missing token", async () => {
    const app = buildApp(requireAuth());
    const res = await app.request("/protected");
    expect(res.status).toBe(401);
  });

  it("rejects invalid token", async () => {
    const app = buildApp(requireAuth());
    const res = await app.request("/protected", {
      headers: { authorization: "Bearer invalid-token" },
    });
    expect(res.status).toBe(401);
  });

  it("rejects malformed header", async () => {
    const app = buildApp(requireAuth());
    const res = await app.request("/protected", {
      headers: { authorization: "NotBearer token" },
    });
    expect(res.status).toBe(401);
  });
});

describe("optionalAuth", () => {
  it("attaches user when token is valid", async () => {
    const app = buildApp(optionalAuth());
    const res = await app.request("/protected", {
      headers: { authorization: `Bearer ${validToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe("test@test.com");
  });

  it("does not block when no token", async () => {
    const app = buildApp(optionalAuth());
    const res = await app.request("/protected");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeUndefined();
  });

  it("does not block on invalid token", async () => {
    const app = buildApp(optionalAuth());
    const res = await app.request("/protected", {
      headers: { authorization: "Bearer bad-token" },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeUndefined();
  });
});

describe("requireRole", () => {
  it("allows user with correct role", async () => {
    const app = buildApp(requireAuth(), requireRole("USER"));
    const res = await app.request("/protected", {
      headers: { authorization: `Bearer ${validToken}` },
    });
    expect(res.status).toBe(200);
  });

  it("allows admin with correct role", async () => {
    const app = buildApp(requireAuth(), requireRole("ADMIN"));
    const res = await app.request("/protected", {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
  });

  it("forbids user without required role", async () => {
    const app = buildApp(requireAuth(), requireRole("ADMIN"));
    const res = await app.request("/protected", {
      headers: { authorization: `Bearer ${validToken}` },
    });
    expect(res.status).toBe(403);
  });

  it("forbids when not authenticated", async () => {
    const app = buildApp(requireRole("USER"));
    const res = await app.request("/protected");
    expect(res.status).toBe(401);
  });
});
