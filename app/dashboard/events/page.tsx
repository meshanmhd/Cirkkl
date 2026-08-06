import { createClient } from "@/utils/supabase/server";
import { Plus, Calendar, Clock, Sparkles } from "lucide-react";
import Link from "next/link";

function getStatus(dateStr: string): "upcoming" | "past" {
  if (!dateStr) return "upcoming";
  const eventDate = new Date(dateStr);
  return eventDate >= new Date() ? "upcoming" : "past";
}

export default async function EventsDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: events } = await supabase
    .from("events")
    .select("id, title, date, time, price")
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

      {(!events || events.length === 0) ? (
        <div className="flex flex-col items-center justify-center gap-5 py-24 px-6 text-center">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full opacity-20" style={{ background: "#cfe467" }} />
            <Sparkles className="text-[#111111] relative z-10" size={32} strokeWidth={1.5} />
          </div>
          
          <div className="max-w-sm">
            <h3 className="text-xl font-bold tracking-tight text-[#111111] mb-2">No events yet</h3>
            <p className="text-[15px] text-[#6E6E73] leading-relaxed">
              You haven't hosted any events. Start building your community by creating your first event.
            </p>
          </div>
          
          <Link
            href="/dashboard/events/new"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-[15px] font-semibold text-[#111111] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            style={{ background: "linear-gradient(135deg, #cfe467 0%, #b8d44e 100%)" }}
          >
            <Plus size={18} strokeWidth={2.5} />
            Host Your First Event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map((event) => {
            const status = getStatus(event.date);
            return (
              <Link key={event.id} href={`/dashboard/events/${event.id}`} className="group block">
                <article className="relative h-full rounded-[16px] bg-white border border-[#E5E5EA] overflow-hidden transition-all duration-200 hover:border-[#D1D1D6] hover:shadow-sm">
                  <div className="p-5 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="relative pl-3.5 flex-1 min-w-0">
                        <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full" style={{ background: "#cfe467" }} />
                        <h3 className="font-bold text-[16px] leading-snug text-[#111111] line-clamp-2">
                          {event.title}
                        </h3>
                      </div>
                      <span
                        className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full leading-none"
                        style={
                          status === "upcoming"
                            ? { background: "#F0FFF4", color: "#34C759" }
                            : { background: "#F5F5F7", color: "#6E6E73" }
                        }
                      >
                        {status === "upcoming" ? "Upcoming" : "Past"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[8px] border border-[#E5E5EA] bg-[#F5F5F7] flex items-center justify-center shrink-0">
                          <Calendar className="text-[#6E6E73]" style={{ width: "14px", height: "14px" }} strokeWidth={1.5} />
                        </div>
                        <span className="text-[13px] font-medium text-[#111111]">
                          {event.date || "—"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[8px] border border-[#E5E5EA] bg-[#F5F5F7] flex items-center justify-center shrink-0">
                          <Clock className="text-[#6E6E73]" style={{ width: "14px", height: "14px" }} strokeWidth={1.5} />
                        </div>
                        <span className="text-[13px] font-medium text-[#111111]">
                          {event.time || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
