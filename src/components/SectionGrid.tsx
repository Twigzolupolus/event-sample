import EventCard from "@/components/EventCard";

type EventLite = {
  id: string;
  slug: string;
  title: string;
  date: Date;
  time: string;
  location: string;
  category: string;
  description: string;
  imageUrl: string | null;
};

export default function SectionGrid({ title, events }: { title: string; events: EventLite[] }) {
  if (!events.length) return null;
  return (
    <section className="mt-10">
      <h2 className="ui-h2 mb-4 text-2xl font-bold text-white">{title}</h2>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}
