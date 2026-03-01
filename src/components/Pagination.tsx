import Link from "next/link";

type Props = {
  page: number;
  totalPages: number;
  baseParams: Record<string, string | undefined>;
  basePath?: string;
};

function hrefFor(page: number, baseParams: Record<string, string | undefined>, basePath: string) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(baseParams)) {
    if (v) p.set(k, v);
  }
  p.set("page", String(page));
  return `${basePath}?${p.toString()}`;
}

function pageWindow(page: number, totalPages: number) {
  const out: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

export default function Pagination({ page, totalPages, baseParams, basePath = "/" }: Props) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <Link
        aria-disabled={page <= 1}
        href={page <= 1 ? "#" : hrefFor(1, baseParams, basePath)}
        className={`rounded-lg border px-3 py-2 text-sm ${page <= 1 ? "pointer-events-none border-slate-700 text-slate-600" : "border-white/20 text-slate-200"}`}
      >
        First
      </Link>
      <Link
        aria-disabled={page <= 1}
        href={page <= 1 ? "#" : hrefFor(page - 1, baseParams, basePath)}
        className={`rounded-lg border px-3 py-2 text-sm ${page <= 1 ? "pointer-events-none border-slate-700 text-slate-600" : "border-white/20 text-slate-200"}`}
      >
        Prev
      </Link>

      {pages[0] > 1 ? <span className="px-1 text-slate-500">…</span> : null}
      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p, baseParams, basePath)}
          className={`rounded-lg border px-3 py-2 text-sm ${
            p === page ? "border-cyan-300/60 bg-cyan-500/20 text-cyan-100" : "border-white/20 text-slate-200"
          }`}
        >
          {p}
        </Link>
      ))}
      {pages[pages.length - 1] < totalPages ? <span className="px-1 text-slate-500">…</span> : null}

      <Link
        aria-disabled={page >= totalPages}
        href={page >= totalPages ? "#" : hrefFor(page + 1, baseParams, basePath)}
        className={`rounded-lg border px-3 py-2 text-sm ${page >= totalPages ? "pointer-events-none border-slate-700 text-slate-600" : "border-white/20 text-slate-200"}`}
      >
        Next
      </Link>
      <Link
        aria-disabled={page >= totalPages}
        href={page >= totalPages ? "#" : hrefFor(totalPages, baseParams, basePath)}
        className={`rounded-lg border px-3 py-2 text-sm ${page >= totalPages ? "pointer-events-none border-slate-700 text-slate-600" : "border-white/20 text-slate-200"}`}
      >
        Last
      </Link>

      <span className="ml-2 text-sm text-slate-300">Page {page} of {totalPages}</span>
    </div>
  );
}
