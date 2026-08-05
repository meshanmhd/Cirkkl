import Link from "next/link";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { EVENTS } from "@/data/events";

const upcoming = EVENTS.slice(3, 9);

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Hackathons: { bg: "#F3F0FF", text: "#7B61FF" },
  Cultural: { bg: "#FFF0F5", text: "#FF3B7A" },
  Workshops: { bg: "#FFF3EE", text: "#FF6B35" },
  Technical: { bg: "#EBF5FF", text: "#cfe467" },
  Sports: { bg: "#F0FFF4", text: "#34C759" },
  Seminars: { bg: "#FFF8EE", text: "#FF9500" },
  Competitions: { bg: "#F8F0FF", text: "#AF52DE" },
  Music: { bg: "#FFF0F3", text: "#FF2D55" },
};

export default function UpcomingEvents() {
  return (
    <section className="py-24 px-6" id="upcoming">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#cfe467" }}>
              Coming Up
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight" style={{ color: "#111111" }}>
              Upcoming Events
            </h2>
          </div>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm font-medium transition-all duration-200 hover:gap-3"
            style={{ color: "#cfe467" }}
          >
            View all
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
          {upcoming.map((event) => {
            const colors = CATEGORY_COLORS[event.category] ?? { bg: "#EBF5FF", text: "#cfe467" };
            return (
              <article
                key={event.id}
                className="flex-none w-72 rounded-2xl bg-white overflow-hidden card-hover"
                style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }}
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                  <span
                    className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    {event.category}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm leading-snug mb-2 line-clamp-2" style={{ color: "#111111" }}>
                    {event.title}
                  </h3>
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "#6E6E73" }}>
                      <Calendar size={11} style={{ color: "#cfe467" }} />
                      {event.date}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "#6E6E73" }}>
                      <Clock size={11} style={{ color: "#cfe467" }} />
                      {event.time}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "#6E6E73" }}>
                      <MapPin size={11} style={{ color: "#cfe467" }} />
                      {event.location}
                    </div>
                  </div>
                  <button
                    className="w-full py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:opacity-90"
                    style={{ background: "rgba(0,122,255,0.08)", color: "#cfe467" }}
                  >
                    Register
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
