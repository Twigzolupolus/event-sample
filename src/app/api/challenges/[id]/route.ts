import { isAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { CHALLENGE_TYPES, EVIDENCE_MODES } from "@/lib/challenge-types";

const schema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  type: z.enum(CHALLENGE_TYPES).optional(),
  evidenceMode: z.enum(EVIDENCE_MODES).optional(),
  autoApproveAnswer: z.string().optional().or(z.literal("")),
  points: z.number().int().min(1).max(1000).optional(),
  enabled: z.boolean().optional(),
  isToday: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const current = await db.challenge.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const hasPending = await db.challengeSubmission.count({ where: { challengeId: id, status: "PENDING" } });
  const hasCompleted = await db.pointEntry.count({ where: { challengeId: id } });
  if (hasPending > 0 || hasCompleted > 0) {
    return NextResponse.json({ error: "Cannot modify: challenge has pending/approved user progress" }, { status: 409 });
  }

  const finalMode = parsed.data.evidenceMode || current.evidenceMode;
  if (finalMode === "SHORT_ANSWER") {
    const ans = parsed.data.autoApproveAnswer ?? current.autoApproveAnswer;
    if (!ans || !String(ans).trim()) return NextResponse.json({ error: "Pre-approved answer required for SHORT_ANSWER" }, { status: 400 });
  }

  if (parsed.data.isToday) {
    await db.challenge.updateMany({ where: { eventId: current.eventId }, data: { isToday: false } });
  }

  const challenge = await db.challenge.update({
    where: { id },
    data: {
      ...parsed.data,
      autoApproveAnswer: finalMode === "SHORT_ANSWER" ? (parsed.data.autoApproveAnswer ?? current.autoApproveAnswer) : null,
    },
  });
  return NextResponse.json({ ok: true, challenge });
}
