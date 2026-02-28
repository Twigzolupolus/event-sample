import ExperienceNav from "@/components/ExperienceNav";
import { db } from "@/lib/db";
import { JOIN_COOKIE, parseJoinedCookie } from "@/lib/join-session";
import { PARTICIPANT_COOKIE } from "@/lib/participant";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

function countdown(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return "Started";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  return `${days}d ${hours}h ${mins}m`;
}

function safeName(name: string) {
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

export default async function ExperienceHome({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ joined?: string }> }) {
  const { code } = await params;
  const { joined } = await searchParams;
  const normalized = decodeURIComponent(code).toUpperCase();

  const store = await cookies();
  const joinedCodes = parseJoinedCookie(store.get(JOIN_COOKIE)?.value);
  if (!joinedCodes.includes(normalized)) redirect(`/join?code=${encodeURIComponent(normalized)}`);

  const participantId = store.get(PARTICIPANT_COOKIE)?.value;

  const event = await db.event.findFirst({ where: { eventCode: normalized } });
  if (!event) notFound();

  const [allChallenges, completedRows, topBoardById, activity] = await Promise.all([
    db.challenge.findMany({ where: { eventId: event.id, enabled: true }, orderBy: [{ isToday: "desc" }, { createdAt: "desc" }] }),
    participantId ? db.pointEntry.findMany({ where: { eventId: event.id, participantId }, select: { challengeId: true } }) : Promise.resolve([]),
    db.pointEntry.groupBy({ by: ["participantId"], where: { eventId: event.id }, _sum: { points: true }, orderBy: { _sum: { points: "desc" } }, take: 20 }),
    db.activity.findMany({ where: { eventId: event.id }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  const completedSet = new Set(completedRows.map((r) => r.challengeId));
  const featuredChallenge = allChallenges.find((c) => !completedSet.has(c.id)) || null;

  const participantRows = await db.participant.findMany({ where: { id: { in: topBoardById.map((r) => r.participantId) } }, select: { id: true, name: true } });
  const nameMap = new Map(participantRows.map((p) => [p.id, safeName(p.name)]));

  const merged = new Map<string, number>();
  for (const row of topBoardById) {
    const name = nameMap.get(row.participantId) || row.participantId;
    merged.set(name, (merged.get(name) || 0) + (row._sum.points || 0));
  }
  const topBoard = [...merged.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div>
      {joined === "1" ? <div className="mb-4 rounded-xl border border-emerald-400/40 bg-emerald-900/20 p-3 text-emerald-200">You’re in! Welcome to the event hub.</div> : null}
      <ExperienceNav code={normalized} />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass rounded-2xl p-5 md:col-span-2">
          <p className="text-xs uppercase tracking-wider text-cyan-200">Event Dashboard</p>
          <h1 className="text-3xl font-bold text-white">{event.title}</h1>
          <p className="mt-1 text-slate-300">{event.location} • {event.date.toISOString().slice(0, 10)} • {event.time}</p>
          <p className="mt-3 text-lg text-cyan-300">Countdown: {countdown(event.date)}</p>

          <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-sm uppercase tracking-wide text-slate-400">Event Brief</p>
            <p className="mt-2 line-clamp-3 text-slate-200">{event.description}</p>
            <a href={`/experience/${encodeURIComponent(normalized)}/brief`} className="mt-3 inline-block rounded-lg border border-white/20 px-3 py-1 text-sm text-slate-200">View Details</a>
          </div>

          <div className="mt-4 rounded-xl border border-violet-300/30 bg-violet-900/20 p-4">
            <p className="text-sm uppercase tracking-wide text-violet-200">Featured Challenge</p>
            {featuredChallenge ? (
              <>
                <p className="mt-1 font-semibold text-white">{featuredChallenge.title} · {featuredChallenge.points} pts</p>
                <p className="text-sm text-slate-300">{featuredChallenge.description}</p>
                <a href={`/experience/${encodeURIComponent(normalized)}/challenges`} className="mt-3 inline-block rounded-lg bg-violet-500 px-3 py-1 text-sm font-semibold text-white">Start Game</a>
              </>
            ) : <p className="mt-1 text-sm text-slate-300">No remaining challenges. Great job!</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl p-4">
            <h3 className="mb-2 text-sm font-semibold text-white">Leaderboard (Top)</h3>
            <ul className="space-y-1 text-sm text-slate-300">
              {topBoard.length ? topBoard.map(([name, pts], i) => <li key={`${name}-${i}`}>#{i + 1} {name} — {pts}</li>) : <li>No points yet.</li>}
            </ul>
            <a href={`/experience/${encodeURIComponent(normalized)}/leaderboard`} className="mt-2 inline-block text-xs text-cyan-300">View full leaderboard →</a>
          </div>

          <div className="glass rounded-2xl p-4">
            <h3 className="mb-2 text-sm font-semibold text-white">Live Activity</h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {activity.length ? activity.map((a) => <li key={a.id}>{a.message}</li>) : <li>No activity yet.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
