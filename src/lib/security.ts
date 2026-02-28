import { headers } from "next/headers";

const store = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

export function rateLimit(req: Request, key: string, limit: number, windowMs: number) {
  const ip = getClientIp(req);
  const id = `${key}:${ip}`;
  const now = Date.now();
  const entry = store.get(id);

  if (!entry || now > entry.resetAt) {
    store.set(id, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) return { ok: false, remaining: 0 };

  entry.count += 1;
  store.set(id, entry);
  return { ok: true, remaining: Math.max(0, limit - entry.count) };
}

export async function isSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  if (!host) return false;
  return origin === `${proto}://${host}`;
}
