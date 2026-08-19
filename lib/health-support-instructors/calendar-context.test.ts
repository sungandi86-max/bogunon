import { describe, expect, it } from "vitest";

import { appendCalendarContextToDraft, calendarEventsForWorkDate } from "@/lib/health-support-instructors/calendar-context";
import type { EventRow } from "@/types/database";

const schoolEvent = {
  id: "calendar-event-1",
  user_id: "user-1",
  title: "보건 교육",
  area: "schoolSchedule",
  start_date: "2026-08-18",
  end_date: "2026-08-18",
  is_all_day: true,
  start_time: null,
  end_time: null,
  memo: null,
  description: "외부 일정 설명",
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
} satisfies EventRow;

describe("health support calendar context", () => {
  it("shows a matching calendar event exactly once when its date spans the selected work date", () => {
    const result = calendarEventsForWorkDate([schoolEvent, schoolEvent], "2026-08-18");

    expect(result).toEqual([schoolEvent]);
  });

  it("changes context when the selected work date changes", () => {
    const result = calendarEventsForWorkDate([schoolEvent], "2026-08-19");

    expect(result).toEqual([]);
  });

  it("appends plain calendar context to a draft without changing the source event", () => {
    const result = appendCalendarContextToDraft("기존 메모", schoolEvent);

    expect(result).toBe("기존 메모\n[일정 참고] 보건 교육");
    expect(schoolEvent.description).toBe("외부 일정 설명");
  });
});
