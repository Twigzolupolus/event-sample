import { isAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { rateLimit } from "@/lib/security";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rl = rateLimit(req, "rotate-password", 10, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword || String(newPassword).length < 8) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const cred = await db.adminCredential.findUnique({ where: { id: "singleton" } });
  const validCurrent = cred
    ? verifyPassword(currentPassword, cred.passwordHash)
    : currentPassword === process.env.ADMIN_PASSWORD;

  if (!validCurrent) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

  await db.adminCredential.upsert({
    where: { id: "singleton" },
    update: { passwordHash: hashPassword(newPassword) },
    create: { id: "singleton", passwordHash: hashPassword(newPassword) },
  });

  return NextResponse.json({ ok: true });
}
