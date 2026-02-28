import { db } from "@/lib/db";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await db.event.findFirst({ where: { slug, status: "PUBLISHED" } });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #1e1b4b, #0f172a)",
          color: "white",
          fontSize: 48,
        }}
      >
        <div style={{ fontSize: 26, color: "#67e8f9" }}>Twigzolupolus Events</div>
        <div style={{ fontWeight: 700, lineHeight: 1.2 }}>{event?.title ?? "Event"}</div>
        <div style={{ fontSize: 30, color: "#cbd5e1" }}>{event?.category ?? "Category"}</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
