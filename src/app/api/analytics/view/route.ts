import { NextResponse } from "next/server";
import { z } from "zod";
import { trackEventView } from "@/lib/analytics";

const schema = z.object({ eventId: z.string().min(1) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  await trackEventView(parsed.data.eventId);
  return NextResponse.json({ ok: true });
}
