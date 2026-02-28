import { isAdminSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

export async function POST() {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const root = process.cwd();
  const source = path.join(root, "prisma", "dev.db");
  const backupDir = path.join(root, "backups");
  await mkdir(backupDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const target = path.join(backupDir, `dev-${stamp}.db`);
  await copyFile(source, target);

  return NextResponse.json({ ok: true, file: target });
}
