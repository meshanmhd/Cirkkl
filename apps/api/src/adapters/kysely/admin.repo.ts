import { Kysely, sql } from "kysely";
import { Database } from "./database";
import { AdminRepo } from "../../ports/repositories";

export class KyselyAdminRepo implements AdminRepo {
  constructor(private readonly db: Kysely<Database>) {}

  async isSuperAdmin(userId: string): Promise<boolean> {
    const admin = await this.db
      .selectFrom("platform_admins")
      .select("user_id")
      .where("user_id", "=", userId)
      .executeTakeFirst();
    return Boolean(admin);
  }

  async logAudit(entry: {
    adminUserId: string | null;
    action: string;
    targetOrgId?: string | null;
  }): Promise<void> {
    await this.db
      .insertInto("admin_audit_log")
      .values({
        admin_user_id: entry.adminUserId,
        action: entry.action,
        target_org_id: entry.targetOrgId ?? null,
      })
      .execute();
  }

  async addPlatformAdmin(userId: string): Promise<void> {
    await sql`INSERT INTO platform_admins (user_id) VALUES (${userId}) ON CONFLICT (user_id) DO NOTHING`.execute(this.db);
  }
}
