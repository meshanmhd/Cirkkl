"use client";

import Link from "next/link";
import { CATEGORIES } from "@/data/events";

export default function CategoriesSection() {
  return (
    <section className="py-24 px-6" style={{ background: "white" }} id="categories">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#cfe467" }}>
            Browse by Category
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight" style={{ color: "#111111" }}>
            What&apos;s your vibe?
          </h2>
          <p className="mt-3 text-[#6E6E73] max-w-md mx-auto">
            From technical competitions to cultural performances — there&apos;s something for everyone.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={`/events?category=${cat.name}`}
              id={`category-${cat.name.toLowerCase()}`}
              className="group relative flex flex-col items-center gap-3 p-6 rounded-2xl text-center transition-all duration-300 cursor-pointer"
              style={{
                background: "#F7F7F8",
                border: "1px solid #E5E5EA",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.background = cat.bg;
                el.style.border = `1px solid ${cat.color}20`;
                el.style.transform = "translateY(-4px)";
                el.style.boxShadow = "0 12px 36px rgba(0,0,0,0.10)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.background = "#F7F7F8";
                el.style.border = "1px solid #E5E5EA";
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "none";
              }}
            >
              <span
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform duration-300 group-hover:scale-110"
                style={{ background: cat.bg }}
              >
                {cat.icon}
              </span>
              <span className="font-semibold text-sm" style={{ color: "#111111" }}>
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
