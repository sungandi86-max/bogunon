import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FullWeekCalendar } from "@/components/calendar/full-week-calendar";
import { CalendarPreferencesProvider } from "@/components/calendar/calendar-preferences-provider";
import { CALENDAR_WEEK_START_STORAGE_KEY } from "@/lib/calendar/preferences";
import type { EventRow, TaskRow } from "@/types/database";

const event: EventRow = { id: "event-1", user_id: "user", title: "병원", area: "personal", start_date: "2026-07-18", end_date: "2026-07-18", is_all_day: false, start_time: "18:00:00", end_time: "19:00:00", memo: null, description: null, created_at: "", updated_at: "" };
const task: TaskRow = { id: "task-1", user_id: "user", title: "결과 보고", area: "healthWork", status: "planned", priority: "normal", category: "officialDocument", scheduled_date: "2026-07-18", due_date: null, follow_up_date: null, memo: null, description: null, estimated_minutes: null, completed_at: null, recurrence_frequency: null, recurrence_source_id: null, recurrence_date: null, recurrence_generated_through: null, created_at: "", updated_at: "" };

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe("FullWeekCalendar", () => {
  beforeEach(() => localStorage.clear());

  it("renders a Sunday-to-Saturday week by default and the selected day's personal event", () => {
    const { container } = render(<FullWeekCalendar date="2026-07-18" events={[event]} onDropDate={vi.fn()} onMove={vi.fn()} onSelectDate={vi.fn()} selectedDate="2026-07-18" stickers={[]} tasks={[]} today="2026-07-18" />);
    expect(container.querySelector(".smart-week__date")?.textContent).toContain("일12");
    expect(screen.getAllByRole("button", { name: /요일|월|화|수|목|금|토|일/ }).length).toBeGreaterThanOrEqual(7);
    expect(screen.getAllByText("병원").length).toBeGreaterThan(0);
    expect(screen.getAllByText("개인").length).toBeGreaterThan(0);
  });

  it("starts the visible week on Monday when the local preference requests it", () => {
    localStorage.setItem(CALENDAR_WEEK_START_STORAGE_KEY, "monday");
    const { container } = render(<CalendarPreferencesProvider><FullWeekCalendar date="2026-07-18" events={[]} onDropDate={vi.fn()} onMove={vi.fn()} onSelectDate={vi.fn()} selectedDate="2026-07-18" stickers={[]} tasks={[]} today="2026-07-18" /></CalendarPreferencesProvider>);
    expect(container.querySelector(".smart-week__date")?.textContent).toContain("월13");
  });

  it("renders health and academic stickers together through the existing weekly overflow lane", () => {
    render(<FullWeekCalendar date="2026-07-18" events={[event]} onDropDate={vi.fn()} onMove={vi.fn()} onSelectDate={vi.fn()} selectedDate="2026-07-18" stickers={[
      { id: "health-1", user_id: "user", sticker_key: "health.aed-check", sticker_date: "2026-07-18", end_date: null, label: "AED 점검", note: null, created_at: "", updated_at: "" },
      { id: "academic-1", user_id: "user", sticker_key: "academic.sports-day", sticker_date: "2026-07-18", end_date: null, label: "체육대회", note: null, created_at: "", updated_at: "" },
      { id: "personal-1", user_id: "user", sticker_key: "personal.hospital", sticker_date: "2026-07-18", end_date: null, label: "병원", note: null, created_at: "", updated_at: "" },
    ]} tasks={[task]} today="2026-07-18" />);

    expect(screen.getByRole("button", { name: "7월 18일 AED 점검 스티커 관리" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "7월 18일 병원 스티커 관리" })).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "7월 18일 체육대회 스티커 관리" })).not.toBeInTheDocument();
    expect(screen.getAllByText("병원").length).toBeGreaterThan(0);
    expect(screen.getAllByText("결과 보고").length).toBeGreaterThan(0);
  });
});
