"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative max-w-2xl mx-auto">
      <Search
        size={20}
        className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "#6E6E73" }}
      />
      <input
        id="events-search"
        type="search"
        placeholder="Search events, clubs, organizers…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-14 pr-5 py-4 rounded-2xl text-sm outline-none transition-all duration-200 bg-white"
        style={{
          border: "1.5px solid #E5E5EA",
          color: "#111111",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.border = "1.5px solid #cfe467";
          e.currentTarget.style.boxShadow = "0 0 0 4px rgba(0,122,255,0.08)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.border = "1.5px solid #E5E5EA";
          e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
        }}
      />
    </div>
  );
}
