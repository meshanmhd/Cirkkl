import { Hono } from "hono";
import {
  AcceptTeamInviteInputSchema,
  DeclineTeamInviteInputSchema,
  LookupTeammateInputSchema,
  RegisterForEventInputSchema,
} from "@cirkkl/contracts";
import { RegistrationService } from "../services/registration.service";
import { requireUser } from "./middleware/auth";

export function createRegistrationsRoutes(registrationService: RegistrationService) {
  const router = new Hono();

  router.post("/events/:eventId/registrations", requireUser(), async (c) => {
    const caller = c.get("caller");
    const eventId = c.req.param("eventId")!;
    const body = await c.req.json();
    const parsed = RegisterForEventInputSchema.parse({ ...body, eventId });
    const result = await registrationService.registerForEvent(parsed, caller);
    return c.json(result, 201);
  });

  router.get("/events/:eventId/my-registration", requireUser(), async (c) => {
    const caller = c.get("caller");
    const eventId = c.req.param("eventId")!;
    const result = await registrationService.getMine(eventId, caller);
    return c.json(result, 200);
  });

  router.get("/events/:eventId/teammates/lookup", requireUser(), async (c) => {
    const caller = c.get("caller");
    const eventId = c.req.param("eventId")!;
    const cklId = c.req.query("cklId") || "";
    const parsed = LookupTeammateInputSchema.parse({ eventId, cklId });
    const result = await registrationService.lookupTeammate(parsed.eventId, parsed.cklId, caller);
    return c.json(result, 200);
  });

  router.post("/registrations/teams/:teamId/accept", requireUser(), async (c) => {
    const caller = c.get("caller");
    const teamId = c.req.param("teamId")!;
    const body = await c.req.json();
    const parsed = AcceptTeamInviteInputSchema.parse({ ...body, teamId });
    const result = await registrationService.acceptTeamInvite(parsed.teamId, parsed.eventId, caller);
    return c.json(result, 200);
  });

  router.post("/registrations/teams/:teamId/decline", requireUser(), async (c) => {
    const caller = c.get("caller");
    const teamId = c.req.param("teamId")!;
    const body = await c.req.json();
    const parsed = DeclineTeamInviteInputSchema.parse({ ...body, teamId });
    const result = await registrationService.declineTeamInvite(parsed.teamId, parsed.eventId, caller);
    return c.json(result, 200);
  });

  router.get("/registrations/my-tickets", requireUser(), async (c) => {
    const caller = c.get("caller");
    const result = await registrationService.myTickets(caller);
    return c.json(result, 200);
  });

  return router;
}
