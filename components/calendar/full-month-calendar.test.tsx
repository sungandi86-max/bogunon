import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FullMonthCalendar } from "@/components/calendar/full-month-calendar";

describe("FullMonthCalendar", () => {
  it("marks the supplied current date on its calendar cell", () => {
    render(<FullMonthCalendar month="2026-07" today="2026-07-18" />);

    expect(screen.getByRole("gridcell", { name: "2026년 7월 18일, 일정 0개, 날짜 스티커 0개, 운동 0개" })).toHaveClass("is-today");
  });

  it("shows school, personal, and exercise records in the same date cell", () => {
    render(<FullMonthCalendar month="2026-07" today="2026-07-18" events={[
      { id: "event-school", user_id: "user", title: "방학식", area: "schoolSchedule", start_date: "2026-07-18", end_date: "2026-07-18", is_all_day: true, start_time: null, end_time: null, memo: null, description: null, created_at: "", updated_at: "" },
      { id: "event-personal", user_id: "user", title: "병원", area: "personal", start_date: "2026-07-18", end_date: "2026-07-18", is_all_day: false, start_time: "18:00", end_time: "19:00", memo: null, description: null, created_at: "", updated_at: "" },
    ]} schoolStickers={[{ id: "sticker", user_id: "user", sticker_key: "vacation-ceremony", sticker_date: "2026-07-18", end_date: null, label: "방학식", note: null, created_at: "", updated_at: "" }]} />);
    const cell = screen.getByRole("gridcell", { name: /2026년 7월 18일, 일정 2개, 날짜 스티커 1개/ });
    expect(cell).toHaveTextContent("학교");
    expect(cell).toHaveTextContent("개인");
    expect(cell).toHaveTextContent("방학식");
  });
});
