import { describe, it, expect } from "vitest";
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from "../src/lib/errors.js";

describe("AppError", () => {
  it("creates a basic error with status code", () => {
    const err = new AppError("Something went wrong", 500);
    expect(err.message).toBe("Something went wrong");
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(true);
  });

  it("marks non-operational errors", () => {
    const err = new AppError("Critical", 500, false);
    expect(err.isOperational).toBe(false);
  });
});

describe("NotFoundError", () => {
  it("defaults to Resource not found", () => {
    const err = new NotFoundError();
    expect(err.message).toBe("Resource not found");
    expect(err.statusCode).toBe(404);
  });

  it("accepts custom resource name", () => {
    const err = new NotFoundError("User");
    expect(err.message).toBe("User not found");
  });
});

describe("UnauthorizedError", () => {
  it("defaults to Unauthorized", () => {
    const err = new UnauthorizedError();
    expect(err.message).toBe("Unauthorized");
    expect(err.statusCode).toBe(401);
  });
});

describe("ForbiddenError", () => {
  it("defaults to Forbidden", () => {
    const err = new ForbiddenError();
    expect(err.message).toBe("Forbidden");
    expect(err.statusCode).toBe(403);
  });
});

describe("ConflictError", () => {
  it("defaults to Conflict", () => {
    const err = new ConflictError();
    expect(err.message).toBe("Conflict");
    expect(err.statusCode).toBe(409);
  });
});

describe("ValidationError", () => {
  it("stores field errors", () => {
    const errors = { email: ["Invalid email"] };
    const err = new ValidationError(errors);
    expect(err.message).toBe("Validation failed");
    expect(err.statusCode).toBe(422);
    expect(err.errors).toEqual(errors);
  });
});
