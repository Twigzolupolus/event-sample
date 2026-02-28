import { db } from "@/lib/db";

export async function trackEventView(eventId: string) {
  try {
    await db.eventView.create({ data: { eventId } });
  } catch {
    // no-op for resilience
  }
}

export async function trackSearchMetric(input: { query: string; category?: string; view?: string; resultsCount: number }) {
  try {
    const query = input.query.trim();
    if (!query) return;
    await db.searchMetric.create({
      data: {
        query,
        category: input.category || null,
        view: input.view || null,
        resultsCount: input.resultsCount,
      },
    });
  } catch {
    // no-op
  }
}

export async function trackCategoryEngagement(category: string) {
  try {
    if (!category?.trim()) return;
    await db.categoryMetric.create({ data: { category } });
  } catch {
    // no-op
  }
}
