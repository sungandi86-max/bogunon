import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CreateItemForm } from "@/components/layout/create-item-form";
import { BUILT_IN_TEMPLATES } from "@/lib/work-items/workflow";

vi.mock("@/app/(app)/work-item-actions", () => ({
  saveWorkItemAction: vi.fn(async () => ({ status: "success", message: "저장했습니다." })),
}));

describe("CreateItemForm Phase 5 workflows", () => {
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
});
