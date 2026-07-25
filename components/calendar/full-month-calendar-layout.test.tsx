import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FullMonthCalendar } from "@/components/calendar/full-month-calendar";
import type { EventRow } from "@/types/database";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

function calendarEvent(values: Partial<EventRow>): EventRow {
  return {
    id: "event",
    user_id: "user",
    title: "일정",
    area: "personal",
    start_date: "2026-07-31",
    end_date: "2026-07-31",
    is_all_day: true,
    start_time: null,
    end_time: null,
    memo: null,
    description: null,
    created_at: "",
    updated_at: "",
    ...values,
  };
}

function expectSeparatedCell(date: string, eventCount: number): HTMLElement {
  const cell = screen.getByRole("gridcell", {
    name: `${date}, 일정 ${eventCount}개, 업무 0개, 스티커 0개`,
  });
  expect(Array.from(cell.children, (node) => node.className)).toEqual([
    "full-calendar__day-header",
    "full-calendar__event-list",
  ]);
  expect(cell.firstElementChild).toContainElement(
    screen.getByRole("button", { name: `${date} 선택` }),
  );
  return cell;
}

describe("FullMonthCalendar day cell layout", () => {
  it("keeps the date header before an empty event list", () => {
    render(<FullMonthCalendar month="2026-07" today="2026-07-25" />);

    const cell = expectSeparatedCell("2026-07-30", 0);
    expect(cell.querySelector(".full-calendar__day-header")).toHaveTextContent("30");
    expect(cell.querySelector(".full-calendar__event-list")).toBeEmptyDOMElement();
  });

  it("keeps a timed event below the date header on July 31", () => {
    render(<FullMonthCalendar events={[
      calendarEvent({
        title: "배드민턴 레슨",
        is_all_day: false,
        start_time: "19:40",
        end_time: "20:40",
        event_type: "workout",
        event_details: { kind: "workout", workoutType: "배드민턴" },
      }),
    ]} month="2026-07" today="2026-07-25" />);

    const cell = expectSeparatedCell("2026-07-31", 1);
    expect(cell.querySelector(".full-calendar__day-header")).toHaveTextContent("31");
    expect(cell.querySelector(".full-calendar__event-list")).toHaveTextContent(
      "19:40 배드민턴 레슨",
    );
  });

  it("keeps multiple workout and tournament events inside the event list", () => {
    render(<FullMonthCalendar events={[
      calendarEvent({ id: "workout", title: "필라테스", event_type: "workout" }),
      calendarEvent({ id: "tournament", title: "오픈대회", event_type: "tournament" }),
    ]} month="2026-07" selectedDate="2026-07-31" today="2026-07-31" visibleItemLimit={2} />);

    const cell = expectSeparatedCell("2026-07-31", 2);
    expect(cell).toHaveClass("is-selected", "is-today");
    expect(cell.querySelector(".full-calendar__day-header")).toHaveTextContent("31");
    expect(cell.querySelector(".full-calendar__event-list")).toHaveTextContent("필라테스");
    expect(cell.querySelector(".full-calendar__event-list")).toHaveTextContent("오픈대회");
  });
});
