import { describe, expect, it } from "vitest";

import {
  BUILT_IN_WORKFLOW_TEMPLATES,
  calculateWorkflowProgress,
  deriveNextWorkflowAction,
  isStepTransitionAllowed,
  isWorkflowTransitionAllowed,
} from "@/lib/workflows/domain";
import type { WorkflowStepSnapshot } from "@/lib/workflows/domain";

const step = (
  position: number,
  status: WorkflowStepSnapshot["status"],
  incompleteChecklist = 0,
): WorkflowStepSnapshot => ({
  id: `step-${position}`,
  name: `단계 ${position + 1}`,
  position,
  status,
  incompleteChecklist,
});

describe("built-in workflow templates", () => {
  it("provides immutable privacy-safe health workflows", () => {
    expect(BUILT_IN_WORKFLOW_TEMPLATES.map((template) => template.name)).toEqual([
      "결핵검진",
      "학생건강검진",
    ]);
    expect(JSON.stringify(BUILT_IN_WORKFLOW_TEMPLATES)).not.toMatch(
      /학생 이름|학번|반번호|질병명|검진 결과|상담 기록|연락처/,
    );
  });
});

describe("calculateWorkflowProgress", () => {
  it("calculates completed, remaining, and percentage from step states", () => {
    const result = calculateWorkflowProgress([
      step(0, "completed"),
      step(1, "completed"),
      step(2, "skipped"),
      step(3, "in_progress"),
      step(4, "pending"),
    ]);

    expect(result).toEqual({ completed: 2, total: 5, remaining: 2, percentage: 40 });
  });
});

describe("deriveNextWorkflowAction", () => {
  it("prioritizes the current in-progress step and unfinished checklist", () => {
    const result = deriveNextWorkflowAction([
      step(0, "completed"),
      step(1, "in_progress", 2),
      step(2, "pending"),
    ]);

    expect(result).toEqual({
      stepId: "step-1",
      stepName: "단계 2",
      message: "체크리스트 2개를 완료한 뒤 단계를 완료하세요.",
    });
  });

  it("surfaces a blocked step unless blocked steps are excluded", () => {
    const steps = [step(0, "completed"), step(1, "blocked"), step(2, "pending")];

    expect(deriveNextWorkflowAction(steps)).toMatchObject({
      stepId: "step-1",
      message: "보류된 단계를 재개하거나 건너뛸지 확인하세요.",
    });
    expect(deriveNextWorkflowAction(steps, { includeBlocked: false })).toMatchObject({
      stepId: "step-2",
    });
  });

  it("returns completion guidance when every step is resolved", () => {
    expect(deriveNextWorkflowAction([step(0, "completed"), step(1, "skipped")])).toEqual({
      stepId: null,
      stepName: null,
      message: "모든 단계를 처리했습니다. Workflow를 완료하세요.",
    });
  });
});

describe("workflow state transitions", () => {
  it("keeps completed and cancelled workflows terminal", () => {
    expect(isWorkflowTransitionAllowed("active", "paused")).toBe(true);
    expect(isWorkflowTransitionAllowed("paused", "active")).toBe(true);
    expect(isWorkflowTransitionAllowed("completed", "active")).toBe(false);
    expect(isWorkflowTransitionAllowed("cancelled", "active")).toBe(false);
  });

  it("allows explicit step progress, hold, skip, and rollback transitions", () => {
    expect(isStepTransitionAllowed("pending", "in_progress")).toBe(true);
    expect(isStepTransitionAllowed("in_progress", "blocked")).toBe(true);
    expect(isStepTransitionAllowed("blocked", "in_progress")).toBe(true);
    expect(isStepTransitionAllowed("completed", "in_progress")).toBe(true);
    expect(isStepTransitionAllowed("completed", "skipped")).toBe(false);
  });
});
