import { isAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const note = typeof body?.note === "string" && body.note.trim() ? body.note.trim() : "Approved";

  const sub = await db.challengeSubmission.findUnique({ where: { id }, include: { challenge: true } });
  if (!sub) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  if (sub.status === "APPROVED") return NextResponse.json({ ok: true, already: true });

  await db.challengeSubmission.update({ where: { id }, data: { status: "APPROVED", reviewNote: note, reviewedAt: new Date() } });

  const existingPoints = await db.pointEntry.findUnique({ where: { challengeId_participantId: { challengeId: sub.challengeId, participantId: sub.participantId } } });
  if (!existingPoints) {
    await db.pointEntry.create({ data: { eventId: sub.eventId, challengeId: sub.challengeId, participantId: sub.participantId, points: sub.challenge.points } });
  }

  await db.activity.create({ data: { eventId: sub.eventId, type: "approval", message: `${sub.participantName} approved for ${sub.challenge.title} (+${sub.challenge.points})` } });

  return NextResponse.json({ ok: true });
}
