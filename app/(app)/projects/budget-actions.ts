"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  budgetInputFromFormData,
  expenseDeleteSchema,
  expenseInputFromFormData,
  expenseStatusInputSchema,
} from "@/lib/projects/budget";
import {
  deleteProjectBudget,
  deleteProjectExpense,
  saveProjectBudget,
  saveProjectExpense,
  updateProjectExpenseStatus,
} from "@/lib/projects/budget-repository";

export type BudgetActionResult =
  | { readonly status: "success"; readonly message: string; readonly savedId?: string }
  | { readonly status: "error"; readonly message: string };

function refreshBudgetViews(projectId: string): void {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
}

function actionError(error: unknown, fallback: string): BudgetActionResult {
  if (error instanceof z.ZodError) {
    return { status: "error", message: error.issues[0]?.message ?? fallback };
  }
  if (error instanceof Error) return { status: "error", message: error.message };
  return { status: "error", message: fallback };
}

export async function saveBudgetAction(
  _state: BudgetActionResult,
  formData: FormData,
): Promise<BudgetActionResult> {
  try {
    const input = budgetInputFromFormData(formData);
    const savedId = await saveProjectBudget(input);
    refreshBudgetViews(input.projectId);
    return { status: "success", message: "총예산을 저장했습니다.", savedId };
  } catch (error) {
    return actionError(error, "예산을 저장하지 못했습니다.");
  }
}

export async function clearBudgetAction(input: unknown): Promise<BudgetActionResult> {
  try {
    const parsed = z.object({ projectId: z.uuid() }).parse(input);
    await deleteProjectBudget(parsed.projectId);
    refreshBudgetViews(parsed.projectId);
    return { status: "success", message: "총예산을 초기화했습니다." };
  } catch (error) {
    return actionError(error, "예산을 초기화하지 못했습니다.");
  }
}

export async function saveExpenseAction(
  _state: BudgetActionResult,
  formData: FormData,
): Promise<BudgetActionResult> {
  try {
    const input = expenseInputFromFormData(formData);
    const savedId = await saveProjectExpense(input);
    refreshBudgetViews(input.projectId);
    return {
      status: "success",
      message: input.expenseId ? "지출을 수정했습니다." : "지출을 추가했습니다.",
      savedId,
    };
  } catch (error) {
    return actionError(error, "지출을 저장하지 못했습니다.");
  }
}

export async function deleteExpenseAction(input: unknown): Promise<BudgetActionResult> {
  try {
    const parsed = expenseDeleteSchema.parse(input);
    await deleteProjectExpense(parsed.expenseId);
    refreshBudgetViews(parsed.projectId);
    return { status: "success", message: "지출을 삭제했습니다." };
  } catch (error) {
    return actionError(error, "지출을 삭제하지 못했습니다.");
  }
}

export async function updateExpenseStatusAction(input: unknown): Promise<BudgetActionResult> {
  try {
    const parsed = expenseStatusInputSchema.parse(input);
    await updateProjectExpenseStatus(parsed.expenseId, parsed.paymentStatus);
    refreshBudgetViews(parsed.projectId);
    return { status: "success", message: "결제 상태를 변경했습니다." };
  } catch (error) {
    return actionError(error, "결제 상태를 변경하지 못했습니다.");
  }
}
