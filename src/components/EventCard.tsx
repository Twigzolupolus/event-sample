"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils";
import Image from "next/image";
import { useMemo, useState } from "react";

type Props = {
  event: {
    slug: string;
    title: string;
    date: Date | string;
    time: string;
    location: string;
    category: string;
    description: string;
    imageUrl?: string | null;
  };
};

function statusChip(date: Date) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((eventStart.getTime() - todayStart.getTime()) / 86400000);

  if (diffDays < 0) return { label: "Past", cls: "bg-slate-700 text-slate-200" };
  if (diffDays === 0) return { label: "Today", cls: "bg-emerald-600 text-white" };
  if (diffDays <= 7) return { label: "This Week", cls: "bg-cyan-600 text-white" };
  return { label: "Upcoming", cls: "bg-violet-600 text-white" };
}

export default function EventCard({ event }: Props) {
  const [open, setOpen] = useState(false);
  const date = useMemo(() => new Date(event.date), [event.date]);

  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = date.getDate();
  const chip = statusChip(date);

  return (
    <>
      <Link href={`/events/${event.slug}`} className="glass group block overflow-hidden rounded-2xl transition hover:-translate-y-0.5 hover:border-violet-300/40">
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <Image
            src={event.imageUrl || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80"}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute left-3 top-3 rounded-md border border-white/25 bg-black/45 px-2 py-1 text-center">
            <p className="text-[10px] tracking-widest text-cyan-200">{month}</p>
            <p className="text-base leading-none font-bold text-white">{day}</p>
          </div>
          <div className="absolute bottom-3 left-3 flex gap-2">
            <p className="rounded-full border border-white/30 bg-black/40 px-3 py-1 text-xs uppercase tracking-wider text-cyan-200">{event.category}</p>
            <p className={`rounded-full px-3 py-1 text-xs ${chip.cls}`}>{chip.label}</p>
          </div>
        </div>
        <div className="p-4">
          <h3 className="ui-h3 text-lg font-semibold text-white">{event.title}</h3>
          <p className="mt-1 text-sm text-slate-300">{formatDate(date)} • {event.time}</p>
          <p className="text-sm text-slate-400">{event.location}</p>
          <p className="mt-3 line-clamp-2 text-sm text-slate-300">{event.description}</p>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setOpen(true);
            }}
            className="mt-3 rounded-lg border border-white/20 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
          >
            Quick view
          </button>
        </div>
      </Link>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div className="glass w-full max-w-xl rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="ui-h3 text-2xl font-bold text-white">{event.title}</h3>
              <button className="rounded border border-white/20 px-2 py-1 text-xs text-slate-200" onClick={() => setOpen(false)}>Close</button>
            </div>
            <p className="text-sm text-slate-300">{formatDate(date)} • {event.time}</p>
            <p className="text-sm text-slate-400">{event.location}</p>
            <p className="mt-3 text-slate-200">{event.description}</p>
            <Link href={`/events/${event.slug}`} className="mt-4 inline-block rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950">Open full event</Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
