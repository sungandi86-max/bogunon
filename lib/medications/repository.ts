import { createClient } from "@/lib/supabase/server";
import type { BudgetInput, MedicationBudget, MedicationImportInput, MedicationItem, MedicationItemInput, MedicationLot, MedicationPurchasePlan, MedicationReceipt, PurchasePlanInput, ReceiptInput } from "@/lib/medications/domain";
import type { MedicationBudgetRow, MedicationItemRow, MedicationLotRow, MedicationPurchasePlanRow, MedicationReceiptRow } from "@/types/database";

export class MedicationRepositoryError extends Error { readonly name = "MedicationRepositoryError"; }
async function ownedClient() { const supabase = await createClient(); const { data: { user }, error } = await supabase.auth.getUser(); if (error || !user) throw new MedicationRepositoryError("로그인이 필요합니다."); return { supabase, userId: user.id }; }
const mapItem = (row: MedicationItemRow): MedicationItem => ({ id: row.id, userId: row.user_id, category: row.category, name: row.name, specification: row.specification, unit: row.unit, recommendedStock: row.recommended_stock, managementTip: row.management_tip, note: row.note, active: row.active, createdAt: row.created_at, updatedAt: row.updated_at });
const mapLot = (row: MedicationLotRow): MedicationLot => ({ id: row.id, itemId: row.item_id, receiptId: row.receipt_id, quantity: row.quantity, expirationDate: row.expiration_date, receivedAt: row.received_at, unitPrice: row.unit_price });
const mapReceipt = (row: MedicationReceiptRow): MedicationReceipt => ({ id: row.id, itemId: row.item_id, purchasePlanId: row.purchase_plan_id, receivedAt: row.received_at, quantity: row.quantity, actualUnitPrice: row.actual_unit_price, expirationDate: row.expiration_date, inventoryAppliedAt: row.inventory_applied_at, createdAt: row.created_at });
const mapBudget = (row: MedicationBudgetRow): MedicationBudget => ({ id: row.id, budgetYear: row.budget_year, name: row.name, amount: row.amount, memo: row.memo });

export async function listMedicationData() {
  const { supabase, userId } = await ownedClient();
  const [itemsResult, lotsResult, plansResult, receiptsResult, budgetsResult] = await Promise.all([
    supabase.from("medication_items").select("*").eq("user_id", userId).eq("active", true).order("name"),
    supabase.from("medication_lots").select("*").eq("user_id", userId).order("expiration_date"),
    supabase.from("medication_purchase_plans").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("medication_receipts").select("*").eq("user_id", userId).order("received_at", { ascending: false }),
    supabase.from("medication_budgets").select("*").eq("user_id", userId).order("budget_year", { ascending: false }),
  ]);
  const error = itemsResult.error ?? lotsResult.error ?? plansResult.error ?? receiptsResult.error ?? budgetsResult.error;
  if (error) throw new MedicationRepositoryError("의약품 관리 데이터를 불러오지 못했습니다.");
  const receipts = (receiptsResult.data ?? []).map(mapReceipt); const receivedByPlan = new Map<string, number>();
  for (const receipt of receipts) if (receipt.purchasePlanId) receivedByPlan.set(receipt.purchasePlanId, (receivedByPlan.get(receipt.purchasePlanId) ?? 0) + receipt.quantity);
  const plans = (plansResult.data ?? []).map((row: MedicationPurchasePlanRow): MedicationPurchasePlan => ({ id: row.id, itemId: row.item_id, quantity: row.quantity, expectedUnitPrice: row.expected_unit_price, status: row.status, note: row.note, createdAt: row.created_at, receivedQuantity: receivedByPlan.get(row.id) ?? 0 }));
  return { items: (itemsResult.data ?? []).map(mapItem), lots: (lotsResult.data ?? []).map((row) => mapLot(row as MedicationLotRow)), plans, receipts, budgets: (budgetsResult.data ?? []).map(mapBudget) };
}
export async function saveMedicationItem(userId: string, input: MedicationItemInput): Promise<void> { const { supabase } = await ownedClient(); const fields = { category: input.category, name: input.name, specification: input.specification, unit: input.unit, recommended_stock: input.recommendedStock, management_tip: input.managementTip, note: input.note, active: true }; const result = input.id ? await supabase.from("medication_items").update(fields).eq("id", input.id).eq("user_id", userId).select("id").single() : await supabase.from("medication_items").insert({ user_id: userId, ...fields }).select("id").single(); if (result.error || !result.data) throw new MedicationRepositoryError("의약품 품목을 저장하지 못했습니다."); if (!input.id && input.initialQuantity > 0 && input.expirationDate) { const { error } = await supabase.from("medication_lots").insert({ user_id: userId, item_id: result.data.id, quantity: input.initialQuantity, expiration_date: input.expirationDate, received_at: new Date().toISOString().slice(0, 10), unit_price: 0 }); if (error) throw new MedicationRepositoryError("초기 재고를 저장하지 못했습니다."); } }
export async function importMedicationRows(rows: readonly MedicationImportInput[]): Promise<{ createdItems: number; createdLots: number; skippedDuplicates: number }> {
  const { supabase, userId } = await ownedClient();
  const [itemsResult, lotsResult] = await Promise.all([
    supabase.from("medication_items").select("*").eq("user_id", userId),
    supabase.from("medication_lots").select("*").eq("user_id", userId),
  ]);
  if (itemsResult.error || lotsResult.error) throw new MedicationRepositoryError("기존 의약품 데이터를 확인하지 못했습니다.");
  const items = (itemsResult.data ?? []).map((row) => row as MedicationItemRow);
  const lots = (lotsResult.data ?? []).map((row) => row as MedicationLotRow);
  const itemByKey = new Map(items.map((item) => [[item.name, item.specification, item.unit].join("|"), item]));
  let createdItems = 0;
  let createdLots = 0;
  let skippedDuplicates = 0;
  for (const row of rows) {
    const key = [row.name, row.specification, row.unit].join("|");
    let item = itemByKey.get(key);
    if (!item) {
      const result = await supabase.from("medication_items").insert({ user_id: userId, category: row.category, name: row.name, specification: row.specification, unit: row.unit, recommended_stock: row.recommendedStock, management_tip: row.managementTip, note: row.note, active: true }).select("*").single();
      if (result.error || !result.data) throw new MedicationRepositoryError("새 의약품 품목을 저장하지 못했습니다.");
      item = result.data as MedicationItemRow;
      itemByKey.set(key, item);
      items.push(item);
      createdItems += 1;
    }
    const duplicate = lots.some((lot) => lot.item_id === item?.id && lot.expiration_date === row.expirationDate && lot.quantity === row.quantity && lot.unit_price === 0);
    if (duplicate) {
      skippedDuplicates += 1;
      continue;
    }
    const result = await supabase.from("medication_lots").insert({ user_id: userId, item_id: item.id, quantity: row.quantity, expiration_date: row.expirationDate, received_at: row.receivedAt, unit_price: 0 }).select("*").single();
    if (result.error || !result.data) throw new MedicationRepositoryError("의약품 lot를 저장하지 못했습니다.");
    lots.push(result.data as MedicationLotRow);
    createdLots += 1;
  }
  return { createdItems, createdLots, skippedDuplicates };
}
export async function archiveMedicationItem(id: string): Promise<void> { const { supabase, userId } = await ownedClient(); const { error } = await supabase.from("medication_items").update({ active: false }).eq("id", id).eq("user_id", userId); if (error) throw new MedicationRepositoryError("의약품 품목을 보관 처리하지 못했습니다."); }
export async function savePurchasePlan(userId: string, input: PurchasePlanInput): Promise<void> { const { supabase } = await ownedClient(); const fields = { item_id: input.itemId, quantity: input.quantity, expected_unit_price: input.expectedUnitPrice, status: input.status, note: input.note }; const result = input.id ? await supabase.from("medication_purchase_plans").update(fields).eq("id", input.id).eq("user_id", userId) : await supabase.from("medication_purchase_plans").insert({ user_id: userId, ...fields }); if (result.error) throw new MedicationRepositoryError("구매 계획을 저장하지 못했습니다."); }
export async function saveBudget(userId: string, input: BudgetInput): Promise<void> { const { supabase } = await ownedClient(); const { error } = await supabase.from("medication_budgets").upsert({ user_id: userId, budget_year: input.budgetYear, name: input.name, amount: input.amount, memo: input.memo }, { onConflict: "user_id,budget_year" }); if (error) throw new MedicationRepositoryError("예산을 저장하지 못했습니다."); }
export async function receiveMedication(input: ReceiptInput): Promise<void> { const { supabase } = await ownedClient(); const { error } = await supabase.rpc("receive_medication", { p_item_id: input.itemId, p_purchase_plan_id: input.purchasePlanId, p_received_at: input.receivedAt, p_quantity: input.quantity, p_actual_unit_price: input.actualUnitPrice, p_expiration_date: input.expirationDate, p_idempotency_key: input.idempotencyKey }); if (error) throw new MedicationRepositoryError("입고를 반영하지 못했습니다."); }
