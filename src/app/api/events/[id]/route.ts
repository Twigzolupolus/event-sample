import { isAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  location: z.string().min(1),
  category: z.string().min(1),
  organizer: z.string().min(1),
  notes: z.string().min(1),
  imageUrl: z.string().url().optional().or(z.literal("")),
  seoTitle: z.string().optional().or(z.literal("")),
  seoDescription: z.string().optional().or(z.literal("")),
  scheduledPublishAt: z.string().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const slugBase = slugify(data.slug || data.title);
  let slug = slugBase;
  let i = 1;
  while (true) {
    const found = await db.event.findUnique({ where: { slug } });
    if (!found || found.id === id) break;
    slug = `${slugBase}-${i++}`;
  }

  const event = await db.event.update({
    where: { id },
    data: {
      ...data,
      slug,
      date: new Date(data.date),
      imageUrl: data.imageUrl || null,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      scheduledPublishAt: data.scheduledPublishAt ? new Date(data.scheduledPublishAt) : null,
    },
  });

  await logAudit({ action: "UPDATE", target: "event", targetId: event.id, message: event.title });
  return NextResponse.json(event);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const ev = await db.event.findUnique({ where: { id }, select: { title: true } });
  await db.event.delete({ where: { id } });
  await logAudit({ action: "DELETE", target: "event", targetId: id, message: ev?.title });
  return NextResponse.json({ ok: true });
}
