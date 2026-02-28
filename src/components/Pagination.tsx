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

export default function Pagination({ page, totalPages, baseParams, basePath = "/" }: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <Link aria-disabled={page <= 1} href={page <= 1 ? "#" : hrefFor(page - 1, baseParams, basePath)} className={`rounded-lg border px-3 py-2 text-sm ${page <= 1 ? "pointer-events-none border-slate-700 text-slate-600" : "border-white/20 text-slate-200"}`}>
        Prev
      </Link>
      <span className="text-sm text-slate-300">Page {page} of {totalPages}</span>
      <Link aria-disabled={page >= totalPages} href={page >= totalPages ? "#" : hrefFor(page + 1, baseParams, basePath)} className={`rounded-lg border px-3 py-2 text-sm ${page >= totalPages ? "pointer-events-none border-slate-700 text-slate-600" : "border-white/20 text-slate-200"}`}>
        Next
      </Link>
    </div>
  );
}
