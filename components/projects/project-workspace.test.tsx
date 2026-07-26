import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProjectWorkspace } from "@/components/projects/project-workspace";
import type { ProjectRow } from "@/types/database";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

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
});
