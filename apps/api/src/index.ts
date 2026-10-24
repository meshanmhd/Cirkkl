import { serve } from "@hono/node-server";
import { createContainer } from "./container";
import { env } from "./config/env";

const { app } = createContainer();

serve({
  fetch: app.fetch,
  port: env.PORT,
});

export default app;
