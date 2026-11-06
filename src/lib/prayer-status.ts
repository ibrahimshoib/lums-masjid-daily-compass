export type PrayerPeriod = {
  name: "Fajr" | "Zuhr" | "Asr" | "Maghrib" | "Isha";
  dateKey: string;
  startAt: string;
  endAt: string;
  startLabel: string;
  jamaatAt: string;
  jamaatLabel: string;
};

// Compare absolute instants; never parse the display labels or the visitor's
// local date. Fajr ends at sunrise, leaving a gap before Zuhr.
export function getPrayerStatus(periods: PrayerPeriod[], now: number) {
  const current =
    periods.find((period) => Date.parse(period.startAt) <= now && now < Date.parse(period.endAt)) ??
    null;
  const next = periods.find((period) => Date.parse(period.jamaatAt) > now) ?? null;
  return {
    current,
    next,
    remainingSeconds: next ? Math.ceil((Date.parse(next.jamaatAt) - now) / 1_000) : 0,
  };
}

export function countdownParts(seconds: number) {
  const remaining = Math.max(0, Math.ceil(seconds));
  return [Math.floor(remaining / 3_600), Math.floor((remaining % 3_600) / 60), remaining % 60].map(
    (part) => String(part).padStart(2, "0"),
  );
}
