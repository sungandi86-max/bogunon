import { describe, expect, it } from "vitest";

import { nextScheduledEvent, sortTodayEvents } from "@/lib/briefing/mobile-home";
import type { EventRow } from "@/types/database";

const event = (id: string, title: string, startTime: string | null, area: EventRow["area"] = "schoolSchedule", date = "2026-07-18"): EventRow => ({
  id,
  user_id: "user-1",
  title,
  area,
  start_date: date,
  end_date: date,
  is_all_day: startTime === null,
  start_time: startTime,
  end_time: startTime,
  memo: null,
  description: null,
  created_at: "2026-07-18T00:00:00Z",
  updated_at: "2026-07-18T00:00:00Z",
});

describe("mobile home schedule", () => {
  it("sorts all-day first and timed events chronologically while excluding exercise events", () => {
    const values = [event("3", "저녁", "19:00"), event("1", "종일", null), event("2", "오후", "14:00"), event("4", "운동", "10:00", "exercise")];
    expect(sortTodayEvents(values).map((item) => item.id)).toEqual(["1", "2", "3"]);
  });

  it("returns the nearest future timed event and a Korean remaining-time label", () => {
    const values = [event("1", "지난 일정", "09:00"), event("2", "보건교육", "14:00"), event("3", "회의", "16:00")];
    expect(nextScheduledEvent(values, new Date("2026-07-18T11:20:00+09:00"))).toMatchObject({ event: { id: "2" }, remainingLabel: "2시간 40분 후" });
  });

  it("does not treat legacy exercise events as normal schedule counts", () => {
    const values = [event("1", "배드민턴", "19:00", "exercise")];
    expect(nextScheduledEvent(values, new Date("2026-07-18T11:20:00+09:00"))).toBeNull();
  });

  it("finds the nearest event on a later date when today has no remaining event", () => {
    const values = [event("1", "지난 일정", "09:00"), event("2", "내일 회의", "09:00", "schoolSchedule", "2026-07-19")];
    expect(nextScheduledEvent(values, new Date("2026-07-18T11:20:00+09:00"))).toMatchObject({ event: { id: "2" }, remainingLabel: "21시간 40분 후" });
  });
});
