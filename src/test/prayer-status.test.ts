import { describe, expect, it } from "vitest";

import { countdownParts, getPrayerStatus } from "@/lib/prayer-status";
import { calculateDailyPrayerSchedule } from "@/lib/prayer-times";

const schedule = calculateDailyPrayerSchedule(new Date("2026-11-07T12:00:00+05:00"));

describe("current and next prayer", () => {
  it.each([
    ["01:00:00", "Isha", "Fajr"],
    ["04:59:59", "Isha", "Fajr"],
    ["05:00:00", "Fajr", "Fajr"],
    ["05:39:59", "Fajr", "Fajr"],
    ["05:40:00", "Fajr", "Zuhr"],
    ["06:22:59", "Fajr", "Zuhr"],
    ["06:23:00", null, "Zuhr"],
    ["11:46:59", null, "Zuhr"],
    ["11:47:00", "Zuhr", "Zuhr"],
    ["13:30:00", "Zuhr", "Asr"],
    ["15:31:00", "Asr", "Asr"],
    ["16:00:00", "Asr", "Maghrib"],
    ["17:09:00", "Maghrib", "Maghrib"],
    ["17:14:00", "Maghrib", "Isha"],
    ["18:32:00", "Isha", "Isha"],
    ["19:00:00", "Isha", "Fajr"],
    ["23:59:59", "Isha", "Fajr"],
  ])("at %s highlights %s and counts toward %s", (clock, current, next) => {
    const status = getPrayerStatus(schedule.timeline, Date.parse(`2026-11-07T${clock}+05:00`));
    expect(status.current?.name ?? null).toBe(current);
    expect(status.next?.name).toBe(next);
    expect(status.remainingSeconds).toBeGreaterThan(0);
  });

  it("uses tomorrow's calculated Fajr and the next half-month's jamaat", () => {
    const today = calculateDailyPrayerSchedule(new Date("2026-11-15T20:00:00+05:00"));
    const tomorrow = calculateDailyPrayerSchedule(new Date("2026-11-16T08:00:00+05:00"));
    const status = getPrayerStatus(today.timeline, Date.parse(today.calculatedAt));
    expect(status.next?.dateKey).toBe("2026-11-16");
    expect(status.next?.startLabel).toBe(tomorrow.prayers[0]?.start);
    expect(status.next?.jamaatLabel).toBe("6:00 AM");
    expect(status.next?.jamaatAt).toBe("2026-11-16T01:00:00.000Z");
    expect(today.prayers[0]?.jamaat).toBe("5:40 AM");
    expect(
      getPrayerStatus(tomorrow.timeline, Date.parse("2026-11-16T00:00:00+05:00")).current?.name,
    ).toBe("Isha");
  });

  it("rolls tomorrow's prayer date and jamaat across a year boundary", () => {
    const today = calculateDailyPrayerSchedule(new Date("2026-12-31T23:00:00+05:00"));
    const next = getPrayerStatus(today.timeline, Date.parse(today.calculatedAt)).next;
    expect(next?.name).toBe("Fajr");
    expect(next?.dateKey).toBe("2027-01-01");
    expect(next?.jamaatLabel).toBe("6:20 AM");
  });

  it("rounds remaining fractions up and advances at the precise jamaat time", () => {
    const boundary = Date.parse("2026-11-07T16:00:00+05:00");
    expect(getPrayerStatus(schedule.timeline, boundary - 1).remainingSeconds).toBe(1);
    const after = getPrayerStatus(schedule.timeline, boundary);
    expect(after.current?.name).toBe("Asr");
    expect(after.next?.name).toBe("Maghrib");
    expect(countdownParts(3_661)).toEqual(["01", "01", "01"]);
    expect(countdownParts(-1)).toEqual(["00", "00", "00"]);
  });
});
