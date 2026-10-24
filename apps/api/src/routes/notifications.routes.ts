import { Hono } from "hono";
import { ListNotificationsInputSchema } from "@cirkkl/contracts";
import { NotificationService } from "../services/notification.service";
import { requireUser } from "./middleware/auth";

export function createNotificationsRoutes(notificationService: NotificationService) {
  const router = new Hono();

  router.use("*", requireUser());

  router.get("/", async (c) => {
    const caller = c.get("caller");
    const query = c.req.query();
    const parsed = ListNotificationsInputSchema.parse(query);
    const result = await notificationService.list(caller, parsed);
    return c.json(result, 200);
  });

  router.patch("/:id/read", async (c) => {
    const caller = c.get("caller");
    const id = c.req.param("id");
    const result = await notificationService.markRead(id, caller);
    return c.json(result, 200);
  });

  router.post("/mark-all-read", async (c) => {
    const caller = c.get("caller");
    const result = await notificationService.markAllRead(caller);
    return c.json(result, 200);
  });

  router.delete("/:id", async (c) => {
    const caller = c.get("caller");
    const id = c.req.param("id");
    const result = await notificationService.delete(id, caller);
    return c.json(result, 200);
  });

  router.get("/unread-count", async (c) => {
    const caller = c.get("caller");
    const result = await notificationService.unreadCount(caller);
    return c.json(result, 200);
  });

  router.get("/stream", async (c) => {
    const caller = c.get("caller");
    const realtime = notificationService.getRealtimeProvider();

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`event: ping\ndata: {}\n\n`));

        let unsubscribe: (() => void) | undefined;
        realtime
          .subscribe(caller.userId, (event, payload) => {
            try {
              controller.enqueue(
                encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`)
              );
            } catch {
            }
          })
          .then((unsub) => {
            unsubscribe = unsub;
          });

        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`event: ping\ndata: {}\n\n`));
          } catch {
            clearInterval(keepAlive);
          }
        }, 30000);

        c.req.raw.signal.addEventListener("abort", () => {
          clearInterval(keepAlive);
          if (unsubscribe) unsubscribe();
          try {
            controller.close();
          } catch {
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  });

  return router;
}
