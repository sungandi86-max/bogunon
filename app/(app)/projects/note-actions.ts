"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  projectNoteInputSchema,
  projectNoteTargetSchema,
  projectNotesTargetSchema,
} from "@/lib/projects/notes";
import {
  deleteProjectNote,
  listProjectNotes,
  saveProjectNote,
} from "@/lib/projects/notes-repository";
import type { ProjectNoteRow } from "@/types/database";

export type NotesActionResult =
  | {
    readonly message: string;
    readonly note?: ProjectNoteRow;
    readonly notes?: readonly ProjectNoteRow[];
    readonly status: "success";
  }
  | { readonly message: string; readonly status: "error" };

function actionError(error: unknown, fallback: string): NotesActionResult {
  if (error instanceof z.ZodError) {
    return { message: error.issues[0]?.message ?? fallback, status: "error" };
  }
  if (error instanceof Error) return { message: error.message, status: "error" };
  return { message: fallback, status: "error" };
}

export async function loadProjectNotesAction(input: unknown): Promise<NotesActionResult> {
  try {
    const { projectId } = projectNotesTargetSchema.parse(input);
    return { message: "", notes: await listProjectNotes(projectId), status: "success" };
  } catch (error) {
    return actionError(error, "노트를 불러오지 못했습니다.");
  }
}

export async function saveProjectNoteAction(input: unknown): Promise<NotesActionResult> {
  try {
    const parsed = projectNoteInputSchema.parse(input);
    const note = await saveProjectNote(parsed);
    revalidatePath(`/projects/${parsed.projectId}`);
    return { message: "노트를 저장했습니다.", note, status: "success" };
  } catch (error) {
    return actionError(error, "노트를 저장하지 못했습니다.");
  }
}

export async function deleteProjectNoteAction(input: unknown): Promise<NotesActionResult> {
  try {
    const parsed = projectNoteTargetSchema.parse(input);
    await deleteProjectNote(parsed);
    revalidatePath(`/projects/${parsed.projectId}`);
    return { message: "노트를 삭제했습니다.", status: "success" };
  } catch (error) {
    return actionError(error, "노트를 삭제하지 못했습니다.");
  }
}
