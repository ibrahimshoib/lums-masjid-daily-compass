import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PrayerTimetable } from "@/components/PrayerTimetable";
import { calculateDailyPrayerSchedule } from "@/lib/prayer-times";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("live prayer timetable", () => {
  it("shows last night's actual Isha jamaat before dawn on a timetable-change day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-16T01:00:00+05:00"));
    const schedule = calculateDailyPrayerSchedule();
    expect(schedule.prayers.find((row) => row.name === "Isha")?.jamaat).toBe("7:15 PM");
    render(<PrayerTimetable schedule={schedule} />);
    const current = screen.getByRole("table").querySelector('[aria-current="time"]');
    expect(current).toHaveTextContent("Isha");
    expect(current).toHaveTextContent("From last night");
    expect(current).toHaveTextContent("7:30 PM");
    expect(current).not.toHaveTextContent("7:15 PM");
  });

  it("highlights at prayer start and advances the countdown at jamaat time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-07T11:46:59+05:00"));
    render(<PrayerTimetable schedule={calculateDailyPrayerSchedule()} />);
    const table = screen.getByRole("table");
    expect(table.querySelector('[aria-current="time"]')).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("Zuhr");
    expect(screen.getByText("Next jama’at starts in")).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("01Hours43Minutes01Seconds");
    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(table.querySelector('[aria-current="time"]')).toHaveTextContent("Zuhr");
    expect(screen.getByRole("status")).toHaveTextContent("Zuhr");
    expect(screen.getByRole("timer")).toHaveTextContent("01Hours43Minutes00Seconds");
    vi.setSystemTime(new Date("2026-11-07T13:29:59+05:00"));
    fireEvent.focus(window);
    expect(screen.getByRole("timer")).toHaveTextContent("00Hours00Minutes01Seconds");
    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(table.querySelector('[aria-current="time"]')).toHaveTextContent("Zuhr");
    expect(screen.getByRole("status")).toHaveTextContent("Asr");
    expect(screen.getByRole("timer")).toHaveTextContent("02Hours30Minutes00Seconds");
    expect(screen.getByRole("timer")).toHaveAttribute("aria-live", "off");
  });

  it("resyncs after suspension and leaves sunrise and nawafil unhighlighted", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-07T05:30:00+05:00"));
    render(<PrayerTimetable schedule={calculateDailyPrayerSchedule()} />);
    const table = screen.getByRole("table");
    expect(table.querySelector('[aria-current="time"]')).toHaveTextContent("Fajr");
    fireEvent.click(screen.getByRole("button", { name: "Other times" }));
    vi.setSystemTime(new Date("2026-11-07T06:43:00+05:00"));
    fireEvent(document, new Event("visibilitychange"));
    expect(table.querySelector('[aria-current="time"]')).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("Zuhr");
    expect(screen.getByRole("timer")).toHaveTextContent("06Hours47Minutes00Seconds");
  });

  it("shows tomorrow's Fajr and labels Isha from the previous night", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-15T22:00:00+05:00"));
    const { rerender } = render(<PrayerTimetable schedule={calculateDailyPrayerSchedule()} />);
    expect(screen.getByRole("status")).toHaveTextContent("FajrTomorrow");
    expect(screen.getByText(/Jamaat 6:00 AM/)).toBeInTheDocument();
    vi.setSystemTime(new Date("2026-11-16T00:00:00+05:00"));
    rerender(<PrayerTimetable schedule={calculateDailyPrayerSchedule()} />);
    fireEvent.focus(window);
    const current = screen.getByRole("table").querySelector('[aria-current="time"]');
    expect(current).toHaveTextContent("Isha");
    expect(current).toHaveTextContent("From last night");
    expect(screen.getByRole("status")).not.toHaveTextContent("Tomorrow");
  });
});

describe("Other times toggle", () => {
  it("reveals the three extra rows without Zawal and restores the compact timetable", () => {
    const schedule = calculateDailyPrayerSchedule(new Date("2026-11-07T07:00:00Z"));
    render(<PrayerTimetable schedule={schedule} />);
    const toggle = screen.getByRole("button", { name: "Other times" });
    const table = screen.getByRole("table");

    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(within(table).getAllByRole("row")).toHaveLength(7);
    for (const name of ["Tahajjud", "Ishraq", "Zawal", "Jummah"]) {
      expect(within(table).queryByText(name)).not.toBeInTheDocument();
    }

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(9);
    const names = [
      "Tahajjud",
      "Fajr",
      "Sunrise",
      "Ishraq",
      "Zuhr",
      "Jummah",
      "Asr",
      "Maghrib",
      "Isha",
    ];
    for (const [index, name] of names.entries()) {
      expect(within(rows[index]!).getByText(name)).toBeInTheDocument();
    }
    expect(rows[0]).toHaveClass("prayer-row--nafl");
    expect(rows[3]).toHaveClass("prayer-row--nafl");
    expect(rows[1]).not.toHaveClass("prayer-row--nafl");
    expect(rows[5]).toHaveClass("prayer-row--fard");
    expect(within(rows[5]!).getByText("1:30 PM")).toBeInTheDocument();
    expect(screen.queryByText(/Zawal|Solar noon/)).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(within(table).getAllByRole("row")).toHaveLength(7);
    expect(within(table).queryByText("Tahajjud")).not.toBeInTheDocument();
  });
});
