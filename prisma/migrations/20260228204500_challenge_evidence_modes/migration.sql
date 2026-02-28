-- Add evidence mode to challenges
ALTER TABLE "Challenge" ADD COLUMN "evidenceMode" TEXT NOT NULL DEFAULT 'TEXT';

-- Add richer evidence + review note fields to submissions
ALTER TABLE "ChallengeSubmission" ADD COLUMN "evidenceText" TEXT;
ALTER TABLE "ChallengeSubmission" ADD COLUMN "evidenceUrl" TEXT;
ALTER TABLE "ChallengeSubmission" ADD COLUMN "evidenceFileUrl" TEXT;
ALTER TABLE "ChallengeSubmission" ADD COLUMN "reviewNote" TEXT;

-- Backfill old evidence URLs where available
UPDATE "ChallengeSubmission" SET "evidenceUrl" = "photoEvidence" WHERE "photoEvidence" IS NOT NULL;
