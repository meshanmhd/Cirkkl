"use client";

import { useState } from "react";
import Link from "next/link";
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
    <Link href={`/events/${event.id}`} className="group block h-full">
      <article className="relative h-full rounded-xl bg-white overflow-hidden transition-colors duration-300 border border-[#F0F0F0] hover:border-[#D1D1D6]">
        {/* Image & Overlays */}
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Free/Paid Badge */}
          <div className={`absolute top-4 right-4 px-3.5 py-1.5 rounded-[6px] shadow-sm flex items-center justify-center ${event.price === "paid" ? "bg-[#7B61FF]" : "bg-[#cfe467]"}`}>
            <span className={`text-[12px] font-bold leading-none pt-[1px] ${event.price === "paid" ? "text-white" : "text-[#111111]"}`}>
              {event.price === "paid" ? "Paid" : "Free"}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="p-5 flex flex-col gap-6">
          {/* Title with left accent border */}
          <div className="relative pl-4 flex flex-col justify-center min-h-[48px]">
            <div className="absolute left-0 top-1 bottom-1 w-1 bg-[#cfe467] rounded-full" />
            {event.organizer && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6E73] mb-0.5">
                {event.organizer}
              </span>
            )}
            <h3 className="font-bold text-[17px] leading-snug text-[#111111] truncate">
              {event.title}
            </h3>
          </div>

          <div className="flex flex-col gap-4">
            {/* Time */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-[10px] border border-[#E5E5EA] bg-white flex items-center justify-center shrink-0">
                <Clock size={16} className="text-[#111111]" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col justify-center min-h-[40px]">
                <span className="text-[12px] font-medium text-[#6E6E73] mb-0.5">Time</span>
                <span className="text-[13px] font-medium text-[#111111]">{event.time}</span>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-[10px] border border-[#E5E5EA] bg-white flex items-center justify-center shrink-0">
                <Calendar size={16} className="text-[#111111]" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col justify-center min-h-[40px]">
                <span className="text-[12px] font-medium text-[#6E6E73] mb-0.5">Date</span>
                <span className="text-[13px] font-medium text-[#111111]">{event.date}</span>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-[10px] border border-[#E5E5EA] bg-white flex items-center justify-center shrink-0">
                <MapPin size={16} className="text-[#111111]" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col justify-center min-h-[40px]">
                <span className="text-[12px] font-medium text-[#6E6E73] mb-0.5">Venue</span>
                <span className="text-[13px] font-medium text-[#111111] line-clamp-1">{event.location || event.venue}</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
