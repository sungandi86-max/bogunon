"use server";

import { revalidatePath } from "next/cache";

import { createAnnualPlannerCustomItem } from "@/lib/annual-planner/repository";

export type AnnualPlannerActionState = {
  readonly status: "idle" | "success" | "error";
  readonly message?: string;
};

function optionalText(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

export async function createAnnualPlannerCustomItemAction(
  _state: AnnualPlannerActionState,
  formData: FormData,
): Promise<AnnualPlannerActionState> {
  const month = Number(formData.get("month"));
  const title = String(formData.get("title") ?? "").trim();
  const rawItemKind = formData.get("itemKind");
  if (rawItemKind !== "task" && rawItemKind !== "event") {
    return { status: "error", message: "업무 또는 일정을 선택해 주세요." };
  }
  const itemKind = rawItemKind;
  const estimatedValue = optionalText(formData, "estimatedMinutes");
  const checklist = String(formData.get("checklist") ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  try {
    await createAnnualPlannerCustomItem({
      month,
      title,
      itemKind,
      description: optionalText(formData, "description"),
      estimatedMinutes: estimatedValue ? Number(estimatedValue) : null,
      checklist,
    });
    revalidatePath("/annual");
    return { status: "success", message: "내 업무를 추가했습니다." };
  } catch {
    return { status: "error", message: "입력 내용을 확인하거나 잠시 후 다시 시도해 주세요." };
  }
}
