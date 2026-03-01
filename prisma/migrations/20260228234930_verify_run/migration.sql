/*
  Warnings:

  - You are about to drop the column `photoEvidence` on the `ChallengeSubmission` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChallengeSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challengeId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "participantName" TEXT NOT NULL,
    "evidenceText" TEXT,
    "evidenceUrl" TEXT,
    "evidenceFileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    CONSTRAINT "ChallengeSubmission_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ChallengeSubmission" ("challengeId", "createdAt", "eventId", "evidenceFileUrl", "evidenceText", "evidenceUrl", "id", "participantId", "participantName", "reviewNote", "reviewedAt", "status") SELECT "challengeId", "createdAt", "eventId", "evidenceFileUrl", "evidenceText", "evidenceUrl", "id", "participantId", "participantName", "reviewNote", "reviewedAt", "status" FROM "ChallengeSubmission";
DROP TABLE "ChallengeSubmission";
ALTER TABLE "new_ChallengeSubmission" RENAME TO "ChallengeSubmission";
CREATE INDEX "ChallengeSubmission_eventId_status_idx" ON "ChallengeSubmission"("eventId", "status");
CREATE UNIQUE INDEX "ChallengeSubmission_challengeId_participantId_key" ON "ChallengeSubmission"("challengeId", "participantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
