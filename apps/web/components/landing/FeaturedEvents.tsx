import { api } from "@/lib/api";
import { AccordionGallery } from "@/components/ui/AccordionGallery";
import { EventSummary } from "@cirkkl/contracts";

export default async function FeaturedEvents() {
  let featured: EventSummary[] = [];
  try {
    const res = await api.events.list({ limit: 6 });
    const all = res.items || [];
    const withFeatured = all.filter((e) => e.featured);
    featured = withFeatured.length > 0 ? withFeatured.slice(0, 3) : all.slice(0, 3);
  } catch {
    featured = [];
  }

  if (!featured || featured.length === 0) return null;

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
