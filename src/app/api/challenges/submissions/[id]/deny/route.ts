import { isAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const reason = typeof body?.reason === "string" && body.reason.trim() ? body.reason.trim() : "Rejected by admin";

  const sub = await db.challengeSubmission.findUnique({ where: { id }, include: { challenge: true } });
  if (!sub) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  await db.challengeSubmission.update({ where: { id }, data: { status: "REJECTED", reviewNote: reason, reviewedAt: new Date() } });
  await db.activity.create({ data: { eventId: sub.eventId, type: "review", message: `${sub.participantName} submission denied: ${reason}` } });

  return NextResponse.json({ ok: true });
}
