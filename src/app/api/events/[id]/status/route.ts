import { isAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const schema = z.object({ status: z.enum(["DRAFT", "PUBLISHED"]) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  await db.event.update({ where: { id }, data: { status: parsed.data.status } });
  await logAudit({ action: "STATUS", target: "event", targetId: id, message: parsed.data.status });
  return NextResponse.json({ ok: true });
}
