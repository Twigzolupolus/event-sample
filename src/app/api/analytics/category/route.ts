import { NextResponse } from "next/server";
import { z } from "zod";
import { trackCategoryEngagement } from "@/lib/analytics";

const schema = z.object({ category: z.string().min(1) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  await trackCategoryEngagement(parsed.data.category);
  return NextResponse.json({ ok: true });
}
