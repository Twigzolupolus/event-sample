import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  category: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { email, category } = parsed.data;
  await db.categorySubscription.upsert({
    where: { email_category: { email, category } },
    update: {},
    create: { email, category },
  });

  return NextResponse.json({ ok: true });
}
