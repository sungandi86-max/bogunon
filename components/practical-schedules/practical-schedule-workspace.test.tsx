import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { EventRow } from "@/types/database";
import { PracticalScheduleWorkspace } from "@/components/practical-schedules/practical-schedule-workspace";

vi.mock("@/app/(app)/practical-schedules/actions", () => ({
  attachPracticalToolAction: vi.fn(),
  createAndAttachPracticalToolAction: vi.fn(),
  deletePracticalScheduleAction: vi.fn(),
  detachPracticalToolAction: vi.fn(),
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

const schedule = {
  id: "schedule-1", user_id: "user-1", year: 2026, category: "student" as const, title: "1학년 건강검진", scheduled_date: "2026-05-14", start_time: "08:00:00", end_time: "12:00:00", location: "체육관", method: "검진기관 진행", notes: "문진표 확인", url: null, annual_preset_key: null, sticker_key: "health.student-checkup" as const, created_at: "", updated_at: "",
};

describe("PracticalScheduleWorkspace edit modal", () => {
  it("opens a centered dialog, preserves linked fields as read-only, and closes on cancel with focus restored", () => {
    render(<PracticalScheduleWorkspace items={[schedule]} linkableEvents={[]} linkedScheduleIds={[schedule.id]} year={2026} />);
    const editButton = screen.getByRole("button", { name: "1학년 건강검진 수정" });
    fireEvent.click(editButton);
    const dialog = screen.getByRole("dialog", { name: "실무 일정 수정" });
    expect(dialog).toBeTruthy();
    expect(document.body.classList.contains("overlay-open")).toBe(true);
    expect((screen.getByLabelText("업무명") as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText("날짜") as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText("진행방법") as HTMLInputElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(screen.queryByRole("dialog", { name: "실무 일정 수정" })).toBeNull();
    expect(document.activeElement).toBe(editButton);
  });

  it("closes the edit dialog with Escape", () => {
    render(<PracticalScheduleWorkspace items={[schedule]} linkableEvents={[]} year={2026} />);
    fireEvent.click(screen.getByRole("button", { name: "1학년 건강검진 수정" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "실무 일정 수정" })).toBeNull();
  });
});

describe("PracticalScheduleWorkspace related tools", () => {
  it("shows only supplied public or personal tools for the selected schedule", () => {
    const tool = { id: "tool-1", name: "온라인 보건실", description: "우리 학교 제출 및 확인", url: "https://health.example", icon_key: "online_health" as const, scope: "personal" as const, owner_id: "user-1", is_active: true, created_at: "", updated_at: "" };
    render(<PracticalScheduleWorkspace items={[schedule]} linkableEvents={[]} practicalTools={[tool]} scheduleToolLinks={[]} year={2026} />);
    fireEvent.click(screen.getByRole("button", { name: "1학년 건강검진 관련 도구" }));
    expect(screen.getByRole("dialog", { name: "1학년 건강검진" })).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "도구 추가" })[0]!);
    expect(screen.getByRole("tab", { name: "내 도구" })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("tab", { name: "내 도구" }));
    expect(screen.getByText("온라인 보건실")).toBeTruthy();
    expect(screen.getByRole("button", { name: "온라인 보건실 연결" })).toBeTruthy();
  });

  it("shows scope badges and readable actions on linked tool cards", () => {
    const personalTool = { id: "tool-personal", name: "온라인 보건실", description: "세화여자고등학교 온라인 보건실 링크", url: "https://health.example", icon_key: "online_health" as const, scope: "personal" as const, owner_id: "user-1", is_active: true, created_at: "", updated_at: "" };
    const publicTool = { id: "tool-public", name: "AED 점검", description: "AED 점검 기록을 관리합니다.", url: "/aed", icon_key: "other" as const, scope: "public" as const, owner_id: null, is_active: true, created_at: "", updated_at: "" };
    render(<PracticalScheduleWorkspace items={[schedule]} linkableEvents={[]} practicalTools={[personalTool, publicTool]} scheduleToolLinks={[{ id: "link-personal", user_id: "user-1", schedule_id: schedule.id, tool_id: personalTool.id, created_at: "" }, { id: "link-public", user_id: "user-1", schedule_id: schedule.id, tool_id: publicTool.id, created_at: "" }]} year={2026} />);
    fireEvent.click(screen.getByRole("button", { name: "1학년 건강검진 관련 도구" }));
    expect(screen.getByRole("heading", { name: "관련 도구·링크" })).toBeTruthy();
    expect(screen.getByText("이 업무에 필요한 도구, 사이트, 문서 링크를 연결해두고 바로 열 수 있어요.")).toBeTruthy();
    expect(screen.getByText("내 도구")).toBeTruthy();
    expect(screen.getByText("공용")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "연결 해제" })).toHaveLength(2);
    expect(screen.getAllByText("열기")).toHaveLength(2);
  });

  it("distinguishes a tool-list load failure from an empty candidate list", () => {
    render(<PracticalScheduleWorkspace items={[schedule]} linkableEvents={[]} practicalToolsError practicalTools={[]} scheduleToolLinks={[]} year={2026} />);
    fireEvent.click(screen.getByRole("button", { name: "1학년 건강검진 관련 도구" }));
    expect(screen.getByText("아직 연결된 도구·링크가 없어요.")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "도구 추가" })[0]!);
    expect(screen.getByRole("alert")).toHaveTextContent("도구 목록을 불러오지 못했어요. 다시 시도해 주세요.");
    expect(screen.queryByText("연결할 수 있는 도구가 없습니다.")).toBeNull();
  });
});
