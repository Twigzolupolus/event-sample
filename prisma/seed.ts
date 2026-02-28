import { PrismaClient, EventStatus, ChallengeType, EvidenceMode, SubmissionStatus } from "@prisma/client";

const prisma = new PrismaClient();

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "EV-";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function ensureCodes() {
  const events = await prisma.event.findMany({ select: { id: true, eventCode: true } });
  const used = new Set(events.map((e) => e.eventCode).filter(Boolean) as string[]);
  for (const e of events) {
    if (e.eventCode) continue;
    let code = randomCode();
    while (used.has(code)) code = randomCode();
    used.add(code);
    await prisma.event.update({ where: { id: e.id }, data: { eventCode: code } });
  }
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  await prisma.pointEntry.deleteMany();
  await prisma.challengeSubmission.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.eventView.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.event.deleteMany();

  const baseEvents = [
    ["Lagos Startup Mixer", "Networking", "Civic Hub, Yaba", -20],
    ["Community Health Fair", "Community", "Freedom Park", -12],
    ["Design Sprint Open Lab", "Workshop", "Lekki Studio", -7],
    ["Tech Career Day", "Career", "Innovation Center", -3],
    ["Creative Market Pop-up", "Expo", "Tafawa Hall", -1],
    ["Product Builders Meetup", "Networking", "Yaba Campus", 1],
    ["AI for Founders", "Workshop", "VI Tech Loft", 3],
    ["Civic Data Hacknight", "Hackathon", "Island Hub", 5],
    ["Women in Product Circle", "Community", "Ikeja Labs", 7],
    ["No-Code Builder Camp", "Workshop", "Lekki Campus", 10],
    ["Campus Creator Summit", "Career", "UNILAG Annex", 14],
    ["Open Source Jam", "Hackathon", "Yaba Garage", 18],
    ["Startup Demo Night", "Networking", "Marina Arena", 24],
    ["Social Impact Forum", "Community", "Eko Hall", 30],
    ["Future of Work Expo", "Expo", "Landmark Centre", 40],
  ] as const;

  const created = [] as { id: string; title: string; status: EventStatus }[];

  for (const [i, row] of baseEvents.entries()) {
    const [title, category, location, offset] = row;
    const slug = `${title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")}-${i + 1}`;
    const status = offset < -2 ? EventStatus.PUBLISHED : EventStatus.PUBLISHED;
    const ev = await prisma.event.create({
      data: {
        title,
        slug,
        description: `${title} brings practitioners together for practical sessions, networking, and collaborative activities.`,
        date: daysFromNow(offset),
        time: i % 2 === 0 ? "6:00 PM" : "11:00 AM",
        location,
        category,
        organizer: "Twigzolupolus",
        notes: "Seeded demo event",
        imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865",
        status,
      },
    });
    created.push({ id: ev.id, title: ev.title, status });
  }

  await ensureCodes();

  const types: ChallengeType[] = ["QUIZ", "PHOTO", "CHECKIN", "SCAVENGER", "SOCIAL", "POLL", "TRIVIA", "REFERRAL"];
  const evidenceModes: EvidenceMode[] = ["TEXT", "PHOTO_UPLOAD", "SHORT_ANSWER", "URL"];

  const allEvents = await prisma.event.findMany({ orderBy: { date: "asc" } });

  for (const [i, event] of allEvents.entries()) {
    const base = 10 + i * 2;
    const shortAnswer = `answer-${i + 1}`;
    await prisma.challenge.createMany({
      data: [
        {
          eventId: event.id,
          title: `Featured Challenge #${i + 1}`,
          description: `Core challenge for ${event.title}`,
          type: types[i % types.length],
          evidenceMode: evidenceModes[i % evidenceModes.length],
          autoApproveAnswer: evidenceModes[i % evidenceModes.length] === "SHORT_ANSWER" ? shortAnswer : null,
          points: base + 10,
          enabled: true,
          isToday: true,
        },
        {
          eventId: event.id,
          title: `Social Boost #${i + 1}`,
          description: "Share your takeaway publicly.",
          type: "SOCIAL",
          evidenceMode: "URL",
          points: base + 5,
          enabled: true,
          isToday: false,
        },
        {
          eventId: event.id,
          title: `Photo Proof #${i + 1}`,
          description: "Upload photo evidence from the event floor.",
          type: "PHOTO",
          evidenceMode: "PHOTO_UPLOAD",
          points: base + 15,
          enabled: i % 2 === 0,
          isToday: false,
        },
      ],
    });

    await prisma.activity.create({ data: { eventId: event.id, type: "challenge", message: `Challenge set initialized for ${event.title}` } });
  }

  // Sample participants and stats for past events only
  const participants = ["JJ", "John Doe", "Ada", "Kemi", "Tobi", "Mina"];
  for (const name of participants) {
    await prisma.participant.create({ data: { id: `seed_${name.toLowerCase().replace(/\s+/g, "_")}`, name } });
  }

  const pastEvents = await prisma.event.findMany({ where: { date: { lt: daysFromNow(0) } }, include: { challenges: true } });

  for (const event of pastEvents) {
    const challs = event.challenges.slice(0, 2);
    for (const pName of participants.slice(0, 4)) {
      const pid = `seed_${pName.toLowerCase().replace(/\s+/g, "_")}`;
      for (const [idx, ch] of challs.entries()) {
        const approved = !(pName === "JJ" && idx === 1 && event.id.endsWith("a"));
        await prisma.challengeSubmission.upsert({
          where: { challengeId_participantId: { challengeId: ch.id, participantId: pid } },
          update: {
            participantName: pName,
            status: approved ? SubmissionStatus.APPROVED : SubmissionStatus.REJECTED,
            reviewNote: approved ? "Approved (seed)" : "Evidence mismatch (seed)",
            reviewedAt: new Date(),
            evidenceText: "seed evidence",
          },
          create: {
            challengeId: ch.id,
            eventId: event.id,
            participantId: pid,
            participantName: pName,
            status: approved ? SubmissionStatus.APPROVED : SubmissionStatus.REJECTED,
            reviewNote: approved ? "Approved (seed)" : "Evidence mismatch (seed)",
            reviewedAt: new Date(),
            evidenceText: "seed evidence",
          },
        });

        if (approved) {
          await prisma.pointEntry.upsert({
            where: { challengeId_participantId: { challengeId: ch.id, participantId: pid } },
            update: { points: ch.points },
            create: { eventId: event.id, challengeId: ch.id, participantId: pid, points: ch.points },
          });
          await prisma.activity.create({ data: { eventId: event.id, type: "approval", message: `${pName} approved for ${ch.title} (+${ch.points})` } });
        } else {
          await prisma.activity.create({ data: { eventId: event.id, type: "review", message: `${pName} denied for ${ch.title}: Evidence mismatch` } });
        }
      }
    }
  }

  console.log(`Seed complete: ${allEvents.length} events (past + upcoming) with varied challenges and sample leaderboard stats`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
