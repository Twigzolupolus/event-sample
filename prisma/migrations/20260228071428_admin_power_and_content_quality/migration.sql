-- AlterTable
ALTER TABLE "Event" ADD COLUMN "scheduledPublishAt" DATETIME;
ALTER TABLE "Event" ADD COLUMN "seoDescription" TEXT;
ALTER TABLE "Event" ADD COLUMN "seoTitle" TEXT;

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "message" TEXT,
    "actor" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "AuditLog_target_targetId_idx" ON "AuditLog"("target", "targetId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Event_scheduledPublishAt_idx" ON "Event"("scheduledPublishAt");
