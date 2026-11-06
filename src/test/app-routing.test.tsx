import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("lists all six requested prayer names and identifies Asr as Hanafi", async () => {
    const { readFile } = await import("node:fs/promises");
    const homePage = await readFile(new URL("../routes/index.tsx", import.meta.url), "utf8");

    for (const name of ["Fajr", "Sunrise", "Zuhr", "Asr", "Maghrib", "Isha"]) {
      expect(homePage).toContain(`name: "${name}"`);
    }
    expect(homePage).toContain('note: "Hanafi"');
  });
});
