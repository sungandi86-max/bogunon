import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BriefingMonthOverview } from "@/components/briefing/briefing-month-overview";
import type { EventRow } from "@/types/database";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const event: EventRow = {
  id: "event-1",
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

describe("BriefingMonthOverview", () => {
  it("shows readable events below the month after selecting a date", () => {
    render(
      <BriefingMonthOverview
        events={[event]}
        month="2026-07"
        stickers={[]}
        today="2026-07-25"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "2026-07-31 선택" }));

    const list = screen.getByRole("region", { name: "7월 31일 금요일 일정" });
    expect(list).toHaveTextContent("19:40");
    expect(list).toHaveTextContent("배드민턴 레슨");
    expect(screen.getByRole("link", { name: /배드민턴 레슨/ })).toHaveAttribute(
      "href",
      "/calendar?date=2026-07-31&highlight=event%3Aevent-1",
    );
  });

  it("keeps a short empty state for a selected date without items", () => {
    render(
      <BriefingMonthOverview
        events={[]}
        month="2026-07"
        stickers={[]}
        today="2026-07-25"
      />,
    );

    expect(screen.getByRole("region", { name: "7월 25일 토요일 일정" })).toHaveTextContent(
      "등록된 일정이 없어요.",
    );
  });
});
