"use server";

import { revalidatePath } from "next/cache";

import { settingsInputSchema } from "@/lib/settings/domain";
import { upsertUserSettings } from "@/lib/settings/repository";

export type SettingsActionState = { readonly status: "idle" | "success" | "error"; readonly message?: string };

export async function saveSettingsAction(_state: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const parsed = settingsInputSchema.safeParse({
    weekStartsOn: String(formData.get("weekStartsOn") ?? ""),
    defaultEventMinutes: Number(formData.get("defaultEventMinutes")),
    eventRemindersEnabled: formData.get("eventRemindersEnabled") === "on",
    taskDueRemindersEnabled: formData.get("taskDueRemindersEnabled") === "on",
    exerciseEnabled: formData.get("exerciseEnabled") === "on",
    writingAssistanceEnabled: formData.get("writingAssistanceEnabled") === "on",
    displayDensity: String(formData.get("displayDensity") ?? ""),
  });
  if (!parsed.success) return { status: "error", message: "설정 값을 확인해 주세요." };
  try {
    await upsertUserSettings(parsed.data);
    revalidatePath("/settings");
    return { status: "success", message: "설정을 저장했습니다." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "설정을 저장하지 못했습니다." };
  }
}
