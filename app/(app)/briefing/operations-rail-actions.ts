"use server";

import { revalidatePath } from "next/cache";

import { QUICK_NOTE_DESCRIPTION, isQuickNote } from "@/lib/briefing/quick-notes";
import { listTasks, removeWorkItem, saveEvent, saveTask, setTaskCompleted } from "@/lib/work-items/repository";

function refresh(): void {
  revalidatePath("/briefing");
  revalidatePath("/calendar");
}

export async function createQuickNoteAction(formData: FormData): Promise<void> {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  await saveTask({
    title,
    area: "personal",
    status: "planned",
    priority: "normal",
    category: "other",
    scheduled_date: null,
    due_date: null,
    follow_up_date: null,
    memo: null,
    description: QUICK_NOTE_DESCRIPTION,
    estimated_minutes: null,
    completed_at: null,
    recurrence_frequency: null,
  });
  refresh();
}

export async function toggleQuickNoteAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const note = (await listTasks()).find((task) => task.id === id && isQuickNote(task));
  if (!note) return;
  await setTaskCompleted(note.id, note.status !== "completed");
  refresh();
}

export async function deleteQuickNoteAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const note = (await listTasks()).find((task) => task.id === id && isQuickNote(task));
  if (!note) return;
  await removeWorkItem("tasks", note.id);
  refresh();
}

export async function convertQuickNoteToEventAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const date = String(formData.get("date") ?? "");
  if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  const note = (await listTasks()).find((task) => task.id === id && isQuickNote(task));
  if (!note) return;
  await saveEvent({
    title: note.title,
    area: "personal",
    start_date: date,
    end_date: date,
    is_all_day: true,
    start_time: null,
    end_time: null,
    location: null,
    color_key: "lavender",
    recurrence_frequency: null,
    recurrence_source_id: null,
    recurrence_date: null,
    recurrence_generated_through: null,
    memo: null,
    description: null,
  });
  await removeWorkItem("tasks", note.id);
  refresh();
}
