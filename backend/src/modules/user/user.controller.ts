import { Hono } from "hono";
import { authRateLimiter, requireAuth, validateBody, validateQuery } from "../../middleware/index.js";
import {
  createUserSchema,
  loginSchema,
  updateUserSchema,
  userQuerySchema,
} from "../../schemas/user.js";
import type { CreateUserInput, LoginInput, UpdateUserInput, UserQuery } from "../../schemas/user.js";
import { sendCreated, sendSuccess, sendNoContent, sendPaginated } from "../../lib/response.js";
import { userService } from "./user.service.js";
import type { AuthenticatedUser } from "../../types/index.js";

type Variables = {
  validated: CreateUserInput | LoginInput | UpdateUserInput;
  validatedQuery: UserQuery;
  user: AuthenticatedUser;
};

const userController = new Hono<{ Variables: Variables }>();

userController.post("/register", authRateLimiter(), validateBody(createUserSchema), async (c) => {
  const input = c.var.validated;
  const result = await userService.create(input as CreateUserInput);
  return sendCreated(c, result, "User registered successfully");
});

userController.post("/login", authRateLimiter(), validateBody(loginSchema), async (c) => {
  const input = c.var.validated;
  const result = await userService.login(input as LoginInput);
  return sendSuccess(c, result, "Login successful");
});

userController.get("/me", requireAuth(), async (c) => {
  const user = c.var.user;
  const profile = await userService.getProfile(user.id);
  return sendSuccess(c, profile);
});

userController.get("/", requireAuth(), validateQuery(userQuerySchema), async (c) => {
  const query = c.var.validatedQuery;
  const result = await userService.getAll(query);
  return sendPaginated(c, result.users, result.total, result.page, result.limit);
});

userController.get("/:id", requireAuth(), async (c) => {
  const id = c.req.param("id");
  const user = await userService.getById(id);
  return sendSuccess(c, user);
});

userController.patch("/:id", requireAuth(), validateBody(updateUserSchema), async (c) => {
  const id = c.req.param("id");
  const input = c.var.validated;
  const user = await userService.update(id, input as UpdateUserInput);
  return sendSuccess(c, user, "User updated successfully");
});

userController.delete("/:id", requireAuth(), async (c) => {
  const id = c.req.param("id");
  await userService.delete(id);
  return sendNoContent(c);
});

export { userController };
