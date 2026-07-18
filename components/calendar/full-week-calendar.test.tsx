import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FullWeekCalendar } from "@/components/calendar/full-week-calendar";
import type { EventRow } from "@/types/database";

const event: EventRow = { id: "event-1", user_id: "user", title: "병원", area: "personal", start_date: "2026-07-18", end_date: "2026-07-18", is_all_day: false, start_time: "18:00:00", end_time: "19:00:00", memo: null, description: null, created_at: "", updated_at: "" };

describe("FullWeekCalendar", () => {
  it("renders a Monday-to-Sunday week and the selected day's personal event", () => {
    render(<FullWeekCalendar date="2026-07-18" events={[event]} exerciseLogs={[]} exerciseStickers={[]} onDropDate={vi.fn()} onMove={vi.fn()} onSelectDate={vi.fn()} selectedDate="2026-07-18" stickers={[]} tasks={[]} today="2026-07-18" />);
    expect(screen.getAllByRole("button", { name: /요일|월|화|수|목|금|토|일/ }).length).toBeGreaterThanOrEqual(7);
    expect(screen.getAllByText("병원").length).toBeGreaterThan(0);
    expect(screen.getAllByText("개인").length).toBeGreaterThan(0);
  });
});
