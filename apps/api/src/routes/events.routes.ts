import { Hono } from "hono";
import {
  CreateEventInputSchema,
  ListEventsInputSchema,
  ListOrgEventsInputSchema,
  UpdateEventBodySchema,
  UpdateEventStatusInputSchema,
} from "@cirkkl/contracts";
import { EventService } from "../services/event.service";
import { requireOrg } from "./middleware/auth";

export function createEventsRoutes(eventService: EventService) {
  const router = new Hono();

  router.get("/", async (c) => {
    const query = c.req.query();
    const parsed = ListEventsInputSchema.parse(query);
    const result = await eventService.listEvents(parsed);
    return c.json(result, 200);
  });

  router.get("/:idOrSlug", async (c) => {
    const idOrSlug = c.req.param("idOrSlug")!;
    const result = await eventService.getEvent(idOrSlug);
    return c.json(result, 200);
  });

  router.post("/", requireOrg(), async (c) => {
    const caller = c.get("caller");
    const body = await c.req.json();
    const parsed = CreateEventInputSchema.parse(body);
    const result = await eventService.createEvent(parsed, caller);
    return c.json(result, 201);
  });

  router.put("/:id", requireOrg(), async (c) => {
    const caller = c.get("caller");
    const id = c.req.param("id")!;
    const body = await c.req.json();
    const parsed = UpdateEventBodySchema.parse(body);
    const result = await eventService.updateEvent(id, parsed, caller);
    return c.json(result, 200);
  });

  router.delete("/:id", requireOrg(), async (c) => {
    const caller = c.get("caller");
    const id = c.req.param("id")!;
    const result = await eventService.deleteEvent(id, caller);
    return c.json(result, 200);
  });

  router.patch("/:id/status", requireOrg(), async (c) => {
    const caller = c.get("caller");
    const id = c.req.param("id")!;
    const body = await c.req.json();
    const parsed = UpdateEventStatusInputSchema.parse({ id, ...body });
    const result = await eventService.updateEventStatus(id, parsed.status, caller);
    return c.json(result, 200);
  });

  return router;
}

export function createOrgEventsRoutes(eventService: EventService) {
  const router = new Hono();

  router.get("/", requireOrg(), async (c) => {
    const caller = c.get("caller");
    const query = c.req.query();
    const parsed = ListOrgEventsInputSchema.parse(query);
    const result = await eventService.listOrgEvents(parsed, caller);
    return c.json(result, 200);
  });

  router.get("/:id", requireOrg(), async (c) => {
    const caller = c.get("caller");
    const id = c.req.param("id")!;
    const result = await eventService.getForOrg(id, caller);
    return c.json(result, 200);
  });

  return router;
}
