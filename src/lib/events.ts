import { EventStatus } from "@prisma/client";
import { db } from "./db";

type View = "upcoming" | "past";
type Sort = "soonest" | "latest" | "newest";

function orderByFrom(view: View, sort: Sort) {
  if (sort === "newest") return { createdAt: "desc" as const };
  if (sort === "latest") return { date: "desc" as const };
  return { date: view === "past" ? "desc" : "asc" } as const;
}

function whereFrom(params?: { search?: string; category?: string; view?: View }) {
  const view = params?.view ?? "upcoming";
  return {
    status: EventStatus.PUBLISHED,
    ...(view === "upcoming" ? { date: { gte: new Date() } } : { date: { lt: new Date() } }),
    ...(params?.search
      ? {
          OR: [
            { title: { contains: params.search } },
            { location: { contains: params.search } },
            { category: { contains: params.search } },
          ],
        }
      : {}),
    ...(params?.category && params.category !== "all" ? { category: params.category } : {}),
  };
}

export async function getPublishedEvents(params?: {
  search?: string;
  category?: string;
  view?: View;
  sort?: Sort;
  page?: number;
  pageSize?: number;
}) {
  const view = params?.view ?? "upcoming";
  const sort = params?.sort ?? "soonest";
  const page = Math.max(1, params?.page ?? 1);
  const pageSize = params?.pageSize ?? 10;

  const where = whereFrom(params);
  const [items, total] = await Promise.all([
    db.event.findMany({
      where,
      orderBy: orderByFrom(view, sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.event.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getFeaturedEvent() {
  return db.event.findFirst({
    where: { status: EventStatus.PUBLISHED, date: { gte: new Date() } },
    orderBy: { date: "asc" },
  });
}

export async function getPublishedCategories() {
  const rows = await db.event.findMany({
    where: { status: EventStatus.PUBLISHED },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return rows.map((r) => r.category);
}

export async function getDiscoverySections() {
  const now = new Date();
  const day = now.getDay();
  const diffToSunday = 7 - day;
  const weekendEnd = new Date(now);
  weekendEnd.setDate(now.getDate() + diffToSunday);

  const [trending, thisWeekend, newest] = await Promise.all([
    db.event.findMany({
      where: { status: EventStatus.PUBLISHED, date: { gte: now } },
      orderBy: [{ createdAt: "desc" }, { date: "asc" }],
      take: 3,
    }),
    db.event.findMany({
      where: { status: EventStatus.PUBLISHED, date: { gte: now, lte: weekendEnd } },
      orderBy: { date: "asc" },
      take: 3,
    }),
    db.event.findMany({
      where: { status: EventStatus.PUBLISHED },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  return { trending, thisWeekend, newest };
}

export async function getRelatedEvents(eventId: string, category: string) {
  return db.event.findMany({
    where: { status: EventStatus.PUBLISHED, category, id: { not: eventId } },
    orderBy: { date: "asc" },
    take: 3,
  });
}
