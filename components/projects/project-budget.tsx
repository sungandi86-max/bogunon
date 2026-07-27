"use client";

import { CircleDollarSign, Plus, WalletCards } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  clearBudgetAction,
  deleteExpenseAction,
  updateExpenseStatusAction,
} from "@/app/(app)/projects/budget-actions";
import { ResponsiveDetailPanel } from "@/components/layout/responsive-detail-panel";
import { ProjectBudgetForm } from "@/components/projects/project-budget-form";
import { ProjectBudgetSummary } from "@/components/projects/project-budget-summary";
import { ProjectExpenseCard } from "@/components/projects/project-expense-card";
import { ProjectExpenseFilters } from "@/components/projects/project-expense-filters";
import { ProjectExpenseForm } from "@/components/projects/project-expense-form";
import { ProjectQuickExpenseForm } from "@/components/projects/project-quick-expense-form";
import { Button } from "@/components/ui/button";
import {
  type ExpenseCategory,
  type PaymentStatus,
} from "@/lib/projects/budget";
import type {
  ProjectBudgetRow,
  ProjectExpenseRow,
  ProjectReservationRow,
} from "@/types/database";

const budgetFormId = "project-budget-form";
const expenseFormId = "project-expense-form";
type PaymentFilter = "all" | PaymentStatus;

export function ProjectBudget({
  budget,
  expenses,
  projectId,
  reservations,
  today = "",
}: {
  readonly budget: ProjectBudgetRow | null;
  readonly expenses: readonly ProjectExpenseRow[];
  readonly projectId: string;
  readonly reservations: readonly ProjectReservationRow[];
  readonly today?: string;
}) {
  const router = useRouter();
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectExpenseRow | "new">();
  const [deleting, setDeleting] = useState<ProjectExpenseRow>();
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | ExpenseCategory>("all");
  const [busy, setBusy] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const filteredExpenses = useMemo(() => expenses.filter((expense) => (
    (paymentFilter === "all" || expense.payment_status === paymentFilter)
    && (categoryFilter === "all" || expense.category === categoryFilter)
  )), [categoryFilter, expenses, paymentFilter]);

  const refreshed = useCallback((nextMessage: string) => {
    setMessage(nextMessage);
    setError(false);
    setBudgetOpen(false);
    setEditing(undefined);
    router.refresh();
  }, [router]);

  async function clearBudget(): Promise<void> {
    if (!budget || busy || !window.confirm("총예산을 초기화할까요? 지출 내역은 유지됩니다.")) return;
    setBusy(true);
    try {
      const result = await clearBudgetAction({ projectId });
      setMessage(result.message);
      setError(result.status === "error");
      if (result.status === "success") {
        setBudgetOpen(false);
        router.refresh();
      }
    } catch (caught) {
      setError(true);
      setMessage(caught instanceof Error ? caught.message : "네트워크 연결을 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function removeExpense(): Promise<void> {
    if (!deleting || busy) return;
    setBusy(true);
    try {
      const result = await deleteExpenseAction({ expenseId: deleting.id, projectId });
      setMessage(result.message);
      setError(result.status === "error");
      if (result.status === "success") {
        setDeleting(undefined);
        router.refresh();
      }
    } catch (caught) {
      setError(true);
      setMessage(caught instanceof Error ? caught.message : "네트워크 연결을 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus(expense: ProjectExpenseRow): Promise<void> {
    if (busy) return;
    setBusy(true);
    try {
      const result = await updateExpenseStatusAction({
        expenseId: expense.id,
        paymentStatus: expense.payment_status === "paid" ? "planned" : "paid",
        projectId,
      });
      setMessage(result.message);
      setError(result.status === "error");
      if (result.status === "success") router.refresh();
    } catch (caught) {
      setError(true);
      setMessage(caught instanceof Error ? caught.message : "네트워크 연결을 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="project-budget-title" className="project-budget">
      <div className="project-budget__heading">
        <div>
          <h2 id="project-budget-title">예산</h2>
          <p>프로젝트의 총예산과 결제 예정·완료 지출을 관리합니다.</p>
        </div>
        <div>
          <Button onClick={() => setBudgetOpen(true)} variant="secondary">
            <WalletCards aria-hidden="true" size={17} />{budget ? "총예산 수정" : "총예산 설정"}
          </Button>
          <Button onClick={() => setEditing("new")}>
            <Plus aria-hidden="true" size={17} />지출 추가
          </Button>
        </div>
      </div>
      <ProjectBudgetSummary budget={budget} expenses={expenses} />
      {message && <p className={`project-budget__message${error ? " is-error" : ""}`} role={error ? "alert" : "status"}>{message}</p>}
      <ProjectQuickExpenseForm
        onSaved={() => refreshed("지출을 추가했습니다.")}
        projectId={projectId}
        today={today}
      />
      <ProjectExpenseFilters
        category={categoryFilter}
        onCategoryChange={setCategoryFilter}
        onPaymentChange={setPaymentFilter}
        payment={paymentFilter}
      />
      {filteredExpenses.length ? (
        <div className="project-expense-list">
          {filteredExpenses.map((expense) => (
            <ProjectExpenseCard
              expense={expense}
              key={expense.id}
              onDelete={() => setDeleting(expense)}
              onEdit={() => setEditing(expense)}
              onToggleStatus={() => void toggleStatus(expense)}
            />
          ))}
        </div>
      ) : (
        <div className="project-budget__empty">
          <CircleDollarSign aria-hidden="true" size={22} />
          <div>
            <strong>{expenses.length ? "조건에 맞는 지출이 없습니다." : "등록된 지출이 없습니다."}</strong>
            <p>예산을 설정하지 않아도 지출부터 추가할 수 있습니다.</p>
          </div>
        </div>
      )}
      <ResponsiveDetailPanel
        footer={<>
          {budget && <Button disabled={busy || formBusy} onClick={() => void clearBudget()} variant="danger">초기화</Button>}
          <Button disabled={formBusy} onClick={() => setBudgetOpen(false)} variant="secondary">취소</Button>
          <Button disabled={formBusy} form={budgetFormId} type="submit">{formBusy ? "저장 중" : "저장"}</Button>
        </>}
        onClose={() => setBudgetOpen(false)}
        open={budgetOpen}
        panelClassName="project-budget-panel"
        title="총예산 설정"
      >
        <ProjectBudgetForm
          budget={budget}
          formId={budgetFormId}
          onPendingChange={setFormBusy}
          onSaved={() => refreshed("총예산을 저장했습니다.")}
          projectId={projectId}
        />
      </ResponsiveDetailPanel>
      <ResponsiveDetailPanel
        footer={<><Button disabled={formBusy} onClick={() => setEditing(undefined)} variant="secondary">취소</Button><Button disabled={formBusy} form={expenseFormId} type="submit">{formBusy ? "저장 중" : "저장"}</Button></>}
        onClose={() => setEditing(undefined)}
        open={Boolean(editing)}
        panelClassName="project-expense-panel"
        title={editing === "new" ? "지출 추가" : "지출 수정"}
      >
        {editing && <ProjectExpenseForm
          {...(editing === "new" ? {} : { expense: editing })}
          formId={expenseFormId}
          onPendingChange={setFormBusy}
          onSaved={() => refreshed(editing === "new" ? "지출을 추가했습니다." : "지출을 수정했습니다.")}
          projectId={projectId}
          reservations={reservations}
        />}
      </ResponsiveDetailPanel>
      <ResponsiveDetailPanel
        footer={<><Button disabled={busy} onClick={() => setDeleting(undefined)} variant="secondary">취소</Button><Button disabled={busy} onClick={() => void removeExpense()} variant="danger">지출 삭제</Button></>}
        onClose={() => setDeleting(undefined)}
        open={Boolean(deleting)}
        panelClassName="project-expense-delete-panel"
        title="지출 삭제"
      >
        <p className="project-expense-delete-copy"><strong>{deleting?.title}</strong> 지출을 삭제합니다.</p>
      </ResponsiveDetailPanel>
    </section>
  );
}
