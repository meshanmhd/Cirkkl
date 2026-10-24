import { z } from "zod";
import {
  GetEventOutput,
  GetEventOutputSchema,
  GetMineRegistrationOutput,
  GetMineRegistrationOutputSchema,
  GetProfileOutput,
  GetProfileOutputSchema,
  ListEventsInput,
  ListEventsOutput,
  ListEventsOutputSchema,
  UpdateProfileInput,
  UpdateProfileOutput,
  UpdateProfileOutputSchema,
} from "@cirkkl/contracts";

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

  const res = await fetch(url, {
    ...options,
    headers,
  });

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
