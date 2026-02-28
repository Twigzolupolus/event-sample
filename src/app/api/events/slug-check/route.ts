import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slugRaw = searchParams.get("slug") || "";
  const id = searchParams.get("id");
  const slug = slugify(slugRaw);
  if (!slug) return NextResponse.json({ ok: false, available: false });

  const existing = await db.event.findUnique({ where: { slug } });
  const available = !existing || existing.id === id;
  return NextResponse.json({ ok: true, available, slug });
}
