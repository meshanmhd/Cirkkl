"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  current: number;
  total: number;
  onChange: (page: number) => void;
}

export default function Pagination({ current, total, onChange }: PaginationProps) {
  const pages = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        aria-label="Previous page"
        className="-full flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ border: "1.5px solid #E5E5EA", color: "#111111" }}
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((page) => (
        <button
          key={page}
          id={`page-${page}`}
          onClick={() => onChange(page)}
          aria-label={`Page ${page}`}
          aria-current={page === current ? "page" : undefined}
          className="-full text-sm font-medium transition-all duration-200"
          style={{
            background: page === current ? "#cfe467" : "white",
            color: page === current ? "white" : "#111111",
            border: page === current ? "1.5px solid #cfe467" : "1.5px solid #E5E5EA",
            boxShadow: page === current ? "0 4px 12px rgba(0,122,255,0.25)" : "none",
          }}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        aria-label="Next page"
        className="-full flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ border: "1.5px solid #E5E5EA", color: "#111111" }}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
