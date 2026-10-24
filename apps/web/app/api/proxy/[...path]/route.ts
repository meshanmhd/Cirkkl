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

async function refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: number } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    const siteOrigin = req.nextUrl.origin;
    const isMatch =
      origin &&
      (origin === siteOrigin ||
        (host && (origin === `http://${host}` || origin === `https://${host}`)));
    if (!isMatch) {
      return new NextResponse(
        JSON.stringify({ error: { code: "FORBIDDEN", message: "Invalid origin" } }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
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
    refreshedTokens = await refreshTokens(refreshToken);
    if (refreshedTokens) {
      accessToken = refreshedTokens.accessToken;
    }
  }

  const clientIp =
    (req as any).ip ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

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
      lower !== "x-real-ip"
    ) {
      forwardHeaders.set(key, val);
    }
  });

  forwardHeaders.set("x-forwarded-for", clientIp);
  forwardHeaders.set("x-real-ip", clientIp);

  if (accessToken) {
    forwardHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  let body: BodyInit | null | undefined = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.arrayBuffer();
  }

  let upstreamRes = await fetch(targetUrl.toString(), {
    method: req.method,
    headers: forwardHeaders,
    body,
  });

  if (upstreamRes.status === 401 && refreshToken && !refreshedTokens) {
    refreshedTokens = await refreshTokens(refreshToken);
    if (refreshedTokens) {
      accessToken = refreshedTokens.accessToken;
      forwardHeaders.set("Authorization", `Bearer ${accessToken}`);
      upstreamRes = await fetch(targetUrl.toString(), {
        method: req.method,
        headers: forwardHeaders,
        body,
      });
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
