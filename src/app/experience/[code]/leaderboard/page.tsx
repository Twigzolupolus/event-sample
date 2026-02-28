import ExperienceNav from "@/components/ExperienceNav";
import { db } from "@/lib/db";
import { JOIN_COOKIE, parseJoinedCookie } from "@/lib/join-session";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

function safeName(name: string) {
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

export default async function LeaderboardPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const normalized = decodeURIComponent(code).toUpperCase();

  const store = await cookies();
  const joinedCodes = parseJoinedCookie(store.get(JOIN_COOKIE)?.value);
  if (!joinedCodes.includes(normalized)) redirect(`/join?code=${encodeURIComponent(normalized)}`);

  const event = await db.event.findFirst({ where: { eventCode: normalized } });
  if (!event) notFound();

  const [leadersById, activity] = await Promise.all([
    db.pointEntry.groupBy({ by: ["participantId"], where: { eventId: event.id }, _sum: { points: true }, orderBy: { _sum: { points: "desc" } } }),
    db.activity.findMany({ where: { eventId: event.id }, orderBy: { createdAt: "desc" }, take: 40 }),
  ]);

  const names = await db.participant.findMany({ where: { id: { in: leadersById.map((l) => l.participantId) } }, select: { id: true, name: true } });
  const nameMap = new Map(names.map((n) => [n.id, safeName(n.name)]));

  const merged = new Map<string, number>();
  for (const row of leadersById) {
    const name = nameMap.get(row.participantId) || row.participantId;
    merged.set(name, (merged.get(name) || 0) + (row._sum.points || 0));
  }
  const leaders = [...merged.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <ExperienceNav code={normalized} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <h1 className="text-2xl font-bold text-white">Full Leaderboard</h1>
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            {leaders.length ? leaders.map(([name, pts], i) => <li key={name}>#{i + 1} {name} — {pts} pts</li>) : <li>No scores yet.</li>}
          </ul>
        </div>
        <div className="glass rounded-2xl p-5">
          <h2 className="text-xl font-semibold text-white">Live Activity Feed</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {activity.length ? activity.map((a) => <li key={a.id}>{a.message}</li>) : <li>No activity yet.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
