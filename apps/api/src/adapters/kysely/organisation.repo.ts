import { timingSafeEqual } from "crypto";
import { Kysely } from "kysely";
import { Database } from "./database";
import { OrganisationRepo, VerifyOtpResult } from "../../ports/repositories";
import { Organisation, OrgStatus } from "../../ports/domain";
import { decryptOtp, verifyLegacyHmac } from "../../crypto";

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
      otpExpiresAt: row.otp_expires_at ? new Date(row.otp_expires_at) : null,
      otpFailedAttempts: row.otp_failed_attempts ?? 0,
      createdAt: new Date(row.created_at),
    };
  }

  async findById(id: string): Promise<Organisation | null> {
    const row = await this.db.selectFrom("organisations").selectAll().where("id", "=", id).executeTakeFirst();
    console.log(`[OrgRepo] findById(${id}):`, row ? "FOUND" : "NOT FOUND");
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
        otp_expires_at: data.otpExpiresAt ?? null,
        otp_failed_attempts: data.otpFailedAttempts ?? 0,
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
    if (data.otpExpiresAt !== undefined) values.otp_expires_at = data.otpExpiresAt;
    if (data.otpFailedAttempts !== undefined) values.otp_failed_attempts = data.otpFailedAttempts;

    if (Object.keys(values).length > 0) {
      await this.db.updateTable("organisations").set(values).where("id", "=", id).execute();
    }

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error("Failed to retrieve updated organisation");
    }
    return updated;
  }

  async verifyOtp(orgId: string, otp: string): Promise<VerifyOtpResult> {
    return this.db.transaction().execute(async (trx) => {
      const row = await trx
        .selectFrom("organisations")
        .select([
          "id",
          "org_otp",
          "otp_expires_at",
          "otp_failed_attempts",
          "is_otp_verified",
        ])
        .where("id", "=", orgId)
        .forUpdate()
        .executeTakeFirst();

      if (!row || !row.org_otp) {
        return { success: false, reason: "not_found" };
      }

      if ((row.otp_failed_attempts ?? 0) >= 10) {
        return { success: false, reason: "max_attempts" };
      }

      if (row.otp_expires_at && new Date(row.otp_expires_at).getTime() < Date.now()) {
        return { success: false, reason: "expired" };
      }

      let isMatch = false;
      if (row.org_otp.startsWith("v1:")) {
        try {
          const decrypted = decryptOtp(row.org_otp);
          const decBuf = Buffer.from(decrypted, "utf8");
          const inBuf = Buffer.from(otp, "utf8");
          if (decBuf.length === inBuf.length) {
            isMatch = timingSafeEqual(decBuf, inBuf);
          }
        } catch {
          isMatch = false;
        }
      } else {
        isMatch = verifyLegacyHmac(otp, row.org_otp);
      }
      if (isMatch) {
        await trx
          .updateTable("organisations")
          .set({
            is_otp_verified: true,
            org_otp: null,
            otp_expires_at: null,
            otp_failed_attempts: 0,
          })
          .where("id", "=", orgId)
          .execute();
        return { success: true };
      }

      const nextAttempts = (row.otp_failed_attempts ?? 0) + 1;
      await trx
        .updateTable("organisations")
        .set({
          otp_failed_attempts: nextAttempts,
        })
        .where("id", "=", orgId)
        .execute();

      if (nextAttempts >= 10) {
        return { success: false, reason: "max_attempts" };
      }
      return { success: false, reason: "invalid" };
    });
  }
}
