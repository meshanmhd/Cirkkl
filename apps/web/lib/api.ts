import { z } from "zod";
import {
  AcceptTeamInviteOutput,
  AcceptTeamInviteOutputSchema,
  CreatePaymentInput,
  CreatePaymentOutput,
  CreatePaymentOutputSchema,
  DeclineTeamInviteOutput,
  DeclineTeamInviteOutputSchema,
  DeleteNotificationOutput,
  DeleteNotificationOutputSchema,
  GetEventOutput,
  GetEventOutputSchema,
  GetMineRegistrationOutput,
  GetMineRegistrationOutputSchema,
  GetProfileOutput,
  GetProfileOutputSchema,
  ListEventsInput,
  ListEventsOutput,
  ListEventsOutputSchema,
  ListNotificationsInput,
  ListNotificationsOutput,
  ListNotificationsOutputSchema,
  LookupTeammateOutput,
  LookupTeammateOutputSchema,
  MarkAllNotificationsReadOutput,
  MarkAllNotificationsReadOutputSchema,
  MarkNotificationReadOutput,
  MarkNotificationReadOutputSchema,
  MyTicketsOutput,
  MyTicketsOutputSchema,
  NotificationItem,
  RegisterForEventInput,
  RegisterForEventOutput,
  RegisterForEventOutputSchema,
  RequestUploadInput,
  RequestUploadOutput,
  RequestUploadOutputSchema,
  UnreadNotificationsCountOutput,
  UnreadNotificationsCountOutputSchema,
  UpdateProfileInput,
  UpdateProfileOutput,
  UpdateProfileOutputSchema,
} from "@cirkkl/contracts";

export type { NotificationItem };

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
      case "NOT_FOUND":
        return err.message || "Requested resource not found.";
      case "BAD_REQUEST":
        return err.message || "Invalid request.";
      default:
        return err.message || fallback;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

async function getAccessToken(): Promise<string | undefined> {
  try {
    if (typeof window !== "undefined") {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token;
    } else {
      const getHeaders = new Function('return import("next/headers")');
      const getSupabaseSsr = new Function('return import("@supabase/ssr")');
      const { cookies } = await getHeaders();
      const { createServerClient } = await getSupabaseSsr();
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll() {},
          },
        }
      );
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token;
    }
  } catch {
    return undefined;
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function request<T>(
  path: string,
  options: RequestInit = {},
  schema?: z.ZodType<T>
): Promise<T> {
  const token = await getAccessToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${normalizedPath}`;

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

      (async () => {
        try {
          const token = await getAccessToken();
          const headers: Record<string, string> = {
            Accept: "text/event-stream",
          };
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }
          const res = await fetch(`${API_BASE_URL}/api/v1/notifications/stream`, {
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
  },
};
