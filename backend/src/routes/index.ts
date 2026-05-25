import { Hono } from "hono";
import { userController } from "../modules/user/user.controller.js";

const api = new Hono();

api.route("/users", userController);

export { api };
