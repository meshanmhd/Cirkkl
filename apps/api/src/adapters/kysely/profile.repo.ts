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
    try {
      const row = await this.db
        .selectFrom("profiles")
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
        ])
        .where("profiles.id", "=", userId)
        .executeTakeFirst();

      if (!row) return null;
      
      // Email and cklId are fetched separately or set to empty
      // Since there's no users table in the schema, we just use empty defaults
      return this.mapRow(row, "", null);
    } catch (error) {
      console.error(`Error finding profile for userId ${userId}:`, error);
      return null;
    }
  }

  async findByCklId(cklId: string): Promise<Profile | null> {
    // Since there's no users table, we can't look up by ckl_id
    // This feature requires a users table or storing ckl_id in profiles table
    return null;
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

    // Return the profile with the email from the data
    const created = await this.db
      .selectFrom("profiles")
      .selectAll()
      .where("id", "=", data.userId)
      .executeTakeFirst();
    
    if (!created) {
      throw new Error("Failed to retrieve created profile");
    }
    
    return this.mapRow(created, data.email, data.cklId);
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

    // Fetch updated profile with preserved email
    const updated = await this.db
      .selectFrom("profiles")
      .selectAll()
      .where("id", "=", userId)
      .executeTakeFirst();
      
    if (!updated) {
      throw new Error("Failed to retrieve updated profile");
    }
    
    // Keep the email from the update data if provided, otherwise use empty
    const email = data.email ?? "";
    const cklId = data.cklId ?? null;
    
    return this.mapRow(updated, email, cklId);
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
