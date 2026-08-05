"use client";

import { useState } from "react";
import { Calendar, Clock, MapPin, Users, Bookmark, BookmarkCheck } from "lucide-react";
import type { Event } from "@/data/events";

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

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const [saved, setSaved] = useState(false);
  const colors = CATEGORY_COLORS[event.category] ?? { bg: "#EBF5FF", text: "#cfe467" };
  const seatsPercent = Math.round((event.seatsAvailable / event.seats) * 100);
  const isLow = seatsPercent < 20;

  return (
    <article
      className="group bg-white rounded-2xl overflow-hidden flex flex-col transition-all duration-300 cursor-pointer"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0" }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(-6px)";
        el.style.boxShadow = "0 20px 50px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
      }}
    >
      <div className="relative overflow-hidden aspect-[16/9]">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 55%)" }}
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
            style={{ background: colors.bg, color: colors.text }}
          >
            {event.category}
          </span>
          {event.price === "free" && (
            <span
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
              style={{ background: "rgba(52,199,89,0.15)", color: "#34C759" }}
            >
              Free
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSaved(!saved);
          }}
          aria-label={saved ? "Unsave event" : "Save event"}
          className="absolute top-3 right-3 -full flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{ background: "rgba(255,255,255,0.9)" }}
        >
          {saved ? (
            <BookmarkCheck size={15} style={{ color: "#cfe467" }} />
          ) : (
            <Bookmark size={15} style={{ color: "#6E6E73" }} />
          )}
        </button>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3
          className="font-semibold text-[15px] leading-snug mb-2 line-clamp-2"
          style={{ color: "#111111" }}
        >
          {event.title}
        </h3>
        <p className="text-xs leading-relaxed mb-4 line-clamp-2" style={{ color: "#6E6E73" }}>
          {event.description}
        </p>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs" style={{ color: "#6E6E73" }}>
            <Calendar size={12} style={{ color: "#cfe467" }} />
            <span>{event.date}</span>
            <span className="mx-1">·</span>
            <Clock size={12} style={{ color: "#cfe467" }} />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: "#6E6E73" }}>
            <MapPin size={12} style={{ color: "#cfe467" }} />
            {event.venue}
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: "#6E6E73" }}>
            <Users size={12} style={{ color: isLow ? "#FF3B30" : "#cfe467" }} />
            <span style={{ color: isLow ? "#FF3B30" : "#6E6E73" }}>
              {event.seatsAvailable} seats left
              {isLow && " — Almost full!"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs mb-4" style={{ color: "#6E6E73" }}>
          <span>by <strong style={{ color: "#111111" }}>{event.organizer}</strong></span>
        </div>

        <div className="mt-auto">
          <button
            id={`register-${event.id}`}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-[#111111] transition-all duration-200" style={{ background: "#cfe467" }}
          >
            Register Now
          </button>
        </div>
      </div>
    </article>
  );
}
