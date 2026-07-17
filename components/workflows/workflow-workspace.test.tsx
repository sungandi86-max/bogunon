import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkflowWorkspace } from "@/components/workflows/workflow-workspace";
import { WorkflowInstanceCard } from "@/components/workflows/workflow-instance-card";
import type { TaskRow } from "@/types/database";
import type { HealthWorkflowData } from "@/types/workflows";

vi.mock("@/app/(app)/workflow-actions", () => ({
  cloneWorkflowTemplateAction: vi.fn(), saveWorkflowTemplateAction: vi.fn(), startWorkflowAction: vi.fn(),
  saveWorkflowStepAction: vi.fn(), transitionWorkflowAction: vi.fn(), transitionWorkflowStepAction: vi.fn(),
}));

const task: TaskRow = {
  id: "task-1", user_id: "user-1", title: "결핵검진 운영", area: "healthWork", status: "planned",
  priority: "high", category: "additionalScreening", scheduled_date: "2026-07-17", due_date: null,
  follow_up_date: null, memo: null, description: null, estimated_minutes: null, completed_at: null,
  recurrence_frequency: null, recurrence_source_id: null, recurrence_date: null,
  recurrence_generated_through: null, created_at: "2026-07-17T00:00:00Z", updated_at: "2026-07-17T00:00:00Z",
};

const data: HealthWorkflowData = {
  templates: [], templateSteps: [], templateChecklistItems: [], templateLinks: [], links: [], followups: [],
  instances: [{ id: "instance-1", user_id: "user-1", task_id: task.id, source_template_id: null, name: "결핵검진", description: null, category: "additionalScreening", priority: "high", status: "active", current_step_id: "step-1", started_at: "2026-07-17T00:00:00Z", paused_at: null, completed_at: null, cancelled_at: null, created_at: "2026-07-17T00:00:00Z", updated_at: "2026-07-17T00:00:00Z" }],
  steps: [{ id: "step-1", user_id: "user-1", instance_id: "instance-1", template_step_id: null, name: "공문 확인", description: null, position: 0, status: "in_progress", estimated_minutes: 20, memo: "시행 일정", internal_notes: null, assignee_label: null, completion_condition: "공문 확인", started_at: "2026-07-17T00:00:00Z", completed_at: null, created_at: "2026-07-17T00:00:00Z", updated_at: "2026-07-17T00:00:00Z" }],
  checklistItems: [], timeline: [],
};

describe("WorkflowWorkspace", () => {
  it("shows progress and filters by step memo", () => {
    const { container } = render(<WorkflowWorkspace data={data} tasks={[task]} />);
    expect(screen.getByText(/현재 공문 확인/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "완료" })).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Workflow, 업무, 단계, 메모 검색"), { target: { value: "시행 일정" } });
    expect(container.querySelector(".task-results-summary")).toHaveTextContent("Workflow 1건");
    fireEvent.change(screen.getByPlaceholderText("Workflow, 업무, 단계, 메모 검색"), { target: { value: "없는 업무" } });
    expect(container.querySelector(".task-results-summary")).toHaveTextContent("Workflow 0건");
  });

  it.each(["paused", "completed", "cancelled"] as const)(
    "hides step transition actions when the workflow is %s",
    (status) => {
      const instance = { ...data.instances[0]!, status };

      render(<WorkflowInstanceCard data={data} instance={instance} task={task} />);

      expect(screen.queryByRole("button", { name: "완료" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "보류" })).not.toBeInTheDocument();
    },
  );
});
