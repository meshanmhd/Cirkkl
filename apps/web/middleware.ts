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

async function refreshTokens(refreshToken: string) {
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

async function fetchMe(token: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAuthPage = path === "/login" || path === "/signup";

  let accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!accessToken && !refreshToken) {
    if (isAuthPage) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", path);
    return NextResponse.redirect(loginUrl);
  }

  let refreshedTokens: { accessToken: string; refreshToken: string; expiresAt: number } | null = null;

  if (refreshToken && (!accessToken || isTokenExpired(accessToken))) {
    refreshedTokens = await refreshTokens(refreshToken);
    if (refreshedTokens) {
      accessToken = refreshedTokens.accessToken;
    } else {
      if (isAuthPage) {
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
  }

  let me = accessToken ? await fetchMe(accessToken) : null;

  if (!me && refreshToken && !refreshedTokens) {
    refreshedTokens = await refreshTokens(refreshToken);
    if (refreshedTokens) {
      accessToken = refreshedTokens.accessToken;
      me = await fetchMe(accessToken);
    }
  }

  if (!me) {
    if (isAuthPage) {
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

  const applyCookies = (res: NextResponse) => {
    if (refreshedTokens) {
      res.cookies.set(ACCESS_TOKEN_COOKIE, refreshedTokens.accessToken, getCookieOptions(false));
      res.cookies.set(REFRESH_TOKEN_COOKIE, refreshedTokens.refreshToken, getCookieOptions(true));
    }
    return res;
  };

  const isOrg = me.role === "organisation" || !!me.org;

  if (isOrg) {
    if (me.org && !me.org.isOtpVerified) {
      if (path !== "/verify-org") {
        return applyCookies(NextResponse.redirect(new URL("/verify-org", request.url)));
      }
    } else if (me.org && !me.org.isApproved) {
      if (path !== "/pending-approval") {
        return applyCookies(NextResponse.redirect(new URL("/pending-approval", request.url)));
      }
    } else {
      if (
        path === "/login" ||
        path === "/signup" ||
        path === "/verify-org" ||
        path === "/pending-approval" ||
        path === "/profile"
      ) {
        return applyCookies(NextResponse.redirect(new URL("/dashboard/events", request.url)));
      }
    }
  } else {
    if (path.startsWith("/dashboard") || path === "/verify-org" || path === "/pending-approval") {
      return applyCookies(NextResponse.redirect(new URL("/", request.url)));
    }
    if (isAuthPage) {
      const redirectTo = request.nextUrl.searchParams.get("redirectTo");
      return applyCookies(NextResponse.redirect(new URL(redirectTo || "/", request.url)));
    }
  }

  return applyCookies(NextResponse.next());
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile",
    "/notifications",
    "/verify-org",
    "/pending-approval",
    "/login",
    "/signup",
  ],
};
