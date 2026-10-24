import { z } from "zod";
import { Operation } from "./common";
import { UserRoleSchema } from "./auth";

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: UserRoleSchema,
  fullName: z.string().nullable().optional(),
  cklId: z.string().nullable().optional(),
  college: z.string().nullable().optional(),
  branch: z.string().nullable().optional(),
  academicYear: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  isProfileCompleted: z.boolean().default(false),
  linkedinUrl: z.string().nullable().optional(),
  githubUrl: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const GetProfileInputSchema = z.object({});
export type GetProfileInput = z.infer<typeof GetProfileInputSchema>;

export const GetProfileOutputSchema = z.object({
  profile: UserProfileSchema,
});
export type GetProfileOutput = z.infer<typeof GetProfileOutputSchema>;

export const UpdateProfileInputSchema = z.object({
  fullName: z.string().min(1).optional(),
  college: z.string().optional(),
  branch: z.string().optional(),
  academicYear: z.string().optional(),
  phoneNumber: z.string().optional(),
  gender: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
  bio: z.string().max(500).optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;

export const UpdateProfileOutputSchema = z.object({
  profile: UserProfileSchema,
});
export type UpdateProfileOutput = z.infer<typeof UpdateProfileOutputSchema>;

export const UpdateAvatarInputSchema = z.object({
  avatarKey: z.string().min(1),
});
export type UpdateAvatarInput = z.infer<typeof UpdateAvatarInputSchema>;

export const UpdateAvatarOutputSchema = z.object({
  avatarUrl: z.string().url(),
});
export type UpdateAvatarOutput = z.infer<typeof UpdateAvatarOutputSchema>;

export const CollegeItemSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  city: z.string().optional(),
  state: z.string().optional(),
});
export type CollegeItem = z.infer<typeof CollegeItemSchema>;

export const SearchCollegesInputSchema = z.object({
  query: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type SearchCollegesInput = z.infer<typeof SearchCollegesInputSchema>;

export const SearchCollegesOutputSchema = z.object({
  colleges: z.array(CollegeItemSchema),
});
export type SearchCollegesOutput = z.infer<typeof SearchCollegesOutputSchema>;

export const getProfileOperation: Operation<typeof GetProfileInputSchema, typeof GetProfileOutputSchema> = {
  name: "profile.get",
  method: "GET",
  path: "/api/v1/profile",
  auth: "user",
  input: GetProfileInputSchema,
  output: GetProfileOutputSchema,
  errorCodes: ["UNAUTHORIZED", "NOT_FOUND", "INTERNAL_SERVER_ERROR"],
};

export const updateProfileOperation: Operation<typeof UpdateProfileInputSchema, typeof UpdateProfileOutputSchema> = {
  name: "profile.update",
  method: "PUT",
  path: "/api/v1/profile",
  auth: "user",
  input: UpdateProfileInputSchema,
  output: UpdateProfileOutputSchema,
  errorCodes: ["BAD_REQUEST", "UNAUTHORIZED", "INTERNAL_SERVER_ERROR"],
};

export const updateAvatarOperation: Operation<typeof UpdateAvatarInputSchema, typeof UpdateAvatarOutputSchema> = {
  name: "profile.updateAvatar",
  method: "POST",
  path: "/api/v1/profile/avatar",
  auth: "user",
  input: UpdateAvatarInputSchema,
  output: UpdateAvatarOutputSchema,
  errorCodes: ["BAD_REQUEST", "UNAUTHORIZED", "INTERNAL_SERVER_ERROR"],
};

export const searchCollegesOperation: Operation<typeof SearchCollegesInputSchema, typeof SearchCollegesOutputSchema> = {
  name: "profile.searchColleges",
  method: "GET",
  path: "/api/v1/colleges/search",
  auth: "public",
  input: SearchCollegesInputSchema,
  output: SearchCollegesOutputSchema,
  errorCodes: ["BAD_REQUEST", "INTERNAL_SERVER_ERROR"],
};
