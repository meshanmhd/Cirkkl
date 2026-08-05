"use client";

const FILTERS = [
  "All",
  "Today",
  "This Week",
  "Workshops",
  "Hackathons",
  "Sports",
  "Cultural",
  "Technical",
  "Seminars",
  "Competitions",
  "Music",
  "Free",
  "Registered",
];

interface FilterPillsProps {
  active: string;
  onChange: (filter: string) => void;
}

export default function FilterPills({ active, onChange }: FilterPillsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {FILTERS.map((filter) => {
        const isActive = active === filter;
        return (
          <button
            key={filter}
            id={`filter-${filter.toLowerCase().replace(/\s+/g, "-")}`}
            onClick={() => onChange(filter)}
            className="flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap"
            style={{
              background: isActive ? "#cfe467" : "white",
              color: isActive ? "white" : "#6E6E73",
              border: isActive ? "1.5px solid #cfe467" : "1.5px solid #E5E5EA",
              boxShadow: isActive ? "0 4px 12px rgba(0,122,255,0.25)" : "none",
              transform: isActive ? "scale(1.02)" : "scale(1)",
            }}
          >
            {filter}
          </button>
        );
      })}
    </div>
  );
}
