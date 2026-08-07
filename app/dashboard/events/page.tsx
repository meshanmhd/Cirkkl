import { createClient } from "@/utils/supabase/server";
import { Plus } from "lucide-react";
import Link from "next/link";
import { EventsTable } from "@/components/dashboard/EventsTable";

export default async function EventsDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: events } = await supabase
    .from("events")
    .select("id, title, date, category, status, visibility, price")
    .eq("org_id", user?.id)
    .order("date", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end">
        <Link
          href="/dashboard/events/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[14px] font-semibold text-[#111111] transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #cfe467 0%, #c0d955 100%)" }}
        >
          <Plus style={{ width: "16px", height: "16px" }} strokeWidth={2.5} />
          Host Event
        </Link>
      </div>

      <EventsTable events={events ?? []} />
    </div>
  );
}
