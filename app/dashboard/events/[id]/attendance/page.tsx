import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AttendanceScanner from "./AttendanceScanner";

export const dynamic = 'force-dynamic';

export default async function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify ownership
  const { data: event } = await supabase
    .from("events")
    .select("id, title, org_id")
    .eq("id", id)
    .eq("org_id", user.id)
    .single();

  if (!event) notFound();

  return <AttendanceScanner eventId={id} eventTitle={event.title} orgId={user.id} />;
}
