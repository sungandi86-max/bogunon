import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HealthSupportCalendarContext } from "@/components/health-support-instructors/calendar-context";
import type { HealthSupportWorkLog } from "@/lib/health-support-instructors/repository";
import type { EventRow } from "@/types/database";

const calendarEvent = {
  id: "calendar-event-1",
  user_id: "user-1",
  title: "<img src=x onerror=alert(1)>",
  area: "schoolSchedule",
  start_date: "2026-08-18",
  end_date: "2026-08-18",
  is_all_day: false,
  start_time: "09:00:00",
  end_time: "10:00:00",
  memo: null,
  description: "일정 설명",
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
} satisfies EventRow;

const recentLog = {
  id: "log-1",
  instructorId: "00000000-0000-4000-8000-000000000001",
  date: "2026-08-11",
  startTime: "09:00:00",
  endTime: "12:30:00",
  note: null,
} satisfies HealthSupportWorkLog;

describe("HealthSupportCalendarContext", () => {
  it("renders one matching event as plain text and appends it only to the unsaved note draft", () => {
    const onNoteChange = vi.fn();
    const onTimeChange = vi.fn();
    render(<HealthSupportCalendarContext events={[calendarEvent, calendarEvent]} note="기존 메모" onNoteChange={onNoteChange} onTimeChange={onTimeChange} recentLogs={[recentLog]} selectedDate="2026-08-18" />);

    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "비고에 추가" }));

    expect(onNoteChange).toHaveBeenCalledWith("기존 메모\n[일정 참고] <img src=x onerror=alert(1)>");
    expect(onTimeChange).not.toHaveBeenCalled();
  });

  it("fills an unsaved time draft from a recent record without calling a persistence action", () => {
    const onNoteChange = vi.fn();
    const onTimeChange = vi.fn();
    render(<HealthSupportCalendarContext events={[]} note="" onNoteChange={onNoteChange} onTimeChange={onTimeChange} recentLogs={[recentLog]} selectedDate="2026-08-18" />);

    fireEvent.click(screen.getByRole("button", { name: "최근 시간 재사용" }));

    expect(onTimeChange).toHaveBeenCalledWith({ endTime: "12:30", startTime: "09:00" });
    expect(onNoteChange).not.toHaveBeenCalled();
  });
});
