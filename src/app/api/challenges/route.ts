import { isAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { CHALLENGE_TYPES, EVIDENCE_MODES } from "@/lib/challenge-types";

const schema = z.object({
  eventId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(CHALLENGE_TYPES).default("QUIZ"),
  evidenceMode: z.enum(EVIDENCE_MODES).default("TEXT"),
  autoApproveAnswer: z.string().optional().or(z.literal("")),
  points: z.number().int().min(1).max(1000),
  enabled: z.boolean().default(true),
  isToday: z.boolean().default(false),
});

export async function POST(req: Request) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const payload = parsed.data;

  if (payload.evidenceMode === "SHORT_ANSWER" && !payload.autoApproveAnswer?.trim()) {
    return NextResponse.json({ error: "Pre-approved answer is required for SHORT_ANSWER" }, { status: 400 });
  }

  if (payload.isToday) {
    await db.challenge.updateMany({ where: { eventId: payload.eventId }, data: { isToday: false } });
  }

  const challenge = await db.challenge.create({
    data: {
      ...payload,
      autoApproveAnswer: payload.evidenceMode === "SHORT_ANSWER" ? payload.autoApproveAnswer?.trim() || null : null,
    },
  });

  await db.activity.create({ data: { eventId: payload.eventId, type: "challenge", message: `New ${payload.type} challenge: ${payload.title}` } });

  return NextResponse.json({ ok: true, challenge });
}
