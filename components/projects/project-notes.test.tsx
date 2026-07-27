import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ProjectNoteRow } from "@/types/database";

const mocks = vi.hoisted(() => ({
  deleteNote: vi.fn(),
  loadNotes: vi.fn(),
  saveNote: vi.fn(),
}));

vi.mock("@/app/(app)/projects/note-actions", () => ({
  deleteProjectNoteAction: mocks.deleteNote,
  loadProjectNotesAction: mocks.loadNotes,
  saveProjectNoteAction: mocks.saveNote,
}));

import { ProjectNotes } from "@/components/projects/project-notes";

const projectId = "22222222-2222-4222-8222-222222222222";
const pinnedNote: ProjectNoteRow = {
  id: "33333333-3333-4333-8333-333333333333",
  user_id: "user-1",
  project_id: projectId,
  title: "제주 여행 계획",
  content: "숙소 예약 확인",
  is_pinned: true,
  created_at: "2026-07-27T09:00:00Z",
  updated_at: "2026-07-27T10:00:00Z",
};
const meetingNote: ProjectNoteRow = {
  id: "44444444-4444-4444-8444-444444444444",
  user_id: "user-1",
  project_id: projectId,
  title: "강의 준비 회의록",
  content: "교안 구성 검토",
  is_pinned: false,
  created_at: "2026-07-28T09:00:00Z",
  updated_at: "2026-07-28T11:00:00Z",
};

describe("ProjectNotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadNotes.mockResolvedValue({
      message: "",
      notes: [pinnedNote, meetingNote],
      status: "success",
    });
  });

  it("loads once, sorts pinned notes first, and filters title and content", async () => {
    render(<ProjectNotes projectId={projectId} />);

    expect(await screen.findByRole("button", { name: /제주 여행 계획/ })).toBeInTheDocument();
    const list = screen.getByLabelText("프로젝트 노트 목록");
    expect(within(list).getAllByRole("button").map((button) => button.textContent)).toEqual([
      expect.stringContaining("제주 여행 계획"),
      expect.stringContaining("강의 준비 회의록"),
    ]);
    expect(mocks.loadNotes).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByRole("searchbox", { name: "노트 검색" }), {
      target: { value: "교안" },
    });
    expect(screen.queryByRole("button", { name: /제주 여행 계획/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /강의 준비 회의록/ })).toBeInTheDocument();
  });

  it("creates and saves a note with Enter from the title field", async () => {
    const created = {
      ...meetingNote,
      id: "55555555-5555-4555-8555-555555555555",
      title: "AI 업무 자동화",
      content: "# 아이디어",
    };
    mocks.saveNote.mockResolvedValue({
      message: "노트를 저장했습니다.",
      note: created,
      status: "success",
    });
    render(<ProjectNotes projectId={projectId} />);
    await screen.findByRole("button", { name: /제주 여행 계획/ });

    fireEvent.click(screen.getByRole("button", { name: "새 노트" }));
    fireEvent.change(screen.getByRole("textbox", { name: "노트 제목" }), {
      target: { value: "AI 업무 자동화" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "노트 본문" }), {
      target: { value: "# 아이디어" },
    });
    fireEvent.keyDown(screen.getByRole("textbox", { name: "노트 제목" }), { key: "Enter" });

    await waitFor(() => expect(mocks.saveNote).toHaveBeenCalledWith({
      content: "# 아이디어",
      isPinned: false,
      noteId: null,
      projectId,
      title: "AI 업무 자동화",
    }));
    expect(await screen.findByText("노트를 저장했습니다.")).toBeInTheDocument();
  });

  it("updates pin state, previews Markdown, deletes a note, and returns to the mobile list", async () => {
    mocks.saveNote.mockResolvedValue({
      message: "노트를 저장했습니다.",
      note: { ...meetingNote, is_pinned: true, title: "강의 아이디어" },
      status: "success",
    });
    mocks.deleteNote.mockResolvedValue({ message: "노트를 삭제했습니다.", status: "success" });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<ProjectNotes projectId={projectId} />);

    fireEvent.click(await screen.findByRole("button", { name: /강의 준비 회의록/ }));
    fireEvent.change(screen.getByRole("textbox", { name: "노트 제목" }), {
      target: { value: "강의 아이디어" },
    });
    fireEvent.click(screen.getByRole("button", { name: "노트 고정" }));
    fireEvent.click(screen.getByRole("button", { name: "미리보기" }));
    expect(
      within(screen.getByLabelText("노트 미리보기")).getByText("교안 구성 검토"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "노트 저장" }));
    await waitFor(() => expect(mocks.saveNote).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "노트 삭제" }));
    await waitFor(() => expect(mocks.deleteNote).toHaveBeenCalledWith({
      noteId: meetingNote.id,
      projectId,
    }));
    fireEvent.click(screen.getByRole("button", { name: "노트 목록으로" }));
    expect(screen.getByLabelText("프로젝트 노트 목록")).toBeInTheDocument();
  });
});
