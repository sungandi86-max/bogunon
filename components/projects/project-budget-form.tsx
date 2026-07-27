"use client";

import { useActionState, useEffect } from "react";

import {
  saveBudgetAction,
  type BudgetActionResult,
} from "@/app/(app)/projects/budget-actions";
import { ProjectMoneyInput } from "@/components/projects/project-money-input";
import type { ProjectBudgetRow } from "@/types/database";

const initialState: BudgetActionResult = { status: "success", message: "" };

export function ProjectBudgetForm({
  budget,
  formId,
  onPendingChange,
  onSaved,
  projectId,
}: {
  readonly budget: ProjectBudgetRow | null;
  readonly formId: string;
  readonly onPendingChange: (pending: boolean) => void;
  readonly onSaved: () => void;
  readonly projectId: string;
}) {
  const [state, action, pending] = useActionState(saveBudgetAction, initialState);

  useEffect(() => {
    if (state.status === "success" && state.savedId) onSaved();
  }, [onSaved, state]);

  useEffect(() => {
    onPendingChange(pending);
  }, [onPendingChange, pending]);

  return (
    <form action={action} className="project-budget-form" id={formId}>
      <input name="projectId" type="hidden" value={projectId} />
      <input name="currency" type="hidden" value="KRW" />
      <div className="field">
        <label className="field-label" htmlFor="project-budget-amount">총예산</label>
        <ProjectMoneyInput
          {...(budget ? { defaultValue: budget.budget_amount } : {})}
          id="project-budget-amount"
          name="budgetAmount"
          required
        />
        <small>현재는 원화(KRW)만 지원합니다.</small>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="project-budget-memo">메모</label>
        <textarea
          defaultValue={budget?.memo ?? ""}
          id="project-budget-memo"
          maxLength={2000}
          name="memo"
          placeholder="예산 기준이나 참고 사항"
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
