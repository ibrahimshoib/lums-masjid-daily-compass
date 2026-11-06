import { createServerFn } from "@tanstack/react-start";

export const getDailyPrayerSchedule = createServerFn({ method: "GET" }).handler(async () => {
  const { calculateDailyPrayerSchedule } = await import("@/lib/prayer-times");
  return calculateDailyPrayerSchedule();
});
