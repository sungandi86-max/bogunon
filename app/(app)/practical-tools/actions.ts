"use server";

import { revalidatePath } from "next/cache";
import { createPracticalTool, deletePracticalTool, updatePracticalTool } from "@/lib/practical-tools/repository";
import { createClient } from "@/lib/supabase/server";
import type { PracticalToolIconKey } from "@/types/database";

export type PracticalToolActionState = { readonly status: "idle" | "success" | "error"; readonly message?: string };
const icons: readonly PracticalToolIconKey[] = ["online_health", "spreadsheet", "drive", "school_system", "website", "other"];
function value(formData: FormData, key: string): string { return String(formData.get(key) ?? "").trim(); }
function parse(formData: FormData): { name: string; description: string | null; url: string; icon_key: PracticalToolIconKey; is_active: boolean } | string {
  const name = value(formData, "name");
  const url = value(formData, "url");
  const icon = value(formData, "iconKey") as PracticalToolIconKey;
  if (!name || name.length > 80) return "도구 이름을 확인해 주세요.";
  if (url.startsWith("/") && !url.startsWith("//")) return { name, description: value(formData, "description") || null, url, icon_key: icons.includes(icon) ? icon : "other", is_active: formData.has("isActive") };
  try { if (!/^https?:$/i.test(new URL(url).protocol)) return "http 또는 https 주소만 사용할 수 있습니다."; } catch { return "URL을 확인해 주세요."; }
  return { name, description: value(formData, "description") || null, url, icon_key: icons.includes(icon) ? icon : "other", is_active: formData.has("isActive") };
}
function refresh(): void { revalidatePath("/settings/practical-tools"); revalidatePath("/practical-schedules"); }

export async function savePracticalToolAction(_state: PracticalToolActionState, formData: FormData): Promise<PracticalToolActionState> {
  const parsed = parse(formData);
  if (typeof parsed === "string") return { status: "error", message: parsed };
  try {
    const { data: { user } } = await (await createClient()).auth.getUser();
    if (!user) return { status: "error", message: "로그인이 필요합니다." };
    const id = value(formData, "id");
    if (id) await updatePracticalTool(id, parsed);
    else await createPracticalTool(user.id, parsed);
    refresh();
    return { status: "success", message: "내 도구를 저장했습니다." };
  } catch (error) { return { status: "error", message: error instanceof Error ? error.message : "내 도구를 저장하지 못했습니다." }; }
}
export async function deletePracticalToolAction(formData: FormData): Promise<void> { const id = value(formData, "id"); if (!id) return; await deletePracticalTool(id); refresh(); }
