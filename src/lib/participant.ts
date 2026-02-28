import { randomUUID } from "node:crypto";

export const PARTICIPANT_COOKIE = "participant_id";
export const PARTICIPANT_NAME_COOKIE = "participant_name";
export const PARTICIPANT_MAP_COOKIE = "participant_map";

export function newParticipantId() {
  return `p_${randomUUID().slice(0, 12)}`;
}

export function parseParticipantMap(raw?: string) {
  if (!raw) return {} as Record<string, string>;
  try {
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof k === "string" && typeof v === "string") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}
