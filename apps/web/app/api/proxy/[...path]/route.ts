import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, getCookieOptions } from "@/lib/auth/cookies";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    if (!payload.exp) return false;
    return payload.exp * 1000 <= Date.now() + 5000;
  } catch {
    return true;
  }
}

type RefreshResult =
  | { status: "ok"; tokens: { accessToken: string; refreshToken: string; expiresAt: number } }
  | { status: "invalid" }
  | { status: "unavailable" };

async function refreshTokens(refreshToken: string): Promise<RefreshResult> {
  try {
    const proxySecret = process.env.INTERNAL_PROXY_SECRET;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (proxySecret) {
      headers["x-internal-proxy-secret"] = proxySecret;
    }
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers,
      body: JSON.stringify({ refreshToken }),
    });
    if (res.ok) {
      const tokens = await res.json();
      return { status: "ok", tokens };
    }
    if (res.status === 400 || res.status === 401) {
      return { status: "invalid" };
    }
    return { status: "unavailable" };
  } catch {
    return { status: "unavailable" };
  }
}

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const origin = req.headers.get("origin");
    if (!origin) {
      return new NextResponse(
        JSON.stringify({ error: { code: "FORBIDDEN", message: "Missing origin header" } }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
    const expectedOrigins: string[] = [];
    if (siteUrl) {
      try {
        expectedOrigins.push(new URL(siteUrl).origin);
      } catch {}
    }
    expectedOrigins.push(req.nextUrl.origin);

    const isDevelopment = process.env.NODE_ENV !== "production";
    const isLocalhost =
      isDevelopment &&
      (/^https?:\/\/localhost(:\d+)?$/.test(origin) ||
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin));

    const isMatch = expectedOrigins.includes(origin) || isLocalhost;
    if (!isMatch) {
      return new NextResponse(
        JSON.stringify({ error: { code: "FORBIDDEN", message: "Invalid origin" } }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  const { path } = await params;
  const rawSubpath = path.join("/");
  let targetPath: string;
  if (rawSubpath.startsWith("api/v1/")) {
    targetPath = `/${rawSubpath}`;
  } else if (rawSubpath.startsWith("v1/")) {
    targetPath = `/api/${rawSubpath}`;
  } else if (rawSubpath.startsWith("api/")) {
    targetPath = `/${rawSubpath}`;
  } else {
    targetPath = `/api/v1/${rawSubpath}`;
  }

  if (!targetPath.startsWith("/api/v1/") || targetPath.includes("..")) {
    return new NextResponse(
      JSON.stringify({ error: { code: "FORBIDDEN", message: "Path not allowed" } }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const baseOrigin = new URL(API_BASE_URL).origin;
  const targetUrl = new URL(targetPath, baseOrigin);
  req.nextUrl.searchParams.forEach((val, key) => {
    targetUrl.searchParams.set(key, val);
  });

  if (targetUrl.origin !== baseOrigin) {
    return new NextResponse(JSON.stringify({ error: { code: "FORBIDDEN", message: "Invalid proxy target" } }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  let accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  let refreshedTokens: { accessToken: string; refreshToken: string; expiresAt: number } | null = null;

  if (refreshToken && (!accessToken || isTokenExpired(accessToken))) {
    const refresh = await refreshTokens(refreshToken);
    if (refresh.status === "ok") {
      refreshedTokens = refresh.tokens;
      accessToken = refreshedTokens.accessToken;
    } else if (refresh.status === "invalid") {
      const response = new NextResponse(
        JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Session expired" } }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
      response.cookies.delete(ACCESS_TOKEN_COOKIE);
      response.cookies.delete(REFRESH_TOKEN_COOKIE);
      return response;
    }
  }

  const trustedHeader = (process.env.TRUSTED_IP_HEADER || "x-real-ip").toLowerCase();
  const rawIp = req.headers.get(trustedHeader);
  let clientIp: string | undefined = undefined;
  if (rawIp) {
    const parts = rawIp.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      clientIp = parts[parts.length - 1];
    }
  }

  const forwardHeaders = new Headers();
  req.headers.forEach((val, key) => {
    const lower = key.toLowerCase();
    if (
      lower !== "cookie" &&
      lower !== "host" &&
      lower !== "connection" &&
      lower !== "keep-alive" &&
      lower !== "transfer-encoding" &&
      lower !== "content-length" &&
      lower !== "authorization" &&
      lower !== "x-forwarded-for" &&
      lower !== "x-real-ip" &&
      lower !== "x-internal-proxy-secret" &&
      lower !== "internal-proxy-secret"
    ) {
      forwardHeaders.set(key, val);
    }
  });

  if (clientIp) {
    forwardHeaders.set("x-forwarded-for", clientIp);
    forwardHeaders.set("x-real-ip", clientIp);
  }

  const proxySecret = process.env.INTERNAL_PROXY_SECRET;
  if (proxySecret) {
    forwardHeaders.set("x-internal-proxy-secret", proxySecret);
  }

  if (accessToken) {
    forwardHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  let body: BodyInit | null | undefined = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.arrayBuffer();
  }

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: forwardHeaders,
      body,
      signal: req.signal,
    });
  } catch (err: any) {
    if (req.signal.aborted) {
      return new Response(null, { status: 499 });
    }
    return new NextResponse(
      JSON.stringify({
        error: {
          code: "API_UNAVAILABLE",
          message: "API service is currently unavailable. Please check your connection.",
          details: err?.message,
        },
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  if (upstreamRes.status === 401 && refreshToken && !refreshedTokens) {
    const refresh = await refreshTokens(refreshToken);
    if (refresh.status === "ok") {
      refreshedTokens = refresh.tokens;
      accessToken = refreshedTokens.accessToken;
      forwardHeaders.set("Authorization", `Bearer ${accessToken}`);
      try {
        upstreamRes = await fetch(targetUrl.toString(), {
          method: req.method,
          headers: forwardHeaders,
          body,
          signal: req.signal,
        });
      } catch (err: any) {
        if (req.signal.aborted) {
          return new Response(null, { status: 499 });
        }
        return new NextResponse(
          JSON.stringify({
            error: {
              code: "API_UNAVAILABLE",
              message: "API service is currently unavailable. Please check your connection.",
              details: err?.message,
            },
          }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      }
    } else if (refresh.status === "invalid") {
      const response = new NextResponse(
        JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Session expired" } }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
      response.cookies.delete(ACCESS_TOKEN_COOKIE);
      response.cookies.delete(REFRESH_TOKEN_COOKIE);
      return response;
    }
  }

  const responseHeaders = new Headers();
  upstreamRes.headers.forEach((val, key) => {
    const lower = key.toLowerCase();
    if (
      lower !== "content-encoding" &&
      lower !== "content-length" &&
      lower !== "transfer-encoding" &&
      lower !== "connection"
    ) {
      responseHeaders.set(key, val);
    }
  });

  const response = new NextResponse(upstreamRes.body, {
    status: upstreamRes.status,
    statusText: upstreamRes.statusText,
    headers: responseHeaders,
  });

  if (refreshedTokens) {
    response.cookies.set(ACCESS_TOKEN_COOKIE, refreshedTokens.accessToken, getCookieOptions(false));
    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshedTokens.refreshToken, getCookieOptions(true));
  }

  return response;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, ctx);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, ctx);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, ctx);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, ctx);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, ctx);
}

export async function HEAD(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, ctx);
}
