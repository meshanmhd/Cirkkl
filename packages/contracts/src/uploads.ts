import { z } from "zod";
import { Operation } from "./common";

export const UploadTargetTypeSchema = z.enum([
  "profile_image",
  "event_image",
  "payment_proof",
]);
export type UploadTargetType = z.infer<typeof UploadTargetTypeSchema>;

export const RequestUploadInputSchema = z.object({
  targetType: UploadTargetTypeSchema,
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive().max(10 * 1024 * 1024),
});
export type RequestUploadInput = z.infer<typeof RequestUploadInputSchema>;

export const RequestUploadOutputSchema = z.object({
  key: z.string().min(1),
  uploadUrl: z.string().url(),
  method: z.enum(["PUT", "POST"]).default("PUT"),
  headers: z.record(z.string(), z.string()).default({}),
  publicUrl: z.string().url().optional(),
  expiresAt: z.string(),
});
export type RequestUploadOutput = z.infer<typeof RequestUploadOutputSchema>;

export const requestUploadOperation: Operation<typeof RequestUploadInputSchema, typeof RequestUploadOutputSchema> = {
  name: "uploads.requestUpload",
  method: "POST",
  path: "/api/v1/uploads/presigned-url",
  auth: "user",
  input: RequestUploadInputSchema,
  output: RequestUploadOutputSchema,
  errorCodes: ["BAD_REQUEST", "UNAUTHORIZED", "UNPROCESSABLE_ENTITY", "INTERNAL_SERVER_ERROR"],
};
