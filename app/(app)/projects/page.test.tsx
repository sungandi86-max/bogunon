import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/projects/repository", () => ({
  listProjects: vi.fn(async () => [{
    id: "project-1", user_id: "user-1", name: "2학기 보건교육", icon: "school", color: "mint",
    description: "교육 일정을 모읍니다.", start_date: "2026-08-01", end_date: "2026-12-31",
    created_at: "", updated_at: "",
  }]),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import ProjectsPage from "@/app/(app)/projects/page";

describe("projects page", () => {
  it("renders the account project list", async () => {
    render(await ProjectsPage());
    expect(screen.getByRole("heading", { name: "프로젝트", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /2학기 보건교육/ })).toHaveAttribute("href", "/projects/project-1");
    expect(screen.getByRole("button", { name: "프로젝트 만들기" })).toBeInTheDocument();
  });
});
