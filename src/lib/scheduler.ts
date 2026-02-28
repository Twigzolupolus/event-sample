import { db } from "./db";
import { logAudit } from "./audit";

export async function publishDueDrafts() {
  try {
    const due = await db.event.findMany({
      where: {
        status: "DRAFT",
        scheduledPublishAt: { lte: new Date() },
      },
      select: { id: true, title: true },
    });

    if (!due.length) return 0;

    await db.event.updateMany({
      where: { id: { in: due.map((d) => d.id) } },
      data: { status: "PUBLISHED" },
    });

    await Promise.all(
      due.map((d) =>
        logAudit({
          action: "AUTO_PUBLISH",
          target: "event",
          targetId: d.id,
          message: `Auto-published scheduled draft: ${d.title}`,
        }),
      ),
    );

    return due.length;
  } catch {
    // Graceful fallback when local DB schema hasn't been migrated yet.
    return 0;
  }
}
