import { db } from "@/lib/db";

export async function GET() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const events = await db.event.findMany({ where: { status: "PUBLISHED" }, orderBy: { date: "desc" }, take: 30 });

  const items = events.map((e) => `<item><title><![CDATA[${e.title}]]></title><link>${base}/events/${e.slug}</link><description><![CDATA[${e.description}]]></description><pubDate>${new Date(e.date).toUTCString()}</pubDate></item>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>EventGrid</title><link>${base}</link><description>Published events</description>${items}</channel></rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
