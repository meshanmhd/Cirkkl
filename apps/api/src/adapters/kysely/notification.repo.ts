import { Kysely, sql } from "kysely";
import { Database } from "./database";
import { NotificationRepo } from "../../ports/repositories";
import { Notification, NotificationType, PaginatedResult, PaginationOptions } from "../../ports/domain";

export class KyselyNotificationRepo implements NotificationRepo {
  constructor(private readonly db: Kysely<Database>) {}

  private mapRow(row: any): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type as NotificationType,
      title: row.title || "Notification",
      message: row.message || "",
      isRead: Boolean(row.is_read ?? row.read),
      eventId: row.event_id ?? null,
      teamId: row.team_id ?? null,
      senderId: row.sender_id ?? null,
      createdAt: new Date(row.created_at),
    };
  }

  async findById(id: string): Promise<Notification | null> {
    const row = await this.db.selectFrom("notifications").selectAll().where("id", "=", id).executeTakeFirst();
    return row ? this.mapRow(row) : null;
  }

  async findByUser(
    userId: string,
    filters?: { type?: NotificationType; filter?: "all" | "invites" | "general" },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Notification>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const offset = (page - 1) * limit;

    let query = this.db.selectFrom("notifications").selectAll().where("user_id", "=", userId);
    let countQuery = this.db
      .selectFrom("notifications")
      .select(sql<number>`count(*)`.as("count"))
      .where("user_id", "=", userId);

    if (filters?.type) {
      query = query.where("type", "=", filters.type);
      countQuery = countQuery.where("type", "=", filters.type);
    } else if (filters?.filter === "invites") {
      query = query.where("type", "=", "team_invite");
      countQuery = countQuery.where("type", "=", "team_invite");
    } else if (filters?.filter === "general") {
      query = query.where("type", "!=", "team_invite");
      countQuery = countQuery.where("type", "!=", "team_invite");
    }

    const [rows, countRes] = await Promise.all([
      query.orderBy("created_at", "desc").offset(offset).limit(limit).execute(),
      countQuery.executeTakeFirst(),
    ]);

    const total = Number(countRes?.count ?? 0);
    const totalPages = Math.ceil(total / limit);

    const eventIds = Array.from(new Set(rows.map((r: any) => r.event_id).filter(Boolean)));
    const teamIds = Array.from(new Set(rows.map((r: any) => r.team_id).filter(Boolean)));
    const senderIds = Array.from(new Set(rows.map((r: any) => r.sender_id).filter(Boolean)));

    const [events, teams, senders, teamMembers] = await Promise.all([
      eventIds.length > 0
        ? (this.db as any).selectFrom("events").select(["id", "title"]).where("id", "in", eventIds).execute()
        : [],
      teamIds.length > 0
        ? (this.db as any).selectFrom("teams").select(["id", "name"]).where("id", "in", teamIds).execute()
        : [],
      senderIds.length > 0
        ? (this.db as any).selectFrom("profiles").select(["id", "full_name"]).where("id", "in", senderIds).execute()
        : [],
      teamIds.length > 0
        ? (this.db as any).selectFrom("team_members").select(["team_id", "status"]).where("team_id", "in", teamIds).where("user_id", "=", userId).execute()
        : [],
    ]);

    const eventMap = new Map<string, string>();
    for (const e of events) {
      if (e?.id && e.title) eventMap.set(e.id, e.title);
    }

    const teamMap = new Map<string, string>();
    for (const t of teams) {
      if (t?.id && t.name) teamMap.set(t.id, t.name);
    }

    const senderMap = new Map<string, string>();
    for (const s of senders) {
      if (s?.id && s.full_name) senderMap.set(s.id, s.full_name);
    }

    const teamMemberMap = new Map<string, "pending" | "approved" | "rejected">();
    for (const tm of teamMembers) {
      if (tm?.team_id && tm.status) teamMemberMap.set(tm.team_id, tm.status as any);
    }

    const items: Notification[] = rows.map((r: any) => {
      const eventTitle = r.event_id ? eventMap.get(r.event_id) ?? null : null;
      const teamName = r.team_id ? teamMap.get(r.team_id) ?? null : null;
      const senderName = r.sender_id ? senderMap.get(r.sender_id) ?? null : null;
      const inviteStatus = r.team_id ? teamMemberMap.get(r.team_id) ?? "pending" : null;

      let isRead = Boolean(r.is_read ?? r.read);
      if (r.type === "team_invite") {
        if (inviteStatus === "pending") {
          isRead = false;
        } else if (inviteStatus === "approved" || inviteStatus === "rejected") {
          isRead = true;
        }
      }

      let title = r.title;
      let message = r.message;

      if (!title || !message) {
        if (r.type === "team_invite") {
          const tName = teamName || "the team";
          const eTitle = eventTitle || "the event";
          if (inviteStatus === "approved") {
            title = title || "Team Invite Accepted";
            message = message || `You joined ${tName} for the event ${eTitle}.`;
          } else if (inviteStatus === "rejected") {
            title = title || "Team Invite Rejected";
            message = message || `You declined the invite to join ${tName} for the event ${eTitle}.`;
          } else {
            title = title || "Team Invite received";
            message = message || `${senderName || "Someone"} invited you to join team ${tName} for ${eTitle}.`;
          }
        } else if (r.type === "registration_approved") {
          title = title || "Registration Approved";
          message = message || `Your registration for ${eventTitle || "the event"} has been approved.`;
        } else if (r.type === "registration_rejected") {
          title = title || "Registration Rejected";
          message = message || `Your registration for ${eventTitle || "the event"} has been rejected.`;
        } else {
          title = title || "Notification";
          message = message || "You have a new notification.";
        }
      }

      return {
        id: r.id,
        userId: r.user_id,
        type: r.type as NotificationType,
        title,
        message,
        isRead,
        eventId: r.event_id ?? null,
        eventTitle,
        teamId: r.team_id ?? null,
        teamName,
        senderId: r.sender_id ?? null,
        senderName,
        inviteStatus,
        createdAt: new Date(r.created_at),
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async create(data: Omit<Notification, "id" | "createdAt">): Promise<Notification> {
    const id = crypto.randomUUID();
    await (this.db as any)
      .insertInto("notifications")
      .values({
        id,
        user_id: data.userId,
        type: data.type,
        title: data.title ?? null,
        message: data.message ?? null,
        is_read: data.isRead,
        read: data.isRead,
        event_id: data.eventId ?? null,
        team_id: data.teamId ?? null,
        sender_id: data.senderId ?? null,
      })
      .execute();

    const created = await this.findById(id);
    if (!created) {
      throw new Error("Failed to retrieve created notification");
    }
    return created;
  }

  async createMany(data: Array<Omit<Notification, "id" | "createdAt">>): Promise<Notification[]> {
    if (data.length === 0) return [];
    const results: Notification[] = [];
    for (const item of data) {
      const created = await this.create(item);
      results.push(created);
    }
    return results;
  }

  async markRead(id: string, userId: string): Promise<void> {
    await (this.db as any)
      .updateTable("notifications")
      .set({ is_read: true, read: true })
      .where("id", "=", id)
      .where("user_id", "=", userId)
      .execute();
  }

  async markAllRead(userId: string): Promise<number> {
    const res = await (this.db as any)
      .updateTable("notifications")
      .set({ is_read: true, read: true })
      .where("user_id", "=", userId)
      .where((eb: any) => eb.or([eb("is_read", "=", false), eb("read", "=", false)]))
      .execute();

    return Number(res[0]?.numUpdatedRows ?? 0);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.db
      .deleteFrom("notifications")
      .where("id", "=", id)
      .where("user_id", "=", userId)
      .execute();
  }

  async deleteOldNotifications(userId: string, olderThanDays: number): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    let query = this.db.deleteFrom("notifications").where("created_at", "<", cutoff);
    if (userId) {
      query = query.where("user_id", "=", userId);
    }
    const res = await query.execute();
    return Number(res[0]?.numDeletedRows ?? 0);
  }

  async deleteByEventAndTeam(eventId: string, teamId: string, type: NotificationType): Promise<number> {
    const res = await this.db
      .deleteFrom("notifications")
      .where("event_id", "=", eventId)
      .where("team_id", "=", teamId)
      .where("type", "=", type)
      .execute();

    return Number(res[0]?.numDeletedRows ?? 0);
  }

  async countUnread(userId: string): Promise<number> {
    const res = await (this.db as any)
      .selectFrom("notifications")
      .select(sql<number>`count(*)`.as("count"))
      .where("user_id", "=", userId)
      .where((eb: any) =>
        eb.and([
          eb("is_read", "=", false),
          eb.or([eb("read", "=", false), eb("read", "is", null)]),
        ])
      )
      .executeTakeFirst();

    return Number(res?.count ?? 0);
  }
}
