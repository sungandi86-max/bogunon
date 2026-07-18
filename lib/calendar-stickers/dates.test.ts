import { describe, expect, it } from "vitest";

import { calendarStickerRangeSchema, dateOnlySchema, rangesOverlap } from "@/lib/calendar-stickers/dates";

describe("calendar sticker date semantics", () => {
  it("accepts real date-only values and rejects timestamps or impossible dates", () => {
    expect(dateOnlySchema.safeParse("2026-07-18").success).toBe(true);
    expect(dateOnlySchema.safeParse("2026-07-18T00:00:00Z").success).toBe(false);
    expect(dateOnlySchema.safeParse("2026-02-29").success).toBe(false);
    expect(dateOnlySchema.safeParse("2028-02-29").success).toBe(true);
  });

  it("treats a missing end date as a one-day range", () => {
    expect(rangesOverlap("2026-07-18", null, "2026-07-18", "2026-07-18")).toBe(true);
    expect(rangesOverlap("2026-07-18", null, "2026-07-19", "2026-07-31")).toBe(false);
  });

  it("includes ranges touching either query boundary", () => {
    expect(rangesOverlap("2026-07-01", "2026-07-10", "2026-07-10", "2026-07-20")).toBe(true);
    expect(rangesOverlap("2026-07-20", "2026-07-25", "2026-07-10", "2026-07-20")).toBe(true);
  });

  it("rejects a range whose end precedes its start", () => {
    expect(calendarStickerRangeSchema.safeParse({ stickerDate: "2026-07-18", endDate: "2026-07-17" }).success).toBe(false);
    expect(calendarStickerRangeSchema.safeParse({ stickerDate: "2026-07-18", endDate: null }).success).toBe(true);
  });
});
