import type { UpcomingEvent } from "@/lib/events";

export function UpcomingEvents({ events }: { events: UpcomingEvent[] }) {
  return (
    <ol className="event-list" aria-label="Upcoming events">
      {events.map((event) => (
        <li className="event-item" key={event.id}>
          <time className="event-date" dateTime={event.dateKey} aria-label={event.displayDate}>
            <span className="event-day">{event.day}</span>
            <span className="event-month">{event.month}</span>
          </time>
          <div className="event-copy">
            <h3>{event.title}</h3>
            <p className="event-timing">
              {event.recurrence} <span aria-hidden="true">·</span> {event.timing}
            </p>
            <p className="event-next">Next gathering · {event.displayDate}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
