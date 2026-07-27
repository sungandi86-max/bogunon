import { z } from "zod";

import type { ProjectChecklistItemRow } from "@/types/database";

export const checklistDueStatuses = ["none", "overdue", "today", "upcoming"] as const;
export type ChecklistDueStatus = (typeof checklistDueStatuses)[number];

const nullableDate = z.union([z.iso.date(), z.null()]);

export const createChecklistItemSchema = z.object({
  projectId: z.uuid(),
  title: z.string().trim().min(1, "체크리스트 항목을 입력해 주세요.").max(300, "항목은 300자 이내로 입력해 주세요."),
  dueDate: nullableDate,
});

export const updateChecklistItemSchema = z.object({
  projectId: z.uuid(),
  itemId: z.uuid(),
  title: z.string().trim().min(1).max(300).optional(),
  isCompleted: z.boolean().optional(),
  dueDate: nullableDate.optional(),
}).refine(
  ({ title, isCompleted, dueDate }) => title !== undefined || isCompleted !== undefined || dueDate !== undefined,
  "수정할 내용을 입력해 주세요.",
);

export const checklistItemTargetSchema = z.object({
  projectId: z.uuid(),
  itemId: z.uuid(),
});

export const checklistProjectTargetSchema = z.object({
  projectId: z.uuid(),
});

export const reorderChecklistItemsSchema = z.object({
  projectId: z.uuid(),
  itemIds: z.array(z.uuid()).max(500),
});

export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>;
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;
export type ChecklistItemTarget = z.infer<typeof checklistItemTargetSchema>;
export type ChecklistProjectTarget = z.infer<typeof checklistProjectTargetSchema>;
export type ReorderChecklistItemsInput = z.infer<typeof reorderChecklistItemsSchema>;

export function checklistDueStatus(dueDate: string | null, today: string): ChecklistDueStatus {
  if (!dueDate) return "none";
  if (dueDate < today) return "overdue";
  if (dueDate === today) return "today";
  return "upcoming";
}

export function normalizeChecklistOrder(
  items: readonly ProjectChecklistItemRow[],
): ProjectChecklistItemRow[] {
  return items.map((item, sortOrder) => ({ ...item, sort_order: sortOrder }));
}

export function placeChecklistItem(
  items: readonly ProjectChecklistItemRow[],
  itemId: string,
  targetId: string,
): ProjectChecklistItemRow[] {
  const currentIndex = items.findIndex((item) => item.id === itemId);
  const targetIndex = items.findIndex((item) => item.id === targetId);
  if (currentIndex < 0 || targetIndex < 0 || currentIndex === targetIndex) return [...items];
  const reordered = [...items];
  const [item] = reordered.splice(currentIndex, 1);
  if (!item) return [...items];
  reordered.splice(targetIndex, 0, item);
  return normalizeChecklistOrder(reordered);
}
