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

function parseDateStr(d: any): string | null {
  if (!d) return null;
  if (d instanceof Date) return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
  const s = String(d).trim();
  return s.includes("T") ? s.split("T")[0] : s.slice(0, 10);
}

function parseTimeStr(t: any): string | null {
  if (!t) return null;
  return String(t).trim().slice(0, 5);
}

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
      time: parseTimeStr(row.time),
      endTime: parseTimeStr(row.end_time),
      location: row.location ?? row.venue ?? row.city ?? null,
      locationType: row.location_type ?? "physical",
      locationLink: row.location_link ?? null,
      meetingLink: row.meeting_link ?? null,
      platform: row.platform ?? null,
      registrationDeadline: row.registration_deadline ? new Date(row.registration_deadline) : null,
      registrationEndTime: parseTimeStr(row.registration_end_time),
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
  }): Promise<{ items: Event[]; nextCursor: string | null }> {
    const limit = filters.limit ?? 20;
    let query = this.db.selectFrom("events").selectAll().where("status", "=", "published");

    const now = new Date();
    if (filters.timeFilter === "upcoming") {
      query = query.where((eb) =>
        eb.or([
          eb("start_date", ">=", now),
          eb("end_date", ">=", now),
        ])
      );
    } else if (filters.timeFilter === "past") {
      query = query.where((eb) =>
        eb.and([
          eb("start_date", "<", now),
          eb.or([eb("end_date", "is", null), eb("end_date", "<", now)]),
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

    const rows = await query.orderBy("start_date", "asc").orderBy("id", "asc").limit(limit + 1).execute();

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

    await this.db
      .insertInto("events")
      .values({
        id,
        org_id: data.organisationId,
        title: data.title,
        slug: data.slug,
        description: data.description,
        tagline: data.tagline ?? null,
        category: data.category ?? null,
        organizer: data.organizer ?? null,
        venue: data.venue ?? null,
        city: data.city ?? null,
        date: parseDateStr(data.startDate),
        time: parseTimeStr(data.time),
        start_date: data.startDate,
        end_date: parseDateStr(data.endDate),
        end_time: parseTimeStr(data.endTime),
        registration_deadline: parseDateStr(data.registrationDeadline),
        registration_end_time: parseTimeStr(data.registrationEndTime),
        location: data.location ?? data.venue ?? data.city ?? null,
        location_type: data.locationType ?? "physical",
        location_link: data.locationLink ?? null,
        meeting_link: data.meetingLink ?? null,
        platform: data.platform ?? null,
        status: data.status,
        visibility: data.visibility,
        is_featured: data.isFeatured,
        is_paid: data.isPaid,
        price: data.price ?? (data.isPaid ? "paid" : "free"),
        price_amount: data.priceAmount ?? null,
        seats: data.seats ?? null,
        seats_available: data.seatsAvailable ?? data.seats ?? null,
        capacity: data.seats ?? null,
        approval_required: data.approvalRequired ?? false,
        cancellation_policy: data.cancellationPolicy ?? null,
        refund_policy: data.refundPolicy ?? null,
        photography_policy: data.photographyPolicy ?? null,
        tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []), 
        hosts: data.hosts ? JSON.stringify(data.hosts) : null,
        is_team_event: data.isTeamEvent,
        min_team_size: data.minTeamSize ?? null,
        max_team_size: data.maxTeamSize ?? null,
        banner_url: data.bannerUrl ?? null,
        poster_url: data.posterUrl ?? null,
        image: data.bannerUrl ?? null,
        poster_image: data.posterUrl ?? null,
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
    if (data.tagline !== undefined) values.tagline = data.tagline;
    if (data.category !== undefined) values.category = data.category;
    if (data.organizer !== undefined) values.organizer = data.organizer;
    if (data.venue !== undefined) values.venue = data.venue;
    if (data.city !== undefined) values.city = data.city;
    if (data.startDate !== undefined) {
      values.start_date = data.startDate;
      values.date = data.startDate ? data.startDate.toISOString().split("T")[0] : null;
    }
    if (data.time !== undefined) values.time = parseTimeStr(data.time);
    if (data.endDate !== undefined) values.end_date = parseDateStr(data.endDate);
    if (data.endTime !== undefined) values.end_time = parseTimeStr(data.endTime);
    if (data.registrationDeadline !== undefined) values.registration_deadline = parseDateStr(data.registrationDeadline);
    if (data.registrationEndTime !== undefined) values.registration_end_time = parseTimeStr(data.registrationEndTime);
    if (data.location !== undefined) values.location = data.location;
    if (data.locationType !== undefined) values.location_type = data.locationType;
    if (data.locationLink !== undefined) values.location_link = data.locationLink;
    if (data.meetingLink !== undefined) values.meeting_link = data.meetingLink;
    if (data.platform !== undefined) values.platform = data.platform;
    if (data.status !== undefined) values.status = data.status;
    if (data.visibility !== undefined) values.visibility = data.visibility;
    if (data.isFeatured !== undefined) values.is_featured = data.isFeatured;
    if (data.isPaid !== undefined) values.is_paid = data.isPaid;
    if (data.price !== undefined) values.price = data.price;
    if (data.priceAmount !== undefined) values.price_amount = data.priceAmount;
    if (data.seats !== undefined) {
      values.seats = data.seats;
      values.capacity = data.seats;
    }
    if (data.seatsAvailable !== undefined) values.seats_available = data.seatsAvailable;
    if (data.approvalRequired !== undefined) values.approval_required = data.approvalRequired;
    if (data.cancellationPolicy !== undefined) values.cancellation_policy = data.cancellationPolicy;
    if (data.refundPolicy !== undefined) values.refund_policy = data.refundPolicy;
    if (data.photographyPolicy !== undefined) values.photography_policy = data.photographyPolicy;
    if (data.tags !== undefined) {
      values.tags = Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []);
    }
    if (data.isTeamEvent !== undefined) values.is_team_event = data.isTeamEvent;
    if (data.minTeamSize !== undefined) values.min_team_size = data.minTeamSize;
    if (data.maxTeamSize !== undefined) values.max_team_size = data.maxTeamSize;
    if (data.bannerUrl !== undefined) {
      values.banner_url = data.bannerUrl;
      values.image = data.bannerUrl;
    }
    if (data.posterUrl !== undefined) {
      values.poster_url = data.posterUrl;
      values.poster_image = data.posterUrl;
    }
    if (data.speakers !== undefined) values.speakers = JSON.stringify(data.speakers);
    if (data.customFields !== undefined) values.custom_fields = JSON.stringify(data.customFields);
    if (data.hosts !== undefined) values.hosts = JSON.stringify(data.hosts);

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
    const hostRoles = await this.db
      .selectFrom("event_roles")
      .select("user_id")
      .where("event_id", "=", eventId)
      .where("role", "=", "host")
      .execute();

    if (hostRoles.length > 0) {
      const userIds = hostRoles.map((r) => r.user_id);
      const rows = await this.db
        .selectFrom("members")
        .select(["id", "user_id", "name", "role", "avatar_url"])
        .where((eb) => eb.or([eb("user_id", "in", userIds), eb("id", "in", userIds)]))
        .execute();

      return rows.map((r) => ({
        id: r.user_id || r.id,
        name: r.name,
        role: r.role,
        avatarUrl: r.avatar_url ?? undefined,
      }));
    }

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

  async setHosts(eventId: string, hostUserIds: string[]): Promise<void> {
    await this.db
      .deleteFrom("event_roles")
      .where("event_id", "=", eventId)
      .where("role", "=", "host")
      .execute();

    for (const userId of hostUserIds) {
      await this.db
        .insertInto("event_roles")
        .values({
          id: crypto.randomUUID(),
          event_id: eventId,
          user_id: userId,
          role: "host",
        })
        .execute();
    }
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
