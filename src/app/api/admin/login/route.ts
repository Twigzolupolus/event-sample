import { ADMIN_COOKIE } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json();
  if (!password) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cred = await db.adminCredential.findUnique({ where: { id: "singleton" } });
  let ok = false;

  if (cred) {
    ok = verifyPassword(password, cred.passwordHash);
  } else {
    ok = password === process.env.ADMIN_PASSWORD;
    if (ok) {
      await db.adminCredential.upsert({
        where: { id: "singleton" },
        update: {},
        create: { id: "singleton", passwordHash: hashPassword(password) },
      });
    }
  }

  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, process.env.ADMIN_COOKIE_SECRET || "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
