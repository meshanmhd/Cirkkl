"use client";

import { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SearchBar from "@/components/events/SearchBar";
import SortDropdown from "@/components/events/SortDropdown";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EventGrid from "@/components/events/EventGrid";
import Pagination from "@/components/events/Pagination";
import EmptyState from "@/components/events/EmptyState";
import { LoadingAnimation } from "@/components/ui/LoadingAnimation";
import { createClient } from "@/utils/supabase/client";
import { Event } from "@/data/events";
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

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("Upcoming");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('events')
        .select('*');
      
      if (error) {
        console.error("Error fetching events:", error);
      } else if (data) {
        setEvents(data as Event[]);
      }
      setLoading(false);
    }
    
    fetchEvents();
  }, []);

  const filtered = useMemo(() => {
    let result = [...events];

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

    const now = new Date("Aug 12, 2025").getTime(); // Using fixed date based on data context
    if (timeFilter === "Upcoming") {
      result = result.filter(e => new Date(e.date).getTime() >= now);
    } else if (timeFilter === "Past") {
      result = result.filter(e => new Date(e.date).getTime() < now);
    }

    if (categoryFilter !== "All") {
      result = result.filter((e) => e.category === categoryFilter);
    }

    return result;
  }, [search, timeFilter, categoryFilter, events]);

  const totalPages = Math.ceil(filtered.length / EVENTS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * EVENTS_PER_PAGE, page * EVENTS_PER_PAGE);

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
    <>
      <Navbar />
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
                    // Close menu if focus moves outside the dropdown
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
      <Footer />
    </>
  );
}
