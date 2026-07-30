import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/projects/repository", () => ({
  getProject: vi.fn(async () => ({
    id: "project-1", user_id: "user-1", name: "학교 행사 준비", icon: "calendar", color: "mint",
    description: null, start_date: null, end_date: null, created_at: "", updated_at: "",
  })),
  listProjectEvents: vi.fn(async () => [{
    id: "event-1", user_id: "user-1", project_id: "project-1", title: "축제 준비",
    area: "schoolSchedule", start_date: "2026-09-01", end_date: "2026-09-01",
    is_all_day: false, start_time: "14:00:00", end_time: "15:00:00", location: "강당",
    memo: null, description: null, created_at: "", updated_at: "",
  }]),
}));

vi.mock("@/lib/projects/checklist-repository", () => ({
  listProjectChecklistItems: vi.fn(async () => []),
}));

vi.mock("@/lib/projects/reservation-repository", () => ({
  listProjectReservations: vi.fn(async () => []),
}));

vi.mock("@/lib/projects/budget-repository", () => ({
  listProjectBudget: vi.fn(async () => null),
  listProjectExpenses: vi.fn(async () => []),
}));

import ProjectDetailPage from "@/app/(app)/projects/[...slug]/page";
import { AppShellCreateContext } from "@/components/layout/app-shell-create-context";

describe("project detail page", () => {
  it("shows only repository-provided project events", async () => {
    render(
      <AppShellCreateContext.Provider value={{ openCreate: vi.fn() }}>
        {await ProjectDetailPage({ params: Promise.resolve({ slug: ["project-1"] }) })}
      </AppShellCreateContext.Provider>,
    );
    expect(screen.getByRole("heading", { name: "학교 행사 준비", level: 1 })).toBeInTheDocument();
    const statistics = within(screen.getByLabelText("프로젝트 통계"));
    expect(statistics.getByText("일정").nextElementSibling).toHaveTextContent("1");
    expect(statistics.getByText("체크리스트").nextElementSibling).toHaveTextContent("0");
    expect(statistics.getByText("예약").nextElementSibling).toHaveTextContent("0");
    expect(statistics.getByText("지출").nextElementSibling).toHaveTextContent("0");
    expect(screen.getByRole("tab", { name: "개요" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("오늘 일정이 없습니다.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "일정" }));
    expect(screen.getByRole("link", { name: /축제 준비/ })).toHaveAttribute("href", "/calendar?date=2026-09-01&highlight=event-1");
    expect(screen.getByText("14:00 ~ 15:00")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "체크리스트" }));
    expect(screen.getByRole("heading", { name: "체크리스트 0/0" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "예약" }));
    expect(screen.getByRole("heading", { name: "예약 0" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "예산" }));
    expect(screen.getByRole("heading", { name: "예산" })).toBeInTheDocument();
  });
});
