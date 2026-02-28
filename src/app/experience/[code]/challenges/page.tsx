import ExperienceNav from "@/components/ExperienceNav";
import ChallengeBoard from "@/components/ChallengeBoard";
import { db } from "@/lib/db";
import { JOIN_COOKIE, parseJoinedCookie } from "@/lib/join-session";
import { PARTICIPANT_COOKIE, PARTICIPANT_NAME_COOKIE } from "@/lib/participant";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

export default async function ChallengesPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const normalized = decodeURIComponent(code).toUpperCase();

  const store = await cookies();
  const joinedCodes = parseJoinedCookie(store.get(JOIN_COOKIE)?.value);
  if (!joinedCodes.includes(normalized)) redirect(`/join?code=${encodeURIComponent(normalized)}`);

  const participantId = store.get(PARTICIPANT_COOKIE)?.value;
  const participantName = store.get(PARTICIPANT_NAME_COOKIE)?.value ? decodeURIComponent(store.get(PARTICIPANT_NAME_COOKIE)!.value) : null;

  const event = await db.event.findFirst({ where: { eventCode: normalized } });
  if (!event) notFound();

  const sameNameIds = participantName
    ? (await db.participant.findMany({ where: { name: participantName }, select: { id: true } })).map((p) => p.id)
    : [];
  const actorIds = Array.from(new Set([...(participantId ? [participantId] : []), ...sameNameIds]));

  const [challenges, completed, submissions] = await Promise.all([
    db.challenge.findMany({ where: { eventId: event.id, enabled: true }, orderBy: [{ isToday: "desc" }, { createdAt: "desc" }] }),
    actorIds.length
      ? db.pointEntry.findMany({ where: { eventId: event.id, participantId: { in: actorIds } }, select: { challengeId: true } })
      : Promise.resolve([]),
    actorIds.length
      ? db.challengeSubmission.findMany({ where: { eventId: event.id, participantId: { in: actorIds } }, select: { challengeId: true, status: true, reviewNote: true }, orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
  ]);

  const dedupSubs = new Map<string, { challengeId: string; status: "PENDING" | "APPROVED" | "REJECTED"; reviewNote: string | null }>();
  for (const s of submissions) {
    if (!dedupSubs.has(s.challengeId)) dedupSubs.set(s.challengeId, s as any);
  }

  return (
    <div>
      <ExperienceNav code={normalized} />
      <div className="glass rounded-2xl p-5">
        <h1 className="text-2xl font-bold text-white">Game / Challenges</h1>
        <p className="mt-2 text-slate-300">Submit challenge evidence. Points are allocated after admin approval.</p>
        <div className="mt-4">
          <ChallengeBoard
            challenges={challenges as any}
            completedIds={Array.from(new Set(completed.map((c) => c.challengeId)))}
            submissions={Array.from(dedupSubs.values())}
          />
        </div>
      </div>
    </div>
  );
}
