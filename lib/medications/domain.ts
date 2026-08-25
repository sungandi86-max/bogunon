import { z } from "zod";

export const MEDICATION_CATEGORIES = ["internal", "external", "supplies", "other"] as const;
export type MedicationCategory = (typeof MEDICATION_CATEGORIES)[number];
export const medicationCategoryLabels: Record<MedicationCategory, string> = {
  internal: "내복약",
  external: "외용제",
  supplies: "소모품",
  other: "기타",
};
export const PURCHASE_STATUSES = ["planned", "ordered", "partially_received", "received", "cancelled"] as const;
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];
export const purchaseStatusLabels: Record<PurchaseStatus, string> = {
  planned: "구매 예정",
  ordered: "품의/주문 완료",
  partially_received: "부분 입고",
  received: "입고 완료",
  cancelled: "취소",
};

export const medicationItemSchema = z.object({
  id: z.string().uuid().optional(),
  category: z.enum(MEDICATION_CATEGORIES),
  name: z.string().trim().min(1, "품명을 입력해 주세요.").max(160),
  specification: z.string().trim().max(160),
  unit: z.string().trim().max(40),
  recommendedStock: z.coerce.number().int().min(0),
  initialQuantity: z.coerce.number().int().min(0),
  expirationDate: z.string().date().nullable(),
  managementTip: z.string().trim().max(1000).nullable(),
  note: z.string().trim().max(2000).nullable(),
});
export type MedicationItemInput = z.infer<typeof medicationItemSchema>;

export const purchasePlanSchema = z.object({
  id: z.string().uuid().optional(),
  itemId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
  expectedUnitPrice: z.coerce.number().int().min(0),
  status: z.enum(PURCHASE_STATUSES),
  note: z.string().trim().max(2000).nullable(),
});
export type PurchasePlanInput = z.infer<typeof purchasePlanSchema>;

export const receiptSchema = z.object({
  itemId: z.string().uuid(),
  purchasePlanId: z.string().uuid().nullable(),
  receivedAt: z.string().date(),
  quantity: z.coerce.number().int().positive(),
  actualUnitPrice: z.coerce.number().int().min(0),
  expirationDate: z.string().date(),
  idempotencyKey: z.string().trim().min(1).max(120),
});
export type ReceiptInput = z.infer<typeof receiptSchema>;

export const budgetSchema = z.object({
  budgetYear: z.coerce.number().int().min(2000).max(2100),
  name: z.string().trim().min(1).max(160),
  amount: z.coerce.number().int().min(0),
  memo: z.string().trim().max(2000).nullable(),
});
export type BudgetInput = z.infer<typeof budgetSchema>;

export type MedicationItem = { readonly id: string; readonly userId: string; readonly category: MedicationCategory; readonly name: string; readonly specification: string; readonly unit: string; readonly recommendedStock: number; readonly managementTip: string | null; readonly note: string | null; readonly active: boolean; readonly createdAt: string; readonly updatedAt: string };
export type MedicationLot = { readonly id: string; readonly itemId: string; readonly receiptId: string | null; readonly quantity: number; readonly expirationDate: string; readonly receivedAt: string; readonly unitPrice: number; };
export type MedicationPurchasePlan = { readonly id: string; readonly itemId: string; readonly quantity: number; readonly expectedUnitPrice: number; readonly status: PurchaseStatus; readonly note: string | null; readonly createdAt: string; readonly receivedQuantity: number };
export type MedicationReceipt = { readonly id: string; readonly itemId: string; readonly purchasePlanId: string | null; readonly receivedAt: string; readonly quantity: number; readonly actualUnitPrice: number; readonly expirationDate: string; readonly inventoryAppliedAt: string; readonly createdAt: string };
export type MedicationBudget = { readonly id: string; readonly budgetYear: number; readonly name: string; readonly amount: number; readonly memo: string | null };

export type InventoryItem = MedicationItem & { readonly lots: readonly MedicationLot[]; readonly currentStock: number; readonly nearestExpiration: string | null; readonly daysUntilExpiration: number | null; readonly safetyStatus: "expired" | "replacementSoon" | "normal"; readonly stockStatus: "shortage" | "sufficient" };

function daysUntil(today: string, date: string | null): number | null {
  if (!date) return null;
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

export function deriveInventoryItem(item: MedicationItem, lots: readonly MedicationLot[], today: string): InventoryItem {
  const itemLots = lots.filter((lot) => lot.itemId === item.id).sort((a, b) => a.expirationDate.localeCompare(b.expirationDate));
  const nearestExpiration = itemLots[0]?.expirationDate ?? null;
  const days = daysUntil(today, nearestExpiration);
  const safetyStatus = days !== null && days < 0 ? "expired" : days !== null && days <= 90 ? "replacementSoon" : "normal";
  const currentStock = itemLots.reduce((sum, lot) => sum + lot.quantity, 0);
  return { ...item, lots: itemLots, currentStock, nearestExpiration, daysUntilExpiration: days, safetyStatus, stockStatus: currentStock < item.recommendedStock ? "shortage" : "sufficient" };
}

export function inventoryPriority(item: InventoryItem): number {
  if (item.safetyStatus === "expired") return 0;
  if (item.safetyStatus === "replacementSoon") return 1;
  if (item.stockStatus === "shortage") return 2;
  return 3;
}

export function calculatePurchaseAmount(quantity: number, unitPrice: number): number { return quantity * unitPrice; }
export function calculateExecutionAmount(receipts: readonly MedicationReceipt[]): number { return receipts.reduce((sum, receipt) => sum + receipt.quantity * receipt.actualUnitPrice, 0); }
export function calculateBudgetBalance(budget: MedicationBudget | null, receipts: readonly MedicationReceipt[]): number { return (budget?.amount ?? 0) - calculateExecutionAmount(receipts); }
