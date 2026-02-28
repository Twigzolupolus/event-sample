import { isAdminSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { execSync } from "node:child_process";

export async function POST() {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Disabled in production" }, { status: 403 });

  execSync("npm run db:seed", { cwd: process.cwd(), stdio: "ignore" });
  return NextResponse.json({ ok: true });
}
