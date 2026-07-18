"use server";

import { revalidatePath } from "next/cache";

import {
  resetHealthPresetPreferences,
  saveHealthPresetPreferences,
} from "@/lib/work-items/health-preset-preferences-repository";
import type { HealthPresetPreference } from "@/lib/work-items/health-preset-personalization";

export type HealthPresetPreferenceActionState = {
  readonly status: "success" | "error";
  readonly message: string;
};

const affectedPaths = ["/tasks", "/annual", "/briefing", "/calendar"] as const;

function revalidatePresetSurfaces(): void {
  affectedPaths.forEach((path) => revalidatePath(path));
}

export async function saveHealthPresetPreferencesAction(
  preferences: readonly HealthPresetPreference[],
): Promise<HealthPresetPreferenceActionState> {
  try {
    await saveHealthPresetPreferences(preferences);
    revalidatePresetSurfaces();
    return { status: "success", message: "프리셋 설정을 저장했습니다." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "프리셋 설정을 저장하지 못했습니다." };
  }
}

export async function resetHealthPresetPreferencesAction(): Promise<HealthPresetPreferenceActionState> {
  try {
    await resetHealthPresetPreferences();
    revalidatePresetSurfaces();
    return { status: "success", message: "기본 순서로 복원했습니다." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "프리셋 설정을 초기화하지 못했습니다." };
  }
}
