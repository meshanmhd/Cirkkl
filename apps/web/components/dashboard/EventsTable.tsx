"use client";

import { useState, useMemo } from "react";
import { Search, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/utils/supabase/client";

type EventRow = {
  id: string;
  title: string | null;
  date: string | null;
  category: string | null;
  status: string | null;
  visibility: string | null;
  price: string | null;
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getEventStatus(dateStr: string | null): { label: string; color: string } {
  if (!dateStr) return { label: "-", color: "#9E9EA7" };
  const now = new Date();
  const eventDate = new Date(dateStr);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
  if (eventDay.getTime() === today.getTime()) return { label: "Live", color: "#FF3B30" };
  if (eventDay > today) return { label: "Upcoming", color: "#007AFF" };
  return { label: "Past", color: "#9E9EA7" };
}



const STATUS_FILTERS = ["All", "Upcoming", "Live", "Past"];

interface EventsTableProps {
  events: EventRow[];
}

export function EventsTable({ events: initialEvents }: EventsTableProps) {
  const [events, setEvents] = useState<EventRow[]>(initialEvents);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("All");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchesSearch = !search || (e.title?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const eventStatus = getEventStatus(e.date).label;
      const matchesStatus = activeStatus === "All" || eventStatus === activeStatus;
      return matchesSearch && matchesStatus;
    });
  }, [events, search, activeStatus]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const supabase = createClient();
    await supabase.from("events").delete().eq("id", id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setDeletingId(null);
  }

  return (
    <div className="bg-white rounded-[16px] border border-[#E5E5EA] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5EA] gap-4 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9EA7] pointer-events-none" style={{ width: "14px", height: "14px" }} strokeWidth={2} />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-[10px] border border-[#E5E5EA] bg-white text-[14px] text-[#111111] placeholder:text-[#9E9EA7] outline-none focus:border-[#cfe467] focus:ring-1 focus:ring-[#cfe467] transition-all duration-200 w-[260px]"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#F5F5F7] rounded-[10px] p-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setActiveStatus(s)}
              className={`px-4 py-1.5 rounded-[8px] text-[13px] font-medium transition-all duration-200 ${
                activeStatus === s
                  ? "bg-white text-[#111111] shadow-sm"
                  : "text-[#6E6E73] hover:text-[#111111]"
              }`}
            >
              {s === "All" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E5E5EA]">
              {["EVENT", "DATE", "TYPE", "VISIBILITY", "STATUS"].map((col) => (
                <th key={col} className={`px-6 py-4 text-[12px] font-medium text-[#9E9EA7] tracking-[0.05em] uppercase whitespace-nowrap ${col === "EVENT" ? "text-left" : "text-center"}`}>
                  {col}
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Image src="/no-event.png" alt="No events" width={180} height={180} className="opacity-80" />
                    <p className="text-[14px] font-semibold text-[#111111]">No events found</p>
                    <p className="text-[13px] text-[#6E6E73]">{search ? "Try a different search term." : "Create your first event to get started."}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((event, idx) => {
                const eventStatus = getEventStatus(event.date);
                return (
                  <tr
                    key={event.id}
                    onClick={() => router.push(`/dashboard/events/${event.id}`)}
                    className={`cursor-pointer border-b border-[#F5F5F7] hover:bg-[#FAFAFA] transition-colors duration-150 ${idx === filtered.length - 1 ? "border-b-0" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <p className="text-[13px] text-[#111111] truncate max-w-[220px]">
                        {event.title || "-"}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="text-[13px] text-[#111111] whitespace-nowrap">{formatDate(event.date)}</span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="text-[13px] text-[#111111]">{event.category || "-"}</span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="text-[13px] text-[#111111] capitalize">{event.visibility || "-"}</span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="text-[13px] font-medium" style={{ color: eventStatus.color }}>{eventStatus.label}</span>
                    </td>

                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[#9E9EA7] hover:text-[#111111] hover:bg-[#F5F5F7] transition-all duration-200 outline-none ml-auto">
                          <MoreHorizontal style={{ width: "16px", height: "16px" }} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl border-[#E5E5EA] p-2 bg-white">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/events/${event.id}`)} className="cursor-pointer rounded-lg px-2 py-2 text-sm text-[#111111] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7]">
                            View Event
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/events/${event.id}/edit`)} className="cursor-pointer rounded-lg px-2 py-2 text-sm text-[#111111] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7]">
                            Edit Event
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-[#E5E5EA] my-1" />
                          <DropdownMenuItem
                            onClick={() => handleDelete(event.id)}
                            disabled={deletingId === event.id}
                            className="cursor-pointer rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-600 disabled:opacity-50"
                          >
                            {deletingId === event.id ? "Deleting..." : "Delete Event"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="px-5 py-3 border-t border-[#E5E5EA] flex items-center justify-between">
          <p className="text-[12px] text-[#9E9EA7]">
            Showing <span className="font-semibold text-[#6E6E73]">{filtered.length}</span> of{" "}
            <span className="font-semibold text-[#6E6E73]">{events.length}</span> events
          </p>
        </div>
      )}
    </div>
  );
}