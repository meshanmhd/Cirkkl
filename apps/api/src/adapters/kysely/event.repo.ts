import { Kysely, sql } from "kysely";
import { Database } from "./database";
import { EventRepo } from "../../ports/repositories";
import {
  CustomField,
  Event,
  EventHost,
  EventStatus,
  EventVisibility,
  PaginatedResult,
  PaginationOptions,
  Speaker,
} from "../../ports/domain";

export class KyselyEventRepo implements EventRepo {
  constructor(private readonly db: Kysely<Database>) {}

  private mapRowToEvent(row: any): Event {
    let speakers: Speaker[] = [];
    if (row.speakers) {
      try {
        speakers = typeof row.speakers === "string" ? JSON.parse(row.speakers) : row.speakers;
      } catch {
        speakers = [];
      }
    }

    let customFields: CustomField[] = [];
    if (row.custom_fields) {
      try {
        customFields = typeof row.custom_fields === "string" ? JSON.parse(row.custom_fields) : row.custom_fields;
      } catch {
        customFields = [];
      }
    }

    let tags: string[] = [];
    if (row.tags) {
      if (Array.isArray(row.tags)) {
        tags = row.tags;
      } else if (typeof row.tags === "string") {
        try {
          tags = JSON.parse(row.tags);
        } catch {
          tags = row.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
        }
      }
    }

    const isPaid = row.is_paid !== undefined ? Boolean(row.is_paid) : (row.price === "paid");
    const price = row.price ? (row.price.toLowerCase() === "paid" ? "paid" : "free") : (isPaid ? "paid" : "free");
    const seats = row.seats !== undefined && row.seats !== null ? Number(row.seats) : (row.capacity !== undefined && row.capacity !== null ? Number(row.capacity) : null);
    const seatsAvailable = row.seats_available !== undefined && row.seats_available !== null ? Number(row.seats_available) : (row.seatsAvailable !== undefined && row.seatsAvailable !== null ? Number(row.seatsAvailable) : seats);
    const priceAmount = row.price_amount !== undefined && row.price_amount !== null ? Number(row.price_amount) : (row.priceAmount !== undefined && row.priceAmount !== null ? Number(row.priceAmount) : null);

    return {
      id: row.id,
      organisationId: row.org_id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      tagline: row.tagline ?? null,
      category: row.category ?? null,
      organizer: row.organizer ?? null,
      venue: row.venue ?? null,
      city: row.city ?? null,
      startDate: new Date(row.start_date || row.date),
      endDate: row.end_date ? new Date(row.end_date) : null,
      time: row.time ?? null,
      endTime: row.end_time ?? null,
      location: row.location ?? row.venue ?? row.city ?? null,
      locationType: row.location_type ?? "physical",
      locationLink: row.location_link ?? null,
      meetingLink: row.meeting_link ?? null,
      platform: row.platform ?? null,
      registrationDeadline: row.registration_deadline ? new Date(row.registration_deadline) : null,
      registrationEndTime: row.registration_end_time ?? null,
      status: row.status as EventStatus,
      visibility: row.visibility as EventVisibility,
      isFeatured: Boolean(row.is_featured || row.featured),
      isPaid,
      price,
      priceAmount,
      seats,
      seatsAvailable,
      approvalRequired: Boolean(row.approval_required),
      cancellationPolicy: row.cancellation_policy ?? null,
      refundPolicy: row.refund_policy ?? null,
      photographyPolicy: row.photography_policy ?? null,
      tags,
      isTeamEvent: Boolean(row.is_team_event),
      minTeamSize: row.min_team_size ?? row.team_min_size ?? null,
      maxTeamSize: row.max_team_size ?? row.team_max_size ?? null,
      bannerUrl: row.banner_url || row.image || null,
      posterUrl: row.poster_url || row.poster_image || null,
      speakers,
      customFields,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };
  }

  async findById(id: string): Promise<Event | null> {
    const row = await this.db.selectFrom("events").selectAll().where("id", "=", id).executeTakeFirst();
    return row ? this.mapRowToEvent(row) : null;
  }

  async findBySlug(slug: string): Promise<Event | null> {
    const row = await this.db.selectFrom("events").selectAll().where("slug", "=", slug).executeTakeFirst();
    return row ? this.mapRowToEvent(row) : null;
  }

  async findPublicByIdOrSlug(idOrSlug: string): Promise<Event | null> {
    let query = this.db.selectFrom("events").selectAll().where("status", "=", "published");
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    if (isUuid) {
      query = query.where((eb) => eb.or([eb("id", "=", idOrSlug), eb("slug", "=", idOrSlug)]));
    } else {
      query = query.where("slug", "=", idOrSlug);
    }
    const row = await query.executeTakeFirst();
    return row ? this.mapRowToEvent(row) : null;
  }

  async findOrgEvent(idOrSlug: string, orgId: string): Promise<Event | null> {
    let query = this.db.selectFrom("events").selectAll().where("org_id", "=", orgId);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    if (isUuid) {
      query = query.where((eb) => eb.or([eb("id", "=", idOrSlug), eb("slug", "=", idOrSlug)]));
    } else {
      query = query.where("slug", "=", idOrSlug);
    }
    const row = await query.executeTakeFirst();
    return row ? this.mapRowToEvent(row) : null;
  }

  async findPublicEvents(filters: {
    search?: string;
    category?: string;
    timeFilter?: "upcoming" | "past" | "all";
    cursor?: string;
    limit?: number;
    allowedOrgIds?: string[];
  }): Promise<{ items: Event[]; nextCursor: string | null }> {
    const limit = filters.limit ?? 20;
    let query = this.db.selectFrom("events").selectAll().where("status", "=", "published");

    if (filters.allowedOrgIds && filters.allowedOrgIds.length > 0) {
      query = query.where((eb) =>
        eb.or([
          eb("visibility", "=", "public"),
          eb("visibility", "is", null),
          eb.and([
            eb("visibility", "=", "private"),
            eb("org_id", "in", filters.allowedOrgIds!),
          ]),
        ])
      );
    } else {
      query = query.where((eb) =>
        eb.or([
          eb("visibility", "=", "public"),
          eb("visibility", "is", null),
        ])
      );
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    if (filters.timeFilter === "upcoming") {
      query = query.where((eb) =>
        eb.or([
          eb("start_date", ">=", now),
          eb("end_date", ">=", now),
          eb.and([
            eb("end_date", "is", null),
            eb("start_date", ">=", todayStart),
          ]),
        ])
      );
    } else if (filters.timeFilter === "past") {
      query = query.where((eb) =>
        eb.or([
          eb.and([
            eb("end_date", "is not", null),
            eb("end_date", "<", now),
          ]),
          eb.and([
            eb("end_date", "is", null),
            eb("start_date", "<", todayStart),
          ]),
        ])
      );
    }

    if (filters.search) {
      const pattern = `%${filters.search}%`;
      query = query.where((eb) =>
        eb.or([eb("title", "ilike", pattern), eb("description", "ilike", pattern), eb("city", "ilike", pattern)])
      );
    }

    if (filters.cursor) {
      query = query.where("id", ">", filters.cursor);
    }

    const rows = await query.orderBy("created_at", "desc").orderBy("id", "desc").limit(limit + 1).execute();

    let nextCursor: string | null = null;
    let items = rows;
    if (rows.length > limit) {
      const nextItem = rows[limit];
      nextCursor = nextItem.id;
      items = rows.slice(0, limit);
    }

    return {
      items: items.map((r) => this.mapRowToEvent(r)),
      nextCursor,
    };
  }

  async findMany(
    filters?: {
      status?: EventStatus;
      isFeatured?: boolean;
      search?: string;
      startDateGte?: Date;
      orgId?: string;
    },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Event>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const offset = (page - 1) * limit;

    let query = this.db.selectFrom("events").selectAll();
    let countQuery = this.db.selectFrom("events").select(sql<number>`count(*)`.as("count"));

    if (filters?.status) {
      query = query.where("status", "=", filters.status);
      countQuery = countQuery.where("status", "=", filters.status);
    }
    if (filters?.isFeatured !== undefined) {
      query = query.where("is_featured", "=", filters.isFeatured);
      countQuery = countQuery.where("is_featured", "=", filters.isFeatured);
    }
    if (filters?.orgId) {
      query = query.where("org_id", "=", filters.orgId);
      countQuery = countQuery.where("org_id", "=", filters.orgId);
    }
    if (filters?.startDateGte) {
      query = query.where("start_date", ">=", filters.startDateGte);
      countQuery = countQuery.where("start_date", ">=", filters.startDateGte);
    }
    if (filters?.search) {
      const pattern = `%${filters.search}%`;
      query = query.where((eb) => eb.or([eb("title", "ilike", pattern), eb("description", "ilike", pattern)]));
      countQuery = countQuery.where((eb) => eb.or([eb("title", "ilike", pattern), eb("description", "ilike", pattern)]));
    }

    const [rows, countRes] = await Promise.all([
      query.orderBy("start_date", "desc").offset(offset).limit(limit).execute(),
      countQuery.executeTakeFirst(),
    ]);

    const total = Number(countRes?.count ?? 0);
    const totalPages = Math.ceil(total / limit);

    return {
      items: rows.map((r) => this.mapRowToEvent(r)),
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async findOrgEvents(
    orgId: string,
    filters?: { search?: string; status?: string; cursor?: string; limit?: number }
  ): Promise<{ items: Event[]; nextCursor: string | null }> {
    const limit = filters?.limit ?? 20;
    let query = this.db.selectFrom("events").selectAll().where("org_id", "=", orgId);

    if (filters?.status) {
      query = query.where("status", "=", filters.status);
    }
    if (filters?.search) {
      const pattern = `%${filters.search}%`;
      query = query.where("title", "ilike", pattern);
    }
    if (filters?.cursor) {
      query = query.where("id", ">", filters.cursor);
    }

    const rows = await query.orderBy("id", "asc").limit(limit + 1).execute();

    let nextCursor: string | null = null;
    let items = rows;
    if (rows.length > limit) {
      nextCursor = rows[limit].id;
      items = rows.slice(0, limit);
    }

    return {
      items: items.map((r) => this.mapRowToEvent(r)),
      nextCursor,
    };
  }

  async create(data: Omit<Event, "id" | "createdAt" | "updatedAt">): Promise<Event> {
    const id = crypto.randomUUID();
    const now = new Date();

    await this.db
      .insertInto("events")
      .values({
        id,
        org_id: data.organisationId,
        title: data.title,
        slug: data.slug,
        description: data.description,
        venue: data.venue ?? null,
        city: data.city ?? null,
        start_date: data.startDate,
        end_date: data.endDate ?? null,
        registration_deadline: data.registrationDeadline ?? null,
        status: data.status,
        visibility: data.visibility,
        is_featured: data.isFeatured,
        is_paid: data.isPaid,
        is_team_event: data.isTeamEvent,
        min_team_size: data.minTeamSize ?? null,
        max_team_size: data.maxTeamSize ?? null,
        capacity: null,
        banner_url: data.bannerUrl ?? null,
        poster_url: data.posterUrl ?? null,
        speakers: data.speakers ? JSON.stringify(data.speakers) : null,
        custom_fields: data.customFields ? JSON.stringify(data.customFields) : null,
      })
      .execute();

    const created = await this.findById(id);
    if (!created) {
      throw new Error("Failed to retrieve created event");
    }
    return created;
  }

  async update(id: string, data: Partial<Event>): Promise<Event> {
    const values: Record<string, unknown> = {};
    if (data.title !== undefined) values.title = data.title;
    if (data.slug !== undefined) values.slug = data.slug;
    if (data.description !== undefined) values.description = data.description;
    if (data.venue !== undefined) values.venue = data.venue;
    if (data.city !== undefined) values.city = data.city;
    if (data.startDate !== undefined) values.start_date = data.startDate;
    if (data.endDate !== undefined) values.end_date = data.endDate;
    if (data.registrationDeadline !== undefined) values.registration_deadline = data.registrationDeadline;
    if (data.status !== undefined) values.status = data.status;
    if (data.visibility !== undefined) values.visibility = data.visibility;
    if (data.isFeatured !== undefined) values.is_featured = data.isFeatured;
    if (data.isPaid !== undefined) values.is_paid = data.isPaid;
    if (data.isTeamEvent !== undefined) values.is_team_event = data.isTeamEvent;
    if (data.minTeamSize !== undefined) values.min_team_size = data.minTeamSize;
    if (data.maxTeamSize !== undefined) values.max_team_size = data.maxTeamSize;
    if (data.bannerUrl !== undefined) values.banner_url = data.bannerUrl;
    if (data.posterUrl !== undefined) values.poster_url = data.posterUrl;
    if (data.speakers !== undefined) values.speakers = JSON.stringify(data.speakers);
    if (data.customFields !== undefined) values.custom_fields = JSON.stringify(data.customFields);

    if (Object.keys(values).length > 0) {
      await this.db.updateTable("events").set(values).where("id", "=", id).execute();
    }

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error("Failed to retrieve updated event");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom("events").where("id", "=", id).execute();
  }

  async findHosts(eventId: string): Promise<EventHost[]> {
    const rows = await this.db
      .selectFrom("members")
      .select(["id", "user_id", "name", "role", "avatar_url"])
      .where("org_id", "=", (eb) => eb.selectFrom("events").select("org_id").where("id", "=", eventId))
      .execute();

    return rows.map((r) => ({
      id: r.user_id || r.id,
      name: r.name,
      role: r.role,
      avatarUrl: r.avatar_url ?? undefined,
    }));
  }

  async findRoles(eventId: string): Promise<Array<{ id: string; eventId: string; userId: string; role: string }>> {
    try {
      const rows = await this.db.selectFrom("event_roles").selectAll().where("event_id", "=", eventId).execute();
      return rows.map((r) => ({
        id: r.id,
        eventId: r.event_id,
        userId: r.user_id,
        role: r.role,
      }));
    } catch {
      return [];
    }
  }

  async assignRole(
    eventId: string,
    userId: string,
    role: string
  ): Promise<{ id: string; eventId: string; userId: string; role: string }> {
    const id = crypto.randomUUID();
    await this.db.insertInto("event_roles").values({ id, event_id: eventId, user_id: userId, role }).execute();
    return { id, eventId, userId, role };
  }

  async removeRole(eventId: string, roleId: string): Promise<void> {
    await this.db.deleteFrom("event_roles").where("id", "=", roleId).where("event_id", "=", eventId).execute();
  }
}
