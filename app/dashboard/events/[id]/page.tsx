import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { EventManagePage } from "@/components/dashboard/EventManagePage";

export const dynamic = 'force-dynamic';

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("org_id", user.id)
    .single();

  if (!event) notFound();

  const { data: registrations } = await supabase
    .from("registrations")
    .select("*")
    .eq("event_id", id)
    .order("created_at", { ascending: false });

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let teams: any[] = [];
  let teamMembers: any[] = [];

  if (event.is_team_event) {
    const { data: tData } = await adminSupabase
      .from("teams")
      .select("*")
      .eq("event_id", id);
    teams = tData ?? [];

    if (teams.length > 0) {
      const { data: tmData } = await adminSupabase
        .from("team_members")
        .select("*")
        .in("team_id", teams.map((t: any) => t.id));
      teamMembers = tmData ?? [];
    }
  }

  const allUserIds = new Set((registrations ?? []).map((r: any) => r.user_id).filter(Boolean));
  teamMembers.forEach((tm: any) => {
    if (tm.user_id) allUserIds.add(tm.user_id);
  });
  const userIds = Array.from(allUserIds);

  let profiles: any[] = [];
  if (userIds.length > 0) {
    const { data } = await adminSupabase
      .from("users")
      .select("id, full_name, email")
      .in("id", userIds);
    profiles = data ?? [];
  }

  const { data: orgMembers } = await supabase
    .from("members")
    .select("id, full_name, email, avatar_url")
    .eq("org_id", user.id);

  const { data: eventRoles } = await supabase
    .from("event_roles")
    .select("id, user_id, role")
    .eq("event_id", id);

  return (
    <EventManagePage
      event={event}
      registrations={registrations ?? []}
      profiles={profiles}
      orgMembers={orgMembers ?? []}
      eventRoles={eventRoles ?? []}
      eventId={id}
      teams={teams}
      teamMembers={teamMembers}
    />
  );
}