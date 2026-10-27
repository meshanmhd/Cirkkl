import { serve } from "@hono/node-server";
import { createContainer } from "./container";
import { env } from "./config/env";

const { app } = createContainer();

const server = serve({
  fetch: app.fetch,
  port: env.PORT,
});

console.log(`🚀 API Server running on http://localhost:${env.PORT}`);
console.log(`📊 Health check: http://localhost:${env.PORT}/health`);

export default app;
