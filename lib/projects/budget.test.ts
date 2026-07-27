import { describe, expect, it } from "vitest";

import {
  MAX_PROJECT_AMOUNT,
  budgetInputSchema,
  expenseInputSchema,
  expenseSummary,
  formatWon,
  reservationExpenseDefaults,
} from "@/lib/projects/budget";

const projectId = "11111111-1111-4111-8111-111111111111";

describe("project budget domain", () => {
  it("formats stored integer amounts as Korean won", () => {
    expect(formatWon(33_000)).toBe("33,000원");
    expect(formatWon(1_250_000)).toBe("1,250,000원");
  });

  it("rejects negative, fractional, and excessive budget amounts", () => {
    expect(budgetInputSchema.safeParse({
      budgetAmount: -1,
      currency: "KRW",
      memo: null,
      projectId,
    }).success).toBe(false);
    expect(budgetInputSchema.safeParse({
      budgetAmount: 10.5,
      currency: "KRW",
      memo: null,
      projectId,
    }).success).toBe(false);
    expect(budgetInputSchema.safeParse({
      budgetAmount: MAX_PROJECT_AMOUNT + 1,
      currency: "KRW",
      memo: null,
      projectId,
    }).success).toBe(false);
  });

  it("calculates paid, planned, expected, and remaining amounts", () => {
    const summary = expenseSummary(600_000, [
      { amount: 120_000, payment_status: "paid" },
      { amount: 33_000, payment_status: "paid" },
      { amount: 180_000, payment_status: "planned" },
      { amount: 85_000, payment_status: "planned" },
      { amount: 20_000, payment_status: "planned" },
    ]);

    expect(summary).toEqual({
      budgetAmount: 600_000,
      expectedAmount: 438_000,
      paidAmount: 153_000,
      plannedAmount: 285_000,
      remainingAmount: 162_000,
    });
  });

  it("reports an over-budget amount as a negative remainder", () => {
    const summary = expenseSummary(400_000, [
      { amount: 438_000, payment_status: "paid" },
    ]);

    expect(summary.remainingAmount).toBe(-38_000);
  });

  it("parses a valid direct expense without a reservation link", () => {
    const parsed = expenseInputSchema.parse({
      amount: 120_000,
      category: "transportation",
      expenseDate: "2026-08-04",
      memo: null,
      paymentStatus: "paid",
      projectId,
      reservationId: null,
      title: "항공권",
    });

    expect(parsed.amount).toBe(120_000);
    expect(parsed.reservationId).toBeNull();
  });

  it("maps reservation types to suggested expense defaults", () => {
    expect(reservationExpenseDefaults("flight")).toEqual({
      category: "transportation",
      paymentStatus: "planned",
    });
    expect(reservationExpenseDefaults("hotel").category).toBe("accommodation");
    expect(reservationExpenseDefaults("badminton").category).toBe("activity");
    expect(reservationExpenseDefaults("ticket").category).toBe("ticket");
  });
});
