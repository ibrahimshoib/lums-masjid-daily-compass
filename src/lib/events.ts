const recurringEvents = [
  {
    id: "weekly-spiritual-talk",
    title: "Weekly Spiritual Talk",
    weekday: 4,
    recurrence: "Every Thursday",
    timing: "Post Isha",
  },
  {
    id: "seerah-circle",
    title: "Seerah Circle",
    weekday: 1,
    recurrence: "Every Monday",
    timing: "Post Maghrib",
  },
] as const;

export type UpcomingEvent = ReturnType<typeof calculateUpcomingEvents>[number];

// dateKey is the Lahore calendar date already supplied by the prayer server
// function. Use UTC only for calendar arithmetic, never the visitor's timezone.
// No exact event start/end was supplied, so today's event remains listed until
// Lahore midnight; we don't treat the start of jamaat as the start of the talk.
export function calculateUpcomingEvents(dateKey: string) {
  const today = new Date(`${dateKey}T00:00:00Z`);
  return recurringEvents
    .map((event) => {
      const daysUntil = (event.weekday - today.getUTCDay() + 7) % 7;
      const date = new Date(today.getTime() + daysUntil * 86_400_000);
      return {
        id: event.id,
        title: event.title,
        recurrence: event.recurrence,
        timing: event.timing,
        dateKey: date.toISOString().slice(0, 10),
        day: new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "2-digit" }).format(date),
        month: new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "short" }).format(date),
        displayDate: new Intl.DateTimeFormat("en-GB", {
          timeZone: "UTC",
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(date),
      };
    })
    .sort((first, second) => first.dateKey.localeCompare(second.dateKey));
}
