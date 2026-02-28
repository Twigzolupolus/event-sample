import ExperienceNav from "@/components/ExperienceNav";
import { db } from "@/lib/db";
import { JOIN_COOKIE, parseJoinedCookie } from "@/lib/join-session";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

export default async function BriefPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const normalized = decodeURIComponent(code).toUpperCase();
  const store = await cookies();
  const joinedCodes = parseJoinedCookie(store.get(JOIN_COOKIE)?.value);
  if (!joinedCodes.includes(normalized)) redirect(`/join?code=${encodeURIComponent(normalized)}`);

  const event = await db.event.findFirst({ where: { eventCode: normalized } });
  if (!event) notFound();

  return (
    <div>
      <ExperienceNav code={normalized} />
      <div className="glass rounded-2xl p-5">
        <h1 className="text-2xl font-bold text-white">Event Brief</h1>
        <p className="mt-3 text-slate-200 whitespace-pre-wrap">{event.description}</p>
        <a href={`/events/${event.slug}`} className="mt-4 inline-block rounded-lg border border-white/20 px-3 py-1 text-sm text-slate-200">Open public event details</a>
      </div>
    </div>
  );
}
