import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { NextResponse } from "next/server";

export async function GET() {
  const cred = await db.adminCredential.findUnique({ where: { id: "singleton" } });

  return NextResponse.json({
    ok: true,
    env: {
      hasAdminPassword: Boolean(process.env.ADMIN_PASSWORD),
      adminPasswordLength: process.env.ADMIN_PASSWORD?.length ?? 0,
      hasAdminCookieSecret: Boolean(process.env.ADMIN_COOKIE_SECRET),
      adminCookieSecretLength: process.env.ADMIN_COOKIE_SECRET?.length ?? 0,
      databaseUrl: process.env.DATABASE_URL ?? null,
    },
    db: {
      hasCredentialRow: Boolean(cred),
      passwordHashLength: cred?.passwordHash?.length ?? 0,
      passwordHashFormatValid: cred ? cred.passwordHash.includes(":") : false,
    },
    authMode: cred ? "db_hash" : "env_fallback",
  });
}

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({}));
  const cred = await db.adminCredential.findUnique({ where: { id: "singleton" } });

  const envMatch = typeof password === "string" && password.length > 0
    ? password === process.env.ADMIN_PASSWORD
    : false;

  const dbMatch = typeof password === "string" && password.length > 0 && cred
    ? verifyPassword(password, cred.passwordHash)
    : false;

  return NextResponse.json({
    ok: true,
    checks: {
      providedPassword: typeof password === "string" ? "present" : "missing",
      envMatch,
      dbMatch,
      effectiveMode: cred ? "db_hash" : "env_fallback",
      effectiveMatch: cred ? dbMatch : envMatch,
    },
  });
}
