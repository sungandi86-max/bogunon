import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CalendarWorkspace } from "@/components/calendar/calendar-workspace";
import type { EventRow } from "@/types/database";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }), useSearchParams: () => new URLSearchParams("date=2026-07-18&view=month") }));

const workflow = { templates: [], templateChecklistItems: [], checklistItems: [], taskLinks: [], eventLinks: [], taskReminders: [], eventReminders: [] };
const event: EventRow = { id: "event-1", user_id: "user", title: "보건교육", area: "healthWork", start_date: "2026-07-18", end_date: "2026-07-18", is_all_day: false, start_time: "14:00:00", end_time: "15:00:00", location: "시청각실", memo: null, description: null, created_at: "", updated_at: "" };

describe("CalendarWorkspace", () => {
  beforeEach(() => replace.mockClear());

  it("navigates to weekly view and back to today through URL state", () => {
    render(<CalendarWorkspace events={[event]} exerciseLogs={[]} exerciseStickers={[]} initialDate="2026-07-18" initialView="month" stickers={[]} tasks={[]} today="2026-07-18" workflow={workflow} />);
    fireEvent.click(screen.getByRole("button", { name: "주간" }));
    expect(replace).toHaveBeenCalledWith(expect.stringContaining("view=week"));
    fireEvent.click(screen.getByRole("button", { name: "오늘 날짜로 이동" }));
    expect(replace).toHaveBeenCalledWith(expect.stringContaining("date=2026-07-18"));
  });

  it("searches event location and navigates to the result date", () => {
    render(<CalendarWorkspace events={[event]} exerciseLogs={[]} exerciseStickers={[]} initialDate="2026-07-18" initialView="month" stickers={[]} tasks={[]} today="2026-07-18" workflow={workflow} />);
    fireEvent.change(screen.getByRole("textbox", { name: "캘린더 검색" }), { target: { value: "시청각실" } });
    fireEvent.click(screen.getByRole("option", { name: /보건교육/ }));
    expect(replace).toHaveBeenCalledWith(expect.stringContaining("highlight=event%3Aevent-1"));
  });
});
