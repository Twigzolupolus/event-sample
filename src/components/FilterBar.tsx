"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function FilterBar({ categories }: { categories: string[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const view = (params.get("view") ?? "upcoming") as "upcoming" | "past";
  const [q, setQ] = useState(params.get("q") ?? "");

  function push(next: URLSearchParams) {
    next.delete("page");
    router.push(`/?${next.toString()}`);
  }

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    push(next);
  }

  function submitSearch() {
    const next = new URLSearchParams(params.toString());
    if (!q.trim()) next.delete("q");
    else next.set("q", q.trim());
    push(next);
  }

  return (
    <div className="sticky top-3 z-20 mb-6 space-y-3">
      <div className="glass inline-flex rounded-xl p-1">
        <button aria-label="Show upcoming events" onClick={() => update("view", "upcoming")} className={`rounded-lg px-4 py-2 text-sm ${view === "upcoming" ? "bg-violet-500 text-white" : "text-slate-200"}`}>Upcoming</button>
        <button aria-label="Show past events" onClick={() => update("view", "past")} className={`rounded-lg px-4 py-2 text-sm ${view === "past" ? "bg-violet-500 text-white" : "text-slate-200"}`}>Past</button>
      </div>

      <div className="glass grid grid-cols-1 gap-3 rounded-2xl p-4 md:grid-cols-5">
        <div className="md:col-span-2 flex gap-2">
          <input
            aria-label="Search events"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitSearch();
            }}
            placeholder="Search title, location, category"
            className="ui-input"
          />
          <button onClick={submitSearch} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400">Search</button>
        </div>

        <select aria-label="Filter by category" defaultValue={params.get("category") ?? "all"} className="ui-input" onChange={(e) => update("category", e.target.value)}>
          <option className="text-slate-900 bg-white" value="all">All categories</option>
          {categories.map((c) => <option className="text-slate-900 bg-white" key={c} value={c}>{c}</option>)}
        </select>

        <select aria-label="Sort events" defaultValue={params.get("sort") ?? "soonest"} className="ui-input" onChange={(e) => update("sort", e.target.value)}>
          <option className="text-slate-900 bg-white" value="soonest">Soonest first</option>
          <option className="text-slate-900 bg-white" value="latest">Latest date first</option>
          <option className="text-slate-900 bg-white" value="newest">Recently added</option>
        </select>

        <select aria-label="Records per page" defaultValue={params.get("pageSize") ?? "10"} className="ui-input" onChange={(e) => update("pageSize", e.target.value)}>
          <option className="text-slate-900 bg-white" value="10">10 / page</option>
          <option className="text-slate-900 bg-white" value="20">20 / page</option>
          <option className="text-slate-900 bg-white" value="50">50 / page</option>
          <option className="text-slate-900 bg-white" value="100">100 / page</option>
        </select>
      </div>
    </div>
  );
}
