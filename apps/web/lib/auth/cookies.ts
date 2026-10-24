export const ACCESS_TOKEN_COOKIE = "cirkkl_access_token";
export const REFRESH_TOKEN_COOKIE = "cirkkl_refresh_token";

export function getCookieOptions(isRefresh: boolean = false) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: isRefresh ? 30 * 24 * 60 * 60 : 15 * 60,
  };
}
