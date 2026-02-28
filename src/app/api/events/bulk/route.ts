import { isAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const schema = z.object({ ids: z.array(z.string()).min(1), status: z.enum(["DRAFT", "PUBLISHED"]) });

export async function POST(req: Request) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await db.event.updateMany({ where: { id: { in: parsed.data.ids } }, data: { status: parsed.data.status } });
  await Promise.all(parsed.data.ids.map((id) => logAudit({ action: "BULK_STATUS", target: "event", targetId: id, message: parsed.data.status })));
  return NextResponse.json({ ok: true });
}
