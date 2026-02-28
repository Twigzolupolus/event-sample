import { db } from "@/lib/db";

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "EV-";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function generateUniqueEventCode() {
  let code = randomCode();
  while (await db.event.findFirst({ where: { eventCode: code } })) code = randomCode();
  return code;
}
