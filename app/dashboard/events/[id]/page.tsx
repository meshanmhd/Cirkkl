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

  const userIds = (registrations ?? []).map((r: any) => r.user_id).filter(Boolean);
  let profiles: any[] = [];
  if (userIds.length > 0) {
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
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
    />
  );
}