import { SearchX } from "lucide-react";

interface EmptyStateProps {
  query?: string;
}

export default function EmptyState({ query }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: "#F7F7F8" }}
      >
        <SearchX size={36} style={{ color: "#C7C7CC" }} />
      </div>
      <h3 className="text-xl font-bold mb-2" style={{ color: "#111111" }}>
        No events found
      </h3>
      <p className="text-sm max-w-xs leading-relaxed" style={{ color: "#6E6E73" }}>
        {query
          ? `We couldn't find any events matching "${query}". Try different keywords or clear your filters.`
          : "No events match your current filters. Try changing or clearing them."}
      </p>
    </div>
  );
}
