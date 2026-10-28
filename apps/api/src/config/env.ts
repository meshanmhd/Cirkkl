import { config } from "dotenv";
import { z } from "zod";

config();

const EXAMPLE_SECRETS = new Set([
  "cirkkl-shared-proxy-secret",
  "cirkkl-otp-hmac-secret-min-32-chars",
  "cirkkl-otp-secret-key-2026",
  "cirkkl-otp-aes-gcm-secret-min-32-chars",
  "dev-test-only-otp-secret-at-least-32-chars-long",
  "dev-test-only-internal-proxy-secret-32-chars",
]);

export function validateProductionSecrets(data: {
  NODE_ENV: string;
  OTP_SECRET?: string;
  INTERNAL_PROXY_SECRET?: string;
}) {
  if (data.NODE_ENV === "production") {
    if (!data.OTP_SECRET || data.OTP_SECRET.length < 32 || EXAMPLE_SECRETS.has(data.OTP_SECRET)) {
      throw new Error("Invalid OTP_SECRET for production: must be at least 32 characters and not equal to example values");
    }
    if (!data.INTERNAL_PROXY_SECRET || data.INTERNAL_PROXY_SECRET.length < 32 || EXAMPLE_SECRETS.has(data.INTERNAL_PROXY_SECRET)) {
      throw new Error("Invalid INTERNAL_PROXY_SECRET for production: must be at least 32 characters and not equal to example values");
    }
  }
}

const EnvSchema = z.object({
  DATABASE_URL: z.string().default("postgres://postgres:postgres@localhost:5432/postgres"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  PORT: z.coerce.number().default(3001),
  BACKEND_ADAPTER: z.enum(["supabase", "memory"]).default("supabase"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  OTP_SECRET: z.string().optional(),
  INTERNAL_PROXY_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid environment configuration: ${JSON.stringify(result.error.format())}`);
  }
  validateProductionSecrets(result.data);
  return result.data;
}

export const env = loadEnv();
