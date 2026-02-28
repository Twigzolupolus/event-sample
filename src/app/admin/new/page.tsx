import EventForm from "@/components/EventForm";

export default function NewEventPage() {
  return (
    <div>
      <a href="/admin" className="mb-3 inline-block rounded-lg border border-white/20 px-3 py-1 text-sm text-slate-200">← Back to admin</a>
      <h1 className="mb-4 text-2xl font-bold">Create Event</h1>
      <EventForm />
    </div>
  );
}
