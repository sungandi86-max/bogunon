import { z } from "zod";

import type { ProjectReservationType } from "@/types/database";

export const MAX_PROJECT_AMOUNT = 1_000_000_000_000;

export const EXPENSE_CATEGORIES = [
  { value: "transportation", label: "교통" },
  { value: "accommodation", label: "숙박" },
  { value: "food", label: "식비" },
  { value: "activity", label: "활동" },
  { value: "shopping", label: "쇼핑" },
  { value: "ticket", label: "티켓" },
  { value: "supplies", label: "소모품" },
  { value: "fee", label: "수수료" },
  { value: "other", label: "기타" },
] as const;

export const PAYMENT_STATUSES = [
  { value: "planned", label: "결제 예정" },
  { value: "paid", label: "결제 완료" },
] as const;

export const expenseCategorySchema = z.enum([
  "transportation",
  "accommodation",
  "food",
  "activity",
  "shopping",
  "ticket",
  "supplies",
  "fee",
  "other",
]);
export const paymentStatusSchema = z.enum(["planned", "paid"]);
const amountSchema = z.number().int().min(0).max(MAX_PROJECT_AMOUNT);
const optionalMemoSchema = z.string().trim().max(2000).nullable();

export const budgetInputSchema = z.object({
  projectId: z.uuid(),
  budgetAmount: amountSchema,
  currency: z.literal("KRW"),
  memo: optionalMemoSchema,
});

export const expenseInputSchema = z.object({
  projectId: z.uuid(),
  expenseId: z.uuid().optional(),
  reservationId: z.uuid().nullable(),
  title: z.string().trim().min(1, "지출 이름을 입력해 주세요.").max(160),
  category: expenseCategorySchema,
  amount: amountSchema,
  expenseDate: z.iso.date(),
  paymentStatus: paymentStatusSchema,
  memo: optionalMemoSchema,
});

export const expenseDeleteSchema = z.object({
  projectId: z.uuid(),
  expenseId: z.uuid(),
});

export const expenseStatusInputSchema = z.object({
  projectId: z.uuid(),
  expenseId: z.uuid(),
  paymentStatus: paymentStatusSchema,
});

export type BudgetInput = z.infer<typeof budgetInputSchema>;
export type ExpenseInput = z.infer<typeof expenseInputSchema>;
export type ExpenseCategory = z.infer<typeof expenseCategorySchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

type SummaryExpense = {
  readonly amount: number;
  readonly payment_status: PaymentStatus;
};

export type ExpenseSummary = {
  readonly budgetAmount: number | null;
  readonly paidAmount: number;
  readonly plannedAmount: number;
  readonly expectedAmount: number;
  readonly remainingAmount: number | null;
};

export function expenseSummary(
  budgetAmount: number | null,
  expenses: readonly SummaryExpense[],
): ExpenseSummary {
  const paidAmount = expenses
    .filter((expense) => expense.payment_status === "paid")
    .reduce((total, expense) => total + expense.amount, 0);
  const plannedAmount = expenses
    .filter((expense) => expense.payment_status === "planned")
    .reduce((total, expense) => total + expense.amount, 0);
  const expectedAmount = paidAmount + plannedAmount;
  return {
    budgetAmount,
    expectedAmount,
    paidAmount,
    plannedAmount,
    remainingAmount: budgetAmount === null ? null : budgetAmount - expectedAmount,
  };
}

export function formatWon(amount: number): string {
  return `${new Intl.NumberFormat("ko-KR").format(amount)}원`;
}

export function parseAmount(value: FormDataEntryValue | null): number {
  const normalized = String(value ?? "").replaceAll(",", "").trim();
  return Number(normalized);
}

function nullableFormValue(value: FormDataEntryValue | null): string | null {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

export function budgetInputFromFormData(formData: FormData): BudgetInput {
  return budgetInputSchema.parse({
    projectId: formData.get("projectId"),
    budgetAmount: parseAmount(formData.get("budgetAmount")),
    currency: formData.get("currency"),
    memo: nullableFormValue(formData.get("memo")),
  });
}

export function expenseInputFromFormData(formData: FormData): ExpenseInput {
  return expenseInputSchema.parse({
    projectId: formData.get("projectId"),
    expenseId: nullableFormValue(formData.get("expenseId")) ?? undefined,
    reservationId: nullableFormValue(formData.get("reservationId")),
    title: formData.get("title"),
    category: formData.get("category"),
    amount: parseAmount(formData.get("amount")),
    expenseDate: formData.get("expenseDate"),
    paymentStatus: formData.get("paymentStatus"),
    memo: nullableFormValue(formData.get("memo")),
  });
}

export function reservationExpenseDefaults(type: ProjectReservationType): {
  readonly category: ExpenseCategory;
  readonly paymentStatus: PaymentStatus;
} {
  const categories: Record<ProjectReservationType, ExpenseCategory> = {
    badminton: "activity",
    custom: "other",
    flight: "transportation",
    hotel: "accommodation",
    rental_car: "transportation",
    restaurant: "food",
    ticket: "ticket",
    transportation: "transportation",
  };
  return { category: categories[type], paymentStatus: "planned" };
}
