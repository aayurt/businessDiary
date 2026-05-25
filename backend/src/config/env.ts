import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().default("7d"),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment variables:", result.error.flatten());
    process.exit(1);
  }
  return result.data;
}

export type Env = z.infer<typeof envSchema>;

export const env = parseEnv();
