import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
    rpc: mocks.rpc,
  })),
}));

import {
  deleteProjectBudget,
  deleteProjectExpense,
  saveProjectBudget,
  saveProjectExpense,
  updateProjectExpenseStatus,
} from "@/lib/projects/budget-repository";

const projectId = "11111111-1111-4111-8111-111111111111";
const expenseId = "22222222-2222-4222-8222-222222222222";

describe("project budget repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mocks.rpc.mockResolvedValue({ data: "saved-id", error: null });
  });

  it("saves and clears a project budget through owned RPCs", async () => {
    await expect(saveProjectBudget({
      budgetAmount: 600_000,
      currency: "KRW",
      memo: null,
      projectId,
    })).resolves.toBe("saved-id");
    await expect(deleteProjectBudget(projectId)).resolves.toBeUndefined();

    expect(mocks.rpc).toHaveBeenNthCalledWith(1, "save_project_budget", {
      p_budget_amount: 600_000,
      p_currency: "KRW",
      p_memo: null,
      p_project_id: projectId,
    });
    expect(mocks.rpc).toHaveBeenNthCalledWith(2, "delete_project_budget", {
      p_project_id: projectId,
    });
  });

  it("saves, changes status, and deletes a project expense", async () => {
    await expect(saveProjectExpense({
      amount: 120_000,
      category: "transportation",
      expenseDate: "2026-08-04",
      memo: null,
      paymentStatus: "paid",
      projectId,
      reservationId: null,
      title: "항공권",
    })).resolves.toBe("saved-id");
    await updateProjectExpenseStatus(expenseId, "planned");
    await deleteProjectExpense(expenseId);

    expect(mocks.rpc).toHaveBeenNthCalledWith(1, "save_project_expense", {
      p_expense_id: null,
      p_values: {
        amount: 120_000,
        category: "transportation",
        expense_date: "2026-08-04",
        memo: null,
        payment_status: "paid",
        project_id: projectId,
        reservation_id: null,
        title: "항공권",
      },
    });
    expect(mocks.rpc).toHaveBeenNthCalledWith(2, "update_project_expense_status", {
      p_expense_id: expenseId,
      p_payment_status: "planned",
    });
    expect(mocks.rpc).toHaveBeenNthCalledWith(3, "delete_project_expense", {
      p_expense_id: expenseId,
    });
  });
});
