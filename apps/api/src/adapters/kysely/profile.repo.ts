import { Kysely } from "kysely";
import { Database } from "./database";
import { ProfileRepo } from "../../ports/repositories";
import { College, Profile } from "../../ports/domain";

export class KyselyProfileRepo implements ProfileRepo {
  constructor(private readonly db: Kysely<Database>) {}

  private mapRow(row: any, email: string = "", cklId: string | null = null): Profile {
    return {
      userId: row.id,
      email,
      fullName: row.full_name,
      cklId: cklId ?? row.ckl_id,
      college: row.college,
      branch: row.branch,
      academicYear: row.academic_year,
      phoneNumber: row.phone_number,
      gender: row.gender,
      avatarUrl: row.avatar_url,
      isProfileCompleted: Boolean(row.is_profile_completed),
      linkedinUrl: row.linkedin_url,
      githubUrl: row.github_url,
      bio: row.bio,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    const row = await this.db
      .selectFrom("profiles")
      .innerJoin("users", "users.id", "profiles.id")
      .select([
        "profiles.id",
        "profiles.is_profile_completed",
        "profiles.full_name",
        "profiles.college",
        "profiles.branch",
        "profiles.academic_year",
        "profiles.phone_number",
        "profiles.gender",
        "profiles.avatar_url",
        "profiles.linkedin_url",
        "profiles.github_url",
        "profiles.bio",
        "profiles.created_at",
        "profiles.updated_at",
        "users.email",
        "users.ckl_id",
      ])
      .where("profiles.id", "=", userId)
      .executeTakeFirst();

    return row ? this.mapRow(row, row.email, row.ckl_id) : null;
  }

  async findByCklId(cklId: string): Promise<Profile | null> {
    const user = await this.db
      .selectFrom("users")
      .select(["id", "email", "ckl_id"])
      .where("ckl_id", "=", cklId)
      .executeTakeFirst();

    if (!user) return null;
    return this.findByUserId(user.id);
  }

  async create(data: Omit<Profile, "createdAt" | "updatedAt">): Promise<Profile> {
    await this.db
      .insertInto("profiles")
      .values({
        id: data.userId,
        is_profile_completed: data.isProfileCompleted,
        full_name: data.fullName ?? null,
        college: data.college ?? null,
        branch: data.branch ?? null,
        academic_year: data.academicYear ?? null,
        phone_number: data.phoneNumber ?? null,
        gender: data.gender ?? null,
        avatar_url: data.avatarUrl ?? null,
        linkedin_url: data.linkedinUrl ?? null,
        github_url: data.githubUrl ?? null,
        bio: data.bio ?? null,
      })
      .execute();

    const created = await this.findByUserId(data.userId);
    if (!created) {
      throw new Error("Failed to retrieve created profile");
    }
    return created;
  }

  async update(userId: string, data: Partial<Profile>): Promise<Profile> {
    const values: Record<string, unknown> = {};
    if (data.isProfileCompleted !== undefined) values.is_profile_completed = data.isProfileCompleted;
    if (data.fullName !== undefined) values.full_name = data.fullName;
    if (data.college !== undefined) values.college = data.college;
    if (data.branch !== undefined) values.branch = data.branch;
    if (data.academicYear !== undefined) values.academic_year = data.academicYear;
    if (data.phoneNumber !== undefined) values.phone_number = data.phoneNumber;
    if (data.gender !== undefined) values.gender = data.gender;
    if (data.avatarUrl !== undefined) values.avatar_url = data.avatarUrl;
    if (data.linkedinUrl !== undefined) values.linkedin_url = data.linkedinUrl;
    if (data.githubUrl !== undefined) values.github_url = data.githubUrl;
    if (data.bio !== undefined) values.bio = data.bio;

    if (Object.keys(values).length > 0) {
      await this.db.updateTable("profiles").set(values).where("id", "=", userId).execute();
    }

    if (data.fullName !== undefined) {
      await this.db.updateTable("users").set({ full_name: data.fullName }).where("id", "=", userId).execute();
    }

    const updated = await this.findByUserId(userId);
    if (!updated) {
      throw new Error("Failed to retrieve updated profile");
    }
    return updated;
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<string> {
    await this.db.updateTable("profiles").set({ avatar_url: avatarUrl }).where("id", "=", userId).execute();
    return avatarUrl;
  }

  async searchColleges(query: string, limit?: number): Promise<College[]> {
    const defaultColleges: College[] = [
      { name: "Indian Institute of Technology Bombay", city: "Mumbai", state: "Maharashtra" },
      { name: "Indian Institute of Technology Delhi", city: "New Delhi", state: "Delhi" },
      { name: "Indian Institute of Technology Madras", city: "Chennai", state: "Tamil Nadu" },
      { name: "Indian Institute of Science", city: "Bengaluru", state: "Karnataka" },
      { name: "National Institute of Technology Calicut", city: "Calicut", state: "Kerala" },
      { name: "College of Engineering Trivandrum", city: "Trivandrum", state: "Kerala" },
      { name: "Model Engineering College", city: "Kochi", state: "Kerala" },
      { name: "Government Engineering College Thrissur", city: "Thrissur", state: "Kerala" },
    ];

    const q = query.toLowerCase();
    const filtered = defaultColleges.filter((c) => c.name.toLowerCase().includes(q));
    return filtered.slice(0, limit ?? 10);
  }
}
