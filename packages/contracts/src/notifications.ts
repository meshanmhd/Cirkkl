import { z } from "zod";
import { Operation, PaginationMetaSchema, PaginationQuerySchema } from "./common";

export const NotificationTypeSchema = z.enum([
  "team_invite",
  "registration_approved",
  "registration_rejected",
  "general",
]);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationItemSchema = z.object({
  id: z.string().uuid(),
  type: NotificationTypeSchema,
  title: z.string().nullish().transform((v) => v ?? "Notification"),
  message: z.string().nullish().transform((v) => v ?? ""),
  isRead: z.boolean(),
  createdAt: z.string(),
  eventId: z.string().uuid().nullable().optional(),
  eventTitle: z.string().nullable().optional(),
  teamId: z.string().uuid().nullable().optional(),
  teamName: z.string().nullable().optional(),
  senderId: z.string().uuid().nullable().optional(),
  senderName: z.string().nullable().optional(),
  inviteStatus: z.enum(["pending", "approved", "rejected"]).nullable().optional(),
});
export type NotificationItem = z.infer<typeof NotificationItemSchema>;

export const ListNotificationsInputSchema = PaginationQuerySchema.extend({
  filter: z.enum(["all", "invites", "general"]).default("all"),
});
export type ListNotificationsInput = z.infer<typeof ListNotificationsInputSchema>;

export const ListNotificationsOutputSchema = z.object({
  items: z.array(NotificationItemSchema),
  meta: PaginationMetaSchema,
});
export type ListNotificationsOutput = z.infer<typeof ListNotificationsOutputSchema>;

export const MarkNotificationReadInputSchema = z.object({
  id: z.string().uuid(),
});
export type MarkNotificationReadInput = z.infer<typeof MarkNotificationReadInputSchema>;

export const MarkNotificationReadOutputSchema = z.object({
  success: z.boolean(),
});
export type MarkNotificationReadOutput = z.infer<typeof MarkNotificationReadOutputSchema>;

export const MarkAllNotificationsReadInputSchema = z.object({});
export type MarkAllNotificationsReadInput = z.infer<typeof MarkAllNotificationsReadInputSchema>;

export const MarkAllNotificationsReadOutputSchema = z.object({
  success: z.boolean(),
  updatedCount: z.number().int().min(0),
});
export type MarkAllNotificationsReadOutput = z.infer<typeof MarkAllNotificationsReadOutputSchema>;

export const DeleteNotificationInputSchema = z.object({
  id: z.string().uuid(),
});
export type DeleteNotificationInput = z.infer<typeof DeleteNotificationInputSchema>;

export const DeleteNotificationOutputSchema = z.object({
  success: z.boolean(),
});
export type DeleteNotificationOutput = z.infer<typeof DeleteNotificationOutputSchema>;

export const UnreadNotificationsCountInputSchema = z.object({});
export type UnreadNotificationsCountInput = z.infer<typeof UnreadNotificationsCountInputSchema>;

export const UnreadNotificationsCountOutputSchema = z.object({
  unreadCount: z.number().int().min(0),
});
export type UnreadNotificationsCountOutput = z.infer<typeof UnreadNotificationsCountOutputSchema>;

export const StreamNotificationsInputSchema = z.object({});
export type StreamNotificationsInput = z.infer<typeof StreamNotificationsInputSchema>;

export const StreamNotificationsOutputSchema = z.object({
  event: z.enum(["notification", "ping"]),
  data: NotificationItemSchema.optional(),
});
export type StreamNotificationsOutput = z.infer<typeof StreamNotificationsOutputSchema>;

export const listNotificationsOperation: Operation<typeof ListNotificationsInputSchema, typeof ListNotificationsOutputSchema> = {
  name: "notifications.list",
  method: "GET",
  path: "/api/v1/notifications",
  auth: "user",
  input: ListNotificationsInputSchema,
  output: ListNotificationsOutputSchema,
  errorCodes: ["UNAUTHORIZED", "INTERNAL_SERVER_ERROR"],
};

export const markNotificationReadOperation: Operation<typeof MarkNotificationReadInputSchema, typeof MarkNotificationReadOutputSchema> = {
  name: "notifications.markRead",
  method: "PATCH",
  path: "/api/v1/notifications/:id/read",
  auth: "user",
  input: MarkNotificationReadInputSchema,
  output: MarkNotificationReadOutputSchema,
  errorCodes: ["BAD_REQUEST", "UNAUTHORIZED", "NOT_FOUND", "INTERNAL_SERVER_ERROR"],
};

export const markAllNotificationsReadOperation: Operation<typeof MarkAllNotificationsReadInputSchema, typeof MarkAllNotificationsReadOutputSchema> = {
  name: "notifications.markAllRead",
  method: "POST",
  path: "/api/v1/notifications/mark-all-read",
  auth: "user",
  input: MarkAllNotificationsReadInputSchema,
  output: MarkAllNotificationsReadOutputSchema,
  errorCodes: ["UNAUTHORIZED", "INTERNAL_SERVER_ERROR"],
};

export const deleteNotificationOperation: Operation<typeof DeleteNotificationInputSchema, typeof DeleteNotificationOutputSchema> = {
  name: "notifications.delete",
  method: "DELETE",
  path: "/api/v1/notifications/:id",
  auth: "user",
  input: DeleteNotificationInputSchema,
  output: DeleteNotificationOutputSchema,
  errorCodes: ["BAD_REQUEST", "UNAUTHORIZED", "NOT_FOUND", "INTERNAL_SERVER_ERROR"],
};

export const unreadNotificationsCountOperation: Operation<typeof UnreadNotificationsCountInputSchema, typeof UnreadNotificationsCountOutputSchema> = {
  name: "notifications.unreadCount",
  method: "GET",
  path: "/api/v1/notifications/unread-count",
  auth: "user",
  input: UnreadNotificationsCountInputSchema,
  output: UnreadNotificationsCountOutputSchema,
  errorCodes: ["UNAUTHORIZED", "INTERNAL_SERVER_ERROR"],
};

export const streamNotificationsOperation: Operation<typeof StreamNotificationsInputSchema, typeof StreamNotificationsOutputSchema> = {
  name: "notifications.stream",
  method: "GET",
  path: "/api/v1/notifications/stream",
  auth: "user",
  input: StreamNotificationsInputSchema,
  output: StreamNotificationsOutputSchema,
  errorCodes: ["UNAUTHORIZED", "INTERNAL_SERVER_ERROR"],
};
