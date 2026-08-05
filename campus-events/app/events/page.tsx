"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SearchBar from "@/components/events/SearchBar";
import FilterPills from "@/components/events/FilterPills";
import SortDropdown from "@/components/events/SortDropdown";
import EventGrid from "@/components/events/EventGrid";
import Pagination from "@/components/events/Pagination";
import EmptyState from "@/components/events/EmptyState";
import { EVENTS } from "@/data/events";

const EVENTS_PER_PAGE = 9;

const CATEGORY_FILTERS = [
  "Workshops",
  "Hackathons",
  "Sports",
  "Cultural",
  "Technical",
  "Seminars",
  "Competitions",
  "Music",
];

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Latest");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = [...EVENTS];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.organizer.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
      );
    }

    if (filter !== "All") {
      if (filter === "Free") {
        result = result.filter((e) => e.price === "free");
      } else if (filter === "Today") {
        result = result.filter((e) => e.date.includes("Aug 5"));
      } else if (filter === "This Week") {
        result = result.filter((e) => e.date.includes("Aug"));
      } else if (filter === "Registered") {
        result = result.filter((e) => e.registered);
      } else if (CATEGORY_FILTERS.includes(filter)) {
        result = result.filter((e) => e.category === filter);
      }
    }

    if (sort === "Most Popular") {
      result = result.sort((a, b) => (b.seats - b.seatsAvailable) - (a.seats - a.seatsAvailable));
    } else if (sort === "Upcoming") {
      result = result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    return result;
  }, [search, filter, sort]);

  const totalPages = Math.ceil(filtered.length / EVENTS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * EVENTS_PER_PAGE, page * EVENTS_PER_PAGE);

  const handleFilter = (f: string) => {
    setFilter(f);
    setPage(1);
  };

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen" style={{ background: "#F7F7F8" }}>
        <div className="pt-28 pb-12 px-6" style={{ background: "white", borderBottom: "1px solid #E5E5EA" }}>
          <div className="max-w-7xl mx-auto">
            <div className="mb-2">
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#cfe467" }}>
                All Events
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3" style={{ color: "#111111" }}>
              Explore Events
            </h1>
            <p className="text-[#6E6E73] mb-8 max-w-xl">
              Browse all campus events — filter by category, search by keyword, and register in one click.
            </p>
            <SearchBar value={search} onChange={handleSearch} />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <FilterPills active={filter} onChange={handleFilter} />
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-sm" style={{ color: "#6E6E73" }}>
                {filtered.length} event{filtered.length !== 1 ? "s" : ""}
              </span>
              <SortDropdown value={sort} onChange={setSort} />
            </div>
          </div>

          {paginated.length === 0 ? (
            <EmptyState query={search} />
          ) : (
            <>
              <EventGrid events={paginated} />
              {totalPages > 1 && (
                <Pagination current={page} total={totalPages} onChange={setPage} />
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
