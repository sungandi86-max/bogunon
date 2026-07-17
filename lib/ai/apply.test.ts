import { beforeEach, describe, expect, it, vi } from "vitest";

import { applyAiAction } from "@/lib/ai/apply";
import { saveTaskBundle, listWorkflowData } from "@/lib/work-items/phase5-repository";
import { listTasks } from "@/lib/work-items/repository";
import { createWorkflowInstanceBundle, saveWorkflowTemplateBundle } from "@/lib/workflows/repository";

vi.mock("@/lib/work-items/phase5-repository", () => ({
  duplicateEvent: vi.fn(), duplicateTask: vi.fn(), listWorkflowData: vi.fn(), saveTaskBundle: vi.fn(),
}));
vi.mock("@/lib/work-items/repository", () => ({ listTasks: vi.fn() }));
vi.mock("@/lib/workflows/repository", () => ({ createWorkflowInstanceBundle: vi.fn(), saveWorkflowTemplateBundle: vi.fn() }));

const task = {
  id: "task-1", user_id: "user-1", title: "결핵검진 안내", area: "healthWork", status: "planned",
  priority: "normal", category: "additionalScreening", scheduled_date: "2026-07-20", due_date: null,
  follow_up_date: null, memo: null, description: null, estimated_minutes: null, completed_at: null,
  recurrence_frequency: null, recurrence_source_id: null, recurrence_date: null,
  recurrence_generated_through: null, created_at: "2026-07-18T00:00:00Z", updated_at: "2026-07-18T00:00:00Z",
} as const;

describe("applyAiAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates a task checklist through the existing atomic bundle", async () => {
    vi.mocked(listTasks).mockResolvedValue([task]);
    vi.mocked(listWorkflowData).mockResolvedValue({
      templates: [], templateChecklistItems: [], checklistItems: [], taskLinks: [], eventLinks: [], taskReminders: [], eventReminders: [],
    });
    await applyAiAction({ action: "create_checklist", target_id: task.id, title: task.title, items: [{ title: "대상 범위 확인", is_completed: false }] });
    expect(saveTaskBundle).toHaveBeenCalledWith(expect.objectContaining({ title: task.title }), {
      checklist: [{ title: "대상 범위 확인", isCompleted: false }], links: [], reminders: [],
    }, task.id);
  });

  it("reuses the workflow RPC for a confirmed workflow draft", async () => {
    await applyAiAction({
      action: "create_workflow", task_id: task.id, template_id: null, name: "결핵검진", description: null,
      category: "additionalScreening", priority: "high", steps: [{ name: "공문 확인", description: null, checklist: ["마감 확인"] }],
    });
    expect(createWorkflowInstanceBundle).toHaveBeenCalledWith(task.id, null, expect.objectContaining({ name: "결핵검진" }), expect.any(Array), []);
  });

  it("reuses the workflow template bundle RPC", async () => {
    await applyAiAction({
      action: "create_workflow_template", name: "약품 점검", description: null, category: "medication",
      default_priority: "normal", recommended_timing: "매월 첫째 주", steps: [{ name: "재고 확인", description: null, checklist: [] }],
    });
    expect(saveWorkflowTemplateBundle).toHaveBeenCalledWith(null, expect.objectContaining({ name: "약품 점검" }), expect.any(Array), []);
  });
});
