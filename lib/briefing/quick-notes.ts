import type { TaskRow } from "@/types/database";

export const QUICK_NOTE_DESCRIPTION = "[bogunon:quick-note]";

export function isQuickNote(task: TaskRow): boolean {
  return task.description === QUICK_NOTE_DESCRIPTION;
}
