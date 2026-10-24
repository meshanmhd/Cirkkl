import { notFound } from "next/navigation";
import { requireOrg } from "@/lib/auth/server";
import { createClient } from "@/utils/supabase/server";
import AttendanceScanner from "./AttendanceScanner";

export const dynamic = 'force-dynamic';

export default async function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { org } = await requireOrg();
  const supabase = await createClient();

  // Verify ownership
  const { data: event } = await supabase
    .from("events")
    .select("id, title, org_id")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();

  if (!event) notFound();

  return <AttendanceScanner eventId={id} eventTitle={event.title} />;
}
