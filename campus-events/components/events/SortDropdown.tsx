"use client";

import { ChevronDown } from "lucide-react";

const OPTIONS = ["Latest", "Upcoming", "Most Popular"];

interface SortDropdownProps {
  value: string;
  onChange: (v: string) => void;
}

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <div className="relative inline-block">
      <select
        id="events-sort"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-4 pr-10 py-2.5 rounded-xl text-sm font-medium outline-none cursor-pointer transition-all duration-200"
        style={{
          background: "white",
          border: "1.5px solid #E5E5EA",
          color: "#111111",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        {OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "#6E6E73" }}
      />
    </div>
  );
}
