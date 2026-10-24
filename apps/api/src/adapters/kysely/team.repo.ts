import { Kysely } from "kysely";
import { Database } from "./database";
import { TeamRepo } from "../../ports/repositories";
import { Team, TeamMember, TeamMemberStatus } from "../../ports/domain";

export class KyselyTeamRepo implements TeamRepo {
  constructor(private readonly db: Kysely<Database>) {}

  private mapTeam(row: any): Team {
    return {
      id: row.id,
      eventId: row.event_id,
      leaderId: row.leader_id,
      name: row.name,
      createdAt: new Date(row.created_at),
    };
  }

  private mapMember(row: any): TeamMember {
    return {
      id: row.id,
      teamId: row.team_id,
      userId: row.user_id,
      status: row.status as TeamMemberStatus,
      createdAt: new Date(row.created_at),
    };
  }

  async findById(id: string): Promise<Team | null> {
    const row = await this.db.selectFrom("teams").selectAll().where("id", "=", id).executeTakeFirst();
    return row ? this.mapTeam(row) : null;
  }

  async findByLeaderAndEvent(leaderId: string, eventId: string): Promise<Team | null> {
    const row = await this.db
      .selectFrom("teams")
      .selectAll()
      .where("leader_id", "=", leaderId)
      .where("event_id", "=", eventId)
      .executeTakeFirst();
    return row ? this.mapTeam(row) : null;
  }

  async findActiveMembership(userId: string, eventId: string): Promise<TeamMember | null> {
    const row = await this.db
      .selectFrom("team_members")
      .innerJoin("teams", "teams.id", "team_members.team_id")
      .selectAll("team_members")
      .where("teams.event_id", "=", eventId)
      .where("team_members.user_id", "=", userId)
      .where("team_members.status", "!=", "rejected")
      .executeTakeFirst();
    return row ? this.mapMember(row) : null;
  }

  async findByEvent(eventId: string): Promise<Team[]> {
    const rows = await this.db.selectFrom("teams").selectAll().where("event_id", "=", eventId).execute();
    return rows.map((r) => this.mapTeam(r));
  }

  async create(data: { name: string; eventId: string; leaderId: string }): Promise<Team> {
    const id = crypto.randomUUID();
    await this.db
      .insertInto("teams")
      .values({
        id,
        name: data.name,
        event_id: data.eventId,
        leader_id: data.leaderId,
      })
      .execute();

    const created = await this.findById(id);
    if (!created) {
      throw new Error("Failed to retrieve created team");
    }
    return created;
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom("team_members").where("team_id", "=", id).execute();
    await this.db.deleteFrom("teams").where("id", "=", id).execute();
  }

  async findMembers(teamId: string): Promise<TeamMember[]> {
    const rows = await this.db.selectFrom("team_members").selectAll().where("team_id", "=", teamId).execute();
    return rows.map((r) => this.mapMember(r));
  }

  async addMember(data: { teamId: string; userId: string; status: TeamMemberStatus }): Promise<TeamMember> {
    const id = crypto.randomUUID();
    await this.db
      .insertInto("team_members")
      .values({
        id,
        team_id: data.teamId,
        user_id: data.userId,
        status: data.status,
      })
      .execute();

    const row = await this.db.selectFrom("team_members").selectAll().where("id", "=", id).executeTakeFirst();
    if (!row) {
      throw new Error("Failed to retrieve created team member");
    }
    return this.mapMember(row);
  }

  async updateMemberStatus(teamId: string, userId: string, status: TeamMemberStatus): Promise<TeamMember> {
    await this.db
      .updateTable("team_members")
      .set({ status })
      .where("team_id", "=", teamId)
      .where("user_id", "=", userId)
      .execute();

    const row = await this.db
      .selectFrom("team_members")
      .selectAll()
      .where("team_id", "=", teamId)
      .where("user_id", "=", userId)
      .executeTakeFirst();

    if (!row) {
      throw new Error("Failed to retrieve updated team member");
    }
    return this.mapMember(row);
  }

  async removeMember(teamId: string, userId: string): Promise<void> {
    await this.db
      .deleteFrom("team_members")
      .where("team_id", "=", teamId)
      .where("user_id", "=", userId)
      .execute();
  }
}
