import { isAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateUniqueEventCode } from "@/lib/event-code";
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

export async function POST(req: Request) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const baseSlug = slugify(data.slug || data.title);
  let slug = baseSlug;
  let i = 1;
  while (await db.event.findUnique({ where: { slug } })) slug = `${baseSlug}-${i++}`;

  const eventCode = await generateUniqueEventCode();

  const event = await db.event.create({
    data: {
      ...data,
      slug,
      eventCode,
      date: new Date(data.date),
      imageUrl: data.imageUrl || null,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      scheduledPublishAt: data.scheduledPublishAt ? new Date(data.scheduledPublishAt) : null,
    },
  });

  await logAudit({ action: "CREATE", target: "event", targetId: event.id, message: `${event.title} (${eventCode})` });
  return NextResponse.json(event);
}
