import { z } from "zod";
import { Operation } from "./common";

export const RegistrationStatusSchema = z.enum(["pending", "approved", "rejected", "cancelled", "attended"]);
export type RegistrationStatus = z.infer<typeof RegistrationStatusSchema>;

export const TeamMateInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  cklId: z.string().optional(),
});
export type TeamMateInput = z.infer<typeof TeamMateInputSchema>;

export const RegisterForEventInputSchema = z.object({
  eventId: z.string().uuid(),
  fieldValues: z.record(z.string(), z.string()).default({}),
  transactionId: z.string().nullable().optional(),
  ticketTierId: z.string().nullable().optional(),
  paymentProofKey: z.string().nullable().optional(),
  isTeamEvent: z.boolean().default(false),
  teamName: z.string().optional(),
  teamMates: z.array(TeamMateInputSchema).default([]),
});
export type RegisterForEventInput = z.infer<typeof RegisterForEventInputSchema>;

export const RegisterForEventOutputSchema = z.object({
  registrationId: z.string().uuid(),
  status: RegistrationStatusSchema,
  ticketCode: z.string(),
});
export type RegisterForEventOutput = z.infer<typeof RegisterForEventOutputSchema>;

export const AcceptTeamInviteInputSchema = z.object({
  teamId: z.string().uuid(),
  eventId: z.string().uuid(),
});
export type AcceptTeamInviteInput = z.infer<typeof AcceptTeamInviteInputSchema>;

export const AcceptTeamInviteOutputSchema = z.object({
  success: z.boolean(),
});
export type AcceptTeamInviteOutput = z.infer<typeof AcceptTeamInviteOutputSchema>;

export const DeclineTeamInviteInputSchema = z.object({
  teamId: z.string().uuid(),
  eventId: z.string().uuid(),
});
export type DeclineTeamInviteInput = z.infer<typeof DeclineTeamInviteInputSchema>;

export const DeclineTeamInviteOutputSchema = z.object({
  success: z.boolean(),
});
export type DeclineTeamInviteOutput = z.infer<typeof DeclineTeamInviteOutputSchema>;

export const UserTicketItemSchema = z.object({
  ticketCode: z.string(),
  eventId: z.string().uuid(),
  eventTitle: z.string(),
  status: RegistrationStatusSchema,
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  dateStr: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
});
export type UserTicketItem = z.infer<typeof UserTicketItemSchema>;

export const MyTicketsInputSchema = z.object({});
export type MyTicketsInput = z.infer<typeof MyTicketsInputSchema>;

export const MyTicketsOutputSchema = z.object({
  tickets: z.array(UserTicketItemSchema),
});
export type MyTicketsOutput = z.infer<typeof MyTicketsOutputSchema>;

export const GetMineRegistrationInputSchema = z.object({
  eventId: z.string().uuid(),
});
export type GetMineRegistrationInput = z.infer<typeof GetMineRegistrationInputSchema>;

export const GetMineRegistrationOutputSchema = z.object({
  registration: z.object({
    id: z.string().uuid(),
    status: RegistrationStatusSchema,
    attended: z.boolean(),
    ticketCode: z.string(),
    teamId: z.string().uuid().nullable().optional(),
    ticketTierId: z.string().uuid().nullable().optional(),
  }).nullable(),
});
export type GetMineRegistrationOutput = z.infer<typeof GetMineRegistrationOutputSchema>;

export const LookupTeammateInputSchema = z.object({
  eventId: z.string().uuid(),
  cklId: z.string().min(1),
});
export type LookupTeammateInput = z.infer<typeof LookupTeammateInputSchema>;

export const LookupTeammateOutputSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
});
export type LookupTeammateOutput = z.infer<typeof LookupTeammateOutputSchema>;

export const registerForEventOperation: Operation<typeof RegisterForEventInputSchema, typeof RegisterForEventOutputSchema> = {
  name: "registrations.register",
  method: "POST",
  path: "/api/v1/events/:eventId/registrations",
  auth: "user",
  input: RegisterForEventInputSchema,
  output: RegisterForEventOutputSchema,
  errorCodes: ["BAD_REQUEST", "UNAUTHORIZED", "NOT_FOUND", "ALREADY_REGISTERED", "EVENT_FULL", "REGISTRATION_CLOSED", "INTERNAL_SERVER_ERROR"],
};

export const acceptTeamInviteOperation: Operation<typeof AcceptTeamInviteInputSchema, typeof AcceptTeamInviteOutputSchema> = {
  name: "registrations.acceptTeamInvite",
  method: "POST",
  path: "/api/v1/registrations/teams/:teamId/accept",
  auth: "user",
  input: AcceptTeamInviteInputSchema,
  output: AcceptTeamInviteOutputSchema,
  errorCodes: ["BAD_REQUEST", "UNAUTHORIZED", "NOT_FOUND", "ALREADY_REGISTERED", "TEAM_NOT_FOUND", "INTERNAL_SERVER_ERROR"],
};

export const declineTeamInviteOperation: Operation<typeof DeclineTeamInviteInputSchema, typeof DeclineTeamInviteOutputSchema> = {
  name: "registrations.declineTeamInvite",
  method: "POST",
  path: "/api/v1/registrations/teams/:teamId/decline",
  auth: "user",
  input: DeclineTeamInviteInputSchema,
  output: DeclineTeamInviteOutputSchema,
  errorCodes: ["BAD_REQUEST", "UNAUTHORIZED", "NOT_FOUND", "INTERNAL_SERVER_ERROR"],
};

export const myTicketsOperation: Operation<typeof MyTicketsInputSchema, typeof MyTicketsOutputSchema> = {
  name: "registrations.myTickets",
  method: "GET",
  path: "/api/v1/registrations/my-tickets",
  auth: "user",
  input: MyTicketsInputSchema,
  output: MyTicketsOutputSchema,
  errorCodes: ["UNAUTHORIZED", "INTERNAL_SERVER_ERROR"],
};

export const getMineRegistrationOperation: Operation<typeof GetMineRegistrationInputSchema, typeof GetMineRegistrationOutputSchema> = {
  name: "registrations.getMine",
  method: "GET",
  path: "/api/v1/events/:eventId/my-registration",
  auth: "user",
  input: GetMineRegistrationInputSchema,
  output: GetMineRegistrationOutputSchema,
  errorCodes: ["UNAUTHORIZED", "NOT_FOUND", "INTERNAL_SERVER_ERROR"],
};

export const lookupTeammateOperation: Operation<typeof LookupTeammateInputSchema, typeof LookupTeammateOutputSchema> = {
  name: "registrations.lookupTeammate",
  method: "GET",
  path: "/api/v1/events/:eventId/teammates/lookup",
  auth: "user",
  input: LookupTeammateInputSchema,
  output: LookupTeammateOutputSchema,
  errorCodes: ["BAD_REQUEST", "UNAUTHORIZED", "NOT_FOUND", "ALREADY_REGISTERED", "ALREADY_IN_TEAM", "INTERNAL_SERVER_ERROR"],
};
