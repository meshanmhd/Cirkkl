"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import SearchBar from "@/components/events/SearchBar";
import { ArrowUpDown } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EventGrid from "@/components/events/EventGrid";
import Pagination from "@/components/events/Pagination";
import EmptyState from "@/components/events/EmptyState";
import { LoadingAnimation } from "@/components/ui/LoadingAnimation";
import { api } from "@/lib/api";
import { Event } from "@/data/events";
import { ListEventsInput } from "@cirkkl/contracts";

const EVENTS_PER_PAGE = 12;

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

export default function EventsClient() {
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("Upcoming");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"recent" | "upcoming" | "oldest">("recent");
  const [page, setPage] = useState(1);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const mappedTimeFilter = timeFilter.toLowerCase() as "upcoming" | "past" | "all";
      const params: Partial<ListEventsInput> = {
        timeFilter: mappedTimeFilter,
        limit: 100,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (categoryFilter !== "All") {
        params.category = categoryFilter;
      }

      const res = await api.events.list(params);
      let items: any[] = res.items || [];
      if (mappedTimeFilter === "upcoming") {
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];
        items = items.filter((e: any) => {
          const endDateStr = e.endDate || e.date;
          if (!endDateStr) return true;
          const endDay = endDateStr.includes("T") ? endDateStr.split("T")[0] : endDateStr;
          return endDay >= todayStr;
        });
      }
      const mapped = items.map((e: any) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        description: e.tagline || e.title,
        category: e.category,
        organizer: e.organizer,
        image: e.image,
        posterImage: e.posterImage,
        date: e.date,
        time: e.time,
        location: e.location,
        locationType: e.locationType,
        price: e.price,
        status: e.status,
        featured: e.featured,
        visibility: e.visibility,
        createdAt: e.createdAt,
      }));
      setEvents(mapped as unknown as Event[]);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [search, timeFilter, categoryFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchEvents]);

  const sortedEvents = useMemo(() => {
    const list = [...events];
    if (sortBy === "recent") {
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
    } else if (sortBy === "upcoming") {
      list.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      });
    } else if (sortBy === "oldest") {
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });
    }
    return list;
  }, [events, sortBy]);

  const totalPages = Math.ceil(sortedEvents.length / EVENTS_PER_PAGE);
  const paginated = useMemo(() => {
    return sortedEvents.slice((page - 1) * EVENTS_PER_PAGE, page * EVENTS_PER_PAGE);
  }, [sortedEvents, page]);

  const handleTimeFilter = (v: string) => {
    setTimeFilter(v);
    setPage(1);
  };

  const handleCategoryFilter = (v: string) => {
    setCategoryFilter(v);
    setPage(1);
  };

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <Tabs defaultValue="Upcoming" onValueChange={handleTimeFilter} className="w-full sm:w-[300px]">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="Upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="Past">Past</TabsTrigger>
              <TabsTrigger value="All">All</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-[240px]">
              <SearchBar value={search} onChange={handleSearch} />
            </div>

            <div className="relative w-full sm:w-[180px]">
              <button
                type="button"
                onClick={() => {
                  const menu = document.getElementById("category-menu");
                  if (menu) menu.classList.toggle("hidden");
                }}
                onBlur={(e) => {
                  if (!e.currentTarget.parentElement?.contains(e.relatedTarget)) {
                    document.getElementById("category-menu")?.classList.add("hidden");
                  }
                }}
                className="flex h-12 w-full items-center justify-between rounded-xl border-[1.5px] border-[#E5E5EA] bg-white px-4 py-2 text-sm text-[#111111] focus:outline-none"
              >
                <span className="truncate">
                  {categoryFilter === "All" ? "All Categories" : categoryFilter}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 opacity-50"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <div
                id="category-menu"
                className="hidden absolute top-full left-0 mt-2 w-full z-50 overflow-hidden rounded-xl border border-[#E5E5EA] bg-white shadow-md"
              >
                <div className="max-h-60 overflow-y-auto p-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#E5E5EA] hover:[&::-webkit-scrollbar-thumb]:bg-[#D1D1D6]">
                  <button
                    onClick={() => {
                      handleCategoryFilter("All");
                      document.getElementById("category-menu")?.classList.add("hidden");
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[#F5F5F7] transition-colors ${categoryFilter === "All" ? "font-semibold bg-[#F5F5F7]" : ""}`}
                  >
                    All Categories
                  </button>
                  {CATEGORY_FILTERS.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        handleCategoryFilter(cat);
                        document.getElementById("category-menu")?.classList.add("hidden");
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[#F5F5F7] transition-colors ${categoryFilter === cat ? "font-semibold bg-[#F5F5F7]" : ""}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  const menu = document.getElementById("sort-menu");
                  if (menu) menu.classList.toggle("hidden");
                }}
                onBlur={(e) => {
                  if (!e.currentTarget.parentElement?.contains(e.relatedTarget)) {
                    document.getElementById("sort-menu")?.classList.add("hidden");
                  }
                }}
                className="flex h-12 w-12 items-center justify-center rounded-xl border-[1.5px] border-[#E5E5EA] bg-white text-[#111111] hover:bg-[#F5F5F7] transition-colors focus:outline-none shrink-0"
                aria-label="Sort events"
                title="Sort events"
              >
                <ArrowUpDown size={17} className="text-[#111111]" />
              </button>
              <div
                id="sort-menu"
                className="hidden absolute top-full right-0 mt-2 w-44 z-50 overflow-hidden rounded-xl border border-[#E5E5EA] bg-white shadow-md"
              >
                <div className="p-1">
                  <button
                    onClick={() => {
                      setSortBy("recent");
                      setPage(1);
                      document.getElementById("sort-menu")?.classList.add("hidden");
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[#F5F5F7] transition-colors ${sortBy === "recent" ? "font-semibold bg-[#F5F5F7]" : ""}`}
                  >
                    Recently added
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("upcoming");
                      setPage(1);
                      document.getElementById("sort-menu")?.classList.add("hidden");
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[#F5F5F7] transition-colors ${sortBy === "upcoming" ? "font-semibold bg-[#F5F5F7]" : ""}`}
                  >
                    Upcoming first
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("oldest");
                      setPage(1);
                      document.getElementById("sort-menu")?.classList.add("hidden");
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[#F5F5F7] transition-colors ${sortBy === "oldest" ? "font-semibold bg-[#F5F5F7]" : ""}`}
                  >
                    Oldest first
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingAnimation width={300} height={300} />
          </div>
        ) : paginated.length === 0 ? (
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
  );
}
