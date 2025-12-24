"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Loader2, Calendar as CalendarIcon, Filter, GraduationCap } from "lucide-react";
import { EventCard } from "@/components/events/EventCard";
import { getEvents, getSocieties, getUniversities, getCategories } from "@/lib/services";
import { Event, Society } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [universitySearch, setUniversitySearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [societyFilter, setSocietyFilter] = useState("All");



  const { data: events, isLoading: eventsLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: getEvents,
  });

  const { data: societies } = useQuery({
    queryKey: ['societies'],
    queryFn: getSocieties
  });

  const { data: universities } = useQuery({
    queryKey: ['universities'],
    queryFn: getUniversities
  });

  const { data: fetchedCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories
  });

  const categories = useMemo(() => ["All", ...(fetchedCategories?.map((c: any) => c.name) || [])], [fetchedCategories]);

  const filteredEvents = useMemo(() => {
    return (events || []).filter((event) => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || event.category === selectedCategory;
      const matchesUniversity = !universitySearch || (event.university || "").toLowerCase().includes(universitySearch.toLowerCase());

      const matchesDate = !dateFilter || new Date(event.date).toISOString().split('T')[0] === dateFilter;

      const matchesSociety = societyFilter === "All" || (event.societies?.some(s => s.id === societyFilter));

      return matchesSearch && matchesCategory && matchesUniversity && matchesDate && matchesSociety;
    });
  }, [events, searchTerm, selectedCategory, universitySearch, dateFilter, societyFilter]);

  const upcomingEvents = filteredEvents.filter((e) => !e.isPast);
  const pastEvents = filteredEvents.filter((e) => e.isPast);

  const clearFilters = () => {
    setSearchTerm("");
    setUniversitySearch("");
    setSelectedCategory("All");
    setDateFilter("");
    setSocietyFilter("All");
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 slide-in-from-bottom-4">
      {/* Hero / Search Section */}
      <section className="relative overflow-hidden rounded-3xl bg-indigo-600 px-6 py-16 text-center shadow-2xl md:px-12 md:py-24 dark:bg-indigo-900">
        <div className="absolute inset-0 opacity-10 pattern-grid-lg text-white" />
        <div className="relative z-10 mx-auto max-w-4xl space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-7xl drop-shadow-sm">
            Discover Campus <span className="text-indigo-200">Life</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-indigo-100 md:text-xl">
            From hackathons to music festivals – find your next experience here.
            Connect, compete, and celebrate with your community.
          </p>

          <div className="mx-auto mt-8 flex flex-col gap-4 w-full max-w-3xl">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 flex items-center rounded-full bg-white p-2 shadow-lg dark:bg-slate-950">
                <Search className="ml-3 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search for events..."
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-900 dark:text-white placeholder:text-slate-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex-1 flex items-center rounded-full bg-white p-2 shadow-lg dark:bg-slate-950">
                <GraduationCap className="ml-3 h-5 w-5 text-slate-400" />
                <Select value={universitySearch === "" ? "all" : universitySearch} onValueChange={(val) => setUniversitySearch(val === "all" ? "" : val)}>
                  <SelectTrigger className="border-0 bg-transparent focus:ring-0 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Filter by University" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Universities</SelectItem>
                    {universities?.map((uni: any) => (
                      <SelectItem key={uni.id} value={uni.name}>{uni.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 flex items-center rounded-full bg-white px-4 py-2 shadow-lg dark:bg-slate-950 gap-2">
                <CalendarIcon className="h-5 w-5 text-slate-400" />
                <Input
                  type="date"
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-900 dark:text-white p-0"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
              <div className="flex-1 flex items-center rounded-full bg-white px-4 py-1 shadow-lg dark:bg-slate-950">
                <Filter className="h-5 w-5 text-slate-400 mr-2" />
                <Select value={societyFilter} onValueChange={setSocietyFilter}>
                  <SelectTrigger className="border-0 bg-transparent focus:ring-0 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Filter by Society" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Societies</SelectItem>
                    {societies?.map((society: Society) => (
                      <SelectItem key={society.id} value={society.id}>{society.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(searchTerm || universitySearch || dateFilter || societyFilter !== "All" || selectedCategory !== "All") && (
                <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <div className="sticky top-20 z-40 -mx-4 overflow-x-auto bg-background/80 px-4 py-4 backdrop-blur-md md:mx-0 md:rounded-xl md:px-0">
        <div className="flex gap-2 min-w-max md:justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${selectedCategory === cat
                ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {eventsLoading ? (
        <div className="flex justify-center py-32">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl">
          Failed to load events. Please try again later.
        </div>
      ) : (
        <div className="space-y-16">
          {/* Upcoming Pulse */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-8 w-1.5 rounded-full bg-indigo-600" />
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Upcoming Pulse</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {upcomingEvents.length}
              </span>
            </div>

            {upcomingEvents.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed text-slate-400">
                <p>No upcoming events found.</p>
                <button onClick={clearFilters} className="mt-2 text-indigo-600 hover:underline">Clear filters</button>
              </div>
            )}
          </section>

          {/* Past Memories */}
          {pastEvents.length > 0 && (
            <section className="opacity-75 grayscale transition-all hover:grayscale-0 hover:opacity-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-8 w-1.5 rounded-full bg-slate-400" />
                <h2 className="text-3xl font-bold tracking-tight text-slate-700 dark:text-slate-300">Past Memories</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {pastEvents.length}
                </span>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

