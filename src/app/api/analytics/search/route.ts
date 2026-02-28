import { NextResponse } from "next/server";
import { z } from "zod";
import { trackSearchMetric } from "@/lib/analytics";

const schema = z.object({
  query: z.string().min(1),
  category: z.string().optional(),
  view: z.string().optional(),
  resultsCount: z.number().int().nonnegative(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  await trackSearchMetric(parsed.data);
  return NextResponse.json({ ok: true });
}
