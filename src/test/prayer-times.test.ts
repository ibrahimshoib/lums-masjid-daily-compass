import { afterEach, describe, expect, it, vi } from "vitest";

import { calculateDailyPrayerSchedule } from "@/lib/prayer-times";

const dailySchedule = (date: string) =>
  calculateDailyPrayerSchedule(new Date(`${date}T12:00:00+05:00`));

function clockMinutes(clock: string) {
  const [, hours, minutes, period] = /^(\d+):(\d+) (AM|PM)$/.exec(clock)!;
  return (Number(hours) % 12) * 60 + Number(minutes) + (period === "PM" ? 720 : 0);
}

afterEach(() => vi.unstubAllEnvs());

describe("LUMS Masjid jamaat timetable", () => {
  // Expected values independently transcribed from the supplied timetable card.
  const periods = [
    ["01-01", "6:20 AM", "4:00 PM", "7:15 PM"],
    ["01-16", "6:20 AM", "4:15 PM", "7:15 PM"],
    ["02-01", "6:10 AM", "4:30 PM", "7:30 PM"],
    ["02-16", "6:00 AM", "4:45 PM", "7:45 PM"],
    ["03-01", "5:40 AM", "4:45 PM", "8:00 PM"],
    ["03-16", "5:20 AM", "5:00 PM", "8:00 PM"],
    ["04-01", "5:00 AM", "5:00 PM", "8:15 PM"],
    ["04-16", "4:40 AM", "5:15 PM", "8:30 PM"],
    ["05-01", "4:30 AM", "5:15 PM", "8:45 PM"],
    ["05-16", "4:20 AM", "5:15 PM", "9:00 PM"],
    ["06-01", "4:20 AM", "5:30 PM", "9:15 PM"],
    ["06-16", "4:20 AM", "5:30 PM", "9:15 PM"],
    ["07-01", "4:30 AM", "5:30 PM", "9:15 PM"],
    ["07-16", "4:30 AM", "5:30 PM", "9:00 PM"],
    ["08-01", "4:40 AM", "5:15 PM", "9:00 PM"],
    ["08-16", "4:50 AM", "5:15 PM", "8:30 PM"],
    ["09-01", "5:00 AM", "5:00 PM", "8:15 PM"],
    ["09-16", "5:10 AM", "4:45 PM", "7:45 PM"],
    ["10-01", "5:20 AM", "4:30 PM", "7:30 PM"],
    ["10-16", "5:30 AM", "4:15 PM", "7:15 PM"],
    ["11-01", "5:40 AM", "4:00 PM", "7:00 PM"],
    ["11-16", "6:00 AM", "3:45 PM", "7:00 PM"],
    ["12-01", "6:10 AM", "3:45 PM", "7:00 PM"],
    ["12-16", "6:20 AM", "4:00 PM", "7:00 PM"],
  ] as const;

  it.each(periods)("uses the %s timetable throughout its half-month", (from, fajr, asr, isha) => {
    const [month, day] = from.split("-").map(Number) as [number, number];
    const lastDay = day === 1 ? 15 : new Date(2026, month, 0).getDate();
    for (const date of [from, `${String(month).padStart(2, "0")}-${lastDay}`]) {
      const schedule = dailySchedule(`2026-${date}`);
      const row = (name: string) => schedule.prayers.find((prayer) => prayer.name === name)!;
      expect(row("Fajr").jamaat).toBe(fajr);
      expect(row("Asr").jamaat).toBe(asr);
      expect(row("Isha").jamaat).toBe(isha);
      expect(row("Zuhr").jamaat).toBe("1:30 PM");
      expect(schedule.otherTimes.jummah.jamaat).toBe("1:30 PM");
      expect(row("Sunrise").jamaat).toBeNull();
    }
  });

  it("calculates Maghrib daily instead of using the printed sample sunset", () => {
    const first = dailySchedule("2026-11-01").prayers.find((row) => row.name === "Maghrib")!;
    const last = dailySchedule("2026-11-15").prayers.find((row) => row.name === "Maghrib")!;
    expect(clockMinutes(first.jamaat!) - clockMinutes(first.start)).toBe(5);
    expect(clockMinutes(last.jamaat!) - clockMinutes(last.start)).toBe(5);
    expect(first.jamaat).not.toBe(last.jamaat);
  });
});

describe("daily prayer calculations", () => {
  it("adds today's pre-Fajr Tahajjud, Ishraq, solar noon, and Friday jamaat", () => {
    const schedule = dailySchedule("2026-11-07");
    const { tahajjud, ishraq, zawal, jummah } = schedule.otherTimes;
    // 6 Nov sunset was 5:10 PM; the night ends at 7 Nov Fajr, 5:00 AM.
    // Its final third starts at 1:03 AM, not tomorrow's final third.
    expect(tahajjud.start).toBe("1:03 AM");
    expect(clockMinutes(tahajjud.start!)).toBeLessThan(clockMinutes(schedule.prayers[0]!.start));
    expect(clockMinutes(ishraq.start!) - clockMinutes(schedule.prayers[1]!.start)).toBe(20);
    expect(zawal.start).toBe("11:46 AM");
    expect(clockMinutes(schedule.prayers[2]!.start) - clockMinutes(zawal.start!)).toBe(1);
    expect(jummah.start).toBeNull();
    expect(jummah.jamaat).toBe("1:30 PM");
    expect([tahajjud.kind, ishraq.kind, zawal.kind, jummah.kind]).toEqual([
      "nafl",
      "nafl",
      "marker",
      "fard",
    ]);
  });

  it("keeps the extra times on the displayed date across seasons and year boundaries", () => {
    for (const date of ["2026-01-01", "2026-06-21", "2026-12-31", "2028-02-29"]) {
      const { prayers, otherTimes } = dailySchedule(date);
      expect(clockMinutes(otherTimes.tahajjud.start!)).toBeLessThan(
        clockMinutes(prayers[0]!.start),
      );
      expect(clockMinutes(otherTimes.ishraq.start!) - clockMinutes(prayers[1]!.start)).toBe(20);
      expect(clockMinutes(otherTimes.zawal.start!)).toBeLessThan(clockMinutes(prayers[2]!.start));
    }
  });

  it("calculates Karachi starts and Hanafi Asr for the mosque location", () => {
    const schedule = dailySchedule("2026-11-07");
    expect(schedule.prayers.map(({ name, start }) => [name, start])).toEqual([
      ["Fajr", "5:00 AM"],
      ["Sunrise", "6:23 AM"],
      ["Zuhr", "11:47 AM"],
      ["Asr", "3:31 PM"],
      ["Maghrib", "5:09 PM"],
      ["Isha", "6:32 PM"],
    ]);
    expect(schedule.prayers.find((row) => row.name === "Asr")?.note).toBe("Hanafi");
    expect(schedule.displayDate).toBe("Saturday, 7 November 2026");
  });

  it.each(["UTC", "America/Los_Angeles", "Asia/Tokyo"])(
    "uses Lahore's date and clock with a %s host",
    (zone) => {
      vi.stubEnv("TZ", zone);
      // Lahore is already on the 16th while UTC is still on the 15th.
      const schedule = calculateDailyPrayerSchedule(new Date("2026-11-15T19:00:00Z"));
      const { calculatedAt, ...actual } = schedule;
      const { calculatedAt: expectedClock, ...expected } = dailySchedule("2026-11-16");
      expect(actual).toEqual(expected);
      expect(calculatedAt).toBe("2026-11-15T19:00:00.000Z");
      expect(schedule.dateKey).toBe("2026-11-16");
      expect(schedule.prayers[0]?.jamaat).toBe("6:00 AM");
      expect(schedule.validUntil).toBe("2026-11-16T19:00:00.000Z");
    },
  );

  it("switches half-month periods exactly at Lahore midnight", () => {
    const before = calculateDailyPrayerSchedule(new Date("2026-11-15T18:59:59Z"));
    const after = calculateDailyPrayerSchedule(new Date("2026-11-15T19:00:00Z"));
    expect(before.dateKey).toBe("2026-11-15");
    expect(before.prayers[0]?.jamaat).toBe("5:40 AM");
    expect(after.dateKey).toBe("2026-11-16");
    expect(after.prayers[0]?.jamaat).toBe("6:00 AM");
  });

  it("handles leap day and the December-to-January rollover", () => {
    const leap = dailySchedule("2028-02-29");
    expect(leap.prayers[0]?.jamaat).toBe("6:00 AM");
    expect(leap.validUntil).toBe("2028-02-29T19:00:00.000Z");
    const endOfYear = dailySchedule("2026-12-31");
    const newYear = calculateDailyPrayerSchedule(new Date(endOfYear.validUntil));
    expect(newYear.dateKey).toBe("2027-01-01");
    expect(newYear.prayers.find((row) => row.name === "Isha")?.jamaat).toBe("7:15 PM");
  });

  it("keeps starts ordered and jamaats inside their prayer windows throughout a year", () => {
    for (let day = 0; day < 365; day++) {
      const date = new Date(Date.UTC(2026, 0, 1 + day, 7));
      const schedule = calculateDailyPrayerSchedule(date);
      const minutes = schedule.prayers.map((row) => clockMinutes(row.start));
      expect(minutes, schedule.dateKey).toEqual([...minutes].sort((a, b) => a - b));
      for (const [index, row] of schedule.prayers.entries()) {
        if (row.jamaat === null) continue;
        expect(clockMinutes(row.jamaat), `${schedule.dateKey} ${row.name}`).toBeGreaterThanOrEqual(
          minutes[index]!,
        );
        if (minutes[index + 1]) {
          expect(clockMinutes(row.jamaat), `${schedule.dateKey} ${row.name}`).toBeLessThan(
            minutes[index + 1]!,
          );
        }
      }
    }
  });
});
