import { CircleAlert, WalletCards } from "lucide-react";

import { expenseSummary, formatWon } from "@/lib/projects/budget";
import type { ProjectBudgetRow, ProjectExpenseRow } from "@/types/database";

export function ProjectBudgetSummary({
  budget,
  expenses,
}: {
  readonly budget: ProjectBudgetRow | null;
  readonly expenses: readonly ProjectExpenseRow[];
}) {
  const summary = expenseSummary(budget?.budget_amount ?? null, expenses);
  const overBudget = summary.remainingAmount !== null && summary.remainingAmount < 0;
  const metrics = [
    { label: "총예산", value: summary.budgetAmount === null ? "미설정" : formatWon(summary.budgetAmount) },
    { label: "결제 완료", value: formatWon(summary.paidAmount) },
    { label: "결제 예정", value: formatWon(summary.plannedAmount) },
    {
      label: overBudget ? "예산 초과" : "남은 예산",
      value: summary.remainingAmount === null
        ? "예산 설정 필요"
        : formatWon(Math.abs(summary.remainingAmount)),
    },
  ];

  return (
    <div className={`project-budget-summary${overBudget ? " is-over" : ""}`}>
      <div className="project-budget-summary__lead">
        {overBudget
          ? <CircleAlert aria-hidden="true" size={20} />
          : <WalletCards aria-hidden="true" size={20} />}
        <span>예상 총지출 <strong>{formatWon(summary.expectedAmount)}</strong></span>
      </div>
      <dl>
        {metrics.map((metric) => (
          <div key={metric.label}>
            <dt>{metric.label}</dt>
            <dd>{metric.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
