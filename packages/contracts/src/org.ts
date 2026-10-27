import { z } from "zod";
import { Operation, PaginationMetaSchema, PaginationQuerySchema } from "./common";
import { RegistrationStatusSchema } from "./registrations";

export const OrgEventRegistrationItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  userName: z.string(),
  userEmail: z.string().nullable().optional().default(""),
  userPhone: z.string().nullable().optional(),
  cklId: z.string().nullable().optional(),
  status: RegistrationStatusSchema,
  attended: z.boolean().default(false),
  ticketCode: z.string(),
  ticketName: z.string().nullable().optional(),
  ticketPrice: z.number().nullable().optional(),
  isTeam: z.boolean(),
  teamId: z.string().uuid().nullable().optional(),
  teamName: z.string().nullable().optional(),
  teamLeaderId: z.string().uuid().nullable().optional(),
  teamMembers: z.array(
    z.object({
      id: z.string().uuid(),
      userId: z.string().uuid(),
      name: z.string(),
      email: z.string().nullable().optional().default(""),
      status: z.string(),
      cklId: z.string().nullable().optional(),
    })
  ).default([]),
  fieldValues: z.record(z.string(), z.any()).default({}),
  paymentProofUrl: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type OrgEventRegistrationItem = z.infer<typeof OrgEventRegistrationItemSchema>;

export const GetOrgEventRegistrationsInputSchema = PaginationQuerySchema.extend({
  eventId: z.string(),
  status: RegistrationStatusSchema.optional(),
  search: z.string().optional(),
});
export type GetOrgEventRegistrationsInput = z.infer<typeof GetOrgEventRegistrationsInputSchema>;

export const GetOrgEventRegistrationsOutputSchema = z.object({
  items: z.array(OrgEventRegistrationItemSchema),
  meta: PaginationMetaSchema,
});
export type GetOrgEventRegistrationsOutput = z.infer<typeof GetOrgEventRegistrationsOutputSchema>;

export const ApproveRegistrationInputSchema = z.object({
  eventId: z.string().uuid(),
  registrationId: z.string().uuid(),
});
export type ApproveRegistrationInput = z.infer<typeof ApproveRegistrationInputSchema>;

export const ApproveRegistrationOutputSchema = z.object({
  success: z.boolean(),
  registrationId: z.string().uuid(),
  status: z.literal("approved"),
});
export type ApproveRegistrationOutput = z.infer<typeof ApproveRegistrationOutputSchema>;

export const RejectRegistrationInputSchema = z.object({
  eventId: z.string().uuid(),
  registrationId: z.string().uuid(),
});
export type RejectRegistrationInput = z.infer<typeof RejectRegistrationInputSchema>;

export const RejectRegistrationOutputSchema = z.object({
  success: z.boolean(),
  registrationId: z.string().uuid(),
  status: z.literal("rejected"),
});
export type RejectRegistrationOutput = z.infer<typeof RejectRegistrationOutputSchema>;

export const CancelRegistrationInputSchema = z.object({
  eventId: z.string().uuid(),
  registrationId: z.string().uuid(),
});
export type CancelRegistrationInput = z.infer<typeof CancelRegistrationInputSchema>;

export const CancelRegistrationOutputSchema = z.object({
  success: z.boolean(),
  registrationId: z.string().uuid(),
  status: z.literal("cancelled"),
});
export type CancelRegistrationOutput = z.infer<typeof CancelRegistrationOutputSchema>;

export const ToggleAttendanceInputSchema = z.object({
  eventId: z.string().uuid(),
  registrationId: z.string().uuid(),
  attended: z.boolean(),
});
export type ToggleAttendanceInput = z.infer<typeof ToggleAttendanceInputSchema>;

export const ToggleAttendanceOutputSchema = z.object({
  success: z.boolean(),
  registrationId: z.string().uuid(),
  attended: z.boolean(),
});
export type ToggleAttendanceOutput = z.infer<typeof ToggleAttendanceOutputSchema>;

export const EventRoleMemberSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string(),
  userId: z.string().uuid(),
  name: z.string(),
  email: z.string().nullable().optional().default(""),
  role: z.string(),
});
export type EventRoleMember = z.infer<typeof EventRoleMemberSchema>;

export const AvailableOrgMemberSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  email: z.string().nullable().optional().default(""),
  role: z.string(),
  department: z.string().nullable().optional(),
});
export type AvailableOrgMember = z.infer<typeof AvailableOrgMemberSchema>;

export const GetEventRolesInputSchema = z.object({
  eventId: z.string(),
});
export type GetEventRolesInput = z.infer<typeof GetEventRolesInputSchema>;

export const GetEventRolesOutputSchema = z.object({
  roles: z.array(EventRoleMemberSchema),
  availableMembers: z.array(AvailableOrgMemberSchema),
});
export type GetEventRolesOutput = z.infer<typeof GetEventRolesOutputSchema>;

export const CreateEventRoleInputSchema = z.object({
  eventId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.string(),
});
export type CreateEventRoleInput = z.infer<typeof CreateEventRoleInputSchema>;

export const CreateEventRoleOutputSchema = z.object({
  roleId: z.string().uuid(),
  eventId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.string(),
});
export type CreateEventRoleOutput = z.infer<typeof CreateEventRoleOutputSchema>;

export const DeleteEventRoleInputSchema = z.object({
  eventId: z.string().uuid(),
  roleId: z.string().uuid(),
});
export type DeleteEventRoleInput = z.infer<typeof DeleteEventRoleInputSchema>;

export const DeleteEventRoleOutputSchema = z.object({
  success: z.boolean(),
});
export type DeleteEventRoleOutput = z.infer<typeof DeleteEventRoleOutputSchema>;

export const OrgMemberItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  email: z.string().nullable().optional().default(""),
  role: z.string(),
  department: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type OrgMemberItem = z.infer<typeof OrgMemberItemSchema>;

export const ListMembersInputSchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  department: z.string().optional(),
  role: z.string().optional(),
});
export type ListMembersInput = z.infer<typeof ListMembersInputSchema>;

export const ListMembersOutputSchema = z.object({
  items: z.array(OrgMemberItemSchema),
  meta: PaginationMetaSchema,
});
export type ListMembersOutput = z.infer<typeof ListMembersOutputSchema>;

export const UpdateMemberRoleInputSchema = z.object({
  memberId: z.string().uuid(),
  role: z.string(),
});
export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleInputSchema>;

export const UpdateMemberRoleOutputSchema = z.object({
  success: z.boolean(),
  memberId: z.string().uuid(),
  role: z.string(),
});
export type UpdateMemberRoleOutput = z.infer<typeof UpdateMemberRoleOutputSchema>;

export const ScanAttendanceInputSchema = z.object({
  eventId: z.string().uuid(),
  ticketCode: z.string(),
});
export type ScanAttendanceInput = z.infer<typeof ScanAttendanceInputSchema>;

export const ScanAttendanceOutputSchema = z.object({
  registrationId: z.string().uuid(),
  ticketCode: z.string(),
  attended: z.boolean(),
  ticketTitle: z.string().nullable().optional(),
  registeredAt: z.string(),
  participant: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string(),
    cklId: z.string().nullable().optional(),
    college: z.string().nullable().optional(),
  }),
});
export type ScanAttendanceOutput = z.infer<typeof ScanAttendanceOutputSchema>;

export const ConfirmAttendanceInputSchema = z.object({
  eventId: z.string().uuid(),
  registrationId: z.string().uuid(),
});
export type ConfirmAttendanceInput = z.infer<typeof ConfirmAttendanceInputSchema>;

export const ConfirmAttendanceOutputSchema = z.object({
  success: z.boolean(),
  registrationId: z.string().uuid(),
  attended: z.literal(true),
  attendedAt: z.string(),
});
export type ConfirmAttendanceOutput = z.infer<typeof ConfirmAttendanceOutputSchema>;

export const getOrgEventRegistrationsOperation: Operation<typeof GetOrgEventRegistrationsInputSchema, typeof GetOrgEventRegistrationsOutputSchema> = {
  name: "org.getEventRegistrations",
  method: "GET",
  path: "/api/v1/org/events/:eventId/registrations",
  auth: "org",
  input: GetOrgEventRegistrationsInputSchema,
  output: GetOrgEventRegistrationsOutputSchema,
  errorCodes: ["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "INTERNAL_SERVER_ERROR"],
};

export const approveRegistrationOperation: Operation<typeof ApproveRegistrationInputSchema, typeof ApproveRegistrationOutputSchema> = {
  name: "org.approveRegistration",
  method: "POST",
  path: "/api/v1/org/events/:eventId/registrations/:registrationId/approve",
  auth: "org",
  input: ApproveRegistrationInputSchema,
  output: ApproveRegistrationOutputSchema,
  errorCodes: ["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "INTERNAL_SERVER_ERROR"],
};

export const rejectRegistrationOperation: Operation<typeof RejectRegistrationInputSchema, typeof RejectRegistrationOutputSchema> = {
  name: "org.rejectRegistration",
  method: "POST",
  path: "/api/v1/org/events/:eventId/registrations/:registrationId/reject",
  auth: "org",
  input: RejectRegistrationInputSchema,
  output: RejectRegistrationOutputSchema,
  errorCodes: ["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "INTERNAL_SERVER_ERROR"],
};

export const cancelRegistrationOperation: Operation<typeof CancelRegistrationInputSchema, typeof CancelRegistrationOutputSchema> = {
  name: "org.cancelRegistration",
  method: "POST",
  path: "/api/v1/org/events/:eventId/registrations/:registrationId/cancel",
  auth: "org",
  input: CancelRegistrationInputSchema,
  output: CancelRegistrationOutputSchema,
  errorCodes: ["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "INTERNAL_SERVER_ERROR"],
};

export const toggleAttendanceOperation: Operation<typeof ToggleAttendanceInputSchema, typeof ToggleAttendanceOutputSchema> = {
  name: "org.toggleAttendance",
  method: "PATCH",
  path: "/api/v1/org/events/:eventId/registrations/:registrationId/attendance",
  auth: "org",
  input: ToggleAttendanceInputSchema,
  output: ToggleAttendanceOutputSchema,
  errorCodes: ["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "INTERNAL_SERVER_ERROR"],
};

export const getEventRolesOperation: Operation<typeof GetEventRolesInputSchema, typeof GetEventRolesOutputSchema> = {
  name: "org.getEventRoles",
  method: "GET",
  path: "/api/v1/org/events/:eventId/roles",
  auth: "org",
  input: GetEventRolesInputSchema,
  output: GetEventRolesOutputSchema,
  errorCodes: ["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "INTERNAL_SERVER_ERROR"],
};

export const createEventRoleOperation: Operation<typeof CreateEventRoleInputSchema, typeof CreateEventRoleOutputSchema> = {
  name: "org.createEventRole",
  method: "POST",
  path: "/api/v1/org/events/:eventId/roles",
  auth: "org",
  input: CreateEventRoleInputSchema,
  output: CreateEventRoleOutputSchema,
  errorCodes: ["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "CONFLICT", "INTERNAL_SERVER_ERROR"],
};

export const deleteEventRoleOperation: Operation<typeof DeleteEventRoleInputSchema, typeof DeleteEventRoleOutputSchema> = {
  name: "org.deleteEventRole",
  method: "DELETE",
  path: "/api/v1/org/events/:eventId/roles/:roleId",
  auth: "org",
  input: DeleteEventRoleInputSchema,
  output: DeleteEventRoleOutputSchema,
  errorCodes: ["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "INTERNAL_SERVER_ERROR"],
};

export const listMembersOperation: Operation<typeof ListMembersInputSchema, typeof ListMembersOutputSchema> = {
  name: "org.listMembers",
  method: "GET",
  path: "/api/v1/org/members",
  auth: "org",
  input: ListMembersInputSchema,
  output: ListMembersOutputSchema,
  errorCodes: ["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "INTERNAL_SERVER_ERROR"],
};

export const updateMemberRoleOperation: Operation<typeof UpdateMemberRoleInputSchema, typeof UpdateMemberRoleOutputSchema> = {
  name: "org.updateMemberRole",
  method: "PATCH",
  path: "/api/v1/org/members/:memberId/role",
  auth: "org",
  input: UpdateMemberRoleInputSchema,
  output: UpdateMemberRoleOutputSchema,
  errorCodes: ["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "INTERNAL_SERVER_ERROR"],
};

export const scanAttendanceOperation: Operation<typeof ScanAttendanceInputSchema, typeof ScanAttendanceOutputSchema> = {
  name: "org.scanAttendance",
  method: "POST",
  path: "/api/v1/org/events/:eventId/attendance/scan",
  auth: "org",
  input: ScanAttendanceInputSchema,
  output: ScanAttendanceOutputSchema,
  errorCodes: ["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "INTERNAL_SERVER_ERROR"],
};

export const confirmAttendanceOperation: Operation<typeof ConfirmAttendanceInputSchema, typeof ConfirmAttendanceOutputSchema> = {
  name: "org.confirmAttendance",
  method: "POST",
  path: "/api/v1/org/events/:eventId/attendance/confirm",
  auth: "org",
  input: ConfirmAttendanceInputSchema,
  output: ConfirmAttendanceOutputSchema,
  errorCodes: ["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "INTERNAL_SERVER_ERROR"],
};
