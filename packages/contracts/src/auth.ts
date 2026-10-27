import { z } from "zod";
import { Operation } from "./common";

export const UserRoleSchema = z.enum(["member", "organisation", "attendee", "organiser"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().nullable().optional(),
  name: z.string().optional(),
  role: UserRoleSchema,
  qrCode: z.string().nullable().optional(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const OrgStatusSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().optional(),
  isApproved: z.boolean(),
  isOtpVerified: z.boolean(),
});
export type OrgStatus = z.infer<typeof OrgStatusSchema>;

export const SignupInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: UserRoleSchema.default("member"),
  orgName: z.string().optional(),
});
export type SignupInput = z.infer<typeof SignupInputSchema>;

export const SignupOutputSchema = z.object({
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  expiresAt: z.number().int().optional(),
  user: AuthUserSchema.optional(),
  requiresEmailVerification: z.boolean().default(false),
});
export type SignupOutput = z.infer<typeof SignupOutputSchema>;

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const LoginOutputSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.number().int(),
  token: z.string().optional(),
  user: AuthUserSchema.optional(),
  orgStatus: OrgStatusSchema.nullable().optional(),
});
export type LoginOutput = z.infer<typeof LoginOutputSchema>;

export const RefreshInputSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshInput = z.infer<typeof RefreshInputSchema>;

export const RefreshOutputSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.number().int(),
});
export type RefreshOutput = z.infer<typeof RefreshOutputSchema>;

export const LogoutInputSchema = z.object({});
export type LogoutInput = z.infer<typeof LogoutInputSchema>;

export const LogoutOutputSchema = z.object({
  success: z.boolean(),
});
export type LogoutOutput = z.infer<typeof LogoutOutputSchema>;

export const VerifyOrgOtpInputSchema = z.object({
  otpCode: z.string().min(4).max(10),
});
export type VerifyOrgOtpInput = z.infer<typeof VerifyOrgOtpInputSchema>;

export const VerifyOrgOtpOutputSchema = z.object({
  success: z.boolean(),
  isOtpVerified: z.boolean(),
  isApproved: z.boolean(),
});
export type VerifyOrgOtpOutput = z.infer<typeof VerifyOrgOtpOutputSchema>;

export const MeInputSchema = z.object({});
export type MeInput = z.infer<typeof MeInputSchema>;

export const MeOutputSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().nullable().optional(),
  role: UserRoleSchema,
  org: z
    .object({
      name: z.string().optional(),
      isOtpVerified: z.boolean(),
      isApproved: z.boolean(),
    })
    .optional(),
  user: z
    .object({
      id: z.string().uuid(),
      email: z.string().nullable().optional(),
      name: z.string().optional(),
      role: UserRoleSchema,
    })
    .optional(),
});
export type MeOutput = z.infer<typeof MeOutputSchema>;

export const signupOperation: Operation<typeof SignupInputSchema, typeof SignupOutputSchema> = {
  name: "auth.signup",
  method: "POST",
  path: "/api/v1/auth/signup",
  auth: "public",
  input: SignupInputSchema,
  output: SignupOutputSchema,
  errorCodes: ["BAD_REQUEST", "EMAIL_ALREADY_EXISTS", "TOO_MANY_REQUESTS", "INTERNAL_SERVER_ERROR"],
};

export const loginOperation: Operation<typeof LoginInputSchema, typeof LoginOutputSchema> = {
  name: "auth.login",
  method: "POST",
  path: "/api/v1/auth/login",
  auth: "public",
  input: LoginInputSchema,
  output: LoginOutputSchema,
  errorCodes: ["BAD_REQUEST", "INVALID_CREDENTIALS", "TOO_MANY_REQUESTS", "INTERNAL_SERVER_ERROR"],
};

export const refreshOperation: Operation<typeof RefreshInputSchema, typeof RefreshOutputSchema> = {
  name: "auth.refresh",
  method: "POST",
  path: "/api/v1/auth/refresh",
  auth: "public",
  input: RefreshInputSchema,
  output: RefreshOutputSchema,
  errorCodes: ["BAD_REQUEST", "UNAUTHORIZED", "INTERNAL_SERVER_ERROR"],
};

export const logoutOperation: Operation<typeof LogoutInputSchema, typeof LogoutOutputSchema> = {
  name: "auth.logout",
  method: "POST",
  path: "/api/v1/auth/logout",
  auth: "user",
  input: LogoutInputSchema,
  output: LogoutOutputSchema,
  errorCodes: ["UNAUTHORIZED", "INTERNAL_SERVER_ERROR"],
};

export const verifyOrgOtpOperation: Operation<typeof VerifyOrgOtpInputSchema, typeof VerifyOrgOtpOutputSchema> = {
  name: "auth.verifyOrgOtp",
  method: "POST",
  path: "/api/v1/auth/verify-org-otp",
  auth: "user",
  input: VerifyOrgOtpInputSchema,
  output: VerifyOrgOtpOutputSchema,
  errorCodes: ["UNAUTHORIZED", "NOT_FOUND", "INVALID_OTP", "TOO_MANY_REQUESTS", "INTERNAL_SERVER_ERROR"],
};

export const meOperation: Operation<typeof MeInputSchema, typeof MeOutputSchema> = {
  name: "auth.me",
  method: "GET",
  path: "/api/v1/auth/me",
  auth: "user",
  input: MeInputSchema,
  output: MeOutputSchema,
  errorCodes: ["UNAUTHORIZED", "INTERNAL_SERVER_ERROR"],
};

export const ResendOrgOtpInputSchema = z.object({});
export type ResendOrgOtpInput = z.infer<typeof ResendOrgOtpInputSchema>;

export const ResendOrgOtpOutputSchema = z.object({
  success: z.boolean(),
});
export type ResendOrgOtpOutput = z.infer<typeof ResendOrgOtpOutputSchema>;

export const resendOrgOtpOperation: Operation<typeof ResendOrgOtpInputSchema, typeof ResendOrgOtpOutputSchema> = {
  name: "auth.resendOrgOtp",
  method: "POST",
  path: "/api/v1/auth/resend-org-otp",
  auth: "user",
  input: ResendOrgOtpInputSchema,
  output: ResendOrgOtpOutputSchema,
  errorCodes: ["UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "TOO_MANY_REQUESTS", "INTERNAL_SERVER_ERROR"],
};
