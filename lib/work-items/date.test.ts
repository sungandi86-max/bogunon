import { describe, expect, it } from "vitest";

import { formatSeoulDateTime, monthRange, todayInSeoul } from "@/lib/work-items/date";

describe("work item dates", () => {
  it("uses the Seoul calendar date", () => {
    expect(todayInSeoul(new Date("2026-07-16T15:30:00Z"))).toBe("2026-07-17");
  });

  it("returns the exact month range", () => {
    expect(monthRange("2028-02-10")).toEqual({ first: "2028-02-01", last: "2028-02-29" });
  });

  it("formats timestamps deterministically in the Seoul timezone", () => {
    // Given
    const timestamp = "2026-07-17T15:09:05.000Z";

    // When
    const result = formatSeoulDateTime(timestamp);

    // Then
    expect(result).toBe("2026. 07. 18. 00:09:05");
  });
});
