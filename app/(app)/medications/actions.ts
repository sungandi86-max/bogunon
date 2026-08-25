"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { budgetSchema, medicationImportPayloadSchema, medicationItemSchema, purchasePlanSchema, receiptSchema } from "@/lib/medications/domain";
import { archiveMedicationItem, importMedicationRows, receiveMedication, saveBudget, saveMedicationItem, savePurchasePlan } from "@/lib/medications/repository";

export type MedicationActionState = { readonly status: "idle" | "success" | "error"; readonly message?: string };
const idle: MedicationActionState = { status: "idle" };
const value = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const nullable = (formData: FormData, key: string) => value(formData, key) || null;
async function userId(): Promise<string | null> { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); return user?.id ?? null; }
function refresh() { revalidatePath("/medications"); revalidatePath("/briefing"); }

export async function saveMedicationItemAction(_state: MedicationActionState = idle, formData: FormData): Promise<MedicationActionState> {
  const parsed = medicationItemSchema.safeParse({ id: value(formData, "id") || undefined, category: value(formData, "category"), name: value(formData, "name"), specification: value(formData, "specification"), unit: value(formData, "unit"), recommendedStock: value(formData, "recommendedStock"), initialQuantity: value(formData, "initialQuantity"), expirationDate: nullable(formData, "expirationDate"), managementTip: nullable(formData, "managementTip"), note: nullable(formData, "note") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  const id = await userId(); if (!id) return { status: "error", message: "로그인이 필요합니다." };
  try { await saveMedicationItem(id, parsed.data); refresh(); return { status: "success", message: "의약품 품목을 저장했습니다." }; } catch (error) { return { status: "error", message: error instanceof Error ? error.message : "품목을 저장하지 못했습니다." }; }
}
export async function importMedicationItemsAction(_state: MedicationActionState = idle, formData: FormData): Promise<MedicationActionState> {
  let payload: unknown;
  try { payload = JSON.parse(value(formData, "payload")); } catch { return { status: "error", message: "업로드 미리보기를 다시 확인해 주세요." }; }
  const parsed = medicationImportPayloadSchema.safeParse(payload);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "업로드할 행을 확인해 주세요." };
  if (!await userId()) return { status: "error", message: "로그인이 필요합니다." };
  try { const result = await importMedicationRows(parsed.data); refresh(); return { status: "success", message: `${result.createdItems}개 품목, ${result.createdLots}개 lot를 반영했습니다.${result.skippedDuplicates ? ` 중복 ${result.skippedDuplicates}건은 건너뛰었습니다.` : ""}` }; } catch (error) { return { status: "error", message: error instanceof Error ? error.message : "엑셀 재고를 반영하지 못했습니다." }; }
}
export async function archiveMedicationItemAction(formData: FormData): Promise<void> { const id = value(formData, "id"); if (id) { await archiveMedicationItem(id); refresh(); } }
export async function savePurchasePlanAction(_state: MedicationActionState = idle, formData: FormData): Promise<MedicationActionState> {
  const parsed = purchasePlanSchema.safeParse({ id: value(formData, "id") || undefined, itemId: value(formData, "itemId"), quantity: value(formData, "quantity"), expectedUnitPrice: value(formData, "expectedUnitPrice"), status: value(formData, "status") || "planned", note: nullable(formData, "note") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "구매 계획을 확인해 주세요." }; const id = await userId(); if (!id) return { status: "error", message: "로그인이 필요합니다." };
  try { await savePurchasePlan(id, parsed.data); refresh(); return { status: "success", message: "구매 계획을 저장했습니다." }; } catch (error) { return { status: "error", message: error instanceof Error ? error.message : "구매 계획을 저장하지 못했습니다." }; }
}
export async function saveBudgetAction(_state: MedicationActionState = idle, formData: FormData): Promise<MedicationActionState> { const parsed = budgetSchema.safeParse({ budgetYear: value(formData, "budgetYear"), name: value(formData, "name"), amount: value(formData, "amount"), memo: nullable(formData, "memo") }); if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "예산을 확인해 주세요." }; const id = await userId(); if (!id) return { status: "error", message: "로그인이 필요합니다." }; try { await saveBudget(id, parsed.data); refresh(); return { status: "success", message: "예산을 저장했습니다." }; } catch (error) { return { status: "error", message: error instanceof Error ? error.message : "예산을 저장하지 못했습니다." }; } }
export async function receiveMedicationAction(_state: MedicationActionState = idle, formData: FormData): Promise<MedicationActionState> { const parsed = receiptSchema.safeParse({ itemId: value(formData, "itemId"), purchasePlanId: nullable(formData, "purchasePlanId"), receivedAt: value(formData, "receivedAt"), quantity: value(formData, "quantity"), actualUnitPrice: value(formData, "actualUnitPrice"), expirationDate: value(formData, "expirationDate"), idempotencyKey: value(formData, "idempotencyKey") }); if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "입고 정보를 확인해 주세요." }; try { await receiveMedication(parsed.data); refresh(); return { status: "success", message: "입고를 재고와 예산에 반영했습니다." }; } catch (error) { return { status: "error", message: error instanceof Error ? error.message : "입고를 반영하지 못했습니다." }; } }
