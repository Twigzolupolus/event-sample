export const revalidate = 120;

import EventCard from "@/components/EventCard";
import Pagination from "@/components/Pagination";
import CategoryPageSizeSelect from "@/components/CategoryPageSizeSelect";
import { db } from "@/lib/db";
import { trackCategoryEngagement } from "@/lib/analytics";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  const { category } = await params;
  const { page: pageStr, pageSize: pageSizeStr } = await searchParams;
  const decoded = decodeURIComponent(category);

  const page = Math.max(1, Number(pageStr || "1"));
  const allowed = new Set([10, 20, 50, 100]);
  const parsedPageSize = Number(pageSizeStr || "10");
  const pageSize = allowed.has(parsedPageSize) ? parsedPageSize : 10;

  const where = { status: "PUBLISHED" as const, category: decoded };

  await trackCategoryEngagement(decoded);

  const [events, total] = await Promise.all([
    db.event.findMany({
      where,
      orderBy: { date: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.event.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <a href="/" className="mb-3 inline-block rounded-lg border border-white/20 px-3 py-1 text-sm text-slate-200">← Back to events</a>
          <h1 className="ui-h1 text-3xl font-bold text-white">Category: {decoded}</h1>
        </div>

        <CategoryPageSizeSelect category={decoded} />
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {events.length ? (
          events.map((e) => <EventCard key={e.id} event={e} />)
        ) : (
          <p className="glass rounded-2xl p-6 text-slate-300 lg:col-span-3">No events in this category yet.</p>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} basePath={`/category/${encodeURIComponent(decoded)}`} baseParams={{ pageSize: String(pageSize) }} />

      <div className="mt-3 text-center text-sm text-slate-400">
        {total} total event{total === 1 ? "" : "s"} in this category
      </div>
    </div>
  );
}
