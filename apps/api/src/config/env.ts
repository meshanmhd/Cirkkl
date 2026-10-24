import { config } from "dotenv";
import { z } from "zod";

config();

const EnvSchema = z.object({
  DATABASE_URL: z.string().default("postgres://postgres:postgres@localhost:5432/postgres"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  PORT: z.coerce.number().default(3001),
  BACKEND_ADAPTER: z.enum(["supabase", "memory"]).default("supabase"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid environment configuration: ${JSON.stringify(result.error.format())}`);
  }
  return result.data;
}

export const env = loadEnv();
