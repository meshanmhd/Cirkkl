import { z } from "zod";
import { Operation } from "./common";

export const EventStatusSchema = z.enum(["draft", "published", "cancelled", "completed"]);
export type EventStatus = z.infer<typeof EventStatusSchema>;

export const EventVisibilitySchema = z.enum(["public", "unlisted", "private"]);
export type EventVisibility = z.infer<typeof EventVisibilitySchema>;

export const EventPriceTypeSchema = z.enum(["free", "paid"]);
export type EventPriceType = z.infer<typeof EventPriceTypeSchema>;

export const LocationTypeSchema = z.enum(["physical", "online", "hybrid"]);
export type LocationType = z.infer<typeof LocationTypeSchema>;

export const SpeakerSchema = z.object({
  id: z.string(),
  name: z.string(),
  subtext: z.string().optional(),
  imageUrl: z.string().optional(),
});
export type Speaker = z.infer<typeof SpeakerSchema>;

export const CustomFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.string(),
  required: z.boolean(),
  options: z.string().optional(),
});
export type CustomField = z.infer<typeof CustomFieldSchema>;

export const TicketTypeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  price: z.number().min(0),
  quantity: z.number().int().min(0).nullable().optional(),
  unlimited: z.boolean().default(false),
});
export type TicketType = z.infer<typeof TicketTypeSchema>;

export const EventHostSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable().optional(),
});
export type EventHost = z.infer<typeof EventHostSchema>;

export const EventSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  tagline: z.string().nullable().optional(),
  category: z.string(),
  organizer: z.string(),
  image: z.string(),
  posterImage: z.string().nullable().optional(),
  date: z.string(),
  time: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  location: z.string(),
  locationType: LocationTypeSchema,
  price: EventPriceTypeSchema,
  priceAmount: z.number().nullable().optional(),
  status: EventStatusSchema,
  featured: z.boolean().default(false),
});
export type EventSummary = z.infer<typeof EventSummarySchema>;

export const EventDetailSchema = EventSummarySchema.extend({
  description: z.string().nullable().optional().default(""),
  tags: z.array(z.string()).default([]),
  venue: z.string().nullable().optional(),
  locationLink: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  meetingLink: z.string().nullable().optional(),
  platform: z.string().nullable().optional(),
  seats: z.number().int().nullable().optional(),
  seatsAvailable: z.number().int().nullable().optional(),
  approvalRequired: z.boolean().default(false),
  registrationDeadline: z.string().nullable().optional(),
  registrationEndTime: z.string().nullable().optional(),
  cancellationPolicy: z.string().nullable().optional(),
  refundPolicy: z.string().nullable().optional(),
  photographyPolicy: z.string().nullable().optional(),
  visibility: EventVisibilitySchema.default("public"),
  isTeamEvent: z.boolean().default(false),
  teamMinSize: z.number().int().min(1).default(1),
  teamMaxSize: z.number().int().min(1).default(1),
  customFields: z.array(CustomFieldSchema).default([]),
  speakers: z.array(SpeakerSchema).default([]),
  hosts: z.array(EventHostSchema).default([]),
  ticketTypes: z.array(TicketTypeSchema).default([]),
  totalRegistrations: z.number().int().min(0).default(0),
  isFull: z.boolean().default(false),
});
export type EventDetail = z.infer<typeof EventDetailSchema>;

export const OrgEventDetailSchema = EventDetailSchema.extend({
  orgId: z.string().uuid(),
});
export type OrgEventDetail = z.infer<typeof OrgEventDetailSchema>;

export const ListEventsInputSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  timeFilter: z.enum(["upcoming", "past", "all"]).default("upcoming"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListEventsInput = z.infer<typeof ListEventsInputSchema>;

export const ListEventsOutputSchema = z.object({
  items: z.array(EventSummarySchema),
  nextCursor: z.string().nullable(),
});
export type ListEventsOutput = z.infer<typeof ListEventsOutputSchema>;

export const GetEventInputSchema = z.object({
  idOrSlug: z.string().min(1),
});
export type GetEventInput = z.infer<typeof GetEventInputSchema>;

export const GetEventOutputSchema = EventDetailSchema;
export type GetEventOutput = z.infer<typeof GetEventOutputSchema>;

export const GetForOrgInputSchema = z.object({
  id: z.string().uuid(),
});
export type GetForOrgInput = z.infer<typeof GetForOrgInputSchema>;

export const GetForOrgOutputSchema = OrgEventDetailSchema;
export type GetForOrgOutput = z.infer<typeof GetForOrgOutputSchema>;

export const CreateEventInputSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  tagline: z.string().nullable().optional(),
  description: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()).default([]),
  hosts: z.array(z.string()).default([]),
  speakers: z.array(SpeakerSchema).default([]),
  imageKey: z.string().min(1),
  posterImageKey: z.string().nullable().optional(),
  date: z.string().min(1),
  time: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  venue: z.string().nullable().optional(),
  locationLink: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  locationType: LocationTypeSchema.default("physical"),
  meetingLink: z.string().nullable().optional(),
  platform: z.string().nullable().optional(),
  price: EventPriceTypeSchema.default("free"),
  capacity: z.number().int().positive().nullable().optional(),
  approvalRequired: z.boolean().default(false),
  registrationDeadline: z.string().nullable().optional(),
  registrationEndTime: z.string().nullable().optional(),
  cancellationPolicy: z.string().nullable().optional(),
  refundPolicy: z.string().nullable().optional(),
  photographyPolicy: z.string().nullable().optional(),
  visibility: EventVisibilitySchema.default("public"),
  customFields: z.array(CustomFieldSchema).default([]),
  isTeamEvent: z.boolean().default(false),
  teamMinSize: z.number().int().min(1).default(1),
  teamMaxSize: z.number().int().min(1).default(1),
  tickets: z.array(TicketTypeSchema).default([]),
  isDraft: z.boolean().default(false),
});
export type CreateEventInput = z.infer<typeof CreateEventInputSchema>;

export const CreateEventOutputSchema = EventDetailSchema;
export type CreateEventOutput = z.infer<typeof CreateEventOutputSchema>;

export const UpdateEventBodySchema = CreateEventInputSchema.partial().extend({
  tickets: z.array(TicketTypeSchema).optional(),
});
export type UpdateEventBody = z.infer<typeof UpdateEventBodySchema>;

export const UpdateEventInputSchema = z.object({
  id: z.string().uuid(),
  body: UpdateEventBodySchema,
});
export type UpdateEventInput = z.infer<typeof UpdateEventInputSchema>;

export const UpdateEventOutputSchema = EventDetailSchema;
export type UpdateEventOutput = z.infer<typeof UpdateEventOutputSchema>;

export const DeleteEventInputSchema = z.object({
  id: z.string().uuid(),
});
export type DeleteEventInput = z.infer<typeof DeleteEventInputSchema>;

export const DeleteEventOutputSchema = z.object({
  success: z.boolean(),
});
export type DeleteEventOutput = z.infer<typeof DeleteEventOutputSchema>;

export const UpdateEventStatusInputSchema = z.object({
  id: z.string().uuid(),
  status: EventStatusSchema,
});
export type UpdateEventStatusInput = z.infer<typeof UpdateEventStatusInputSchema>;

export const UpdateEventStatusOutputSchema = z.object({
  success: z.boolean(),
  status: EventStatusSchema,
});
export type UpdateEventStatusOutput = z.infer<typeof UpdateEventStatusOutputSchema>;

export const ListOrgEventsInputSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListOrgEventsInput = z.infer<typeof ListOrgEventsInputSchema>;

export const OrgEventItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  date: z.string().nullable(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  time: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  category: z.string().nullable(),
  status: EventStatusSchema,
  visibility: EventVisibilitySchema.nullable(),
  price: EventPriceTypeSchema.nullable(),
  createdAt: z.string().optional(),
});
export type OrgEventItem = z.infer<typeof OrgEventItemSchema>;

export const ListOrgEventsOutputSchema = z.object({
  items: z.array(OrgEventItemSchema),
  nextCursor: z.string().nullable(),
});
export type ListOrgEventsOutput = z.infer<typeof ListOrgEventsOutputSchema>;

export const listEventsOperation: Operation<typeof ListEventsInputSchema, typeof ListEventsOutputSchema> = {
  name: "events.list",
  method: "GET",
  path: "/api/v1/events",
  auth: "public",
  input: ListEventsInputSchema,
  output: ListEventsOutputSchema,
  errorCodes: ["BAD_REQUEST", "INTERNAL_SERVER_ERROR"],
};

export const getEventOperation: Operation<typeof GetEventInputSchema, typeof GetEventOutputSchema> = {
  name: "events.get",
  method: "GET",
  path: "/api/v1/events/:idOrSlug",
  auth: "public",
  input: GetEventInputSchema,
  output: GetEventOutputSchema,
  errorCodes: ["NOT_FOUND", "INTERNAL_SERVER_ERROR"],
};

export const getForOrgOperation: Operation<typeof GetForOrgInputSchema, typeof GetForOrgOutputSchema> = {
  name: "events.getForOrg",
  method: "GET",
  path: "/api/v1/org/events/:id",
  auth: "org",
  input: GetForOrgInputSchema,
  output: GetForOrgOutputSchema,
  errorCodes: ["UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "INTERNAL_SERVER_ERROR"],
};

export const createEventOperation: Operation<typeof CreateEventInputSchema, typeof CreateEventOutputSchema> = {
  name: "events.create",
  method: "POST",
  path: "/api/v1/events",
  auth: "org",
  input: CreateEventInputSchema,
  output: CreateEventOutputSchema,
  errorCodes: ["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "ORGANISATION_NOT_APPROVED", "INTERNAL_SERVER_ERROR"],
};

export const updateEventOperation: Operation<typeof UpdateEventInputSchema, typeof UpdateEventOutputSchema> = {
  name: "events.update",
  method: "PUT",
  path: "/api/v1/events/:id",
  auth: "org",
  input: UpdateEventInputSchema,
  output: UpdateEventOutputSchema,
  errorCodes: ["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "CONFLICT", "INTERNAL_SERVER_ERROR"],
};

export const deleteEventOperation: Operation<typeof DeleteEventInputSchema, typeof DeleteEventOutputSchema> = {
  name: "events.delete",
  method: "DELETE",
  path: "/api/v1/events/:id",
  auth: "org",
  input: DeleteEventInputSchema,
  output: DeleteEventOutputSchema,
  errorCodes: ["UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "INTERNAL_SERVER_ERROR"],
};

export const updateEventStatusOperation: Operation<typeof UpdateEventStatusInputSchema, typeof UpdateEventStatusOutputSchema> = {
  name: "events.updateStatus",
  method: "PATCH",
  path: "/api/v1/events/:id/status",
  auth: "org",
  input: UpdateEventStatusInputSchema,
  output: UpdateEventStatusOutputSchema,
  errorCodes: ["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "INTERNAL_SERVER_ERROR"],
};

export const listOrgEventsOperation: Operation<typeof ListOrgEventsInputSchema, typeof ListOrgEventsOutputSchema> = {
  name: "events.listForOrg",
  method: "GET",
  path: "/api/v1/org/events",
  auth: "org",
  input: ListOrgEventsInputSchema,
  output: ListOrgEventsOutputSchema,
  errorCodes: ["UNAUTHORIZED", "FORBIDDEN", "INTERNAL_SERVER_ERROR"],
};
