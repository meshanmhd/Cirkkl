import { Hono } from "hono";
import {
  SearchCollegesInputSchema,
  UpdateAvatarInputSchema,
  UpdateProfileInputSchema,
} from "@cirkkl/contracts";
import { ProfileService } from "../services/profile.service";
import { requireUser } from "./middleware/auth";

export function createProfileRoutes(profileService: ProfileService) {
  const router = new Hono();

  router.get("/", requireUser(), async (c) => {
    const caller = c.get("caller");
    const result = await profileService.getProfile(caller);
    return c.json(result, 200);
  });

  router.put("/", requireUser(), async (c) => {
    const caller = c.get("caller");
    const body = await c.req.json();
    const parsed = UpdateProfileInputSchema.parse(body);
    const result = await profileService.updateProfile(parsed, caller);
    return c.json(result, 200);
  });

  router.post("/avatar", requireUser(), async (c) => {
    const caller = c.get("caller");
    const body = await c.req.json();
    const parsed = UpdateAvatarInputSchema.parse(body);
    const result = await profileService.updateAvatar(parsed.avatarKey, caller);
    return c.json(result, 200);
  });

  return router;
}

export function createCollegeRoutes(profileService: ProfileService) {
  const router = new Hono();

  router.get("/search", async (c) => {
    const query = c.req.query();
    const parsed = SearchCollegesInputSchema.parse(query);
    const result = await profileService.searchColleges(parsed.query, parsed.limit);
    return c.json(result, 200);
  });

  return router;
}
