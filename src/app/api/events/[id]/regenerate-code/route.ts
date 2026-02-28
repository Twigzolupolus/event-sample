import { isAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateUniqueEventCode } from "@/lib/event-code";
import { logAudit } from "@/lib/audit";
import { NextResponse } from "next/server";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const event = await db.event.findUnique({ where: { id }, select: { id: true, title: true } });
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const code = await generateUniqueEventCode();
    await db.event.update({ where: { id }, data: { eventCode: code } });
    await logAudit({ action: "REGENERATE_CODE", target: "event", targetId: id, message: `${event.title} -> ${code}` });

    return NextResponse.json({ ok: true, code });
  } catch {
    return NextResponse.json({ error: "Regenerate failed. Run DB migrations and retry." }, { status: 500 });
  }
}
