import { z } from "zod";
import {
  AcceptTeamInviteOutput,
  AcceptTeamInviteOutputSchema,
  ApproveRegistrationOutput,
  ApproveRegistrationOutputSchema,
  CancelRegistrationOutput,
  CancelRegistrationOutputSchema,
  ConfirmAttendanceOutput,
  ConfirmAttendanceOutputSchema,
  CreateEventInput,
  CreateEventOutput,
  CreateEventOutputSchema,
  CreateEventRoleOutput,
  CreateEventRoleOutputSchema,
  CreatePaymentInput,
  CreatePaymentOutput,
  CreatePaymentOutputSchema,
  DeclineTeamInviteOutput,
  DeclineTeamInviteOutputSchema,
  DeleteEventOutput,
  DeleteEventOutputSchema,
  DeleteEventRoleOutput,
  DeleteEventRoleOutputSchema,
  DeleteNotificationOutput,
  DeleteNotificationOutputSchema,
  EventRoleMember,
  EventStatus,
  GetEventOutput,
  GetEventOutputSchema,
  GetEventRolesOutput,
  GetEventRolesOutputSchema,
  GetForOrgOutput,
  GetForOrgOutputSchema,
  GetMineRegistrationOutput,
  GetMineRegistrationOutputSchema,
  GetOrgEventRegistrationsOutput,
  GetOrgEventRegistrationsOutputSchema,
  GetProfileOutput,
  GetProfileOutputSchema,
  ListEventsInput,
  ListEventsOutput,
  ListEventsOutputSchema,
  ListMembersInput,
  ListMembersOutput,
  ListMembersOutputSchema,
  ListNotificationsInput,
  ListNotificationsOutput,
  ListNotificationsOutputSchema,
  ListOrgEventsInput,
  ListOrgEventsOutput,
  ListOrgEventsOutputSchema,
  LoginInput,
  LoginOutput,
  LoginOutputSchema,
  LogoutOutput,
  LogoutOutputSchema,
  LookupTeammateOutput,
  LookupTeammateOutputSchema,
  MarkAllNotificationsReadOutput,
  MarkAllNotificationsReadOutputSchema,
  MarkNotificationReadOutput,
  MarkNotificationReadOutputSchema,
  MeOutput,
  MeOutputSchema,
  MyTicketsOutput,
  MyTicketsOutputSchema,
  NotificationItem,
  OrgEventRegistrationItem,
  OrgMemberItem,
  RefreshOutput,
  RefreshOutputSchema,
  RegisterForEventInput,
  RegisterForEventOutput,
  RegisterForEventOutputSchema,
  RegistrationStatus,
  RejectRegistrationOutput,
  RejectRegistrationOutputSchema,
  RequestUploadInput,
  RequestUploadOutput,
  RequestUploadOutputSchema,
  ResendOrgOtpOutput,
  ResendOrgOtpOutputSchema,
  ScanAttendanceOutput,
  ScanAttendanceOutputSchema,
  SignupInput,
  SignupOutput,
  SignupOutputSchema,
  ToggleAttendanceOutput,
  ToggleAttendanceOutputSchema,
  UnreadNotificationsCountOutput,
  UnreadNotificationsCountOutputSchema,
  UpdateAvatarOutput,
  UpdateAvatarOutputSchema,
  UpdateEventBody,
  UpdateEventOutput,
  UpdateEventOutputSchema,
  UpdateEventStatusOutput,
  UpdateEventStatusOutputSchema,
  UpdateMemberRoleOutput,
  UpdateMemberRoleOutputSchema,
  UpdateProfileInput,
  UpdateProfileOutput,
  UpdateProfileOutputSchema,
  VerifyOrgOtpOutput,
  VerifyOrgOtpOutputSchema,
} from "@cirkkl/contracts";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookies";

export type {
  NotificationItem,
  OrgEventRegistrationItem,
  OrgMemberItem,
  EventRoleMember,
  CreateEventInput,
  UpdateEventBody,
  RegistrationStatus,
  EventStatus,
  LoginInput,
  LoginOutput,
  SignupInput,
  SignupOutput,
  RefreshOutput,
  LogoutOutput,
  VerifyOrgOtpOutput,
  MeOutput,
};

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getErrorMessage(err: unknown, fallback: string = "An error occurred"): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case "API_UNAVAILABLE":
        return "The server is currently unavailable. Please try again later.";
      case "ALREADY_REGISTERED":
        return "You are already registered for this event.";
      case "EVENT_FULL":
        return "This event is currently full.";
      case "REGISTRATION_CLOSED":
        return "Registration for this event is closed.";
      case "ALREADY_IN_TEAM":
        return "User is already invited or in a team for this event.";
      case "TEAM_NOT_FOUND":
        return "Team not found or invite has expired.";
      case "UNAUTHORIZED":
        return "Please log in to continue.";
      case "FORBIDDEN":
        return "You do not have permission to perform this action.";
      case "INVALID_CREDENTIALS":
        return "Invalid email or password.";
      case "INVALID_OTP":
        return "Invalid verification code. Please try again.";
      case "TOO_MANY_REQUESTS":
        return "Too many requests. Please wait and try again later.";
      case "NOT_FOUND":
        return err.message || "Requested resource not found.";
      case "BAD_REQUEST":
        return err.message || "Invalid request.";
      case "CONFLICT":
        return err.message || "A conflict occurred with existing data.";
      default:
        return err.message || fallback;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function getServerAccessToken(): Promise<string | undefined> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
    console.log('[API] getServerAccessToken:', token ? `Found (${token.substring(0, 20)}...)` : 'NOT FOUND');
    return token;
  } catch (error) {
    console.log('[API] getServerAccessToken error:', error);
    return undefined;
  }
}

export function getClientIp(headers: Headers): string | undefined {
  const trustedHeader = (process.env.TRUSTED_IP_HEADER || "x-real-ip").toLowerCase();
  const rawIp = headers.get(trustedHeader);
  if (!rawIp) return undefined;
  const parts = rawIp.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return undefined;
  return parts[parts.length - 1];
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  schema?: z.ZodType<T>
): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const isClient = typeof window !== "undefined";

  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  let url: string;
  if (isClient) {
    url = `/api/proxy${normalizedPath}`;
  } else {
    url = `${API_BASE_URL}${normalizedPath}`;
    const proxySecret = process.env.INTERNAL_PROXY_SECRET;
    if (proxySecret) {
      headers.set("x-internal-proxy-secret", proxySecret);
    }
    if (!headers.has("Authorization")) {
      const serverToken = await getServerAccessToken();
      if (serverToken) {
        headers.set("Authorization", `Bearer ${serverToken}`);
      }
    }
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr: unknown) {
    throw new ApiError(
      "API_UNAVAILABLE",
      "API is currently unavailable. Please check your connection and try again.",
      503,
      netErr
    );
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const errorCode = json?.error?.code || "API_ERROR";
    const errorMessage = json?.error?.message || res.statusText || "Request failed";
    const errorDetails = json?.error?.details;
    throw new ApiError(errorCode, errorMessage, res.status, errorDetails);
  }

  if (schema) {
    return schema.parse(json);
  }

  return json as T;
}

export const api = {
  auth: {
    login: async (body: LoginInput, clientIp?: string): Promise<LoginOutput> => {
      const headers: Record<string, string> = {};
      if (clientIp) {
        headers["x-forwarded-for"] = clientIp;
        headers["x-real-ip"] = clientIp;
      }
      return request<LoginOutput>(
        "/api/v1/auth/login",
        {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        },
        LoginOutputSchema
      );
    },
    signup: async (body: SignupInput, clientIp?: string): Promise<SignupOutput> => {
      const headers: Record<string, string> = {};
      if (clientIp) {
        headers["x-forwarded-for"] = clientIp;
        headers["x-real-ip"] = clientIp;
      }
      return request<SignupOutput>(
        "/api/v1/auth/signup",
        {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        },
        SignupOutputSchema
      );
    },
    refresh: async (refreshToken: string): Promise<RefreshOutput> => {
      return request<RefreshOutput>(
        "/api/v1/auth/refresh",
        {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        },
        RefreshOutputSchema
      );
    },
    logout: async (): Promise<LogoutOutput> => {
      return request<LogoutOutput>(
        "/api/v1/auth/logout",
        {
          method: "POST",
        },
        LogoutOutputSchema
      );
    },
    verifyOrgOtp: async (otpCode: string, clientIp?: string): Promise<VerifyOrgOtpOutput> => {
      const headers: Record<string, string> = {};
      if (clientIp) {
        headers["x-forwarded-for"] = clientIp;
        headers["x-real-ip"] = clientIp;
      }
      return request<VerifyOrgOtpOutput>(
        "/api/v1/auth/verify-org-otp",
        {
          method: "POST",
          headers,
          body: JSON.stringify({ otpCode }),
        },
        VerifyOrgOtpOutputSchema
      );
    },
    resendOrgOtp: async (clientIp?: string): Promise<ResendOrgOtpOutput> => {
      const headers: Record<string, string> = {};
      if (clientIp) {
        headers["x-forwarded-for"] = clientIp;
        headers["x-real-ip"] = clientIp;
      }
      return request<ResendOrgOtpOutput>(
        "/api/v1/auth/resend-org-otp",
        {
          method: "POST",
          headers,
        },
        ResendOrgOtpOutputSchema
      );
    },
    me: async (): Promise<MeOutput> => {
      return request<MeOutput>("/api/v1/auth/me", { method: "GET" }, MeOutputSchema);
    },
  },
  events: {
    list: async (params?: Partial<ListEventsInput>): Promise<ListEventsOutput> => {
      const searchParams = new URLSearchParams();
      if (params?.timeFilter) searchParams.set("timeFilter", params.timeFilter);
      if (params?.category) searchParams.set("category", params.category);
      if (params?.search) searchParams.set("search", params.search);
      if (params?.cursor) searchParams.set("cursor", params.cursor);
      if (params?.limit) searchParams.set("limit", String(params.limit));

      const query = searchParams.toString();
      const path = `/api/v1/events${query ? `?${query}` : ""}`;
      return request<ListEventsOutput>(path, { method: "GET" }, ListEventsOutputSchema);
    },
    get: async (idOrSlug: string): Promise<GetEventOutput> => {
      const path = `/api/v1/events/${encodeURIComponent(idOrSlug)}`;
      return request<GetEventOutput>(path, { method: "GET" }, GetEventOutputSchema);
    },
    listForOrg: async (params?: Partial<ListOrgEventsInput>): Promise<ListOrgEventsOutput> => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set("status", params.status);
      if (params?.search) searchParams.set("search", params.search);
      if (params?.cursor) searchParams.set("cursor", params.cursor);
      if (params?.limit) searchParams.set("limit", String(params.limit));
      const query = searchParams.toString();
      const path = `/api/v1/org/events${query ? `?${query}` : ""}`;
      return request<ListOrgEventsOutput>(path, { method: "GET" }, ListOrgEventsOutputSchema);
    },
    getForOrg: async (id: string): Promise<GetForOrgOutput> => {
      const path = `/api/v1/org/events/${encodeURIComponent(id)}`;
      return request<GetForOrgOutput>(path, { method: "GET" }, GetForOrgOutputSchema);
    },
    create: async (body: CreateEventInput): Promise<CreateEventOutput> => {
      return request<CreateEventOutput>(
        "/api/v1/events",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
        CreateEventOutputSchema
      );
    },
    update: async (id: string, body: UpdateEventBody): Promise<UpdateEventOutput> => {
      const path = `/api/v1/events/${encodeURIComponent(id)}`;
      return request<UpdateEventOutput>(
        path,
        {
          method: "PUT",
          body: JSON.stringify(body),
        },
        UpdateEventOutputSchema
      );
    },
    delete: async (id: string): Promise<DeleteEventOutput> => {
      const path = `/api/v1/events/${encodeURIComponent(id)}`;
      return request<DeleteEventOutput>(path, { method: "DELETE" }, DeleteEventOutputSchema);
    },
    updateStatus: async (id: string, status: EventStatus): Promise<UpdateEventStatusOutput> => {
      const path = `/api/v1/events/${encodeURIComponent(id)}/status`;
      return request<UpdateEventStatusOutput>(
        path,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
        UpdateEventStatusOutputSchema
      );
    },
  },
  registrations: {
    getMine: async (eventId: string): Promise<GetMineRegistrationOutput> => {
      const path = `/api/v1/events/${encodeURIComponent(eventId)}/my-registration`;
      return request<GetMineRegistrationOutput>(
        path,
        { method: "GET" },
        GetMineRegistrationOutputSchema
      );
    },
    register: async (input: RegisterForEventInput): Promise<RegisterForEventOutput> => {
      const path = `/api/v1/events/${encodeURIComponent(input.eventId)}/registrations`;
      return request<RegisterForEventOutput>(
        path,
        {
          method: "POST",
          body: JSON.stringify(input),
        },
        RegisterForEventOutputSchema
      );
    },
    acceptTeamInvite: async (
      teamId: string,
      eventId: string
    ): Promise<AcceptTeamInviteOutput> => {
      const path = `/api/v1/registrations/teams/${encodeURIComponent(teamId)}/accept`;
      return request<AcceptTeamInviteOutput>(
        path,
        {
          method: "POST",
          body: JSON.stringify({ teamId, eventId }),
        },
        AcceptTeamInviteOutputSchema
      );
    },
    declineTeamInvite: async (
      teamId: string,
      eventId: string
    ): Promise<DeclineTeamInviteOutput> => {
      const path = `/api/v1/registrations/teams/${encodeURIComponent(teamId)}/decline`;
      return request<DeclineTeamInviteOutput>(
        path,
        {
          method: "POST",
          body: JSON.stringify({ teamId, eventId }),
        },
        DeclineTeamInviteOutputSchema
      );
    },
    myTickets: async (): Promise<MyTicketsOutput> => {
      return request<MyTicketsOutput>(
        "/api/v1/registrations/my-tickets",
        { method: "GET" },
        MyTicketsOutputSchema
      );
    },
    lookupTeammate: async (
      eventId: string,
      cklId: string
    ): Promise<LookupTeammateOutput> => {
      const path = `/api/v1/events/${encodeURIComponent(eventId)}/teammates/lookup?cklId=${encodeURIComponent(cklId)}`;
      return request<LookupTeammateOutput>(
        path,
        { method: "GET" },
        LookupTeammateOutputSchema
      );
    },
  },
  payments: {
    create: async (input: CreatePaymentInput): Promise<CreatePaymentOutput> => {
      return request<CreatePaymentOutput>(
        "/api/v1/payments/create",
        {
          method: "POST",
          body: JSON.stringify(input),
        },
        CreatePaymentOutputSchema
      );
    },
  },
  uploads: {
    requestUpload: async (input: RequestUploadInput): Promise<RequestUploadOutput> => {
      return request<RequestUploadOutput>(
        "/api/v1/uploads/presigned-url",
        {
          method: "POST",
          body: JSON.stringify(input),
        },
        RequestUploadOutputSchema
      );
    },
  },
  notifications: {
    list: async (
      params?: Partial<ListNotificationsInput>
    ): Promise<ListNotificationsOutput> => {
      const searchParams = new URLSearchParams();
      if (params?.filter) searchParams.set("filter", params.filter);
      if (params?.page) searchParams.set("page", String(params.page));
      if (params?.limit) searchParams.set("limit", String(params.limit));
      const query = searchParams.toString();
      const path = `/api/v1/notifications${query ? `?${query}` : ""}`;
      return request<ListNotificationsOutput>(
        path,
        { method: "GET" },
        ListNotificationsOutputSchema
      );
    },
    markRead: async (id: string): Promise<MarkNotificationReadOutput> => {
      const path = `/api/v1/notifications/${encodeURIComponent(id)}/read`;
      return request<MarkNotificationReadOutput>(
        path,
        { method: "PATCH" },
        MarkNotificationReadOutputSchema
      );
    },
    markAllRead: async (): Promise<MarkAllNotificationsReadOutput> => {
      return request<MarkAllNotificationsReadOutput>(
        "/api/v1/notifications/mark-all-read",
        { method: "POST" },
        MarkAllNotificationsReadOutputSchema
      );
    },
    delete: async (id: string): Promise<DeleteNotificationOutput> => {
      const path = `/api/v1/notifications/${encodeURIComponent(id)}`;
      return request<DeleteNotificationOutput>(
        path,
        { method: "DELETE" },
        DeleteNotificationOutputSchema
      );
    },
    unreadCount: async (): Promise<UnreadNotificationsCountOutput> => {
      return request<UnreadNotificationsCountOutput>(
        "/api/v1/notifications/unread-count",
        { method: "GET" },
        UnreadNotificationsCountOutputSchema
      );
    },
    stream: (
      onEvent: (event: string, data: NotificationItem | unknown) => void,
      onError?: (err: unknown) => void
    ): (() => void) => {
      const controller = new AbortController();
      const isClient = typeof window !== "undefined";
      const streamUrl = isClient
        ? "/api/proxy/api/v1/notifications/stream"
        : `${API_BASE_URL}/api/v1/notifications/stream`;

      (async () => {
        try {
          const headers: Record<string, string> = {
            Accept: "text/event-stream",
          };
          if (!isClient) {
            const token = await getServerAccessToken();
            if (token) {
              headers["Authorization"] = `Bearer ${token}`;
            }
          }
          const res = await fetch(streamUrl, {
            headers,
            signal: controller.signal,
          });

          if (!res.ok || !res.body) {
            throw new Error(`SSE failed with status ${res.status}`);
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || "";

            for (const chunk of lines) {
              const eventLine = chunk.split("\n").find((l) => l.startsWith("event: "));
              const dataLine = chunk.split("\n").find((l) => l.startsWith("data: "));
              const eventType = eventLine ? eventLine.slice(7).trim() : "message";
              let data: unknown = {};
              if (dataLine) {
                try {
                  data = JSON.parse(dataLine.slice(6).trim());
                } catch {
                  data = dataLine.slice(6).trim();
                }
              }
              onEvent(eventType, data);
            }
          }
        } catch (err: unknown) {
          if (!controller.signal.aborted) {
            onError?.(err);
          }
        }
      })();

      return () => {
        controller.abort();
      };
    },
  },
  profile: {
    get: async (): Promise<GetProfileOutput> => {
      return request<GetProfileOutput>("/api/v1/profile", { method: "GET" }, GetProfileOutputSchema);
    },
    update: async (body: UpdateProfileInput): Promise<UpdateProfileOutput> => {
      return request<UpdateProfileOutput>(
        "/api/v1/profile",
        {
          method: "PUT",
          body: JSON.stringify(body),
        },
        UpdateProfileOutputSchema
      );
    },
    updateAvatar: async (avatarKey: string): Promise<UpdateAvatarOutput> => {
      return request<UpdateAvatarOutput>(
        "/api/v1/profile/avatar",
        {
          method: "POST",
          body: JSON.stringify({ avatarKey }),
        },
        UpdateAvatarOutputSchema
      );
    },
  },
  org: {
    getEventRegistrations: async (
      eventId: string,
      params?: { status?: RegistrationStatus; search?: string; page?: number; limit?: number }
    ): Promise<GetOrgEventRegistrationsOutput> => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set("status", params.status);
      if (params?.search) searchParams.set("search", params.search);
      if (params?.page) searchParams.set("page", String(params.page));
      if (params?.limit) searchParams.set("limit", String(params.limit));
      const query = searchParams.toString();
      const path = `/api/v1/org/events/${encodeURIComponent(eventId)}/registrations${query ? `?${query}` : ""}`;
      return request<GetOrgEventRegistrationsOutput>(path, { method: "GET" }, GetOrgEventRegistrationsOutputSchema);
    },
    approveRegistration: async (eventId: string, registrationId: string): Promise<ApproveRegistrationOutput> => {
      const path = `/api/v1/org/events/${encodeURIComponent(eventId)}/registrations/${encodeURIComponent(registrationId)}/approve`;
      return request<ApproveRegistrationOutput>(path, { method: "POST" }, ApproveRegistrationOutputSchema);
    },
    rejectRegistration: async (eventId: string, registrationId: string): Promise<RejectRegistrationOutput> => {
      const path = `/api/v1/org/events/${encodeURIComponent(eventId)}/registrations/${encodeURIComponent(registrationId)}/reject`;
      return request<RejectRegistrationOutput>(path, { method: "POST" }, RejectRegistrationOutputSchema);
    },
    cancelRegistration: async (eventId: string, registrationId: string): Promise<CancelRegistrationOutput> => {
      const path = `/api/v1/org/events/${encodeURIComponent(eventId)}/registrations/${encodeURIComponent(registrationId)}/cancel`;
      return request<CancelRegistrationOutput>(path, { method: "POST" }, CancelRegistrationOutputSchema);
    },
    toggleAttendance: async (eventId: string, registrationId: string, attended: boolean): Promise<ToggleAttendanceOutput> => {
      const path = `/api/v1/org/events/${encodeURIComponent(eventId)}/registrations/${encodeURIComponent(registrationId)}/attendance`;
      return request<ToggleAttendanceOutput>(
        path,
        {
          method: "PATCH",
          body: JSON.stringify({ attended }),
        },
        ToggleAttendanceOutputSchema
      );
    },
    getEventRoles: async (eventId: string): Promise<GetEventRolesOutput> => {
      const path = `/api/v1/org/events/${encodeURIComponent(eventId)}/roles`;
      return request<GetEventRolesOutput>(path, { method: "GET" }, GetEventRolesOutputSchema);
    },
    createEventRole: async (eventId: string, userId: string, role: string): Promise<CreateEventRoleOutput> => {
      const path = `/api/v1/org/events/${encodeURIComponent(eventId)}/roles`;
      return request<CreateEventRoleOutput>(
        path,
        {
          method: "POST",
          body: JSON.stringify({ userId, role }),
        },
        CreateEventRoleOutputSchema
      );
    },
    deleteEventRole: async (eventId: string, roleId: string): Promise<DeleteEventRoleOutput> => {
      const path = `/api/v1/org/events/${encodeURIComponent(eventId)}/roles/${encodeURIComponent(roleId)}`;
      return request<DeleteEventRoleOutput>(path, { method: "DELETE" }, DeleteEventRoleOutputSchema);
    },
    listMembers: async (params?: Partial<ListMembersInput>): Promise<ListMembersOutput> => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set("search", params.search);
      if (params?.department) searchParams.set("department", params.department);
      if (params?.role) searchParams.set("role", params.role);
      if (params?.page) searchParams.set("page", String(params.page));
      if (params?.limit) searchParams.set("limit", String(params.limit));
      const query = searchParams.toString();
      const path = `/api/v1/org/members${query ? `?${query}` : ""}`;
      return request<ListMembersOutput>(path, { method: "GET" }, ListMembersOutputSchema);
    },
    updateMemberRole: async (memberId: string, role: string): Promise<UpdateMemberRoleOutput> => {
      const path = `/api/v1/org/members/${encodeURIComponent(memberId)}/role`;
      return request<UpdateMemberRoleOutput>(
        path,
        {
          method: "PATCH",
          body: JSON.stringify({ role }),
        },
        UpdateMemberRoleOutputSchema
      );
    },
    scanAttendance: async (eventId: string, ticketCode: string): Promise<ScanAttendanceOutput> => {
      const path = `/api/v1/org/events/${encodeURIComponent(eventId)}/attendance/scan`;
      return request<ScanAttendanceOutput>(
        path,
        {
          method: "POST",
          body: JSON.stringify({ ticketCode }),
        },
        ScanAttendanceOutputSchema
      );
    },
    confirmAttendance: async (eventId: string, registrationId: string): Promise<ConfirmAttendanceOutput> => {
      const path = `/api/v1/org/events/${encodeURIComponent(eventId)}/attendance/confirm`;
      return request<ConfirmAttendanceOutput>(
        path,
        {
          method: "POST",
          body: JSON.stringify({ registrationId }),
        },
        ConfirmAttendanceOutputSchema
      );
    },
  },
};
