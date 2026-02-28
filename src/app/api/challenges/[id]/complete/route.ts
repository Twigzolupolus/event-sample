import { db } from "@/lib/db";
import { PARTICIPANT_COOKIE, PARTICIPANT_NAME_COOKIE, newParticipantId } from "@/lib/participant";
import { NextResponse } from "next/server";

function ciEqual(a?: string | null, b?: string | null) {
  return (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase();
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await req.json().catch(() => ({}));
  const evidenceText = typeof payload?.evidenceText === "string" ? payload.evidenceText : null;
  const evidenceUrl = typeof payload?.evidenceUrl === "string" ? payload.evidenceUrl : null;
  const evidenceFileUrl = typeof payload?.evidenceFileUrl === "string" ? payload.evidenceFileUrl : null;

  const cookieHeader = req.headers.get("cookie") || "";
  const participantMatch = cookieHeader.match(/(?:^|; )participant_id=([^;]+)/);
  const nameMatch = cookieHeader.match(/(?:^|; )participant_name=([^;]+)/);
  const participantId = participantMatch ? decodeURIComponent(participantMatch[1]) : newParticipantId();
  const participantName = nameMatch ? decodeURIComponent(nameMatch[1]) : participantId;

  const challenge = await db.challenge.findUnique({ where: { id } });
  if (!challenge || !challenge.enabled) return NextResponse.json({ error: "Challenge unavailable" }, { status: 404 });

  await db.participant.upsert({ where: { id: participantId }, update: { name: participantName }, create: { id: participantId, name: participantName } });

  // Canonicalize by participant name to avoid duplicate submissions/points under multiple ids for same name.
  const sameNameParticipants = await db.participant.findMany({ where: { name: participantName }, select: { id: true } });
  const sameNameIds = Array.from(new Set([participantId, ...sameNameParticipants.map((p) => p.id)]));

  const priorApprovedPoints = await db.pointEntry.findFirst({ where: { challengeId: id, participantId: { in: sameNameIds } } });
  if (priorApprovedPoints) {
    const total = await db.pointEntry.aggregate({ where: { eventId: challenge.eventId, participantId: { in: sameNameIds } }, _sum: { points: true } });
    return NextResponse.json({ ok: true, already: true, approved: true, total: total._sum.points || 0 });
  }

  const existingSubmissions = await db.challengeSubmission.findMany({ where: { challengeId: id, participantId: { in: sameNameIds } }, orderBy: { createdAt: "desc" } });
  const existing = existingSubmissions[0] || null;

  const expected = (challenge.autoApproveAnswer || "").trim();
  const candidate = (evidenceText || "").trim();
  const canAutoApprove = challenge.evidenceMode === "SHORT_ANSWER" && expected.length > 0 && candidate.length > 0 && ciEqual(candidate, expected);

  if (canAutoApprove) {
    if (existing) {
      await db.challengeSubmission.update({
        where: { id: existing.id },
        data: {
          participantId,
          participantName,
          evidenceText,
          evidenceUrl: null,
          evidenceFileUrl: null,
          status: "APPROVED",
          reviewNote: "Auto-approved by answer match",
          reviewedAt: new Date(),
        },
      });
    } else {
      await db.challengeSubmission.create({
        data: {
          challengeId: id,
          eventId: challenge.eventId,
          participantId,
          participantName,
          evidenceText,
          status: "APPROVED",
          reviewNote: "Auto-approved by answer match",
          reviewedAt: new Date(),
        },
      });
    }

    await db.pointEntry.create({ data: { eventId: challenge.eventId, challengeId: id, participantId, points: challenge.points } });
    const total = await db.pointEntry.aggregate({ where: { eventId: challenge.eventId, participantId: { in: sameNameIds } }, _sum: { points: true } });
    await db.activity.create({ data: { eventId: challenge.eventId, type: "approval", message: `${participantName} auto-approved for ${challenge.title} (+${challenge.points})` } });
    return NextResponse.json({ ok: true, approved: true, auto: true, total: total._sum.points || 0 });
  }

  if (existing && existing.status === "PENDING") {
    return NextResponse.json({ ok: true, pending: true, message: "Submission pending admin approval" });
  }

  if (existing && existing.status === "REJECTED") {
    await db.challengeSubmission.update({
      where: { id: existing.id },
      data: {
        participantId,
        participantName,
        evidenceText,
        evidenceUrl,
        evidenceFileUrl,
        status: "PENDING",
        reviewNote: existing.reviewNote,
        reviewedAt: null,
      },
    });
  } else if (existing && existing.status === "APPROVED") {
    const total = await db.pointEntry.aggregate({ where: { eventId: challenge.eventId, participantId: { in: sameNameIds } }, _sum: { points: true } });
    return NextResponse.json({ ok: true, already: true, approved: true, total: total._sum.points || 0 });
  } else {
    await db.challengeSubmission.create({
      data: {
        challengeId: id,
        eventId: challenge.eventId,
        participantId,
        participantName,
        evidenceText,
        evidenceUrl,
        evidenceFileUrl,
        status: "PENDING",
      },
    });
  }

  await db.activity.create({ data: { eventId: challenge.eventId, type: "submission", message: `${participantName} submitted evidence for ${challenge.title}` } });

  return NextResponse.json({ ok: true, pending: true, message: "Submitted for admin approval" });
}
