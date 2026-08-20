import { describe, expect, it } from "vitest";

import { formatPracticalScheduleDate, isLinkablePracticalEvent, isSafePracticalUrl, practicalScheduleCalendarDescription } from "@/lib/practical-schedules/domain";
import type { EventRow } from "@/types/database";

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

  it("excludes linked, recurring, and exercise events from linking", () => {
    const base: EventRow = { id: "event", user_id: "user", title: "건강검진", area: "healthWork", start_date: "2026-05-14", end_date: "2026-05-14", is_all_day: true, start_time: null, end_time: null, memo: null, description: null, created_at: "", updated_at: "" };
    expect(isLinkablePracticalEvent(base)).toBe(true);
    expect(isLinkablePracticalEvent({ ...base, practical_schedule_id: "schedule" })).toBe(false);
    expect(isLinkablePracticalEvent({ ...base, recurrence_frequency: "monthly" })).toBe(false);
    expect(isLinkablePracticalEvent({ ...base, event_type: "workout" })).toBe(false);
    expect(isLinkablePracticalEvent({ ...base, area: "schoolSchedule", color_key: "yellow" })).toBe(false);
  });
});
