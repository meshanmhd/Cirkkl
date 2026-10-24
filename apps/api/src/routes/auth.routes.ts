import { Hono } from "hono";
import {
  LoginInputSchema,
  RefreshInputSchema,
  SignupInputSchema,
  VerifyOrgOtpInputSchema,
} from "@cirkkl/contracts";
import { AuthService } from "../services/auth.service";
import { requireUser } from "./middleware/auth";

export function createAuthRoutes(authService: AuthService) {
  const router = new Hono();

  const getClientIp = (c: any): string | undefined => {
    const forwarded = c.req.header("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0]?.trim();
    return c.req.header("x-real-ip") || undefined;
  };

  router.post("/signup", async (c) => {
    const body = await c.req.json();
    const parsed = SignupInputSchema.parse(body);
    const clientIp = getClientIp(c);
    const result = await authService.signup({ ...parsed, clientIp });
    return c.json(result, 201);
  });

  router.post("/login", async (c) => {
    const body = await c.req.json();
    const parsed = LoginInputSchema.parse(body);
    const clientIp = getClientIp(c);
    const result = await authService.login({ ...parsed, clientIp });
    return c.json(result, 200);
  });

  router.post("/refresh", async (c) => {
    const body = await c.req.json();
    const parsed = RefreshInputSchema.parse(body);
    const result = await authService.refresh(parsed.refreshToken);
    return c.json(result, 200);
  });

  router.post("/logout", requireUser(), async (c) => {
    const authHeader = c.req.header("Authorization")!;
    const token = authHeader.substring(7);
    await authService.logout(token);
    return c.json({ success: true }, 200);
  });

  router.post("/verify-org-otp", requireUser(), async (c) => {
    const caller = c.get("caller");
    const body = await c.req.json();
    const parsed = VerifyOrgOtpInputSchema.parse(body);
    const clientIp = getClientIp(c);
    await authService.verifyOrgOtp(caller.userId, parsed.otpCode, clientIp);
    return c.json({ success: true, isOtpVerified: true, isApproved: false }, 200);
  });

  router.get("/me", requireUser(), async (c) => {
    const caller = c.get("caller");
    const me = await authService.getMe(caller.userId);
    return c.json(
      {
        userId: me.userId,
        email: me.email,
        role: me.role,
        org: me.org,
        user: {
          id: me.userId,
          email: me.email,
          name: "",
          role: me.role,
        },
      },
      200
    );
  });

  return router;
}
