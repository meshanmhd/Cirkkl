import EventCard from "./EventCard";
import type { Event } from "@/data/events";

interface EventGridProps {
  events: Event[];
}

export default function EventGrid({ events }: EventGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
