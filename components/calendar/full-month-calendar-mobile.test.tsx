import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FullMonthCalendar } from "@/components/calendar/full-month-calendar";
import type { EventRow } from "@/types/database";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const workout: EventRow = {
  id: "workout-1",
  user_id: "user-1",
  title: "배드민턴 레슨",
  area: "exercise",
  event_type: "workout",
  event_details: { kind: "workout", workoutType: "배드민턴" },
  start_date: "2026-07-31",
  end_date: "2026-07-31",
  is_all_day: false,
  start_time: "19:40",
  end_time: "21:00",
  memo: null,
  description: null,
  created_at: "",
  updated_at: "",
};

describe("FullMonthCalendar mobile summary", () => {
  it("keeps the day header before desktop entries and the mobile summary", () => {
    render(<FullMonthCalendar events={[workout]} month="2026-07" today="2026-07-25" />);

    const cell = screen.getByRole("gridcell", { name: /2026-07-31, 일정 1개/ });
    const header = cell.querySelector(".full-calendar__day-header");
    const entries = cell.querySelector(".calendar-cell-items");
    const summary = cell.querySelector(".full-calendar__mobile-summary");

    expect(header).not.toBeNull();
    expect(entries).not.toBeNull();
    expect(summary).not.toBeNull();
    expect(header?.compareDocumentPosition(entries as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(entries?.compareDocumentPosition(summary as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(summary).toHaveTextContent("1개");
    expect(summary?.querySelector(".full-calendar__mobile-dot--workout")).not.toBeNull();
  });

  it("summarizes multiple items without putting clipped titles in the mobile summary", () => {
    const tournament: EventRow = {
      ...workout,
      id: "tournament-1",
      title: "성동구 오픈대회",
      event_type: "tournament",
      event_details: {
        kind: "tournament",
        tournamentName: "성동구 오픈대회",
        discipline: "혼합복식",
        partner: "",
        level: "",
        applicationStatus: "applied",
      },
    };

    render(<FullMonthCalendar events={[workout, tournament]} month="2026-07" today="2026-07-25" />);

    const summary = screen
      .getByRole("gridcell", { name: /2026-07-31, 일정 2개/ })
      .querySelector(".full-calendar__mobile-summary");
    expect(summary).toHaveTextContent("2개");
    expect(summary).not.toHaveTextContent("배드민턴");
    expect(summary).not.toHaveTextContent("성동구");
    expect(summary?.querySelector(".full-calendar__mobile-dot--workout")).not.toBeNull();
    expect(summary?.querySelector(".full-calendar__mobile-dot--tournament")).not.toBeNull();
  });
});
