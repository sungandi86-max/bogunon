import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TimeGridCalendar } from "@/components/calendar/time-grid-calendar";
import type { EventRow } from "@/types/database";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/(app)/work-item-actions", () => ({ moveCalendarEventTimeAction: vi.fn(async () => ({ status: "success" })) }));

const event: EventRow = { id: "event-1", user_id: "user", title: "기말고사", area: "schoolSchedule", start_date: "2026-07-22", end_date: "2026-07-22", is_all_day: false, start_time: "09:00:00", end_time: "10:00:00", location: null, color_key: "mint", recurrence_frequency: null, recurrence_source_id: null, recurrence_date: null, recurrence_generated_through: null, memo: null, description: null, created_at: "", updated_at: "" };

describe("TimeGridCalendar", () => {
  it("opens a default event draft from the full empty slot", () => {
    const onSelectSlot = vi.fn();
    render(<TimeGridCalendar date="2026-07-22" events={[event]} mode="day" onSelectDate={vi.fn()} onSelectItem={vi.fn()} onSelectSlot={onSelectSlot} selectedDate="2026-07-22" stickers={[]} tasks={[]} today="2026-07-22" />);
    fireEvent.click(screen.getByRole("button", { name: "2026-07-22 14:00 일정 추가" }));
    expect(onSelectSlot).toHaveBeenCalledWith("2026-07-22", 840);
  });

  it("connects an event click to detail selection", () => {
    const onSelectItem = vi.fn();
    render(<TimeGridCalendar date="2026-07-22" events={[event]} mode="week" onSelectDate={vi.fn()} onSelectItem={onSelectItem} onSelectSlot={vi.fn()} selectedDate="2026-07-22" stickers={[]} tasks={[]} today="2026-07-22" />);
    fireEvent.click(screen.getByRole("button", { name: /기말고사/ }));
    expect(onSelectItem).toHaveBeenCalledWith(expect.objectContaining({ id: "event-1", date: "2026-07-22" }));
  });
});
