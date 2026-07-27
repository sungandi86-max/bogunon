"use client";

import {
  EXPENSE_CATEGORIES,
  expenseCategorySchema,
  type ExpenseCategory,
  type PaymentStatus,
} from "@/lib/projects/budget";

export function ProjectExpenseFilters({
  category,
  onCategoryChange,
  onPaymentChange,
  payment,
}: {
  readonly category: "all" | ExpenseCategory;
  readonly onCategoryChange: (value: "all" | ExpenseCategory) => void;
  readonly onPaymentChange: (value: "all" | PaymentStatus) => void;
  readonly payment: "all" | PaymentStatus;
}) {
  return (
    <div className="project-budget__filters">
      <div aria-label="결제 상태 필터" className="project-budget__segments" role="group">
        {([
          ["all", "전체"],
          ["planned", "결제 예정"],
          ["paid", "결제 완료"],
        ] as const).map(([value, label]) => (
          <button
            aria-pressed={payment === value}
            key={value}
            onClick={() => onPaymentChange(value)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      <label>
        <span>카테고리 필터</span>
        <select
          aria-label="카테고리 필터"
          onChange={(event) => {
            const value = event.currentTarget.value;
            if (value === "all") {
              onCategoryChange("all");
              return;
            }
            const parsed = expenseCategorySchema.safeParse(value);
            if (parsed.success) onCategoryChange(parsed.data);
          }}
          value={category}
        >
          <option value="all">모든 카테고리</option>
          {EXPENSE_CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
