"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function CreateSuccessPage() {
  const [code, setCode] = useState("");
  const [id, setId] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCode(params.get("code") || "");
    setId(params.get("id") || "");
  }, []);

  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}/join?code=${encodeURIComponent(code)}` : `/join?code=${encodeURIComponent(code)}`;

  return (
    <div className="glass mx-auto max-w-xl rounded-2xl p-6">
      <p className="text-sm uppercase tracking-wide text-emerald-300">Event created</p>
      <h1 className="mt-1 text-2xl font-bold text-white">Success 🎉</h1>
      <p className="mt-3 text-slate-300">Event Code</p>
      <p className="text-3xl font-extrabold tracking-wider text-cyan-300">{code || "(missing)"}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => navigator.clipboard.writeText(code)} className="rounded-lg border border-white/20 px-3 py-2 text-sm text-slate-200">Copy code</button>
        <button onClick={() => navigator.clipboard.writeText(joinUrl)} className="rounded-lg border border-white/20 px-3 py-2 text-sm text-slate-200">Copy join link</button>
        <a href={joinUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-white/20 px-3 py-2 text-sm text-slate-200">Open join link</a>
      </div>

      <div className="mt-6 flex gap-2">
        {id ? <Link href={`/admin/${id}/edit`} className="rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-2 text-white">Edit event</Link> : null}
        <Link href="/admin" className="rounded-xl border border-white/20 px-4 py-2 text-slate-200">Back to admin</Link>
      </div>
    </div>
  );
}
