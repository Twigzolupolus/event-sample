import { db } from "@/lib/db";
import { JOIN_COOKIE, parseJoinedCookie } from "@/lib/join-session";
import { PARTICIPANT_COOKIE, PARTICIPANT_MAP_COOKIE, PARTICIPANT_NAME_COOKIE, newParticipantId, parseParticipantMap } from "@/lib/participant";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ code: z.string().min(3), name: z.string().min(2).max(40) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Name and valid code are required" }, { status: 400 });

  const code = parsed.data.code.trim().toUpperCase();
  const name = parsed.data.name.trim();
  const nameKey = name.toLowerCase();
  const event = await db.event.findFirst({ where: { eventCode: code } });
  if (!event) return NextResponse.json({ error: "Event code not found" }, { status: 404 });

  const cookieHeader = req.headers.get("cookie") || "";
  const joinedMatch = cookieHeader.match(/(?:^|; )joined_events=([^;]+)/);
  const mapMatch = cookieHeader.match(/(?:^|; )participant_map=([^;]+)/);

  const existingJoined = parseJoinedCookie(joinedMatch ? decodeURIComponent(joinedMatch[1]) : undefined);
  const alreadyJoined = existingJoined.includes(code);
  const updatedJoined = alreadyJoined ? existingJoined : [code, ...existingJoined].slice(0, 30);

  const map = parseParticipantMap(mapMatch ? decodeURIComponent(mapMatch[1]) : undefined);
  const participantId = map[nameKey] || newParticipantId();
  map[nameKey] = participantId;

  await db.participant.upsert({ where: { id: participantId }, update: { name }, create: { id: participantId, name } });

  if (!alreadyJoined) {
    await db.activity.create({ data: { eventId: event.id, type: "join", message: `${name} joined via code` } });
  }

  const res = NextResponse.json({ ok: true, code, slug: event.slug, alreadyJoined });
  res.cookies.set(JOIN_COOKIE, JSON.stringify(updatedJoined), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  res.cookies.set(PARTICIPANT_COOKIE, participantId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  res.cookies.set(PARTICIPANT_NAME_COOKIE, encodeURIComponent(name), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  res.cookies.set(PARTICIPANT_MAP_COOKIE, encodeURIComponent(JSON.stringify(map)), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
