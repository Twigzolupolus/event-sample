import { isAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const source = await db.event.findUnique({ where: { id } });
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let slug = `${source.slug}-copy`;
  let i = 1;
  while (await db.event.findUnique({ where: { slug } })) slug = `${source.slug}-copy-${i++}`;

  const dup = await db.event.create({
    data: {
      title: `${source.title} (Copy)`,
      slug,
      description: source.description,
      date: source.date,
      time: source.time,
      location: source.location,
      category: source.category,
      organizer: source.organizer,
      notes: source.notes,
      imageUrl: source.imageUrl,
      seoTitle: source.seoTitle,
      seoDescription: source.seoDescription,
      scheduledPublishAt: source.scheduledPublishAt,
      status: "DRAFT",
    },
  });

  await logAudit({ action: "DUPLICATE", target: "event", targetId: dup.id, message: `${source.title} -> ${dup.title}` });
  return NextResponse.json({ ok: true, id: dup.id });
}
