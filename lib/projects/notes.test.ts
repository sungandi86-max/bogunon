import { describe, expect, it } from "vitest";

import {
  filterProjectNotes,
  projectNoteInputSchema,
  sortProjectNotes,
} from "@/lib/projects/notes";
import type { ProjectNoteRow } from "@/types/database";

const notes: readonly ProjectNoteRow[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    user_id: "user-1",
    project_id: "22222222-2222-4222-8222-222222222222",
    title: "최근 회의록",
    content: "다음 주 실행 항목",
    is_pinned: false,
    created_at: "2026-07-28T09:00:00Z",
    updated_at: "2026-07-28T11:00:00Z",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    user_id: "user-1",
    project_id: "22222222-2222-4222-8222-222222222222",
    title: "제주 여행 계획",
    content: "숙소 예약 확인",
    is_pinned: true,
    created_at: "2026-07-27T09:00:00Z",
    updated_at: "2026-07-27T10:00:00Z",
  },
];

describe("project notes domain", () => {
  it("sorts pinned notes before recently updated notes", () => {
    expect(sortProjectNotes(notes).map((note) => note.title)).toEqual([
      "제주 여행 계획",
      "최근 회의록",
    ]);
  });

  it("filters notes by title or content without changing the source", () => {
    expect(filterProjectNotes(notes, "회의").map((note) => note.title)).toEqual(["최근 회의록"]);
    expect(filterProjectNotes(notes, "숙소").map((note) => note.title)).toEqual(["제주 여행 계획"]);
    expect(notes).toHaveLength(2);
  });

  it("parses a bounded note payload at the action boundary", () => {
    const result = projectNoteInputSchema.safeParse({
      content: "- [ ] 항공권 확인",
      isPinned: true,
      noteId: null,
      projectId: "22222222-2222-4222-8222-222222222222",
      title: "  제주 여행 계획  ",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title).toBe("제주 여행 계획");
  });
});
