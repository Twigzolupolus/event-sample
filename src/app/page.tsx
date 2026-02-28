export const revalidate = 120;

import EventCard from "@/components/EventCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import SubscribeCategoryForm from "@/components/SubscribeCategoryForm";
import { getFeaturedEvent, getPublishedCategories, getPublishedEvents } from "@/lib/events";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { publishDueDrafts } from "@/lib/scheduler";
import { trackSearchMetric } from "@/lib/analytics";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; view?: "upcoming" | "past"; sort?: "soonest" | "latest" | "newest"; page?: string; pageSize?: string }>;
}) {
  await publishDueDrafts();

  const { q, category, view, sort, page: pageStr, pageSize: pageSizeStr } = await searchParams;
  const page = Math.max(1, Number(pageStr || "1"));
  const allowed = new Set([10, 20, 50, 100]);
  const parsedPageSize = Number(pageSizeStr || "10");
  const pageSize = allowed.has(parsedPageSize) ? parsedPageSize : 10;

  const result = await getPublishedEvents({ search: q, category, view, sort, page, pageSize });
  const categories = await getPublishedCategories();
  const featured = await getFeaturedEvent();

  if (q?.trim()) {
    await trackSearchMetric({
      query: q.trim(),
      category,
      view,
      resultsCount: result.total,
    });
  }

  return (
    <div>
      {featured ? (
        <section className="mb-8 rounded-3xl border border-white/15 bg-gradient-to-br from-violet-500/20 via-indigo-500/10 to-cyan-500/15 p-7 shadow-2xl">
          <p className="mb-2 text-xs uppercase tracking-[0.25em] text-cyan-200">Featured Event</p>
          <h1 className="ui-h1 mb-3 text-4xl font-extrabold tracking-tight text-white md:text-5xl">{featured.title}</h1>
          <p className="max-w-2xl text-slate-200">{featured.description}</p>
          <p className="mt-3 text-sm text-slate-300">{formatDate(featured.date)} • {featured.time} • {featured.location}</p>
          <Link href={`/events/${featured.slug}`} className="mt-4 inline-block rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white">View event</Link>
        </section>
      ) : null}

      <FilterBar categories={categories} />

      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <Link key={c} href={`/category/${encodeURIComponent(c)}`} className="rounded-full border border-white/20 bg-slate-900/60 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800">
            {c}
          </Link>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {result.items.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-slate-300 lg:col-span-3">
            <p className="text-lg font-semibold text-white">No events found</p>
            <p className="mt-2 text-sm text-slate-400">Try another category or search term.</p>
          </div>
        ) : (
          result.items.map((event) => <EventCard key={event.id} event={event} />)
        )}
      </div>

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        baseParams={{ q, category, view, sort, pageSize: String(pageSize) }}
      />

      <SubscribeCategoryForm categories={categories} />
    </div>
  );
}
