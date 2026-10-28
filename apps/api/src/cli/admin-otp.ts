import { config } from "dotenv";
config();
import pg from "pg";
import { decryptOtp } from "../crypto";

async function main() {
  const orgEmail = process.argv[2];
  if (!orgEmail) {
    console.error("Usage: pnpm --filter api admin:otp <org-email>");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: databaseUrl });
  try {
    const res = await pool.query(
      "SELECT id, email, org_otp, is_otp_verified, otp_expires_at, otp_failed_attempts FROM organisations WHERE LOWER(email) = LOWER($1)",
      [orgEmail]
    );

    if (res.rows.length === 0) {
      console.error("Organisation not found");
      process.exit(1);
    }

    const org = res.rows[0];
    if (org.is_otp_verified) {
      console.error("Organisation is already verified");
      process.exit(1);
    }

    if (!org.org_otp) {
      console.error("No OTP found for organisation");
      process.exit(1);
    }

    await pool.query(
      "INSERT INTO admin_audit_log (admin_user_id, action, target_org_id) VALUES (null, $1, $2)",
      ["cli_show_otp", org.id]
    );

    if (!org.org_otp.startsWith("v1:")) {
      console.log("legacy code, ask the org to request a new one");
      process.exit(0);
    }

    const code = decryptOtp(org.org_otp, process.env.OTP_SECRET);
    console.log(code);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
