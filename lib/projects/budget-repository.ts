import type { BudgetInput, ExpenseInput, PaymentStatus } from "@/lib/projects/budget";
import { createClient } from "@/lib/supabase/server";
import type { ProjectBudgetRow, ProjectExpenseRow } from "@/types/database";

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("로그인이 필요합니다.");
  return { supabase, userId: user.id };
}

export async function listProjectBudget(projectId: string): Promise<ProjectBudgetRow | null> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase
    .from("project_budgets")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("예산을 불러오지 못했습니다.");
  return data;
}

export async function listProjectExpenses(projectId: string): Promise<ProjectExpenseRow[]> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase
    .from("project_expenses")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .order("expense_date")
    .order("created_at");
  if (error) throw new Error("지출 내역을 불러오지 못했습니다.");
  return data;
}

export async function saveProjectBudget(input: BudgetInput): Promise<string> {
  const { supabase } = await ownedClient();
  const { data, error } = await supabase.rpc("save_project_budget", {
    p_budget_amount: input.budgetAmount,
    p_currency: input.currency,
    p_memo: input.memo,
    p_project_id: input.projectId,
  });
  if (error) throw new Error("예산을 저장하지 못했습니다.");
  return data;
}

export async function deleteProjectBudget(projectId: string): Promise<void> {
  const { supabase } = await ownedClient();
  const { error } = await supabase.rpc("delete_project_budget", {
    p_project_id: projectId,
  });
  if (error) throw new Error("예산을 초기화하지 못했습니다.");
}

export async function saveProjectExpense(input: ExpenseInput): Promise<string> {
  const { supabase } = await ownedClient();
  const { data, error } = await supabase.rpc("save_project_expense", {
    p_expense_id: input.expenseId ?? null,
    p_values: {
      amount: input.amount,
      category: input.category,
      expense_date: input.expenseDate,
      memo: input.memo,
      payment_status: input.paymentStatus,
      project_id: input.projectId,
      reservation_id: input.reservationId,
      title: input.title,
    },
  });
  if (error) throw new Error("지출을 저장하지 못했습니다.");
  return data;
}

export async function deleteProjectExpense(expenseId: string): Promise<void> {
  const { supabase } = await ownedClient();
  const { error } = await supabase.rpc("delete_project_expense", {
    p_expense_id: expenseId,
  });
  if (error) throw new Error("지출을 삭제하지 못했습니다.");
}

export async function updateProjectExpenseStatus(
  expenseId: string,
  paymentStatus: PaymentStatus,
): Promise<void> {
  const { supabase } = await ownedClient();
  const { error } = await supabase.rpc("update_project_expense_status", {
    p_expense_id: expenseId,
    p_payment_status: paymentStatus,
  });
  if (error) throw new Error("결제 상태를 변경하지 못했습니다.");
}
