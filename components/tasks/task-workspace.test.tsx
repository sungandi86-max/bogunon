import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AssistantContext } from "@/components/ai/assistant-context";
import { TaskWorkspace } from "@/components/tasks/task-workspace";
import type { EventRow, TaskRow } from "@/types/database";

const task: TaskRow = {
  id: "task-1", user_id: "user-1", title: "약품 점검", area: "healthWork",
  status: "planned", priority: "high", category: "medication",
  scheduled_date: "2026-07-17", due_date: "2026-07-17", follow_up_date: null,
  memo: "유효기간 확인", description: null, estimated_minutes: null, completed_at: null, recurrence_frequency: "monthly",
  recurrence_source_id: null, recurrence_date: "2026-07-17",
  recurrence_generated_through: "2026-07-17",
  created_at: "2026-07-17T00:00:00Z", updated_at: "2026-07-17T00:00:00Z",
};

const event: EventRow = {
  id: "event-1", user_id: "user-1", title: "보건교육", area: "healthWork",
  start_date: "2026-07-17", end_date: "2026-07-17", is_all_day: false,
  start_time: "14:00:00", end_time: null, memo: "교직원 CPR", description: null,
  created_at: "2026-07-17T00:00:00Z", updated_at: "2026-07-17T00:00:00Z",
};

const completedTask: TaskRow = {
  ...task,
  id: "task-2",
  title: "공문 제출",
  status: "completed",
  priority: "low",
  category: "officialDocument",
  scheduled_date: "2026-07-10",
  due_date: "2026-07-10",
  completed_at: "2026-07-10T02:00:00Z",
  recurrence_frequency: null,
  recurrence_date: null,
  recurrence_generated_through: null,
};

describe("TaskWorkspace", () => {
  it("searches task and event memo text as the user types", () => {
    render(<TaskWorkspace events={[event]} tasks={[task]} today="2026-07-17" />);
    const search = screen.getByRole("searchbox", { name: "업무, 일정과 메모 검색" });

    fireEvent.change(search, { target: { value: "CPR" } });
    expect(screen.getByRole("heading", { name: "일정 검색 결과" })).toBeInTheDocument();
    expect(screen.getByText("보건교육")).toBeInTheDocument();
    expect(screen.getByText("메모 일치")).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "유효기간" } });
    expect(screen.getByText("약품 점검")).toBeInTheDocument();
    expect(screen.getByText("업무 1건")).toBeInTheDocument();
  });

  it("combines filters and resets them without a page navigation", () => {
    render(<TaskWorkspace events={[event]} tasks={[task, completedTask]} today="2026-07-17" />);
    const filters = within(screen.getByRole("group", { name: "업무 필터" }));

    fireEvent.change(filters.getByRole("combobox", { name: "카테고리" }), {
      target: { value: "medication" },
    });
    fireEvent.change(filters.getByRole("combobox", { name: "완료 여부" }), {
      target: { value: "open" },
    });
    fireEvent.change(filters.getByRole("combobox", { name: "기간" }), {
      target: { value: "today" },
    });
    fireEvent.change(filters.getByRole("combobox", { name: "우선순위" }), {
      target: { value: "high" },
    });

    expect(screen.getByText("약품 점검")).toBeInTheDocument();
    expect(screen.queryByText("공문 제출")).not.toBeInTheDocument();
    expect(screen.getByText("업무 1건")).toBeInTheDocument();

    fireEvent.click(filters.getByRole("button", { name: "초기화" }));
    expect(screen.getByText("공문 제출")).toBeInTheDocument();
    expect(screen.getByText("업무 2건")).toBeInTheDocument();
  });

  it("keeps secondary actions inside the more menu", () => {
    render(<AssistantContext value={{ openAssistant: vi.fn() }}><TaskWorkspace events={[]} tasks={[task]} today="2026-07-17" /></AssistantContext>);

    expect(screen.queryByRole("button", { name: "AI 초안" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("더보기"));
    expect(screen.getByRole("button", { name: "내용 제안" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "템플릿으로 저장" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "삭제" })).toBeInTheDocument();
  });
});
