import { describe, expect, it } from "vitest";

import { buildTimeGridItems, createSlotDraft, layoutTimedItems, moveTimedItemDraft, seoulDateTime } from "@/lib/calendar/time-grid";
import type { CalendarStickerRow, EventRow, TaskRow } from "@/types/database";

const event = (values: Partial<EventRow> = {}): EventRow => ({
  id: "event-1", user_id: "user", title: "기말고사", area: "schoolSchedule",
  start_date: "2026-07-22", end_date: "2026-07-22", is_all_day: false,
  start_time: "09:00:00", end_time: "10:00:00", location: null, color_key: "mint",
  recurrence_frequency: null, recurrence_source_id: null, recurrence_date: null,
  recurrence_generated_through: null, memo: null, description: null, created_at: "", updated_at: "", ...values,
});
const task = (values: Partial<TaskRow> = {}): TaskRow => ({
  id: "task-1", user_id: "user", title: "검진 서류 마감", area: "healthWork", status: "planned",
  priority: "normal", category: "other", scheduled_date: "2026-07-22", due_date: null,
  follow_up_date: null, memo: null, description: null, estimated_minutes: null, completed_at: null,
  recurrence_frequency: null, recurrence_source_id: null, recurrence_date: null,
  recurrence_generated_through: null, created_at: "", updated_at: "", ...values,
});
const sticker: CalendarStickerRow = { id: "sticker-1", user_id: "user", sticker_key: "vacation-ceremony", label: "방학식", sticker_date: "2026-07-22", end_date: null, note: null, created_at: "", updated_at: "" };

describe("time-grid display model", () => {
  it("classifies timed events while keeping legacy events, tasks, and stickers all-day", () => {
    const result = buildTimeGridItems({ dates: ["2026-07-22"], events: [event(), event({ id: "legacy", title: "기존 일정", start_time: null, end_time: null })], tasks: [task()], stickers: [sticker] });
    expect(result.timed.map((item) => item.title)).toEqual(["기말고사"]);
    expect(result.allDay.map((item) => [item.kind, item.title])).toEqual([["event", "기존 일정"], ["task", "검진 서류 마감"], ["sticker", "방학식"]]);
  });

  it("sorts timed events and gives overlapping events equal columns", () => {
    const items = buildTimeGridItems({ dates: ["2026-07-22"], events: [event({ id: "late", start_time: "09:30:00", end_time: "11:00:00" }), event({ id: "early", start_time: "09:00:00", end_time: "10:00:00" }), event({ id: "no-end", start_time: "12:00:00", end_time: null })], tasks: [], stickers: [] }).timed;
    const layout = layoutTimedItems(items);
    expect(layout.map((item) => item.id)).toEqual(["early", "late", "no-end"]);
    expect(layout.slice(0, 2).map((item) => [item.column, item.columnCount])).toEqual([[0, 2], [1, 2]]);
    expect(layout[2]).toMatchObject({ column: 0, columnCount: 1, endMinute: 780 });
  });

  it("recomputes items from already-filtered inputs", () => {
    const result = buildTimeGridItems({ dates: ["2026-07-22"], events: [event({ area: "personal" })], tasks: [], stickers: [] });
    expect(result.timed).toHaveLength(1);
    expect(buildTimeGridItems({ dates: ["2026-07-22"], events: [], tasks: [], stickers: [] }).timed).toHaveLength(0);
  });

  it("uses Seoul local time and creates a one-hour empty-slot draft", () => {
    expect(seoulDateTime(new Date("2026-07-21T15:30:00.000Z"))).toEqual({ date: "2026-07-22", minute: 30 });
    expect(createSlotDraft("2026-07-22", 14 * 60 + 30)).toMatchObject({ startDate: "2026-07-22", endDate: "2026-07-22", startTime: "14:30", endTime: "15:30", isAllDay: false });
  });

  it("preserves duration when a timed event is dragged", () => {
    expect(moveTimedItemDraft({ date: "2026-07-22", startMinute: 570, endMinute: 660 }, "2026-07-23", 14 * 60)).toEqual({ date: "2026-07-23", startTime: "14:00", endTime: "15:30" });
  });
});
