import { Context, Next } from "hono";
import { AuthService, CallerContext } from "../../services/auth.service";
import { forbidden, unauthorized } from "../../errors";

declare module "hono" {
  interface ContextVariableMap {
    caller: CallerContext;
  }
}

export function createAuthMiddleware(authService: AuthService) {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const caller = await authService.getCaller(token);
        c.set("caller", caller);
      } catch {
      }
    }
    await next();
  };
}

export function requireUser() {
  return async (c: Context, next: Next) => {
    const caller = c.get("caller");
    if (!caller) {
      throw unauthorized("Authentication required");
    }
    await next();
  };
}

export function requireOrg() {
  return async (c: Context, next: Next) => {
    const caller = c.get("caller");
    if (!caller) {
      throw unauthorized("Authentication required");
    }
    if (!caller.orgId) {
      throw forbidden("Organisation account required");
    }
    if (!caller.isOrgApproved) {
      throw forbidden("Organisation is pending approval or OTP verification");
    }
    await next();
  };
}
