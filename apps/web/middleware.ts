import { NextResponse, type NextRequest } from "next/server";
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

async function fetchMe(token: string): Promise<{ ok: boolean; status: number; data?: any }> {
  try {
    const proxySecret = process.env.INTERNAL_PROXY_SECRET;
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (proxySecret) {
      headers["x-internal-proxy-secret"] = proxySecret;
    }
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, { headers });
    if (res.ok) {
      const data = await res.json();
      return { ok: true, status: res.status, data };
    }
    return { ok: false, status: res.status };
  } catch {
    return { ok: false, status: 503 };
  }
}

export async function middleware(request: NextRequest) {
  if (request.headers.has("next-action")) {
    return NextResponse.next();
  }
  const path = request.nextUrl.pathname;
  const isAuthPage = path === "/login" || path === "/signup";
  const isProtectedPage =
    path.startsWith("/dashboard") ||
    path === "/profile" ||
    path === "/notifications" ||
    path === "/verify-org" ||
    path === "/pending-approval";

  let accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  const createNextResponse = (tokens: { accessToken: string; refreshToken: string } | null) => {
    const res = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
    // Only set cookies if tokens were actually refreshed (not null)
    if (tokens) {
      res.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, getCookieOptions(false));
      res.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, getCookieOptions(true));
    }
    return res;
  };

  const createRedirectResponse = (
    url: URL,
    tokens: { accessToken: string; refreshToken: string } | null
  ) => {
    // Prevent redirect loop: don't redirect if already on target page
    if (url.pathname === request.nextUrl.pathname) {
      return createNextResponse(tokens);
    }
    
    const res = NextResponse.redirect(url);
    // Only set cookies if tokens were actually refreshed (not null)
    if (tokens) {
      res.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, getCookieOptions(false));
      res.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, getCookieOptions(true));
    }
    return res;
  };

  if (!accessToken && !refreshToken) {
    if (isAuthPage || !isProtectedPage) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", path);
    return NextResponse.redirect(loginUrl);
  }

  let refreshedTokens: { accessToken: string; refreshToken: string; expiresAt: number } | null = null;

  if (refreshToken && (!accessToken || isTokenExpired(accessToken))) {
    const refresh = await refreshTokens(refreshToken);
    if (refresh.status === "ok") {
      refreshedTokens = refresh.tokens;
      accessToken = refreshedTokens.accessToken;
      request.cookies.set(ACCESS_TOKEN_COOKIE, refreshedTokens.accessToken);
      request.cookies.set(REFRESH_TOKEN_COOKIE, refreshedTokens.refreshToken);
    } else if (refresh.status === "invalid") {
      if (isAuthPage || !isProtectedPage) {
        const res = NextResponse.next();
        res.cookies.delete(ACCESS_TOKEN_COOKIE);
        res.cookies.delete(REFRESH_TOKEN_COOKIE);
        return res;
      }
      const res = NextResponse.redirect(new URL("/login", request.url));
      res.cookies.delete(ACCESS_TOKEN_COOKIE);
      res.cookies.delete(REFRESH_TOKEN_COOKIE);
      return res;
    } else {
      return NextResponse.next();
    }
  }

  let meRes = accessToken ? await fetchMe(accessToken) : null;

  if ((!meRes || !meRes.ok) && refreshToken && !refreshedTokens) {
    const refresh = await refreshTokens(refreshToken);
    if (refresh.status === "ok") {
      refreshedTokens = refresh.tokens;
      accessToken = refreshedTokens.accessToken;
      request.cookies.set(ACCESS_TOKEN_COOKIE, refreshedTokens.accessToken);
      request.cookies.set(REFRESH_TOKEN_COOKIE, refreshedTokens.refreshToken);
      meRes = await fetchMe(accessToken);
    } else if (refresh.status === "invalid") {
      if (isAuthPage || !isProtectedPage) {
        const res = NextResponse.next();
        res.cookies.delete(ACCESS_TOKEN_COOKIE);
        res.cookies.delete(REFRESH_TOKEN_COOKIE);
        return res;
      }
      const res = NextResponse.redirect(new URL("/login", request.url));
      res.cookies.delete(ACCESS_TOKEN_COOKIE);
      res.cookies.delete(REFRESH_TOKEN_COOKIE);
      return res;
    } else {
      return NextResponse.next();
    }
  }

  if (!meRes || !meRes.ok) {
    if (meRes && (meRes.status === 401 || meRes.status === 403)) {
      if (isAuthPage || !isProtectedPage) {
        const res = NextResponse.next();
        res.cookies.delete(ACCESS_TOKEN_COOKIE);
        res.cookies.delete(REFRESH_TOKEN_COOKIE);
        return res;
      }
      const res = NextResponse.redirect(new URL("/login", request.url));
      res.cookies.delete(ACCESS_TOKEN_COOKIE);
      res.cookies.delete(REFRESH_TOKEN_COOKIE);
      return res;
    }
    return createNextResponse(refreshedTokens);
  }

  const me = meRes.data;
  const isOrg = me.role === "organisation" || !!me.org;

  if (isOrg) {
    if (me.org) {
      if (!me.org.isOtpVerified) {
        if (path !== "/verify-org") {
          return createRedirectResponse(new URL("/verify-org", request.url), refreshedTokens);
        }
      } else if (!me.org.isApproved) {
        if (path !== "/pending-approval") {
          return createRedirectResponse(new URL("/pending-approval", request.url), refreshedTokens);
        }
      } else {
        if (!path.startsWith("/dashboard")) {
          return createRedirectResponse(new URL("/dashboard/events", request.url), refreshedTokens);
        }
      }
    } else {
      if (!path.startsWith("/dashboard") && path !== "/verify-org" && path !== "/pending-approval") {
        return createRedirectResponse(new URL("/dashboard/events", request.url), refreshedTokens);
      }
    }
  } else {
    if (path.startsWith("/dashboard") || path === "/verify-org" || path === "/pending-approval") {
      return createRedirectResponse(new URL("/", request.url), refreshedTokens);
    }
    if (isAuthPage) {
      const redirectTo = request.nextUrl.searchParams.get("redirectTo");
      return createRedirectResponse(new URL(redirectTo || "/", request.url), refreshedTokens);
    }
  }

  return createNextResponse(refreshedTokens);
}

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
