import { Kysely, sql } from "kysely";
import { Database } from "./database";
import { RegistrationRepo } from "../../ports/repositories";
import { PaginatedResult, PaginationOptions, Registration, RegistrationStatus } from "../../ports/domain";

export class KyselyRegistrationRepo implements RegistrationRepo {
  constructor(private readonly db: Kysely<Database>) {}

  private mapRow(row: any): Registration {
    let fieldValues: Record<string, string> = {};
    if (row.field_values) {
      try {
        fieldValues = typeof row.field_values === "string" ? JSON.parse(row.field_values) : row.field_values;
      } catch {
        fieldValues = {};
      }
    }

    return {
      id: row.id,
      eventId: row.event_id,
      userId: row.user_id,
      ticketId: row.ticket_id,
      ticketCode: row.ticket_code,
      status: row.status as RegistrationStatus,
      attended: Boolean(row.attended),
      attendedAt: row.attended_at ? new Date(row.attended_at) : null,
      isTeam: Boolean(row.is_team),
      teamId: row.team_id,
      fieldValues,
      transactionId: row.transaction_id,
      paymentProofKey: row.payment_proof_url,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };
  }

  async findById(id: string): Promise<Registration | null> {
    const row = await this.db.selectFrom("registrations").selectAll().where("id", "=", id).executeTakeFirst();
    return row ? this.mapRow(row) : null;
  }

  async findByTicketCode(ticketCode: string): Promise<Registration | null> {
    const row = await this.db
      .selectFrom("registrations")
      .selectAll()
      .where("ticket_code", "=", ticketCode)
      .executeTakeFirst();
    return row ? this.mapRow(row) : null;
  }

  async findByUserAndEvent(userId: string, eventId: string): Promise<Registration | null> {
    const row = await this.db
      .selectFrom("registrations")
      .selectAll()
      .where("user_id", "=", userId)
      .where("event_id", "=", eventId)
      .executeTakeFirst();
    return row ? this.mapRow(row) : null;
  }

  async findMine(userId: string, eventId: string): Promise<Registration | null> {
    return this.findByUserAndEvent(userId, eventId);
  }

  async lookupTeammate(
    eventId: string,
    cklId: string
  ): Promise<{ id: string; displayName: string; isRegistered: boolean; isInTeam: boolean } | null> {
    const user = await this.db
      .selectFrom("users")
      .select(["id", "full_name"])
      .where("ckl_id", "=", cklId)
      .executeTakeFirst();

    if (!user) {
      return null;
    }

    const registration = await this.db
      .selectFrom("registrations")
      .select(["id", "status"])
      .where("event_id", "=", eventId)
      .where("user_id", "=", user.id)
      .executeTakeFirst();

    const isRegistered = Boolean(registration && registration.status !== "rejected" && registration.status !== "cancelled");

    const teamMember = await this.db
      .selectFrom("team_members")
      .innerJoin("teams", "teams.id", "team_members.team_id")
      .select("team_members.id")
      .where("teams.event_id", "=", eventId)
      .where("team_members.user_id", "=", user.id)
      .where("team_members.status", "!=", "rejected")
      .executeTakeFirst();

    const isInTeam = Boolean(teamMember);

    return {
      id: user.id,
      displayName: user.full_name || cklId,
      isRegistered,
      isInTeam,
    };
  }

  async findByEvent(
    eventId: string,
    filters?: { status?: RegistrationStatus; search?: string },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Registration>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const offset = (page - 1) * limit;

    let query = this.db.selectFrom("registrations").selectAll().where("event_id", "=", eventId);
    let countQuery = this.db
      .selectFrom("registrations")
      .select(sql<number>`count(*)`.as("count"))
      .where("event_id", "=", eventId);

    if (filters?.status) {
      query = query.where("status", "=", filters.status);
      countQuery = countQuery.where("status", "=", filters.status);
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

  async findUserTickets(
    userId: string
  ): Promise<Array<Registration & { eventTitle: string; eventDate?: Date }>> {
    const directRows = await this.db
      .selectFrom("registrations")
      .innerJoin("events", "events.id", "registrations.event_id")
      .select([
        "registrations.id",
        "registrations.event_id",
        "registrations.user_id",
        "registrations.ticket_id",
        "registrations.ticket_code",
        "registrations.status",
        "registrations.attended",
        "registrations.attended_at",
        "registrations.is_team",
        "registrations.team_id",
        "registrations.field_values",
        "registrations.transaction_id",
        "registrations.payment_proof_url",
        "registrations.created_at",
        "registrations.updated_at",
        "events.title as event_title",
        "events.start_date as event_start_date",
      ])
      .where("registrations.user_id", "=", userId)
      .where("registrations.status", "=", "approved")
      .execute();

    const teamRows = await this.db
      .selectFrom("team_members")
      .innerJoin("teams", "teams.id", "team_members.team_id")
      .innerJoin("registrations", "registrations.team_id", "teams.id")
      .innerJoin("events", "events.id", "teams.event_id")
      .select([
        "registrations.id",
        "registrations.event_id",
        "registrations.user_id",
        "registrations.ticket_id",
        "registrations.ticket_code",
        "registrations.status",
        "registrations.attended",
        "registrations.attended_at",
        "registrations.is_team",
        "registrations.team_id",
        "registrations.field_values",
        "registrations.transaction_id",
        "registrations.payment_proof_url",
        "registrations.created_at",
        "registrations.updated_at",
        "events.title as event_title",
        "events.start_date as event_start_date",
      ])
      .where("team_members.user_id", "=", userId)
      .where("team_members.status", "=", "approved")
      .where("registrations.status", "=", "approved")
      .execute();

    const seen = new Set<string>();
    const results: Array<Registration & { eventTitle: string; eventDate?: Date }> = [];

    for (const r of [...directRows, ...teamRows]) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        const mapped = this.mapRow(r);
        results.push({
          ...mapped,
          eventTitle: r.event_title,
          eventDate: r.event_start_date ? new Date(r.event_start_date) : undefined,
        });
      }
    }

    return results;
  }

  async countByEvent(eventId: string, status?: RegistrationStatus): Promise<number> {
    let query = this.db
      .selectFrom("registrations")
      .select(sql<number>`count(*)`.as("count"))
      .where("event_id", "=", eventId);

    if (status) {
      query = query.where("status", "=", status);
    }

    const res = await query.executeTakeFirst();
    return Number(res?.count ?? 0);
  }

  async create(data: Omit<Registration, "id" | "createdAt" | "updatedAt">): Promise<Registration> {
    const id = crypto.randomUUID();
    await this.db
      .insertInto("registrations")
      .values({
        id,
        event_id: data.eventId,
        user_id: data.userId,
        ticket_id: data.ticketId ?? null,
        ticket_code: data.ticketCode,
        status: data.status,
        attended: data.attended,
        attended_at: data.attendedAt ?? null,
        is_team: data.isTeam,
        team_id: data.teamId ?? null,
        field_values: data.fieldValues ? JSON.stringify(data.fieldValues) : null,
        transaction_id: data.transactionId ?? null,
        payment_proof_url: data.paymentProofKey ?? null,
      })
      .execute();

    const created = await this.findById(id);
    if (!created) {
      throw new Error("Failed to retrieve created registration");
    }
    return created;
  }

  async update(id: string, data: Partial<Registration>): Promise<Registration> {
    const values: Record<string, unknown> = {};
    if (data.status !== undefined) values.status = data.status;
    if (data.attended !== undefined) values.attended = data.attended;
    if (data.attendedAt !== undefined) values.attended_at = data.attendedAt;
    if (data.ticketCode !== undefined) values.ticket_code = data.ticketCode;
    if (data.ticketId !== undefined) values.ticket_id = data.ticketId;
    if (data.teamId !== undefined) values.team_id = data.teamId;
    if (data.transactionId !== undefined) values.transaction_id = data.transactionId;
    if (data.paymentProofKey !== undefined) values.payment_proof_url = data.paymentProofKey;
    if (data.fieldValues !== undefined) values.field_values = JSON.stringify(data.fieldValues);

    if (Object.keys(values).length > 0) {
      await this.db.updateTable("registrations").set(values).where("id", "=", id).execute();
    }

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error("Failed to retrieve updated registration");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom("registrations").where("id", "=", id).execute();
  }
}
