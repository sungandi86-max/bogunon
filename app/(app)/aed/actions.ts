"use server";

import { revalidatePath } from "next/cache";

import { aedDeviceInputSchema } from "@/lib/aed/domain";
import { createAedDevice, deleteAedDevice, updateAedDevice } from "@/lib/aed/repository";

export type AedActionState = { readonly status: "idle" | "success" | "error"; readonly message?: string };

function value(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function nullableValue(formData: FormData, key: string): string | null {
  return value(formData, key) || null;
}

function parse(formData: FormData) {
  return aedDeviceInputSchema.safeParse({
    id: value(formData, "id") || undefined,
    name: value(formData, "name"),
    location: value(formData, "location"),
    batteryExpiryDate: nullableValue(formData, "batteryExpiryDate"),
    padExpiryDate: nullableValue(formData, "padExpiryDate"),
    lastInspectionDate: nullableValue(formData, "lastInspectionDate"),
    nextInspectionDate: nullableValue(formData, "nextInspectionDate"),
    inspectionIntervalMonths: Number(value(formData, "inspectionIntervalMonths") || 0),
    note: nullableValue(formData, "note"),
    sortOrder: Number(value(formData, "sortOrder") || 0),
  });
}

function refresh(): void {
  revalidatePath("/aed");
  revalidatePath("/briefing");
}

export async function saveAedDeviceAction(_state: AedActionState, formData: FormData): Promise<AedActionState> {
  const parsed = parse(formData);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "AED 정보를 확인해 주세요." };
  try {
    const { id, ...parsedValues } = parsed.data;
    const values = { ...parsedValues, sortOrder: parsedValues.sortOrder ?? 0 };
    if (id) await updateAedDevice(id, values);
    else {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { status: "error", message: "로그인이 필요합니다." };
      await createAedDevice(user.id, values);
    }
    refresh();
    return { status: "success", message: "AED 정보를 저장했습니다." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "AED 정보를 저장하지 못했습니다." };
  }
}

export async function deleteAedDeviceAction(formData: FormData): Promise<void> {
  const id = value(formData, "id");
  if (!id) return;
  await deleteAedDevice(id);
  refresh();
}
