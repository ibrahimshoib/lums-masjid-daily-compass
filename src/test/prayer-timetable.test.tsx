import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PrayerTimetable } from "@/components/PrayerTimetable";
import { calculateDailyPrayerSchedule } from "@/lib/prayer-times";

afterEach(cleanup);

describe("Other times toggle", () => {
  it("reveals all four extra rows in order and restores the compact timetable", () => {
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
    expect(rows).toHaveLength(10);
    const names = [
      "Tahajjud",
      "Fajr",
      "Sunrise",
      "Ishraq",
      "Zawal",
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
    expect(rows[6]).toHaveClass("prayer-row--fard");
    expect(within(rows[6]!).getByText("1:30 PM")).toBeInTheDocument();
    expect(screen.getByText("Solar noon · no prayer")).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(within(table).getAllByRole("row")).toHaveLength(7);
    expect(within(table).queryByText("Tahajjud")).not.toBeInTheDocument();
  });
});
