"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function CategoryPageSizeSelect({ category }: { category: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const pageSize = params.get("pageSize") ?? "10";

  return (
    <div className="glass rounded-xl p-3">
      <label className="mr-2 text-sm text-slate-300" htmlFor="category-page-size">Per page</label>
      <select
        id="category-page-size"
        value={pageSize}
        className="ui-input inline-block w-28"
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          next.set("pageSize", e.target.value);
          next.delete("page");
          router.push(`/category/${encodeURIComponent(category)}?${next.toString()}`);
        }}
      >
        <option className="text-slate-900 bg-white" value="10">10 / page</option>
        <option className="text-slate-900 bg-white" value="20">20 / page</option>
        <option className="text-slate-900 bg-white" value="50">50 / page</option>
        <option className="text-slate-900 bg-white" value="100">100 / page</option>
      </select>
    </div>
  );
}
