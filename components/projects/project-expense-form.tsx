"use client";

import { useActionState, useEffect } from "react";

import {
  saveExpenseAction,
  type BudgetActionResult,
} from "@/app/(app)/projects/budget-actions";
import { ProjectMoneyInput } from "@/components/projects/project-money-input";
import { EXPENSE_CATEGORIES, PAYMENT_STATUSES } from "@/lib/projects/budget";
import type { ProjectExpenseRow, ProjectReservationRow } from "@/types/database";

const initialState: BudgetActionResult = { status: "success", message: "" };

export function ProjectExpenseForm({
  expense,
  formId,
  onPendingChange,
  onSaved,
  projectId,
  reservations,
}: {
  readonly expense?: ProjectExpenseRow;
  readonly formId: string;
  readonly onPendingChange: (pending: boolean) => void;
  readonly onSaved: () => void;
  readonly projectId: string;
  readonly reservations: readonly ProjectReservationRow[];
}) {
  const [state, action, pending] = useActionState(saveExpenseAction, initialState);
  const key = expense?.id ?? "new";

  useEffect(() => {
    if (state.status === "success" && state.savedId) onSaved();
  }, [onSaved, state]);

  useEffect(() => {
    onPendingChange(pending);
  }, [onPendingChange, pending]);

  return (
    <form action={action} className="project-expense-form" id={formId}>
      <input name="projectId" type="hidden" value={projectId} />
      <input name="expenseId" type="hidden" value={expense?.id ?? ""} />
      <div className="field">
        <label className="field-label" htmlFor={`${key}-expense-title`}>지출 이름</label>
        <input
          defaultValue={expense?.title ?? ""}
          id={`${key}-expense-title`}
          maxLength={160}
          name="title"
          placeholder="예: 항공권"
          required
        />
      </div>
      <div className="form-grid project-expense-form__amount">
        <div className="field">
          <label className="field-label" htmlFor={`${key}-expense-amount`}>금액</label>
          <ProjectMoneyInput
            {...(expense ? { defaultValue: expense.amount } : {})}
            id={`${key}-expense-amount`}
            name="amount"
            required
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`${key}-expense-date`}>지출일</label>
          <input
            defaultValue={expense?.expense_date ?? ""}
            id={`${key}-expense-date`}
            name="expenseDate"
            required
            type="date"
          />
        </div>
      </div>
      <div className="form-grid">
        <div className="field">
          <label className="field-label" htmlFor={`${key}-expense-category`}>카테고리</label>
          <select
            defaultValue={expense?.category ?? "other"}
            id={`${key}-expense-category`}
            name="category"
          >
            {EXPENSE_CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`${key}-expense-status`}>결제 상태</label>
          <select
            defaultValue={expense?.payment_status ?? "planned"}
            id={`${key}-expense-status`}
            name="paymentStatus"
          >
            {PAYMENT_STATUSES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label className="field-label" htmlFor={`${key}-expense-reservation`}>연결 예약</label>
        <select
          defaultValue={expense?.reservation_id ?? ""}
          id={`${key}-expense-reservation`}
          name="reservationId"
        >
          <option value="">예약 연결 없음</option>
          {reservations.map((reservation) => (
            <option key={reservation.id} value={reservation.id}>{reservation.title}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label className="field-label" htmlFor={`${key}-expense-memo`}>메모</label>
        <textarea
          defaultValue={expense?.memo ?? ""}
          id={`${key}-expense-memo`}
          maxLength={2000}
          name="memo"
        />
      </div>
      {state.message && (
        <p
          className={state.status === "error" ? "form-message form-message--error" : "form-message"}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
