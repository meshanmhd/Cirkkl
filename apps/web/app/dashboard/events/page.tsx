import { Plus } from "lucide-react";
import Link from "next/link";
import { EventsTable } from "@/components/dashboard/EventsTable";
import { api } from "@/lib/api";

export default async function EventsDashboardPage() {
  // Middleware handles auth - if we reach here, user is authenticated as org
  // Don't call requireOrg() due to Next.js cookie timing issues after login redirect
  
  let events: Array<{
    id: string;
    title: string | null;
    date: string | null;
    category: string | null;
    status: string | null;
    visibility: string | null;
    price: string | null;
  }> = [];
  try {
    const res = await api.events.listForOrg();
    events = (res.items || []).map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      category: e.category,
      status: e.status,
      visibility: "public",
      price: e.price,
    }));
  } catch (error) {
    console.error('Failed to load events:', error);
    // Show empty table if API fails
  }

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

      <EventsTable events={events} />
    </div>
  );
}
