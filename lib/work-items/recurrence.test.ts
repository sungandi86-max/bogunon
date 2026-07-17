import { describe, expect, it } from "vitest";

import { occurrenceDatesThrough } from "@/lib/work-items/recurrence";

describe("occurrenceDatesThrough", () => {
  it("creates each missing daily occurrence after the anchor", () => {
    expect(occurrenceDatesThrough("2026-07-17", "2026-07-20", "daily")).toEqual([
      "2026-07-18",
      "2026-07-19",
      "2026-07-20",
    ]);
  });

  it("creates weekly occurrences on the anchor weekday", () => {
    expect(occurrenceDatesThrough("2026-07-17", "2026-08-07", "weekly")).toEqual([
      "2026-07-24",
      "2026-07-31",
      "2026-08-07",
    ]);
  });

  it("skips months that do not contain the anchor day", () => {
    expect(occurrenceDatesThrough("2026-01-31", "2026-05-31", "monthly")).toEqual([
      "2026-03-31",
      "2026-05-31",
    ]);
  });

  it("skips non-leap years for a February 29 yearly task", () => {
    expect(occurrenceDatesThrough("2024-02-29", "2030-12-31", "yearly")).toEqual([
      "2028-02-29",
    ]);
  });

  it("continues after the recorded generation boundary without recreating deleted dates", () => {
    expect(occurrenceDatesThrough("2026-07-19", "2026-07-21", "daily")).toEqual([
      "2026-07-20",
      "2026-07-21",
    ]);
  });
});
