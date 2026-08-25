import { describe, expect, it } from "vitest";
import { calculateBudgetBalance, calculateExecutionAmount, calculatePurchaseAmount, deriveInventoryItem, inventoryPriority, type MedicationItem, type MedicationLot, type MedicationReceipt } from "@/lib/medications/domain";

const item: MedicationItem = { id: "00000000-0000-0000-0000-000000000001", userId: "00000000-0000-0000-0000-000000000002", category: "internal", name: "테스트 약", specification: "10정", unit: "BOX", recommendedStock: 10, managementTip: null, note: null, active: true, createdAt: "", updatedAt: "" };
const lot = (quantity: number, expirationDate: string, receivedAt = "2026-01-01"): MedicationLot => ({ id: crypto.randomUUID(), itemId: item.id, receiptId: null, quantity, expirationDate, receivedAt, unitPrice: 1000 });

describe("medication domain", () => {
  it("derives expired, near-expiry and shortage states without storing them", () => {
    const expired = deriveInventoryItem(item, [lot(3, "2026-08-01")], "2026-08-25");
    const near = deriveInventoryItem(item, [lot(3, "2026-10-01")], "2026-08-25");
    const normal = deriveInventoryItem(item, [lot(12, "2027-08-01")], "2026-08-25");
    expect(expired.safetyStatus).toBe("expired"); expect(near.safetyStatus).toBe("replacementSoon"); expect(normal.stockStatus).toBe("sufficient"); expect(inventoryPriority(expired)).toBeLessThan(inventoryPriority(near));
  });
  it("keeps same-expiry lots separate and aggregates stock", () => { const rows = deriveInventoryItem(item, [lot(4, "2027-01-01", "2026-01-01"), lot(6, "2027-01-01", "2026-02-01")], "2026-08-25"); expect(rows.lots).toHaveLength(2); expect(rows.currentStock).toBe(10); });
  it("calculates purchase and execution totals", () => { expect(calculatePurchaseAmount(5, 6500)).toBe(32500); const receipts: MedicationReceipt[] = [{ id: "r", itemId: item.id, purchasePlanId: null, receivedAt: "2026-03-01", quantity: 10, actualUnitPrice: 5000, expirationDate: "2027-01-01", inventoryAppliedAt: "", createdAt: "" }]; expect(calculateExecutionAmount(receipts)).toBe(50000); expect(calculateBudgetBalance({ id: "b", budgetYear: 2026, name: "", amount: 100000, memo: null }, receipts)).toBe(50000); });
});
