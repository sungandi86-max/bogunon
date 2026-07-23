"use server";

import { revalidatePath } from "next/cache";

import { AcademicImportUnauthorizedError } from "@/lib/academic-calendar-import/repository";
import { clearUserSchoolSettings, upsertUserSchoolSettings } from "@/lib/neis/school-settings";
import { userSchoolSettingsSchema } from "@/lib/neis/user-school-settings";

export type SchoolSettingsActionResult = {
  readonly status: "success" | "error";
  readonly message: string;
};

function schoolSettingsError(error: unknown, fallback: string): SchoolSettingsActionResult {
  if (error instanceof AcademicImportUnauthorizedError) {
    return { status: "error", message: "로그인 후 학교 정보를 저장해 주세요." };
  }
  return { status: "error", message: error instanceof Error ? error.message : fallback };
}

export async function saveUserSchoolSettingsAction(input: unknown): Promise<SchoolSettingsActionResult> {
  const parsed = userSchoolSettingsSchema.safeParse(input);
  if (!parsed.success) return { status: "error", message: "선택한 학교 정보를 확인해 주세요." };
  try {
    await upsertUserSchoolSettings(parsed.data);
    revalidatePath("/settings");
    revalidatePath("/briefing");
    return { status: "success", message: "학교 설정이 저장되었습니다." };
  } catch (error) {
    return schoolSettingsError(error, "학교 정보를 저장하지 못했습니다.");
  }
}

export async function clearUserSchoolSettingsAction(): Promise<SchoolSettingsActionResult> {
  try {
    await clearUserSchoolSettings();
    revalidatePath("/settings");
    revalidatePath("/briefing");
    return { status: "success", message: "학교 정보를 초기화했습니다." };
  } catch (error) {
    return schoolSettingsError(error, "학교 정보를 초기화하지 못했습니다.");
  }
}
