import Link from "next/link";
import { db } from "@/lib/db";
import AdminEventsTable from "@/components/AdminEventsTable";
import AdminSecurityPanel from "@/components/AdminSecurityPanel";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { publishDueDrafts } from "@/lib/scheduler";
import Pagination from "@/components/Pagination";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: "ALL" | "DRAFT" | "PUBLISHED";
    category?: string;
    sort?: "date_asc" | "date_desc" | "created_desc";
    page?: string;
    pageSize?: string;
  }>;
}) {
  await publishDueDrafts();

  const { q, status, category, sort, page: pageStr, pageSize: pageSizeStr } = await searchParams;
  const page = Math.max(1, Number(pageStr || "1"));
  const allowed = new Set([10, 20, 50, 100]);
  const parsedPageSize = Number(pageSizeStr || "20");
  const pageSize = allowed.has(parsedPageSize) ? parsedPageSize : 20;

  const where = {
    ...(status && status !== "ALL" ? { status } : {}),
    ...(category && category !== "all" ? { category } : {}),
    ...(q?.trim()
      ? {
          OR: [{ title: { contains: q.trim() } }, { category: { contains: q.trim() } }],
        }
      : {}),
  };

  const orderBy =
    sort === "date_desc"
      ? { date: "desc" as const }
      : sort === "created_desc"
        ? { createdAt: "desc" as const }
        : { date: "asc" as const };

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Resilient query for environments that have not migrated to eventCode yet.
  let events: Array<{ id: string; title: string; category: string; status: "DRAFT" | "PUBLISHED"; eventCode: string | null }> = [];
  try {
    events = await db.event.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, title: true, category: true, status: true, eventCode: true },
    });
  } catch {
    const fallback = await db.event.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, title: true, category: true, status: true },
    });
    events = fallback.map((e) => ({ ...e, eventCode: null }));
  }

  const [total, categories, logs, publishedCount, upcomingCount, growth7d] = await Promise.all([
    db.event.count({ where }),
    db.event.findMany({ where: {}, distinct: ["category"], select: { category: true }, orderBy: { category: "asc" } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
    db.event.count({ where: { status: "PUBLISHED" } }),
    db.event.count({ where: { status: "PUBLISHED", date: { gte: new Date() } } }),
    db.event.count({ where: { status: "PUBLISHED", createdAt: { gte: weekAgo } } }),
  ]);

  let views7d = 0;
  let topSearches: Array<{ query: string; _count: { query: number } }> = [];
  let topCategories: Array<{ category: string; _count: { category: number } }> = [];
  try {
    [views7d, topSearches, topCategories] = await Promise.all([
      db.eventView.count({ where: { createdAt: { gte: weekAgo } } }),
      db.searchMetric.groupBy({ by: ["query"], _count: { query: true }, orderBy: { _count: { query: "desc" } }, take: 5 }),
      db.categoryMetric.groupBy({ by: ["category"], _count: { category: true }, orderBy: { _count: { category: "desc" } }, take: 5 }),
    ]);
  } catch {
    // Metrics tables may not exist yet on partially migrated local DB.
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="ui-h1 text-3xl font-bold text-white">Admin Events</h1>
        <div className="flex gap-2">
          <Link className="rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-3 py-2 text-sm font-medium text-white" href="/admin/new">+ New Event</Link>
          <Link className="rounded-xl border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200" href="/admin/approvals">Pending Approvals</Link>
          <AdminLogoutButton />
          {process.env.NODE_ENV !== "production" ? (
            <form action="/api/admin/reseed" method="post"><button className="rounded-xl border border-white/20 px-3 py-2 text-sm text-slate-200">Reseed</button></form>
          ) : null}
        </div>
      </div>

      <section className="mb-4 grid gap-3 md:grid-cols-5">
        <div className="glass rounded-xl p-3"><p className="text-xs text-slate-400">Published</p><p className="text-2xl font-bold text-white">{publishedCount}</p></div>
        <div className="glass rounded-xl p-3"><p className="text-xs text-slate-400">Upcoming</p><p className="text-2xl font-bold text-white">{upcomingCount}</p></div>
        <div className="glass rounded-xl p-3"><p className="text-xs text-slate-400">Growth (7d)</p><p className="text-2xl font-bold text-white">+{growth7d}</p></div>
        <div className="glass rounded-xl p-3"><p className="text-xs text-slate-400">Views (7d)</p><p className="text-2xl font-bold text-white">{views7d}</p></div>
        <div className="glass rounded-xl p-3"><p className="text-xs text-slate-400">Results</p><p className="text-2xl font-bold text-white">{total}</p></div>
      </section>

      <form action="/admin" className="glass mb-4 grid grid-cols-1 gap-3 rounded-2xl p-4 md:grid-cols-6">
        <input name="q" defaultValue={q ?? ""} placeholder="Search title/category" className="ui-input md:col-span-2" />
        <select name="status" defaultValue={status ?? "ALL"} className="ui-input">
          <option value="ALL">All status</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
        </select>
        <select name="category" defaultValue={category ?? "all"} className="ui-input">
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.category} value={c.category}>{c.category}</option>)}
        </select>
        <select name="sort" defaultValue={sort ?? "date_asc"} className="ui-input">
          <option value="date_asc">Date (asc)</option>
          <option value="date_desc">Date (desc)</option>
          <option value="created_desc">Recently created</option>
        </select>
        <div className="flex gap-2">
          <select name="pageSize" defaultValue={String(pageSize)} className="ui-input">
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </select>
          <button className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">Apply</button>
        </div>
      </form>

      <AdminEventsTable events={events} />

      <Pagination page={page} totalPages={totalPages} basePath="/admin" baseParams={{ q, status, category, sort, pageSize: String(pageSize) }} />

      <section className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="glass rounded-xl p-3">
          <h3 className="mb-2 text-sm font-semibold text-white">Top search queries</h3>
          <ul className="space-y-1 text-sm text-slate-300">
            {topSearches.length ? topSearches.map((s) => <li key={s.query}>{s.query} — {s._count.query}</li>) : <li>No search data yet.</li>}
          </ul>
        </div>
        <div className="glass rounded-xl p-3">
          <h3 className="mb-2 text-sm font-semibold text-white">Top category engagement</h3>
          <ul className="space-y-1 text-sm text-slate-300">
            {topCategories.length ? topCategories.map((c) => <li key={c.category}>{c.category} — {c._count.category}</li>) : <li>No category data yet.</li>}
          </ul>
        </div>
      </section>

      <section className="glass mt-8 rounded-2xl p-4">
        <h2 className="ui-h2 mb-3 text-xl font-semibold text-white">Audit Trail</h2>
        <div className="space-y-2">
          {logs.map((l) => (
            <div key={l.id} className="rounded border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-300">
              <span className="font-semibold text-white">{l.action}</span> · {l.target} · {l.targetId}
              {l.message ? <span> — {l.message}</span> : null}
            </div>
          ))}
        </div>
      </section>

      <AdminSecurityPanel />
    </div>
  );
}
