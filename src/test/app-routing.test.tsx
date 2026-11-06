import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { prayerSchedule } from "@/routes/index";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("lists all six requested prayers with Hanafi Asr, leaving unconfirmed times unset", () => {
    expect(prayerSchedule.map(({ name }) => name)).toEqual([
      "Fajr",
      "Sunrise",
      "Zuhr",
      "Asr",
      "Maghrib",
      "Isha",
    ]);
    expect(prayerSchedule.find(({ name }) => name === "Asr")?.note).toBe("Hanafi");
    expect(prayerSchedule.every(({ start, jamaat }) => start === "Being confirmed" && (jamaat === "Being confirmed" || jamaat === null))).toBe(true);
  });
});
