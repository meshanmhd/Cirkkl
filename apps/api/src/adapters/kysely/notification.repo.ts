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
      title: row.title,
      message: row.message,
      isRead: Boolean(row.is_read),
      eventId: row.event_id,
      teamId: row.team_id,
      senderId: row.sender_id,
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

    return {
      items: rows.map((r) => this.mapRow(r)),
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
    await this.db
      .insertInto("notifications")
      .values({
        id,
        user_id: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        is_read: data.isRead,
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
    await this.db
      .updateTable("notifications")
      .set({ is_read: true })
      .where("id", "=", id)
      .where("user_id", "=", userId)
      .execute();
  }

  async markAllRead(userId: string): Promise<number> {
    const res = await this.db
      .updateTable("notifications")
      .set({ is_read: true })
      .where("user_id", "=", userId)
      .where("is_read", "=", false)
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
    const query = this.db.deleteFrom("notifications").where("created_at", "<", cutoff);
    if (userId) {
      query.where("user_id", "=", userId);
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
    const res = await this.db
      .selectFrom("notifications")
      .select(sql<number>`count(*)`.as("count"))
      .where("user_id", "=", userId)
      .where("is_read", "=", false)
      .executeTakeFirst();

    return Number(res?.count ?? 0);
  }
}
