import { Hono } from "hono";
import { RequestUploadInputSchema } from "@cirkkl/contracts";
import { UploadService } from "../services/upload.service";
import { requireUser } from "./middleware/auth";

export function createUploadsRoutes(uploadService: UploadService) {
  const router = new Hono();

  router.post("/presigned-url", requireUser(), async (c) => {
    const caller = c.get("caller");
    const body = await c.req.json();
    const parsed = RequestUploadInputSchema.parse(body);
    const result = await uploadService.requestUpload(parsed, caller);
    return c.json(result, 200);
  });

  return router;
}
