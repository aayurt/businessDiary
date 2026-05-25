import { describe, it, expect } from "vitest";
import { createUserSchema, loginSchema, updateUserSchema, userIdSchema, userQuerySchema } from "../src/schemas/user.js";

describe("createUserSchema", () => {
  it("accepts valid input", () => {
    const result = createUserSchema.safeParse({
      email: "test@example.com",
      password: "password123",
      name: "Test User",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = createUserSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = createUserSchema.safeParse({
      email: "test@example.com",
      password: "1234567",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional name", () => {
    const result = createUserSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });
});

describe("loginSchema", () => {
  it("accepts valid login", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateUserSchema", () => {
  it("accepts partial update", () => {
    const result = updateUserSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = updateUserSchema.safeParse({ email: "bad" });
    expect(result.success).toBe(false);
  });

  it("accepts empty object", () => {
    const result = updateUserSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("userIdSchema", () => {
  it("accepts valid cuid", () => {
    const result = userIdSchema.safeParse({ id: "clxabc123def456ghi789jkl" });
    expect(result.success).toBe(true);
  });

  it("rejects non-cuid", () => {
    const result = userIdSchema.safeParse({ id: "not-a-cuid" });
    expect(result.success).toBe(false);
  });
});

describe("userQuerySchema", () => {
  it("applies defaults", () => {
    const result = userQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("coerces string numbers", () => {
    const result = userQuerySchema.safeParse({ page: "2", limit: "10" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(10);
    }
  });

  it("rejects limit over 100", () => {
    const result = userQuerySchema.safeParse({ limit: "200" });
    expect(result.success).toBe(false);
  });

  it("transforms active string to boolean", () => {
    const result = userQuerySchema.safeParse({ active: "true" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active).toBe(true);
    }
  });
});
