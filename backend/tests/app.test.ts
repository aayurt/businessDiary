import { describe, it, expect } from "vitest";
import { app } from "../src/index.js";

describe("App", () => {
  it("health check returns ok", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("ok");
  });

  it("returns 404 for unknown routes", async () => {
    const res = await app.request("/nonexistent");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("requires auth for user endpoints", async () => {
    const res = await app.request("/api/users");
    expect(res.status).toBe(401);
  });
});
