"use server";

import { revalidatePath } from "next/cache";

import { quickLinkIconKeys, quickLinkInputSchema } from "@/lib/quick-links/domain";
import { createQuickLink, deleteQuickLink, updateQuickLink } from "@/lib/quick-links/repository";
import { createClient } from "@/lib/supabase/server";

export type QuickLinkActionState = { readonly status: "idle" | "success" | "error"; readonly message?: string };

function value(formData: FormData, key: string): string { return String(formData.get(key) ?? "").trim(); }
function parse(formData: FormData) {
  return quickLinkInputSchema.safeParse({ id: value(formData, "id") || undefined, name: value(formData, "name"), url: value(formData, "url"), iconKey: quickLinkIconKeys.includes(value(formData, "iconKey") as typeof quickLinkIconKeys[number]) ? value(formData, "iconKey") : "web", sortOrder: Number(value(formData, "sortOrder") || 0), isVisible: formData.get("isVisible") === "on" });
}
function refresh(): void { revalidatePath("/briefing"); revalidatePath("/settings/quick-links"); }

export async function saveQuickLinkAction(_state: QuickLinkActionState, formData: FormData): Promise<QuickLinkActionState> {
  const parsed = parse(formData);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "링크 정보를 확인해 주세요." };
  try {
    const { id, ...values } = parsed.data;
    const { data: { user } } = await (await createClient()).auth.getUser();
    if (!user) return { status: "error", message: "로그인이 필요합니다." };
    if (id) await updateQuickLink(id, values);
    else await createQuickLink(user.id, values);
    refresh();
    return { status: "success", message: "링크를 저장했습니다." };
  } catch (error) { return { status: "error", message: error instanceof Error ? error.message : "링크를 저장하지 못했습니다." }; }
}

export async function deleteQuickLinkAction(formData: FormData): Promise<void> { const id = value(formData, "id"); if (!id) return; await deleteQuickLink(id); refresh(); }

export async function moveQuickLinkAction(formData: FormData): Promise<void> {
  const id = value(formData, "id");
  const direction = value(formData, "direction");
  if (!id || !["up", "down"].includes(direction)) return;
  const { listQuickLinks, updateQuickLink } = await import("@/lib/quick-links/repository");
  const links = await listQuickLinks();
  const index = links.findIndex((link) => link.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= links.length) return;
  const current = links[index];
  const neighbor = links[target];
  if (!current || !neighbor) return;
  await updateQuickLink(current.id, { name: current.name, url: current.url, iconKey: current.iconKey, sortOrder: neighbor.sortOrder, isVisible: current.isVisible });
  await updateQuickLink(neighbor.id, { name: neighbor.name, url: neighbor.url, iconKey: neighbor.iconKey, sortOrder: current.sortOrder, isVisible: neighbor.isVisible });
  refresh();
}
