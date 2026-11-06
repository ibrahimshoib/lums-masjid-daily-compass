import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UpcomingEvents } from "@/components/UpcomingEvents";
import { calculateUpcomingEvents } from "@/lib/events";
import { calculateDailyPrayerSchedule } from "@/lib/prayer-times";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("weekly event occurrences", () => {
  it.each([
    ["2026-11-08", "seerah-circle", "2026-11-09", "2026-11-12"],
    ["2026-11-09", "seerah-circle", "2026-11-09", "2026-11-12"],
    ["2026-11-10", "weekly-spiritual-talk", "2026-11-12", "2026-11-16"],
    ["2026-11-12", "weekly-spiritual-talk", "2026-11-12", "2026-11-16"],
    ["2026-11-13", "seerah-circle", "2026-11-16", "2026-11-19"],
    ["2026-12-31", "weekly-spiritual-talk", "2026-12-31", "2027-01-04"],
    ["2028-02-29", "weekly-spiritual-talk", "2028-03-02", "2028-03-06"],
  ])("sorts the nearest occurrences from %s", (today, firstId, firstDate, secondDate) => {
    const events = calculateUpcomingEvents(today);
    expect(events).toHaveLength(2);
    expect(events[0]?.id).toBe(firstId);
    expect(events.map((event) => event.dateKey)).toEqual([firstDate, secondDate]);
  });

  it.each(["UTC", "America/Los_Angeles", "Asia/Tokyo"])(
    "uses the Lahore date even on a %s host",
    (zone) => {
      vi.stubEnv("TZ", zone);
      // Just before and after Lahore midnight, Monday becomes Tuesday.
      const before = calculateDailyPrayerSchedule(new Date("2026-11-09T18:59:59Z"));
      const after = calculateDailyPrayerSchedule(new Date("2026-11-09T19:00:00Z"));
      expect(calculateUpcomingEvents(before.dateKey)[0]?.id).toBe("seerah-circle");
      expect(calculateUpcomingEvents(after.dateKey)[0]?.id).toBe("weekly-spiritual-talk");
      expect(calculateUpcomingEvents(after.dateKey)[1]?.dateKey).toBe("2026-11-16");
    },
  );

  it("renders Sunday's Monday gathering first, with the requested post-prayer labels", () => {
    render(<UpcomingEvents events={calculateUpcomingEvents("2026-11-08")} />);
    const items = within(screen.getByRole("list", { name: "Upcoming events" })).getAllByRole(
      "listitem",
    );
    expect(within(items[0]!).getByRole("heading")).toHaveTextContent("Seerah Circle");
    expect(within(items[0]!).getByText(/^Monday/)).toHaveTextContent("Monday · Post Maghrib");
    expect(within(items[0]!).getByText("Imran Haider")).toBeInTheDocument();
    expect(items[0]?.querySelector("time")).toHaveAttribute("datetime", "2026-11-09");
    expect(within(items[1]!).getByRole("heading")).toHaveTextContent("Weekly Spiritual Talk");
    expect(within(items[1]!).getByText(/^Thursday/)).toHaveTextContent("Thursday · Post Isha");
    expect(within(items[1]!).getByText("Dr. Zaid Saeed Khan")).toBeInTheDocument();
    expect(items[1]?.querySelector("time")).toHaveAttribute("datetime", "2026-11-12");
    expect(screen.queryByText(/Next gathering/)).not.toBeInTheDocument();
  });
});
