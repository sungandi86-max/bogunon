import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CalendarEntry } from "@/components/calendar/calendar-entry";
import type { EventRow } from "@/types/database";

const exerciseEvent: EventRow = {
  id: "exercise-event",
  user_id: "user",
  title: "레거시 운동 일정",
  area: "exercise",
  start_date: "2026-07-18",
  end_date: "2026-07-18",
  is_all_day: false,
  start_time: "19:00",
  end_time: "20:00",
  memo: null,
  description: null,
  created_at: "",
  updated_at: "",
};

describe("CalendarEntry", () => {
  it("does not offer move controls for legacy exercise events", () => {
    const onMove = vi.fn();
    const { container } = render(<CalendarEntry item={exerciseEvent} kind="event" onMove={onMove} />);

    expect(container.firstElementChild).toHaveAttribute("draggable", "false");
    expect(screen.queryByRole("button", { name: /날짜 변경/ })).not.toBeInTheDocument();
    fireEvent.dragStart(container.firstElementChild as Element);
    expect(onMove).not.toHaveBeenCalled();
  });
});
