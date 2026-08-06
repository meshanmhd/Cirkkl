import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EVENTS } from "@/data/events";
import { AccordionGallery } from "@/components/ui/AccordionGallery";

const featured = EVENTS.filter((e) => e.featured).slice(0, 3);

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

export default function FeaturedEvents() {
  return (
    <section className="pb-24 px-6 pt-0 mt-0" id="featured">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight" style={{ color: "#111111" }}>
            Featured Events
          </h2>
          <p className="mt-3 text-[#6E6E73]">
            Hand-picked events you don&apos;t want to miss
          </p>
        </div>

        <AccordionGallery items={featured} />
      </div>
    </section>
  );
}
