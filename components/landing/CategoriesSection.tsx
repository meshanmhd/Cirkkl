"use client";

import Link from "next/link";
import {
  Wrench, Terminal, Palette, Dribbble, Cpu, Mic, Medal, Music,
  HeartPulse, Sparkles, BookOpen, Globe, Camera, Code, Briefcase, Zap
} from "lucide-react";
import { CATEGORIES } from "@/data/events";

const EXTRA_CATEGORIES = [
  { name: "Health", icon: "❤️", color: "#FF3B30", bg: "#FFF0F0" },
  { name: "Arts", icon: "✨", color: "#FF9500", bg: "#FFF8EE" },
  { name: "Literature", icon: "📚", color: "#5856D6", bg: "#F4F3FF" },
  { name: "Global", icon: "🌍", color: "#007AFF", bg: "#EBF5FF" },
  { name: "Photography", icon: "📷", color: "#FF2D55", bg: "#FFF0F3" },
  { name: "Coding", icon: "💻", color: "#34C759", bg: "#F0FFF4" },
  { name: "Business", icon: "💼", color: "#AF52DE", bg: "#F8F0FF" },
  { name: "Innovation", icon: "⚡", color: "#FFCC00", bg: "#FFFCEB" },
];

const IconMap: Record<string, any> = {
  Workshops: Wrench,
  Hackathons: Terminal,
  Cultural: Palette,
  Sports: Dribbble,
  Technical: Cpu,
  Seminars: Mic,
  Competitions: Medal,
  Music: Music,
  Health: HeartPulse,
  Arts: Sparkles,
  Literature: BookOpen,
  Global: Globe,
  Photography: Camera,
  Coding: Code,
  Business: Briefcase,
  Innovation: Zap,
};

export default function CategoriesSection() {
  // Duplicate categories to create seamless infinite loops
  const topMarqueeItems = [...CATEGORIES, ...CATEGORIES];
  const bottomMarqueeItems = [...EXTRA_CATEGORIES, ...EXTRA_CATEGORIES];

  return (
    <section className="pb-0 pt-28 px-6 bg-white overflow-hidden" id="categories">
      <div className="max-w-7xl mx-auto mb-12">
        {/* Header Section */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#cfe467" }}>
            Browse by Category
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight" style={{ color: "#111111" }}>
            What&apos;s your vibe?
          </h2>
          <p className="mt-3 text-[#6E6E73] max-w-md mx-auto">
            Explore diverse categories and use filters to quickly discover the events that interest you most.
          </p>
        </div>
      </div>

      {/* Infinite Marquees Container */}
      <div className="relative w-full marquee-container group py-2 flex flex-col gap-6">

        {/* Top Marquee (Left to Right) */}
        <div className="flex w-max animate-marquee gap-6 px-3">
          {topMarqueeItems.map((cat, index) => {
            const IconComponent = IconMap[cat.name] || Terminal;
            return (
              <Link
                key={`top-${cat.name}-${index}`}
                href={`/events?category=${cat.name}`}
                className="group flex-none w-[280px] h-[88px] bg-white border border-[#F0F0F0] hover:border-[#cfe467] transition-colors duration-300 rounded-[24px] flex items-center px-5 gap-5"
              >
                <div 
                  className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center"
                  style={{ background: cat.bg, color: cat.color }}
                >
                  <IconComponent size={24} strokeWidth={2} />
                </div>
                <span className="font-bold text-[18px] text-[#111111] tracking-tight">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Bottom Marquee (Right to Left) */}
        <div className="flex w-max animate-marquee-reverse gap-6 px-3">
          {bottomMarqueeItems.map((cat, index) => {
            const IconComponent = IconMap[cat.name] || Terminal;
            return (
              <Link
                key={`bottom-${cat.name}-${index}`}
                href={`/events?category=${cat.name}`}
                className="group flex-none w-[280px] h-[88px] bg-white border border-[#F0F0F0] hover:border-[#cfe467] transition-colors duration-300 rounded-[24px] flex items-center px-5 gap-5"
              >
                <div 
                  className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center"
                  style={{ background: cat.bg, color: cat.color }}
                >
                  <IconComponent size={24} strokeWidth={2} />
                </div>
                <span className="font-bold text-[18px] text-[#111111] tracking-tight">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>

      </div>

      {/* Styles for Infinite Marquees */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(calc(-50% - 12px)); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(calc(-50% - 12px)); }
          100% { transform: translateX(0%); }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
        .animate-marquee-reverse {
          animation: marquee-reverse 45s linear infinite; /* Slower speed for stagger effect */
        }
        .marquee-container:hover .animate-marquee,
        .marquee-container:hover .animate-marquee-reverse {
          animation-play-state: paused;
        }
      `}} />
    </section>
  );
}
