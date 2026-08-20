import { describe, expect, it } from "vitest";

import { formatPracticalScheduleDate, isSafePracticalUrl, practicalScheduleCalendarDescription } from "@/lib/practical-schedules/domain";

describe("practical schedule domain", () => {
  it("allows only http and https links", () => {
    expect(isSafePracticalUrl("https://school.example/form")).toBe(true);
    expect(isSafePracticalUrl("http://school.example")).toBe(true);
    expect(isSafePracticalUrl("javascript:alert(1)")).toBe(false);
    expect(isSafePracticalUrl("data:text/html,bad")).toBe(false);
  });

  it("keeps date-less work as a first-class display state", () => {
    expect(formatPracticalScheduleDate(null)).toBe("날짜 미정");
    expect(formatPracticalScheduleDate("2026-05-14")).toBe("2026.05.14");
  });

  it("shares method and notes as the calendar description", () => {
    expect(practicalScheduleCalendarDescription("온라인 이수", "사전 확인")).toBe("온라인 이수\n사전 확인");
    expect(practicalScheduleCalendarDescription(null, null)).toBeNull();
  });
});
