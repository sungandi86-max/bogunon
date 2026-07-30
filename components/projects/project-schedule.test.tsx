import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppShellCreateContext } from "@/components/layout/app-shell-create-context";
import { ProjectSchedule } from "@/components/projects/project-schedule";
import type { ProjectRow } from "@/types/database";

const project: ProjectRow = {
  id: "project-1",
  user_id: "user-1",
  name: "제주 여행",
  icon: "travel",
  color: "mint",
  description: null,
  start_date: null,
  end_date: null,
  created_at: "",
  updated_at: "",
};

describe("ProjectSchedule", () => {
  it("opens event creation with the current project as the default", () => {
    const openCreate = vi.fn();
    render(
      <AppShellCreateContext value={{ openCreate }}>
        <ProjectSchedule events={[]} project={project} />
      </AppShellCreateContext>,
    );

    fireEvent.click(screen.getByRole("button", { name: "일정 추가" }));

    expect(openCreate).toHaveBeenCalledWith(
      expect.any(HTMLButtonElement),
      "event",
      expect.objectContaining({
        kind: "event",
        projectId: project.id,
      }),
    );
    expect(screen.getByText("아직 일정이 없습니다.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "공항 출발" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "숙소 체크인" }));
    expect(openCreate).toHaveBeenLastCalledWith(
      expect.any(HTMLButtonElement),
      "event",
      expect.objectContaining({
        projectId: project.id,
        title: "숙소 체크인",
      }),
    );
  });
});
