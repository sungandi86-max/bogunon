import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type {
  ProjectBudgetRow,
  ProjectExpenseRow,
  ProjectReservationRow,
} from "@/types/database";

const mocks = vi.hoisted(() => ({
  clearBudgetAction: vi.fn(),
  deleteExpenseAction: vi.fn(),
  refresh: vi.fn(),
  saveBudgetAction: vi.fn(),
  saveExpenseAction: vi.fn(),
  updateExpenseStatusAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock("@/app/(app)/projects/budget-actions", () => ({
  clearBudgetAction: mocks.clearBudgetAction,
  deleteExpenseAction: mocks.deleteExpenseAction,
  saveBudgetAction: mocks.saveBudgetAction,
  saveExpenseAction: mocks.saveExpenseAction,
  updateExpenseStatusAction: mocks.updateExpenseStatusAction,
}));

import { ProjectBudget } from "@/components/projects/project-budget";

const projectId = "11111111-1111-4111-8111-111111111111";
const budget: ProjectBudgetRow = {
  budget_amount: 600_000,
  created_at: "",
  currency: "KRW",
  id: "22222222-2222-4222-8222-222222222222",
  memo: null,
  project_id: projectId,
  updated_at: "",
  user_id: "user-1",
};
const expenses: ProjectExpenseRow[] = [
  {
    amount: 153_000,
    category: "transportation",
    created_at: "2026-07-01T00:00:00Z",
    expense_date: "2026-08-04",
    id: "33333333-3333-4333-8333-333333333333",
    memo: null,
    payment_status: "paid",
    project_id: projectId,
    reservation_id: null,
    title: "결제 완료 항목",
    updated_at: "",
    user_id: "user-1",
  },
  {
    amount: 285_000,
    category: "accommodation",
    created_at: "2026-07-02T00:00:00Z",
    expense_date: "2026-08-05",
    id: "44444444-4444-4444-8444-444444444444",
    memo: "체크인 전에 잔액 확인",
    payment_status: "planned",
    project_id: projectId,
    reservation_id: "55555555-5555-4555-8555-555555555555",
    title: "결제 예정 항목",
    updated_at: "",
    user_id: "user-1",
  },
];
const reservation: ProjectReservationRow = {
  company: null,
  confirmation_number: null,
  created_at: "",
  end_time: null,
  id: "55555555-5555-4555-8555-555555555555",
  linked_event_id: null,
  location: null,
  memo: null,
  phone: null,
  project_id: projectId,
  reservation_date: "2026-08-05",
  start_time: null,
  title: "MJ Resort",
  type: "hotel",
  updated_at: "",
  user_id: "user-1",
  website: null,
};

describe("project budget", () => {
  it("shows the requested summary amounts and reservation linkage", () => {
    render(
      <ProjectBudget
        budget={budget}
        expenses={expenses}
        projectId={projectId}
        reservations={[reservation]}
      />,
    );

    const summary = screen.getByText("예상 총지출").closest(".project-budget-summary");
    expect(summary).toBeInstanceOf(HTMLElement);
    if (!(summary instanceof HTMLElement)) throw new Error("예산 요약을 찾지 못했습니다.");
    expect(within(summary).getByText("600,000원")).toBeInTheDocument();
    expect(within(summary).getByText("153,000원")).toBeInTheDocument();
    expect(within(summary).getByText("285,000원")).toBeInTheDocument();
    expect(within(summary).getByText("162,000원")).toBeInTheDocument();
    expect(screen.getByText("예약 연결")).toBeInTheDocument();
  });

  it("filters expenses by payment status and category", () => {
    render(
      <ProjectBudget
        budget={budget}
        expenses={expenses}
        projectId={projectId}
        reservations={[reservation]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "결제 예정" }));
    expect(screen.queryByText("결제 완료 항목")).not.toBeInTheDocument();
    expect(screen.getByText("결제 예정 항목")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "전체" }));
    fireEvent.change(screen.getByLabelText("카테고리 필터"), {
      target: { value: "transportation" },
    });
    expect(screen.getByText("결제 완료 항목")).toBeInTheDocument();
    expect(screen.queryByText("결제 예정 항목")).not.toBeInTheDocument();
  });

  it("opens the expense form with a reservation selector", () => {
    render(
      <ProjectBudget
        budget={budget}
        expenses={expenses}
        projectId={projectId}
        reservations={[reservation]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "지출 추가" }));
    expect(screen.getByRole("dialog", { name: "지출 추가" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "MJ Resort" })).toBeInTheDocument();
    expect(screen.getByLabelText("금액")).toHaveAttribute("inputmode", "numeric");
  });

  it("changes planned expenses to paid without editing the whole row", async () => {
    mocks.updateExpenseStatusAction.mockResolvedValue({
      message: "결제 상태를 변경했습니다.",
      status: "success",
    });
    render(
      <ProjectBudget
        budget={budget}
        expenses={expenses}
        projectId={projectId}
        reservations={[reservation]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "결제 완료로 변경" }));
    await waitFor(() => {
      expect(mocks.updateExpenseStatusAction).toHaveBeenCalledWith({
        expenseId: expenses[1]?.id,
        paymentStatus: "paid",
        projectId,
      });
    });
  });
});
