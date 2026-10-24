import { z } from "zod";
import { Operation } from "./common";

export const UserRoleSchema = z.enum(["member", "organisation"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: UserRoleSchema,
  qrCode: z.string().nullable().optional(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const OrgStatusSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  isApproved: z.boolean(),
  isOtpVerified: z.boolean(),
});
export type OrgStatus = z.infer<typeof OrgStatusSchema>;

export const SignupInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: UserRoleSchema.default("member"),
});
export type SignupInput = z.infer<typeof SignupInputSchema>;

export const SignupOutputSchema = z.object({
  user: AuthUserSchema,
  requiresEmailVerification: z.boolean(),
});
export type SignupOutput = z.infer<typeof SignupOutputSchema>;

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const LoginOutputSchema = z.object({
  token: z.string(),
  user: AuthUserSchema,
  orgStatus: OrgStatusSchema.nullable(),
});
export type LoginOutput = z.infer<typeof LoginOutputSchema>;

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
  user: AuthUserSchema,
  org: OrgStatusSchema.nullable(),
});
export type MeOutput = z.infer<typeof MeOutputSchema>;

export const signupOperation: Operation<typeof SignupInputSchema, typeof SignupOutputSchema> = {
  name: "auth.signup",
  method: "POST",
  path: "/api/v1/auth/signup",
  auth: "public",
  input: SignupInputSchema,
  output: SignupOutputSchema,
  errorCodes: ["BAD_REQUEST", "EMAIL_ALREADY_EXISTS", "INTERNAL_SERVER_ERROR"],
};

export const loginOperation: Operation<typeof LoginInputSchema, typeof LoginOutputSchema> = {
  name: "auth.login",
  method: "POST",
  path: "/api/v1/auth/login",
  auth: "public",
  input: LoginInputSchema,
  output: LoginOutputSchema,
  errorCodes: ["BAD_REQUEST", "INVALID_CREDENTIALS", "INTERNAL_SERVER_ERROR"],
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
  errorCodes: ["UNAUTHORIZED", "NOT_FOUND", "INVALID_OTP", "INTERNAL_SERVER_ERROR"],
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
