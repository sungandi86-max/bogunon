import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { EventRow } from "@/types/database";
import { PracticalScheduleWorkspace } from "@/components/practical-schedules/practical-schedule-workspace";

vi.mock("@/app/(app)/practical-schedules/actions", () => ({
  deletePracticalScheduleAction: vi.fn(),
  linkExistingEventAction: vi.fn(),
  savePracticalScheduleAction: vi.fn(),
}));

const event: EventRow = {
  id: "event-1", user_id: "user-1", title: "1학년 건강검진", area: "schoolSchedule", start_date: "2026-05-14", end_date: "2026-05-14",
  is_all_day: false, start_time: "08:00:00", end_time: "12:00:00", location: "체육관", sticker_key: "health.student-checkup",
  memo: null, description: null, created_at: "", updated_at: "",
};

describe("PracticalScheduleWorkspace linking flow", () => {
  it("opens existing-event linking without changing the default new-schedule flow", () => {
    render(<PracticalScheduleWorkspace items={[]} linkableEvents={[event]} year={2026} />);
    expect(screen.queryByRole("heading", { name: "기존 캘린더 일정 연결" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "실무 일정 추가" }));
    fireEvent.click(screen.getByRole("tab", { name: "기존 일정 연결" }));
    expect(screen.getByRole("heading", { name: "기존 캘린더 일정 연결" })).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /1학년 건강검진/ }));
    expect(screen.getByText("캘린더의 제목·날짜·시간·장소·스티커를 그대로 유지합니다.")).not.toBeNull();
    expect(screen.getByRole("button", { name: "기존 일정에 연결" })).not.toBeNull();
  });

  it("keeps sticker selection optional for new schedules", () => {
    render(<PracticalScheduleWorkspace items={[]} linkableEvents={[]} year={2026} newOpen />);
    const select = screen.getByLabelText("일정 스티커");
    expect((select as HTMLSelectElement).value).toBe("");
    expect(screen.getByRole("option", { name: "학생건강검진" })).not.toBeNull();
  });
});
