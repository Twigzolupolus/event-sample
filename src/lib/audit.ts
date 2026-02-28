import { db } from "./db";

export async function logAudit(input: {
  action: string;
  target: string;
  targetId: string;
  message?: string;
  actor?: string;
}) {
  try {
    await db.auditLog.create({
      data: {
        action: input.action,
        target: input.target,
        targetId: input.targetId,
        message: input.message,
        actor: input.actor ?? "admin",
      },
    });
  } catch {
    // non-blocking
  }
}
