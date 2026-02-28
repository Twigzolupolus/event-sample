import EventForm from "@/components/EventForm";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import AdminChallengeManager from "@/components/AdminChallengeManager";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, challenges, submissions] = await Promise.all([
    db.event.findUnique({ where: { id } }),
    db.challenge.findMany({ where: { eventId: id }, orderBy: { createdAt: "desc" } }),
    db.challengeSubmission.findMany({ where: { eventId: id, status: "PENDING" }, orderBy: { createdAt: "desc" }, include: { challenge: true } }),
  ]);
  if (!event) notFound();

  return (
    <div>
      <a href="/admin" className="mb-3 inline-block rounded-lg border border-white/20 px-3 py-1 text-sm text-slate-200">← Back to admin</a>
      <h1 className="mb-2 text-2xl font-bold">Edit Event</h1>
      <p className="mb-4 text-sm text-cyan-300">Event Code: {event.eventCode || "(none)"}</p>
      <EventForm
        id={event.id}
        initial={{
          title: event.title,
          slug: event.slug,
          description: event.description,
          date: event.date.toISOString().slice(0, 10),
          time: event.time,
          location: event.location,
          category: event.category,
          organizer: event.organizer,
          notes: event.notes,
          imageUrl: event.imageUrl ?? "",
          seoTitle: event.seoTitle ?? "",
          seoDescription: event.seoDescription ?? "",
          scheduledPublishAt: event.scheduledPublishAt ? new Date(event.scheduledPublishAt).toISOString().slice(0, 16) : "",
          status: event.status,
        }}
      />

      <AdminChallengeManager
        eventId={event.id}
        challenges={challenges as any}
        submissions={submissions.map((s) => ({ id: s.id, participantName: s.participantName, challengeTitle: s.challenge.title, evidenceText: s.evidenceText, evidenceUrl: s.evidenceUrl, evidenceFileUrl: s.evidenceFileUrl, status: s.status }))}
      />
    </div>
  );
}
