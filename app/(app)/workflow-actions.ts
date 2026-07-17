"use server";

import { revalidatePath } from "next/cache";
import { BUILT_IN_WORKFLOW_TEMPLATES, WORKFLOW_STATUSES, WORKFLOW_STEP_STATUSES } from "@/lib/workflows/domain";
import {
  completeWorkflowInstance, createWorkflowInstanceBundle,
  saveWorkflowTemplateBundle, transitionWorkflowInstance, transitionWorkflowStep, updateWorkflowStepBundle,
} from "@/lib/workflows/repository";
import type { Json } from "@/types/database";
import { parseWorkflowFollowups, parseWorkflowLinks, parseWorkflowSteps, toJson } from "@/lib/workflows/input";

function refresh() {
  for (const path of ["/briefing", "/tasks", "/workflows"]) revalidatePath(path);
}

function value(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function parseJson(formData: FormData, name: string): Json {
  const raw = value(formData, name);
  if (!raw) return [];
  return toJson(JSON.parse(raw));
}

export async function cloneWorkflowTemplateAction(formData: FormData) {
  const key = value(formData, "key");
  const builtIn = BUILT_IN_WORKFLOW_TEMPLATES.find((item) => item.key === key);
  if (!builtIn) throw new Error("기본 Workflow를 찾지 못했습니다.");
  await saveWorkflowTemplateBundle(null, {
    name: `${builtIn.name} 복사본`, description: builtIn.description, category: builtIn.category,
    default_priority: builtIn.defaultPriority, recommended_timing: builtIn.recommendedTiming,
  }, parseWorkflowSteps(builtIn.steps), parseWorkflowFollowups(builtIn.followups));
  refresh();
}

export async function saveWorkflowTemplateAction(formData: FormData) {
  const name = value(formData, "name");
  if (!name) throw new Error("Workflow 이름을 입력해 주세요.");
  await saveWorkflowTemplateBundle(value(formData, "id") || null, {
    name, description: value(formData, "description") || null, category: value(formData, "category"),
    default_priority: value(formData, "priority"), recommended_timing: value(formData, "recommendedTiming") || null,
  }, parseWorkflowSteps(parseJson(formData, "steps")), parseWorkflowFollowups(parseJson(formData, "followups")));
  refresh();
}

export async function startWorkflowAction(formData: FormData) {
  const taskId = value(formData, "taskId");
  const source = value(formData, "source");
  if (!taskId || !source) throw new Error("업무와 Workflow를 선택해 주세요.");
  const builtIn = BUILT_IN_WORKFLOW_TEMPLATES.find((item) => item.key === source);
  if (builtIn) {
    await createWorkflowInstanceBundle(taskId, null, {
      name: builtIn.name, description: builtIn.description, category: builtIn.category, priority: builtIn.defaultPriority,
    }, parseWorkflowSteps(builtIn.steps), parseWorkflowFollowups(builtIn.followups));
  } else {
    await createWorkflowInstanceBundle(taskId, source, {}, [], []);
  }
  refresh();
}

export async function saveWorkflowStepAction(formData: FormData) {
  const stepId = value(formData, "stepId");
  if (!stepId) return;
  await updateWorkflowStepBundle(stepId, {
    memo: value(formData, "memo") || null, internal_notes: value(formData, "internalNotes") || null,
    assignee_label: value(formData, "assigneeLabel") || null,
    completion_condition: value(formData, "completionCondition") || null,
  }, parseJson(formData, "checklist"), parseWorkflowLinks(parseJson(formData, "links")));
  refresh();
}

export async function transitionWorkflowStepAction(formData: FormData) {
  const status = WORKFLOW_STEP_STATUSES.find((item) => item === value(formData, "status"));
  if (!status) throw new Error("단계 상태를 확인해 주세요.");
  await transitionWorkflowStep(value(formData, "stepId"), status, value(formData, "force") === "true");
  refresh();
}

export async function transitionWorkflowAction(formData: FormData) {
  const status = WORKFLOW_STATUSES.find((item) => item === value(formData, "status"));
  if (!status) throw new Error("Workflow 상태를 확인해 주세요.");
  if (status === "completed") await completeWorkflowInstance(value(formData, "instanceId"));
  else await transitionWorkflowInstance(value(formData, "instanceId"), status);
  refresh();
}
