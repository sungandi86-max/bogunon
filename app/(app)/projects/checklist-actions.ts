"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  checklistItemTargetSchema,
  checklistProjectTargetSchema,
  createChecklistItemSchema,
  reorderChecklistItemsSchema,
  updateChecklistItemSchema,
} from "@/lib/projects/checklist";
import {
  createProjectChecklistItem,
  deleteCompletedProjectChecklistItems,
  deleteProjectChecklistItem,
  reorderProjectChecklistItems,
  updateProjectChecklistItem,
} from "@/lib/projects/checklist-repository";
import type { ProjectChecklistItemRow } from "@/types/database";

export type ChecklistActionResult =
  | { readonly status: "success"; readonly message: string; readonly item?: ProjectChecklistItemRow }
  | { readonly status: "error"; readonly message: string };

function revalidateProject(projectId: string): void {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
}

function actionError(error: unknown, fallback: string): ChecklistActionResult {
  if (error instanceof z.ZodError) {
    return { status: "error", message: error.issues[0]?.message ?? fallback };
  }
  if (error instanceof Error) return { status: "error", message: error.message };
  return { status: "error", message: fallback };
}

export async function createChecklistItemAction(input: unknown): Promise<ChecklistActionResult> {
  try {
    const parsed = createChecklistItemSchema.parse(input);
    const item = await createProjectChecklistItem(parsed);
    revalidateProject(parsed.projectId);
    return { status: "success", message: "체크리스트 항목을 추가했습니다.", item };
  } catch (error) {
    return actionError(error, "체크리스트 항목을 추가하지 못했습니다.");
  }
}

export async function updateChecklistItemAction(input: unknown): Promise<ChecklistActionResult> {
  try {
    const parsed = updateChecklistItemSchema.parse(input);
    const item = await updateProjectChecklistItem(parsed);
    revalidateProject(parsed.projectId);
    return { status: "success", message: "체크리스트 항목을 수정했습니다.", item };
  } catch (error) {
    return actionError(error, "체크리스트 항목을 수정하지 못했습니다.");
  }
}

export async function deleteChecklistItemAction(input: unknown): Promise<ChecklistActionResult> {
  try {
    const parsed = checklistItemTargetSchema.parse(input);
    await deleteProjectChecklistItem(parsed);
    revalidateProject(parsed.projectId);
    return { status: "success", message: "체크리스트 항목을 삭제했습니다." };
  } catch (error) {
    return actionError(error, "체크리스트 항목을 삭제하지 못했습니다.");
  }
}

export async function deleteCompletedChecklistItemsAction(
  input: unknown,
): Promise<ChecklistActionResult> {
  try {
    const parsed = checklistProjectTargetSchema.parse(input);
    await deleteCompletedProjectChecklistItems(parsed);
    revalidateProject(parsed.projectId);
    return { status: "success", message: "완료 항목을 삭제했습니다." };
  } catch (error) {
    return actionError(error, "완료 항목을 삭제하지 못했습니다.");
  }
}

export async function reorderProjectChecklistItemsAction(
  input: unknown,
): Promise<ChecklistActionResult> {
  try {
    const parsed = reorderChecklistItemsSchema.parse(input);
    await reorderProjectChecklistItems(parsed);
    revalidateProject(parsed.projectId);
    return { status: "success", message: "순서를 저장했습니다." };
  } catch (error) {
    return actionError(error, "체크리스트 순서를 저장하지 못했습니다.");
  }
}
