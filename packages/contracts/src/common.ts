import { z } from "zod";

export const HttpMethodSchema = z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]);
export type HttpMethod = z.infer<typeof HttpMethodSchema>;

export const AuthRequirementSchema = z.enum(["public", "user", "org"]);
export type AuthRequirement = z.infer<typeof AuthRequirementSchema>;

export const ErrorCodeSchema = z.enum([
  "BAD_REQUEST",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "UNPROCESSABLE_ENTITY",
  "INTERNAL_SERVER_ERROR",
  "ORGANISATION_NOT_APPROVED",
  "ORGANISATION_OTP_UNVERIFIED",
  "INVALID_CREDENTIALS",
  "EMAIL_ALREADY_EXISTS",
  "INVALID_OTP",
  "ALREADY_REGISTERED",
  "REGISTRATION_CLOSED",
  "EVENT_FULL",
  "TEAM_NOT_FOUND",
  "ALREADY_IN_TEAM",
  "INVALID_TICKET_TIER",
  "PAYMENT_REQUIRED",
  "UNAUTHORIZED_EVENT_ACTION",
]);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: ErrorCodeSchema,
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const PaginationMetaSchema = z.object({
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalPages: z.number().int().min(0),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
  nextCursor: z.string().nullable().optional(),
});
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    meta: PaginationMetaSchema,
  });
}

export interface Operation<
  TInput extends z.ZodTypeAny = z.ZodTypeAny,
  TOutput extends z.ZodTypeAny = z.ZodTypeAny
> {
  name: string;
  method: HttpMethod;
  path: string;
  auth: AuthRequirement;
  input: TInput;
  output: TOutput;
  errorCodes: readonly ErrorCode[];
}
