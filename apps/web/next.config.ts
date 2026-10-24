import type { NextConfig } from "next";
import path from "node:path";
import fs from "node:fs";

const rootDir = path.resolve(process.cwd(), "../../");
for (const file of [".env", ".env.local", ".env.development", ".env.production"]) {
  const rootEnv = path.join(rootDir, file);
  if (fs.existsSync(rootEnv) && typeof process.loadEnvFile === "function") {
    try {
      process.loadEnvFile(rootEnv);
    } catch {}
  }
}

const nextConfig: NextConfig = {};

export default nextConfig;
