import { config } from "dotenv";
config();
import pg from "pg";

async function main() {
  const userEmail = process.argv[2];
  if (!userEmail) {
    console.error("Usage: pnpm --filter api admin:grant <user-email>");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: databaseUrl });
  try {
    const userRes = await pool.query(
      "SELECT id, email FROM auth.users WHERE LOWER(email) = LOWER($1)",
      [userEmail]
    );

    if (userRes.rows.length === 0) {
      console.error(`User not found with email: ${userEmail}`);
      process.exit(1);
    }

    const userId = userRes.rows[0].id;
    await pool.query(
      "INSERT INTO platform_admins (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING",
      [userId]
    );

    console.log(`Granted platform_admin to ${userEmail} (${userId})`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
