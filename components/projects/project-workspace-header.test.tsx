import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProjectWorkspaceHeader } from "@/components/projects/project-workspace-header";
import type { EventRow, ProjectRow } from "@/types/database";

const project: ProjectRow = {
  id: "project-1",
  user_id: "user-1",
  name: "제주 여행",
  icon: "travel",
  color: "mint",
  description: null,
  start_date: "2026-08-04",
  end_date: "2026-08-06",
  created_at: "",
  updated_at: "",
};

const events: readonly EventRow[] = [];

describe("ProjectWorkspaceHeader", () => {
  it("shows type-specific travel milestones without changing the project schema", () => {
    render(
      <ProjectWorkspaceHeader
        checklistCount={0}
        eventCount={0}
        events={events}
        expenseCount={0}
        project={project}
        reservationCount={0}
        today="2026-07-30"
      />,
    );

    expect(screen.getByText("D-5")).toBeInTheDocument();
    expect(screen.getByText("출발일")).toBeInTheDocument();
    expect(screen.getByText("8월 4일")).toBeInTheDocument();
    expect(screen.getByText("귀가일")).toBeInTheDocument();
    expect(screen.getByText("8월 6일")).toBeInTheDocument();
  });

  it("guides projects without milestone data toward their first schedule", () => {
    render(
      <ProjectWorkspaceHeader
        checklistCount={0}
        eventCount={0}
        events={events}
        expenseCount={0}
        project={{ ...project, icon: "school", start_date: null, end_date: null }}
        reservationCount={0}
        today="2026-07-30"
      />,
    );

    expect(screen.getByText("일정을 추가하면 표시됩니다.")).toBeInTheDocument();
  });
});
