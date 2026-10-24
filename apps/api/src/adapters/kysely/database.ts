import { Generated, Kysely, PostgresDialect } from "kysely";
import pg from "pg";

export interface UsersTable {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
  ckl_id: string | null;
  created_at: Generated<Date>;
}

export interface OrganisationsTable {
  id: string;
  name: string;
  email: string;
  is_approved: boolean;
  is_otp_verified: boolean;
  org_otp: string | null;
  otp_expires_at: Date | null;
  otp_failed_attempts: number;
  created_at: Generated<Date>;
}

export interface ProfilesTable {
  id: string;
  is_profile_completed: boolean;
  full_name: string | null;
  college: string | null;
  branch: string | null;
  academic_year: string | null;
  phone_number: string | null;
  gender: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  bio: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface EventsTable {
  id: string;
  org_id: string;
  title: string;
  slug: string;
  description: string;
  venue: string | null;
  city: string | null;
  start_date: Date;
  end_date: Date | null;
  registration_deadline: Date | null;
  status: string;
  visibility: string;
  is_featured: boolean;
  is_paid: boolean;
  is_team_event: boolean;
  min_team_size: number | null;
  max_team_size: number | null;
  capacity: number | null;
  banner_url: string | null;
  poster_url: string | null;
  speakers: string | null;
  custom_fields: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface TicketsTable {
  id: string;
  event_id: string;
  name: string;
  price: number;
  total_quantity: number;
  available_quantity: number;
  created_at: Generated<Date>;
}

export interface RegistrationsTable {
  id: string;
  event_id: string;
  user_id: string;
  ticket_id: string | null;
  ticket_code: string;
  status: string;
  attended: boolean;
  attended_at: Date | null;
  is_team: boolean;
  team_id: string | null;
  field_values: string | null;
  transaction_id: string | null;
  payment_proof_url: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface TeamsTable {
  id: string;
  event_id: string;
  leader_id: string;
  name: string;
  created_at: Generated<Date>;
}

export interface TeamMembersTable {
  id: string;
  team_id: string;
  user_id: string;
  status: string;
  created_at: Generated<Date>;
}

export interface EventRolesTable {
  id: string;
  event_id: string;
  user_id: string;
  role: string;
  created_at: Generated<Date>;
}

export interface MembersTable {
  id: string;
  org_id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  avatar_url: string | null;
  created_at: Generated<Date>;
}

export interface NotificationsTable {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  event_id: string | null;
  team_id: string | null;
  sender_id: string | null;
  created_at: Generated<Date>;
}

export interface PaymentsTable {
  id: string;
  order_reference: string;
  user_id: string;
  event_id: string;
  ticket_id: string;
  amount: number;
  status: string;
  transaction_id: string | null;
  upi_uri: string;
  created_at: Generated<Date>;
}

export interface MerchantSettingsTable {
  upi_id: string;
  merchant_name: string;
}

export interface Database {
  users: UsersTable;
  organisations: OrganisationsTable;
  profiles: ProfilesTable;
  events: EventsTable;
  tickets: TicketsTable;
  registrations: RegistrationsTable;
  teams: TeamsTable;
  team_members: TeamMembersTable;
  event_roles: EventRolesTable;
  members: MembersTable;
  notifications: NotificationsTable;
  payments: PaymentsTable;
  merchant_settings: MerchantSettingsTable;
}

export function createKyselyDatabase(connectionString: string): Kysely<Database> {
  const pool = new pg.Pool({
    connectionString,
    max: 10,
  });

  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool,
    }),
  });
}
