import { describe, expect, it } from "vitest";

import { calendarRange, dateSpan, searchCalendar, shiftCalendarPeriod } from "@/lib/calendar/smart-calendar";
import type { CalendarStickerRow, EventRow, TaskRow } from "@/types/database";

const event: EventRow = { id: "e1", user_id: "u1", title: "보건교육", area: "healthWork", start_date: "2026-07-18", end_date: "2026-07-18", is_all_day: false, start_time: "14:00:00", end_time: "15:00:00", location: "시청각실", memo: null, description: "교직원 교육", created_at: "", updated_at: "" };
const task: TaskRow = { id: "t1", user_id: "u1", title: "결과 보고", area: "healthWork", status: "planned", priority: "normal", category: "officialDocument", scheduled_date: "2026-07-20", due_date: null, follow_up_date: null, memo: "교육 결과", description: null, estimated_minutes: 30, completed_at: null, recurrence_frequency: null, recurrence_source_id: null, recurrence_date: null, recurrence_generated_through: null, created_at: "", updated_at: "" };
const sticker: CalendarStickerRow = { id: "s1", user_id: "u1", sticker_key: "vacation-ceremony", sticker_date: "2026-07-24", end_date: null, label: "방학식", note: null, created_at: "", updated_at: "" };
const examSticker: CalendarStickerRow = { id: "s2", user_id: "u1", sticker_key: "academic.midterm", sticker_date: "2026-07-25", end_date: null, label: "중간고사", note: null, created_at: "", updated_at: "" };

describe("smart calendar", () => {
  it("calculates Sunday-first weekly ranges by default and supports Monday-first ranges", () => {
    expect(calendarRange("2026-07-18", "week")).toEqual({ first: "2026-07-12", last: "2026-07-18" });
    expect(calendarRange("2026-07-18", "week", "monday")).toEqual({ first: "2026-07-13", last: "2026-07-19" });
    expect(shiftCalendarPeriod("2026-07-18", "week", 1)).toBe("2026-07-25");
    expect(shiftCalendarPeriod("2026-01-31", "month", 1)).toBe("2026-02-28");
  });

  it("returns inclusive date spans without timezone conversion", () => {
    expect(dateSpan("2026-07-18", "2026-07-20")).toEqual(["2026-07-18", "2026-07-19", "2026-07-20"]);
  });

  it("searches event location, task memo, and school sticker labels", () => {
    expect(searchCalendar("시청각실", [event], [task], [sticker])[0]?.kind).toBe("event");
    expect(searchCalendar("교육 결과", [event], [task], [sticker])[0]?.kind).toBe("task");
    expect(searchCalendar("방학식", [event], [task], [sticker])[0]?.kind).toBe("sticker");
    expect(searchCalendar("시험", [], [], [examSticker])[0]?.title).toBe("중간고사");
  });
});
