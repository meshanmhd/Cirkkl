import { Kysely, sql } from "kysely";
import { Database } from "./database";
import { MemberRepo } from "../../ports/repositories";
import { Member, PaginatedResult, PaginationOptions } from "../../ports/domain";

export class KyselyMemberRepo implements MemberRepo {
  constructor(private readonly db: Kysely<Database>) {}

  private mapRow(row: any): Member {
    return {
      id: row.id,
      organisationId: row.org_id,
      userId: row.user_id || row.id,
      name: row.name || row.full_name || "Member",
      email: row.email,
      role: row.role,
      department: row.department,
      avatarUrl: row.avatar_url,
      createdAt: new Date(row.created_at ?? row.joined_at ?? Date.now()),
    };
  }

  async findById(id: string): Promise<Member | null> {
    const row = await this.db.selectFrom("members").selectAll().where("id", "=", id).executeTakeFirst();
    return row ? this.mapRow(row) : null;
  }

  async findByOrgAndUser(orgId: string, userId: string): Promise<Member | null> {
    const row = await this.db
      .selectFrom("members")
      .selectAll()
      .where("org_id", "=", orgId)
      .where("user_id", "=", userId)
      .executeTakeFirst();
    return row ? this.mapRow(row) : null;
  }

  async findOrgIdsForUser(userId: string): Promise<string[]> {
    const rows = await this.db
      .selectFrom("members")
      .select("org_id")
      .where("user_id", "=", userId)
      .execute();
    return rows.map((r) => r.org_id);
  }

  async findManyByOrg(
    orgId: string,
    filters?: { search?: string; department?: string; role?: string },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Member>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const offset = (page - 1) * limit;

    let query = this.db.selectFrom("members").selectAll().where("org_id", "=", orgId);
    let countQuery = this.db
      .selectFrom("members")
      .select(sql<number>`count(*)`.as("count"))
      .where("org_id", "=", orgId);

    if (filters?.role) {
      query = query.where("role", "=", filters.role);
      countQuery = countQuery.where("role", "=", filters.role);
    }
    if (filters?.department) {
      query = query.where("department", "=", filters.department);
      countQuery = countQuery.where("department", "=", filters.department);
    }
    if (filters?.search) {
      const pattern = `%${filters.search}%`;
      query = query.where((eb) => eb.or([eb("name", "ilike", pattern), eb("email", "ilike", pattern)]));
      countQuery = countQuery.where((eb) => eb.or([eb("name", "ilike", pattern), eb("email", "ilike", pattern)]));
    }

    const [rows, countRes] = await Promise.all([
      query.orderBy("created_at", "asc").offset(offset).limit(limit).execute(),
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

  async create(data: Omit<Member, "id" | "createdAt" | "updatedAt">): Promise<Member> {
    const id = crypto.randomUUID();
    await this.db
      .insertInto("members")
      .values({
        id,
        org_id: data.organisationId,
        user_id: data.userId,
        name: data.name,
        email: data.email,
        role: data.role,
        department: data.department ?? null,
        avatar_url: data.avatarUrl ?? null,
      })
      .execute();

    const created = await this.findById(id);
    if (!created) {
      throw new Error("Failed to retrieve created member");
    }
    return created;
  }

  async updateRole(memberId: string, role: string): Promise<Member> {
    await this.db.updateTable("members").set({ role }).where("id", "=", memberId).execute();
    const updated = await this.findById(memberId);
    if (!updated) {
      throw new Error("Failed to retrieve updated member");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom("members").where("id", "=", id).execute();
  }
}
