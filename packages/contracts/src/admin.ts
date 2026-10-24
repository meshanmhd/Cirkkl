import { z } from "zod";
import { Operation } from "./common";

export const GetOrgOtpInputSchema = z.object({});
export type GetOrgOtpInput = z.infer<typeof GetOrgOtpInputSchema>;

export const GetOrgOtpOutputSchema = z.object({
  code: z.string().nullable().optional(),
  legacy: z.boolean().default(false),
  message: z.string().optional(),
  expiresAt: z.union([z.string(), z.date()]).nullable().optional(),
  failedAttempts: z.number().int(),
});
export type GetOrgOtpOutput = z.infer<typeof GetOrgOtpOutputSchema>;

export const getOrgOtpOperation: Operation<typeof GetOrgOtpInputSchema, typeof GetOrgOtpOutputSchema> = {
  name: "admin.getOrgOtp",
  method: "GET",
  path: "/api/v1/admin/organisations/:id/otp",
  auth: "super_admin",
  input: GetOrgOtpInputSchema,
  output: GetOrgOtpOutputSchema,
  errorCodes: ["UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "BAD_REQUEST", "TOO_MANY_REQUESTS", "INTERNAL_SERVER_ERROR"],
};
