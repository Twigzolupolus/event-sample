export const CHALLENGE_TYPES = [
  "QUIZ",
  "PHOTO",
  "CHECKIN",
  "SCAVENGER",
  "SOCIAL",
  "POLL",
  "TRIVIA",
  "REFERRAL",
] as const;

export const EVIDENCE_MODES = ["PHOTO_UPLOAD", "TEXT", "SHORT_ANSWER", "URL"] as const;

export type ChallengeType = (typeof CHALLENGE_TYPES)[number];
export type EvidenceMode = (typeof EVIDENCE_MODES)[number];
