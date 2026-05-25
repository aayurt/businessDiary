import { Hono } from "hono";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { env } from "./config/env.js";
import { createCorsMiddleware, errorHandler, rateLimiter } from "./middleware/index.js";
import { api } from "./routes/index.js";

const app = new Hono();

app.use("*", createCorsMiddleware());
app.use("*", logger());
app.use("*", rateLimiter());

app.get("/health", (c) => {
  return c.json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

app.route("/api", api);

app.onError(errorHandler());

app.notFound((c) => {
  return c.json(
    { success: false, message: `Route ${c.req.method} ${c.req.path} not found` },
    404,
  );
});

export { app };

if (env.NODE_ENV !== "test") {
  serve(
    { fetch: app.fetch, port: env.PORT },
    (info) => {
      console.log(`Server running on http://localhost:${info.port} [${env.NODE_ENV}]`);
    },
  );
}
