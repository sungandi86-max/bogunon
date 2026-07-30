import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProjectWorkspace } from "@/components/projects/project-workspace";
import type { ProjectRow } from "@/types/database";

const { push, refresh } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("@/app/(app)/projects/actions", () => ({
  deleteProjectAction: vi.fn(),
  saveProjectAction: vi.fn(async () => ({
    status: "success",
    message: "프로젝트를 만들었습니다.",
    projectId: "created-project",
  })),
}));

const project: ProjectRow = {
  id: "project-1",
  user_id: "user-1",
  name: "학교 행사 준비",
  icon: "calendar",
  color: "blue",
  description: "행사 일정을 모읍니다.",
  start_date: "2026-08-01",
  end_date: "2026-08-31",
  created_at: "",
  updated_at: "",
};

describe("ProjectWorkspace", () => {
  it("opens create and edit forms while keeping the project detail link", () => {
    render(<ProjectWorkspace projects={[project]} />);
    expect(screen.getByRole("link", { name: /학교 행사 준비/ })).toHaveAttribute("href", "/projects/project-1");

    fireEvent.click(screen.getByRole("button", { name: "프로젝트 만들기" }));
    expect(screen.getByRole("heading", { name: "새 프로젝트" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "패널 닫기" }));

    fireEvent.click(screen.getByLabelText("학교 행사 준비 더보기"));
    fireEvent.click(screen.getByRole("button", { name: "수정" }));
    expect(screen.getByRole("heading", { name: "프로젝트 수정" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "프로젝트 이름" })).toHaveValue(project.name);
    expect(screen.getByRole("button", { name: "삭제" })).toBeInTheDocument();
  });

  it("opens the created project workspace immediately", async () => {
    render(<ProjectWorkspace projects={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "첫 프로젝트 만들기" }));
    fireEvent.change(screen.getByRole("textbox", { name: "프로젝트 이름" }), {
      target: { value: "제주 여행" },
    });
    const form = within(screen.getByRole("dialog"))
      .getByRole("button", { name: "프로젝트 생성" })
      .closest("form");
    if (!form) throw new Error("프로젝트 생성 폼이 필요합니다.");
    fireEvent.submit(form);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/projects/created-project"));
  });
});
