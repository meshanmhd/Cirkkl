import { Kysely } from "kysely";
import { Database } from "./database";
import { OrganisationRepo } from "../../ports/repositories";
import { Organisation, OrgStatus } from "../../ports/domain";

export class KyselyOrganisationRepo implements OrganisationRepo {
  constructor(private readonly db: Kysely<Database>) {}

  private mapRow(row: any): Organisation {
    return {
      id: row.id,
      ownerId: row.id,
      name: row.name,
      email: row.email,
      status: (row.is_approved ? "approved" : "pending") as OrgStatus,
      isOtpVerified: Boolean(row.is_otp_verified),
      otp: row.org_otp,
      createdAt: new Date(row.created_at),
    };
  }

  async findById(id: string): Promise<Organisation | null> {
    const row = await this.db.selectFrom("organisations").selectAll().where("id", "=", id).executeTakeFirst();
    return row ? this.mapRow(row) : null;
  }

  async findByOwnerId(ownerId: string): Promise<Organisation | null> {
    return this.findById(ownerId);
  }

  async create(data: Omit<Organisation, "id" | "createdAt" | "updatedAt">): Promise<Organisation> {
    const id = data.ownerId;
    await this.db
      .insertInto("organisations")
      .values({
        id,
        name: data.name,
        email: data.email,
        is_approved: data.status === "approved",
        is_otp_verified: data.isOtpVerified,
        org_otp: data.otp ?? null,
      })
      .execute();

    const created = await this.findById(id);
    if (!created) {
      throw new Error("Failed to retrieve created organisation");
    }
    return created;
  }

  async update(id: string, data: Partial<Organisation>): Promise<Organisation> {
    const values: Record<string, unknown> = {};
    if (data.name !== undefined) values.name = data.name;
    if (data.email !== undefined) values.email = data.email;
    if (data.status !== undefined) values.is_approved = data.status === "approved";
    if (data.isOtpVerified !== undefined) values.is_otp_verified = data.isOtpVerified;
    if (data.otp !== undefined) values.org_otp = data.otp;

    if (Object.keys(values).length > 0) {
      await this.db.updateTable("organisations").set(values).where("id", "=", id).execute();
    }

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error("Failed to retrieve updated organisation");
    }
    return updated;
  }

  async verifyOtp(orgId: string, otp: string): Promise<boolean> {
    const row = await this.db
      .selectFrom("organisations")
      .select(["id", "org_otp"])
      .where("id", "=", orgId)
      .executeTakeFirst();

    if (!row || !row.org_otp) {
      return false;
    }

    if (row.org_otp === otp) {
      await this.db
        .updateTable("organisations")
        .set({
          is_otp_verified: true,
          org_otp: null,
        })
        .where("id", "=", orgId)
        .execute();
      return true;
    }

    return false;
  }
}
