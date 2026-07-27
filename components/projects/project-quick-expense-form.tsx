"use client";

import { Plus } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import {
  saveExpenseAction,
  type BudgetActionResult,
} from "@/app/(app)/projects/budget-actions";
import { ProjectMoneyInput } from "@/components/projects/project-money-input";
import { Button } from "@/components/ui/button";

const initialState: BudgetActionResult = { status: "success", message: "" };

export function ProjectQuickExpenseForm({
  onSaved,
  projectId,
  today,
}: {
  readonly onSaved: () => void;
  readonly projectId: string;
  readonly today: string;
}) {
  const [state, action, pending] = useActionState(saveExpenseAction, initialState);
  const handledSavedId = useRef<string | null>(null);

  useEffect(() => {
    if (
      state.status === "success"
      && state.savedId
      && handledSavedId.current !== state.savedId
    ) {
      handledSavedId.current = state.savedId;
      onSaved();
    }
  }, [onSaved, state]);

  return (
    <form action={action} className="project-expense-quick">
      <input name="projectId" type="hidden" value={projectId} />
      <input name="expenseId" type="hidden" value="" />
      <input name="reservationId" type="hidden" value="" />
      <input name="category" type="hidden" value="other" />
      <input name="paymentStatus" type="hidden" value="planned" />
      <input name="memo" type="hidden" value="" />
      <label>
        <span>빠른 추가</span>
        <input maxLength={160} name="title" placeholder="지출 이름" required />
      </label>
      <label>
        <span>금액</span>
        <ProjectMoneyInput id="quick-expense-amount" name="amount" required />
      </label>
      <label>
        <span>지출일</span>
        <input defaultValue={today} name="expenseDate" required type="date" />
      </label>
      <Button disabled={pending} type="submit">
        <Plus aria-hidden="true" size={16} />{pending ? "추가 중" : "추가"}
      </Button>
      {state.status === "error" && <p className="form-message form-message--error" role="alert">{state.message}</p>}
    </form>
  );
}
