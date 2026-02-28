export const revalidate = 120;

import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import ShareButtons from "@/components/ShareButtons";
import EventCard from "@/components/EventCard";
import { getRelatedEvents } from "@/lib/events";
import { trackEventView } from "@/lib/analytics";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await db.event.findFirst({ where: { slug, status: "PUBLISHED" } });
  if (!event) return { title: "Event not found" };
  return {
    title: `${event.title} | Twigzolupolus Events`,
    description: event.description,
    openGraph: {
      title: event.title,
      description: event.description,
      images: event.imageUrl ? [event.imageUrl] : [{ url: `/events/${event.slug}/opengraph-image` }],
    },
  };
}

export default async function EventDetails({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await db.event.findFirst({ where: { slug, status: "PUBLISHED" } });
  if (!event) notFound();

  await trackEventView(event.id);

  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = `${base}/events/${event.slug}`;
  const related = await getRelatedEvents(event.id, event.category);

  return (
    <article className="space-y-6">
      <a href="/" className="inline-block rounded-lg border border-white/20 px-3 py-1 text-sm text-slate-200">← Back to events</a>

      <div className="relative overflow-hidden rounded-3xl border border-white/15">
        <Image
          src={event.imageUrl || "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1800&q=80"}
          alt={event.title}
          width={1800}
          height={900}
          className="h-[320px] w-full object-cover md:h-[420px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-8">
          <p className="mb-2 inline-block rounded-full border border-white/30 bg-black/40 px-3 py-1 text-xs uppercase tracking-widest text-cyan-200">{event.category}</p>
          <h1 className="ui-h1 text-3xl font-bold text-white md:text-5xl">{event.title}</h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ShareButtons url={url} />
        <a href={`/events/${event.slug}/opengraph-image`} target="_blank" rel="noreferrer" className="rounded-lg border border-white/20 px-3 py-1 text-sm text-slate-200">Open share card template</a>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="glass rounded-2xl p-4 text-sm text-slate-200"><p className="text-xs uppercase tracking-wide text-cyan-200">Date</p><p className="mt-1 text-base font-medium text-white">{formatDate(event.date)}</p></div>
        <div className="glass rounded-2xl p-4 text-sm text-slate-200"><p className="text-xs uppercase tracking-wide text-cyan-200">Time</p><p className="mt-1 text-base font-medium text-white">{event.time}</p></div>
        <div className="glass rounded-2xl p-4 text-sm text-slate-200"><p className="text-xs uppercase tracking-wide text-cyan-200">Location</p><p className="mt-1 text-base font-medium text-white">{event.location}</p></div>
      </div>

      <section className="glass rounded-2xl p-6"><h2 className="ui-h2 mb-2 text-xl font-semibold text-white">Overview</h2><p className="text-slate-200">{event.description}</p></section>
      <section className="glass rounded-2xl p-6"><h2 className="ui-h2 mb-2 text-xl font-semibold text-white">Organizer</h2><p className="text-slate-200">{event.organizer}</p></section>
      <section className="glass rounded-2xl p-6"><h2 className="ui-h2 mb-2 text-xl font-semibold text-white">Notes</h2><p className="text-slate-200">{event.notes}</p></section>

      {related.length ? (
        <section>
          <h2 className="ui-h2 mb-4 text-2xl font-bold text-white">Related events</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <EventCard key={r.id} event={r} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
