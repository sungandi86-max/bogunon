import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CreateItemForm } from "@/components/layout/create-item-form";
import { HEALTH_PRESETS } from "@/lib/work-items/health-presets";
import { BUILT_IN_TEMPLATES } from "@/lib/work-items/workflow";
import type { TaskRow } from "@/types/database";

vi.mock("@/app/(app)/work-item-actions", () => ({
  saveWorkItemAction: vi.fn(async () => ({ status: "success", message: "저장했습니다." })),
}));

describe("CreateItemForm Phase 5 workflows", () => {
  it("does not offer project creation and normalizes a legacy project task for editing", () => {
    const legacyProjectTask: TaskRow = {
      id: "legacy-project-task", user_id: "user", title: "AI 업무 자동화 전자책 출간", area: "project",
      status: "planned", priority: "normal", category: "other", scheduled_date: "2026-07-20", due_date: null,
      follow_up_date: null, memo: "기존 메모", description: "기존 설명", estimated_minutes: 60, completed_at: null,
      recurrence_frequency: null, recurrence_source_id: null, recurrence_date: null, recurrence_generated_through: null,
      created_at: "2026-07-18T00:00:00Z", updated_at: "2026-07-18T00:00:00Z",
    };

    const { unmount } = render(<CreateItemForm />);
    expect(screen.getByRole("combobox", { name: "영역" })).not.toHaveTextContent("프로젝트");

    unmount();
    render(<CreateItemForm initialItem={legacyProjectTask} />);
    expect(screen.getByRole("textbox", { name: "제목" })).toHaveValue("AI 업무 자동화 전자책 출간");
    expect(screen.getByRole("textbox", { name: "설명" })).toHaveValue("기존 설명");
    expect(screen.getByRole("combobox", { name: "영역" })).toHaveValue("healthWork");
  });

  it("applies a template without saving and includes its checklist", () => {
    const template = BUILT_IN_TEMPLATES.find((item) => item.key === "supplies");
    expect(template).toBeDefined();
    if (!template) return;
    render(<CreateItemForm initialTemplate={template} />);

    expect(screen.getByRole("textbox", { name: "제목" })).toHaveValue("약품 및 응급물품 점검");
    expect(screen.getByRole("combobox", { name: "반복" })).toHaveValue("monthly");
    expect(screen.getByRole("textbox", { name: "체크리스트 1" })).toHaveValue("재고 확인");
    expect(screen.getByText(/템플릿의 기본값을 적용/)).toBeInTheDocument();
  });

  it("previews Korean quick input before applying it to the form", () => {
    render(<CreateItemForm />);
    fireEvent.change(screen.getByPlaceholderText("예: 내일 오후 2시 보건교육"), { target: { value: "내일 오후 2시 보건교육" } });
    fireEvent.click(screen.getByRole("button", { name: "입력 해석" }));
    expect(screen.getAllByText("일정").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("textbox", { name: "제목" })).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "폼에 반영" }));
    expect(screen.getByRole("textbox", { name: "제목" })).toHaveValue("보건교육");
    expect(screen.getByRole("combobox", { name: "항목 종류" })).toHaveValue("event");
  });

  it("adds, reorders, and removes checklist drafts", () => {
    render(<CreateItemForm />);
    const checklistSection = screen.getByText("체크리스트").closest("section");
    expect(checklistSection).not.toBeNull();
    if (!checklistSection) return;
    const checklistControls = within(checklistSection);
    fireEvent.click(checklistControls.getByRole("button", { name: "추가" }));
    fireEvent.change(screen.getByRole("textbox", { name: "체크리스트 1" }), { target: { value: "첫 항목" } });
    fireEvent.click(checklistControls.getByRole("button", { name: "추가" }));
    fireEvent.change(screen.getByRole("textbox", { name: "체크리스트 2" }), { target: { value: "둘째 항목" } });
    fireEvent.click(checklistControls.getAllByRole("button", { name: "위로 이동" })[1]!);
    expect(screen.getByRole("textbox", { name: "체크리스트 1" })).toHaveValue("둘째 항목");
    fireEvent.click(checklistControls.getAllByRole("button", { name: "삭제" })[0]!);
    expect(screen.queryByDisplayValue("둘째 항목")).not.toBeInTheDocument();
  });

  it("keeps personal quick choices as editable event form defaults", () => {
    render(<CreateItemForm defaultKind="event" initialTemplate={{ key: "personal", name: "개인 일정", kind: "event", area: "personal", category: "event", title: "", description: "", priority: "normal", estimatedMinutes: 30, recommendedTiming: "선택", recurrenceFrequency: null, checklist: [], memo: "", isAllDay: false }} />);
    fireEvent.click(screen.getByRole("button", { name: "병원" }));
    expect(screen.getByRole("textbox", { name: "제목" })).toHaveValue("병원");
    expect(screen.getByRole("combobox", { name: "영역" })).toHaveValue("personal");
    expect(screen.getByRole("combobox", { name: "색상" })).toHaveValue("lavender");
    expect(screen.queryByRole("combobox", { name: "업무 카테고리" })).not.toBeInTheDocument();
  });

  it("requires a date and explains the suggested month for annual planner drafts", () => {
    render(<CreateItemForm initialTemplate={{ key: "annual-screening", name: "학생건강검진 준비", kind: "task", area: "healthWork", category: "studentHealthScreening", title: "학생건강검진 준비", description: "검진 운영을 준비합니다.", priority: "normal", estimatedMinutes: 60, recommendedTiming: "5월 중", recurrenceFrequency: null, checklist: ["일정 확인"], memo: "", requiredDate: true, suggestedMonth: 5, suggestedYear: 2026 }} />);

    expect(screen.getByLabelText("수행일")).toBeRequired();
    expect(screen.getByLabelText("수행일")).toHaveValue("");
    expect(screen.getByText(/2026년 5월 중 실제 날짜를 선택/)).toBeInTheDocument();
  });

  it("applies health preset recurrence, checklist, area, duration, and reminder defaults without saving", () => {
    const taskPreset = HEALTH_PRESETS.find((item) => item.key === "health-log");
    const eventPreset = HEALTH_PRESETS.find((item) => item.key === "health-education-event");
    if (!taskPreset || !eventPreset) throw new Error("빠른 보건업무 프리셋이 필요합니다.");

    const { rerender } = render(<CreateItemForm initialTemplate={taskPreset} />);
    expect(screen.getByLabelText("제목")).toHaveValue("보건일지 작성");
    expect(screen.getByLabelText("예상 소요 시간(분)")).toHaveValue(10);
    expect(screen.getByLabelText("반복")).toHaveValue("daily");
    expect(screen.getByLabelText("체크리스트 1")).toHaveValue("당일 보건실 운영 내용 확인");
    expect(screen.getByLabelText("알림 기준 1")).toHaveValue("scheduled");
    expect(screen.getByLabelText("알림 시점(분) 1")).toHaveValue(0);

    rerender(<CreateItemForm initialTemplate={eventPreset} key={eventPreset.key} />);
    expect(screen.getByLabelText("항목 종류")).toHaveValue("event");
    expect(screen.getByLabelText("영역")).toHaveValue("healthWork");
    expect(screen.getByLabelText("시작 시간")).toHaveValue("09:00");
    expect(screen.getByLabelText("종료 시간")).toHaveValue("09:50");
    expect(screen.getByLabelText("알림 시점(분) 1")).toHaveValue(30);
  });
});
