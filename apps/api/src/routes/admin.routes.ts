import { Hono } from "hono";
import { AdminService } from "../services/admin.service";
import { AdminRepo } from "../ports/repositories";
import { requireSuperAdmin } from "./middleware/auth";

export function createAdminRoutes(adminService: AdminService, adminRepo: AdminRepo) {
  const router = new Hono();

  const getClientIp = (c: any): string | undefined => {
    const proxySecret = process.env.INTERNAL_PROXY_SECRET;
    if (!proxySecret) {
      return undefined;
    }
    const incomingSecret =
      c.req.header("x-internal-proxy-secret") ||
      c.req.header("internal-proxy-secret");
    if (!incomingSecret || incomingSecret !== proxySecret) {
      return undefined;
    }
    const forwarded = c.req.header("x-forwarded-for");
    if (forwarded) {
      const parts = forwarded.split(",").map((s: string) => s.trim()).filter(Boolean);
      return parts[parts.length - 1];
    }
    return c.req.header("x-real-ip") || undefined;
  };

  router.get("/organisations/:id/otp", requireSuperAdmin(adminRepo), async (c) => {
    const caller = c.get("caller");
    const orgId = c.req.param("id")!;
    const clientIp = getClientIp(c);
    const result = await adminService.getOrgOtp(caller.userId, orgId, clientIp);
    return c.json(result, 200);
  });

  return router;
}
