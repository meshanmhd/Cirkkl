import { z } from "zod";

export const HealthCheckResponseSchema = z.object({
  status: z.string(),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;
