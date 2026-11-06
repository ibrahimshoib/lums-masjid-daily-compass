import { CalculationMethod, Coordinates, Madhab, PrayerTimes, SunnahTimes } from "adhan";
import type { PrayerPeriod } from "@/lib/prayer-status";

export const PRAYER_TIME_ZONE = "Asia/Karachi";

// LUMS mosque coordinates, listed in the campus solar-generation application:
// https://nepra.org.pk/Admission%20Notices/2023/05%20May/LPM%20filed%20by%20Nizam%20Power.PDF
const coordinates = new Coordinates(31.469381, 74.409251);

// Transcribed from the two sides of the LUMS Masjid Prayer Timings card.
// Each row applies from the 1st or 16th until the next row, repeating annually.
// Times use a 24-hour clock in Lahore. The card's sample sunsets are deliberately
// omitted: Maghrib jamaat follows the actual day's calculated sunset + 5 minutes.
const jamaatTimetable = [
  //                 Fajr     Asr      Isha
  { from: "01-01", fajr: "06:20", asr: "16:00", isha: "19:15" },
  { from: "01-16", fajr: "06:20", asr: "16:15", isha: "19:15" },
  { from: "02-01", fajr: "06:10", asr: "16:30", isha: "19:30" },
  { from: "02-16", fajr: "06:00", asr: "16:45", isha: "19:45" },
  { from: "03-01", fajr: "05:40", asr: "16:45", isha: "20:00" },
  { from: "03-16", fajr: "05:20", asr: "17:00", isha: "20:00" },
  { from: "04-01", fajr: "05:00", asr: "17:00", isha: "20:15" },
  { from: "04-16", fajr: "04:40", asr: "17:15", isha: "20:30" },
  { from: "05-01", fajr: "04:30", asr: "17:15", isha: "20:45" },
  { from: "05-16", fajr: "04:20", asr: "17:15", isha: "21:00" },
  { from: "06-01", fajr: "04:20", asr: "17:30", isha: "21:15" },
  { from: "06-16", fajr: "04:20", asr: "17:30", isha: "21:15" },
  { from: "07-01", fajr: "04:30", asr: "17:30", isha: "21:15" },
  { from: "07-16", fajr: "04:30", asr: "17:30", isha: "21:00" },
  { from: "08-01", fajr: "04:40", asr: "17:15", isha: "21:00" },
  { from: "08-16", fajr: "04:50", asr: "17:15", isha: "20:30" },
  { from: "09-01", fajr: "05:00", asr: "17:00", isha: "20:15" },
  { from: "09-16", fajr: "05:10", asr: "16:45", isha: "19:45" },
  { from: "10-01", fajr: "05:20", asr: "16:30", isha: "19:30" },
  { from: "10-16", fajr: "05:30", asr: "16:15", isha: "19:15" },
  { from: "11-01", fajr: "05:40", asr: "16:00", isha: "19:00" },
  { from: "11-16", fajr: "06:00", asr: "15:45", isha: "19:00" },
  { from: "12-01", fajr: "06:10", asr: "15:45", isha: "19:00" },
  { from: "12-16", fajr: "06:20", asr: "16:00", isha: "19:00" },
] as const;

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: PRAYER_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: PRAYER_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export type PrayerRow = {
  name: string;
  note?: string;
  start: string;
  jamaat: string | null;
};

export type OtherTimeRow = Omit<PrayerRow, "start"> & {
  start: string | null;
  detail: string;
  kind: "nafl" | "marker" | "fard";
};

export type DailyPrayerSchedule = ReturnType<typeof calculateDailyPrayerSchedule>;

export function calculateDailyPrayerSchedule(now = new Date()) {
  const parts = dateFormatter.formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)!.value;
  const year = Number(part("year"));
  const month = Number(part("month"));
  const day = Number(part("day"));
  const dateKey = `${part("year")}-${part("month")}-${part("day")}`;
  const monthDay = `${part("month")}-${part("day")}`;
  const timetable = jamaatTimetable.filter((row) => row.from <= monthDay).at(-1)!;

  const parameters = CalculationMethod.Karachi();
  parameters.madhab = Madhab.Hanafi;
  // Adhan expects local calendar fields and returns absolute UTC instants.
  // Supply the Lahore calendar date explicitly, independent of the host's zone.
  const times = new PrayerTimes(coordinates, new Date(year, month - 1, day), parameters);
  const jamaat = (clock: string) => timeFormatter.format(new Date(`${dateKey}T${clock}:00+05:00`));

  // Use last night's sunset so this is the last third BEFORE today's Fajr,
  // rather than tomorrow morning's Tahajjud (SunnahTimes uses the next Fajr).
  const previousDay = new PrayerTimes(coordinates, new Date(year, month - 1, day - 1), parameters);
  const tahajjud = new SunnahTimes(previousDay).lastThirdOfTheNight;
  const ishraq = new Date(times.sunrise.getTime() + 20 * 60_000);
  // Dhuhr includes the method's safety adjustment after solar transit. Remove
  // that adjustment to show Zawal as solar noon, not as another prayer start.
  const dhuhrAdjustment = parameters.methodAdjustments.dhuhr + parameters.adjustments.dhuhr;
  const solarNoon = new Date(times.dhuhr.getTime() - dhuhrAdjustment * 60_000);
  const otherTimes: Record<"tahajjud" | "ishraq" | "zawal" | "jummah", OtherTimeRow> = {
    tahajjud: {
      name: "Tahajjud",
      detail: "Last third begins",
      kind: "nafl",
      start: timeFormatter.format(tahajjud),
      jamaat: null,
    },
    ishraq: {
      name: "Ishraq",
      detail: "20 min after sunrise",
      kind: "nafl",
      start: timeFormatter.format(ishraq),
      jamaat: null,
    },
    zawal: {
      name: "Zawal",
      detail: "Solar noon · no prayer",
      kind: "marker",
      start: timeFormatter.format(solarNoon),
      jamaat: null,
    },
    jummah: {
      name: "Jummah",
      detail: "Friday jamaat",
      kind: "fard",
      start: null,
      jamaat: jamaat("13:30"),
    },
  };

  const prayers: PrayerRow[] = [
    { name: "Fajr", start: timeFormatter.format(times.fajr), jamaat: jamaat(timetable.fajr) },
    { name: "Sunrise", start: timeFormatter.format(times.sunrise), jamaat: null },
    { name: "Zuhr", start: timeFormatter.format(times.dhuhr), jamaat: jamaat("13:30") },
    {
      name: "Asr",
      note: "Hanafi",
      start: timeFormatter.format(times.asr),
      jamaat: jamaat(timetable.asr),
    },
    {
      name: "Maghrib",
      start: timeFormatter.format(times.maghrib),
      jamaat: timeFormatter.format(new Date(times.sunset.getTime() + 5 * 60_000)),
    },
    { name: "Isha", start: timeFormatter.format(times.isha), jamaat: jamaat(timetable.isha) },
  ];

  const previousDateKey = new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10);
  const tomorrowDateKey = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
  const tomorrow = new PrayerTimes(coordinates, new Date(year, month - 1, day + 1), parameters);
  const timetableFor = (key: string) =>
    jamaatTimetable.filter((row) => row.from <= key.slice(5)).at(-1)!;
  const jamaatInstant = (key: string, clock: string) => new Date(`${key}T${clock}:00+05:00`);
  const period = (
    name: PrayerPeriod["name"],
    key: string,
    start: Date,
    end: Date,
    jamaatTime: Date,
  ): PrayerPeriod => ({
    name,
    dateKey: key,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    startLabel: timeFormatter.format(start),
    jamaatAt: jamaatTime.toISOString(),
    jamaatLabel: timeFormatter.format(jamaatTime),
  });
  const timeline: PrayerPeriod[] = [
    period(
      "Isha",
      previousDateKey,
      previousDay.isha,
      times.fajr,
      jamaatInstant(previousDateKey, timetableFor(previousDateKey).isha),
    ),
    period("Fajr", dateKey, times.fajr, times.sunrise, jamaatInstant(dateKey, timetable.fajr)),
    period("Zuhr", dateKey, times.dhuhr, times.asr, jamaatInstant(dateKey, "13:30")),
    period("Asr", dateKey, times.asr, times.maghrib, jamaatInstant(dateKey, timetable.asr)),
    period(
      "Maghrib",
      dateKey,
      times.maghrib,
      times.isha,
      new Date(times.sunset.getTime() + 5 * 60_000),
    ),
    period("Isha", dateKey, times.isha, tomorrow.fajr, jamaatInstant(dateKey, timetable.isha)),
    period(
      "Fajr",
      tomorrowDateKey,
      tomorrow.fajr,
      tomorrow.sunrise,
      jamaatInstant(tomorrowDateKey, timetableFor(tomorrowDateKey).fajr),
    ),
  ];

  return {
    calculatedAt: now.toISOString(),
    dateKey,
    displayDate: new Intl.DateTimeFormat("en-GB", {
      timeZone: PRAYER_TIME_ZONE,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(now),
    // Pakistan uses UTC+05:00. Expire at the next Lahore midnight, including
    // month/year boundaries, so a page left open never keeps yesterday's times.
    validUntil: new Date(Date.parse(`${dateKey}T00:00:00+05:00`) + 86_400_000).toISOString(),
    prayers,
    otherTimes,
    timeline,
  };
}
