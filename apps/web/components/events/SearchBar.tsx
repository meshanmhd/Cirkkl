"use client";

import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#6E6E73] z-10"
      />
      <Input
        id="events-search"
        type="text"
        placeholder="Search events, clubs…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-11 pr-10 h-12 rounded-xl text-sm border-[1.5px] border-[#E5E5EA] outline-none focus:outline-none focus:ring-0 focus:border-[#E5E5EA] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#E5E5EA] bg-white text-[#111111]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6E6E73] hover:text-[#111111] transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
