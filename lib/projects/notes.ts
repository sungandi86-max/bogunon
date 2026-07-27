import { z } from "zod";

import type { ProjectNoteRow } from "@/types/database";

const projectIdSchema = z.string().uuid();
const noteIdSchema = z.string().uuid();

export const projectNotesTargetSchema = z.object({
  projectId: projectIdSchema,
});

export const projectNoteTargetSchema = z.object({
  noteId: noteIdSchema,
  projectId: projectIdSchema,
});

export const projectNoteInputSchema = z.object({
  content: z.string().max(100_000, "노트 본문은 100,000자 이내로 입력해 주세요."),
  isPinned: z.boolean(),
  noteId: noteIdSchema.nullable(),
  projectId: projectIdSchema,
  title: z.string().trim().min(1, "노트 제목을 입력해 주세요.").max(200, "노트 제목은 200자 이내로 입력해 주세요."),
});

export type ProjectNoteInput = z.infer<typeof projectNoteInputSchema>;
export type ProjectNoteTarget = z.infer<typeof projectNoteTargetSchema>;

export function sortProjectNotes(notes: readonly ProjectNoteRow[]): ProjectNoteRow[] {
  return [...notes].sort((left, right) => {
    if (left.is_pinned !== right.is_pinned) return left.is_pinned ? -1 : 1;
    return right.updated_at.localeCompare(left.updated_at);
  });
}

export function filterProjectNotes(
  notes: readonly ProjectNoteRow[],
  query: string,
): ProjectNoteRow[] {
  const normalized = query.trim().toLocaleLowerCase("ko-KR");
  if (!normalized) return sortProjectNotes(notes);
  return sortProjectNotes(notes).filter((note) => (
    note.title.toLocaleLowerCase("ko-KR").includes(normalized)
    || note.content.toLocaleLowerCase("ko-KR").includes(normalized)
  ));
}
