"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Row = { id: string; title: string; category: string; status: "DRAFT" | "PUBLISHED"; eventCode: string | null };

export default function AdminEventsTable({ events }: { events: Row[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [working, setWorking] = useState(false);
  const [localCodes, setLocalCodes] = useState<Record<string, string | null>>({});
  const router = useRouter();

  const uiEvents = useMemo(
    () => events.map((e) => ({ ...e, eventCode: localCodes[e.id] ?? e.eventCode })),
    [events, localCodes],
  );

  const btn = "inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-semibold transition hover:-translate-y-0.5 disabled:opacity-50";

  async function bulkStatus(status: "DRAFT" | "PUBLISHED") {
    if (!selected.length) return;
    setWorking(true);
    await fetch("/api/events/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected, status }),
    });
    setSelected([]);
    setWorking(false);
    router.refresh();
  }

  async function bulkDelete() {
    if (!selected.length) return;
    if (!confirm(`Delete ${selected.length} events?`)) return;
    setWorking(true);
    await fetch("/api/events/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected }),
    });
    setSelected([]);
    setWorking(false);
    router.refresh();
  }

  async function toggleStatus(event: Row) {
    setWorking(true);
    await fetch(`/api/events/${event.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: event.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" }),
    });
    setWorking(false);
    router.refresh();
  }

  async function duplicate(id: string) {
    setWorking(true);
    await fetch(`/api/events/${id}/duplicate`, { method: "POST" });
    setWorking(false);
    router.refresh();
  }

  async function regenerateCode(id: string) {
    if (!confirm("Regenerate code? old code links will stop working.")) return;
    setWorking(true);

    const res = await fetch(`/api/events/${id}/regenerate-code`, { method: "POST" });
    const raw = await res.text();
    let data: { code?: string; error?: string } | null = null;
    if (raw) {
      try { data = JSON.parse(raw); } catch { data = null; }
    }

    setWorking(false);

    if (!res.ok) {
      alert(data?.error || "Could not regenerate code. Please refresh and try again.");
      return;
    }

    if (data?.code) {
      setLocalCodes((prev) => ({ ...prev, [id]: data.code ?? null }));

      let copied = false;
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(data.code);
          copied = true;
        }
      } catch {}

      if (!copied) {
        try {
          const ta = document.createElement("textarea");
          ta.value = data.code;
          ta.setAttribute("readonly", "");
          ta.style.position = "absolute";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.select();
          copied = document.execCommand("copy");
          document.body.removeChild(ta);
        } catch {}
      }

      alert(copied ? `New code: ${data.code} (copied)` : `New code: ${data.code}`);
    }

    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button disabled={working} onClick={() => bulkStatus("PUBLISHED")} className={`${btn} border-emerald-300/40 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/35`}>⬆ Bulk Publish</button>
        <button disabled={working} onClick={() => bulkStatus("DRAFT")} className={`${btn} border-amber-300/40 bg-amber-500/20 text-amber-100 hover:bg-amber-500/35`}>📝 Bulk Draft</button>
        <button disabled={working} onClick={bulkDelete} className={`${btn} border-rose-300/40 bg-rose-500/20 text-rose-100 hover:bg-rose-500/35`}>🗑 Bulk Delete</button>
      </div>

      {uiEvents.map((event) => (
        <div key={event.id} className="glass flex items-center justify-between rounded-xl p-3">
          <div className="flex items-center gap-3">
            <input aria-label={`Select ${event.title}`} type="checkbox" checked={selected.includes(event.id)} onChange={() => setSelected((s) => s.includes(event.id) ? s.filter((x) => x !== event.id) : [...s, event.id])} />
            <div>
              <p className="font-semibold text-white">{event.title}</p>
              <p className="text-sm text-slate-300">{event.category} • {event.status}</p>
              <p className="text-xs text-cyan-300">Code: {event.eventCode || "(none)"}</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {event.eventCode ? <Link href={`/experience/${encodeURIComponent(event.eventCode)}`} className={`${btn} border-cyan-300/40 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/35`}>🏠 Hub</Link> : null}
            <button
              disabled={working}
              onClick={() => regenerateCode(event.id)}
              className={`${btn} group border-violet-300/50 bg-violet-500/25 text-violet-100 shadow-sm shadow-violet-500/20 hover:bg-violet-500/40`}
              title="Regenerate event code"
            >
              <span className="transition-transform group-hover:rotate-180">↻</span>
              Regenerate
            </button>
            <button disabled={working} onClick={() => toggleStatus(event)} className={`${btn} border-slate-200/30 bg-slate-500/20 text-slate-100 hover:bg-slate-500/35`}>🔁 Toggle</button>
            <button disabled={working} onClick={() => duplicate(event.id)} className={`${btn} border-blue-300/40 bg-blue-500/20 text-blue-100 hover:bg-blue-500/35`}>📄 Duplicate</button>
            <Link href={`/admin/${event.id}/edit`} className={`${btn} border-white/30 bg-white/10 text-white hover:bg-white/20`}>✏️ Edit</Link>
          </div>
        </div>
      ))}
    </div>
  );
}
