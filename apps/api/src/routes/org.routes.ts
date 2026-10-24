import { Hono } from "hono";
import {
  ApproveRegistrationInputSchema,
  CancelRegistrationInputSchema,
  ConfirmAttendanceInputSchema,
  CreateEventRoleInputSchema,
  DeleteEventRoleInputSchema,
  GetEventRolesInputSchema,
  GetOrgEventRegistrationsInputSchema,
  ListMembersInputSchema,
  RejectRegistrationInputSchema,
  ScanAttendanceInputSchema,
  ToggleAttendanceInputSchema,
  UpdateMemberRoleInputSchema,
} from "@cirkkl/contracts";
import { OrgService } from "../services/org.service";
import { requireOrg } from "./middleware/auth";

export function createOrgRoutes(orgService: OrgService) {
  const router = new Hono();

  router.use("*", requireOrg());

  router.get("/events/:eventId/registrations", async (c) => {
    const caller = c.get("caller");
    const eventId = c.req.param("eventId");
    const query = c.req.query();
    const parsed = GetOrgEventRegistrationsInputSchema.parse({ ...query, eventId });
    const result = await orgService.getEventRegistrations(eventId, caller, parsed);
    return c.json(result, 200);
  });

  router.post("/events/:eventId/registrations/:registrationId/approve", async (c) => {
    const caller = c.get("caller");
    const eventId = c.req.param("eventId");
    const registrationId = c.req.param("registrationId");
    const parsed = ApproveRegistrationInputSchema.parse({ eventId, registrationId });
    const result = await orgService.approveRegistration(parsed.eventId, parsed.registrationId, caller);
    return c.json(result, 200);
  });

  router.post("/events/:eventId/registrations/:registrationId/reject", async (c) => {
    const caller = c.get("caller");
    const eventId = c.req.param("eventId");
    const registrationId = c.req.param("registrationId");
    const parsed = RejectRegistrationInputSchema.parse({ eventId, registrationId });
    const result = await orgService.rejectRegistration(parsed.eventId, parsed.registrationId, caller);
    return c.json(result, 200);
  });

  router.post("/events/:eventId/registrations/:registrationId/cancel", async (c) => {
    const caller = c.get("caller");
    const eventId = c.req.param("eventId");
    const registrationId = c.req.param("registrationId");
    const parsed = CancelRegistrationInputSchema.parse({ eventId, registrationId });
    const result = await orgService.cancelRegistration(parsed.eventId, parsed.registrationId, caller);
    return c.json(result, 200);
  });

  router.patch("/events/:eventId/registrations/:registrationId/attendance", async (c) => {
    const caller = c.get("caller");
    const eventId = c.req.param("eventId");
    const registrationId = c.req.param("registrationId");
    const body = await c.req.json();
    const parsed = ToggleAttendanceInputSchema.parse({ ...body, eventId, registrationId });
    const result = await orgService.toggleAttendance(parsed.eventId, parsed.registrationId, parsed.attended, caller);
    return c.json(result, 200);
  });

  router.get("/events/:eventId/roles", async (c) => {
    const caller = c.get("caller");
    const eventId = c.req.param("eventId");
    const parsed = GetEventRolesInputSchema.parse({ eventId });
    const result = await orgService.getEventRoles(parsed.eventId, caller);
    return c.json(result, 200);
  });

  router.post("/events/:eventId/roles", async (c) => {
    const caller = c.get("caller");
    const eventId = c.req.param("eventId");
    const body = await c.req.json();
    const parsed = CreateEventRoleInputSchema.parse({ ...body, eventId });
    const result = await orgService.createEventRole(parsed.eventId, parsed.userId, parsed.role, caller);
    return c.json(result, 201);
  });

  router.delete("/events/:eventId/roles/:roleId", async (c) => {
    const caller = c.get("caller");
    const eventId = c.req.param("eventId");
    const roleId = c.req.param("roleId");
    const parsed = DeleteEventRoleInputSchema.parse({ eventId, roleId });
    const result = await orgService.deleteEventRole(parsed.eventId, parsed.roleId, caller);
    return c.json(result, 200);
  });

  router.get("/members", async (c) => {
    const caller = c.get("caller");
    const query = c.req.query();
    const parsed = ListMembersInputSchema.parse(query);
    const result = await orgService.listMembers(caller, parsed);
    return c.json(result, 200);
  });

  router.patch("/members/:memberId/role", async (c) => {
    const caller = c.get("caller");
    const memberId = c.req.param("memberId");
    const body = await c.req.json();
    const parsed = UpdateMemberRoleInputSchema.parse({ ...body, memberId });
    const result = await orgService.updateMemberRole(parsed.memberId, parsed.role, caller);
    return c.json(result, 200);
  });

  router.post("/events/:eventId/attendance/scan", async (c) => {
    const caller = c.get("caller");
    const eventId = c.req.param("eventId");
    const body = await c.req.json();
    const parsed = ScanAttendanceInputSchema.parse({ ...body, eventId });
    const result = await orgService.scanAttendance(parsed.eventId, parsed.ticketCode, caller);
    return c.json(result, 200);
  });

  router.post("/events/:eventId/attendance/confirm", async (c) => {
    const caller = c.get("caller");
    const eventId = c.req.param("eventId");
    const body = await c.req.json();
    const parsed = ConfirmAttendanceInputSchema.parse({ ...body, eventId });
    const result = await orgService.confirmAttendance(parsed.eventId, parsed.registrationId, caller);
    return c.json(result, 200);
  });

  return router;
}
