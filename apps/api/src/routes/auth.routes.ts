import { Hono } from "hono";
import {
  LoginInputSchema,
  SignupInputSchema,
  VerifyOrgOtpInputSchema,
} from "@cirkkl/contracts";
import { AuthService } from "../services/auth.service";
import { requireUser } from "./middleware/auth";

export function createAuthRoutes(authService: AuthService) {
  const router = new Hono();

  router.post("/signup", async (c) => {
    const body = await c.req.json();
    const parsed = SignupInputSchema.parse(body);
    const result = await authService.signup(parsed);
    return c.json(result, 201);
  });

  router.post("/login", async (c) => {
    const body = await c.req.json();
    const parsed = LoginInputSchema.parse(body);
    const result = await authService.login(parsed);
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
    await authService.verifyOrgOtp(caller.userId, parsed.otpCode);
    return c.json({ success: true }, 200);
  });

  router.get("/me", requireUser(), async (c) => {
    const caller = c.get("caller");
    const me = await authService.getMe(caller);
    return c.json({ user: me }, 200);
  });

  return router;
}
