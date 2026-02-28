import { isAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
  return NextResponse.json({ logs });
}
