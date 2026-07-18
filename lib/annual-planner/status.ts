import type { WorkItemKind } from "@/types/database";

export type AnnualExistingItem = {
  readonly kind: WorkItemKind;
  readonly title: string;
  readonly date: string | null;
  readonly completed: boolean;
};

export type AnnualPresetStatus = "none" | "added" | "scheduled" | "completed";

type AnnualPresetIdentity = {
  readonly title: string;
  readonly templateTitle: string;
};

export function annualPresetStatus(
  preset: AnnualPresetIdentity,
  existingItems: readonly AnnualExistingItem[],
  year: number,
): AnnualPresetStatus {
  const matches = existingItems.filter((item) => item.title === preset.title || item.title === preset.templateTitle);
  if (matches.some((item) => item.completed && item.date?.startsWith(`${year}-`))) return "completed";
  if (matches.some((item) => item.date?.startsWith(`${year}-`))) return "scheduled";
  if (matches.some((item) => item.date === null)) return "added";
  return "none";
}
