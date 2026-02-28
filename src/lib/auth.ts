import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_session";

export async function isAdminSession() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  return !!token && token === process.env.ADMIN_COOKIE_SECRET;
}
