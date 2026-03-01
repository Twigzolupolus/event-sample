import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/auth";

const rateStore = new Map<string, { count: number; resetAt: number }>();

function hitRateLimit(req: NextRequest, key: string, limit: number, windowMs: number) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const id = `${key}:${ip}`;
  const now = Date.now();
  const current = rateStore.get(id);

  if (!current || now > current.resetAt) {
    rateStore.set(id, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (current.count >= limit) return true;
  current.count += 1;
  rateStore.set(id, current);
  return false;
}

function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "http";
  if (!host) return false;
  return origin === `${proto}://${host}`;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminPath = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isAdminApi = pathname.startsWith("/api/events") || pathname.startsWith("/api/admin");
  const isAdminDebug = pathname === "/api/admin/debug-auth";

  // Rate limiting
  if (pathname === "/api/admin/login" && req.method === "POST" && hitRateLimit(req, "admin-login", 10, 60_000)) {
    return NextResponse.json({ error: "Too many login attempts" }, { status: 429 });
  }
  if (isAdminApi && hitRateLimit(req, "admin-api", 120, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // CSRF protection for state-changing admin endpoints
  if (isAdminApi && ["POST", "PATCH", "PUT", "DELETE"].includes(req.method) && pathname !== "/api/admin/login" && !isAdminDebug) {
    if (!sameOrigin(req)) return NextResponse.json({ error: "Invalid CSRF origin" }, { status: 403 });
  }

  if (isAdminPath || isAdminApi) {
    if (isAdminDebug || pathname === "/api/admin/login") return NextResponse.next();
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    if (token && token === process.env.ADMIN_COOKIE_SECRET) return NextResponse.next();

    if (isAdminApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const res = NextResponse.next();

  if (req.method === "GET" && (pathname === "/" || pathname.startsWith("/category/") || pathname.startsWith("/events/"))) {
    res.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
  }

  return res;
}

export const config = {
  matcher: ["/", "/events/:path*", "/category/:path*", "/admin/:path*", "/api/events/:path*", "/api/admin/:path*"],
};
