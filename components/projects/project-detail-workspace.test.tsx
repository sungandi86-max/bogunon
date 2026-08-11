import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectWorkspaceShell } from "@/components/projects/project-detail-workspace";
import { ProjectWorkspaceOverview } from "@/components/projects/project-workspace-overview";
import { AppShellCreateContext } from "@/components/layout/app-shell-create-context";

const project = {
  id: "project-1",
  user_id: "user-1",
  name: "제주 여행",
  icon: "travel" as const,
  color: "mint" as const,
  description: null,
  start_date: null,
  end_date: null,
  created_at: "",
  updated_at: "",
};

const panels = {
  overview: <p>개요 내용</p>,
  schedule: <p>일정 내용</p>,
  checklist: <p>체크리스트 내용</p>,
  reservations: <p>예약 내용</p>,
  budget: <p>예산 내용</p>,
  notes: <p>노트 내용</p>,
  files: <p>파일 내용</p>,
  map: <p>지도 내용</p>,
};
const travelPanels = { ...panels, projectType: "travel" as const };

describe("project detail workspace", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/projects/project-1");
  });

  it("opens overview by default and keeps every loaded panel mounted", () => {
    render(<ProjectWorkspaceShell {...travelPanels} />);

    expect(screen.getByRole("tab", { name: "개요" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "개요" })).toBeVisible();
    expect(screen.getByText("예약 내용")).toBeInTheDocument();
    expect(screen.getByText("예약 내용").closest("[role=tabpanel]")).toHaveAttribute("hidden");
  });

  it("writes the active tab to the hash and restores it after refresh", () => {
    const { unmount } = render(<ProjectWorkspaceShell {...travelPanels} />);

    fireEvent.click(screen.getByRole("tab", { name: "예약" }));
    expect(window.location.hash).toBe("#reservations");
    expect(screen.getByRole("tabpanel", { name: "예약" })).toBeVisible();

    unmount();
    render(<ProjectWorkspaceShell {...travelPanels} />);
    expect(screen.getByRole("tab", { name: "예약" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "예약" })).toBeVisible();
  });

  it("supports arrow-key tab navigation", () => {
    render(<ProjectWorkspaceShell {...travelPanels} />);

    const overviewTab = screen.getByRole("tab", { name: "개요" });
    fireEvent.keyDown(overviewTab, { key: "ArrowRight" });

    expect(screen.getByRole("tab", { name: "일정" })).toHaveAttribute("aria-selected", "true");
    expect(window.location.hash).toBe("#schedule");
  });

  it("mounts notes on first activation and reuses the mounted panel", () => {
    render(<ProjectWorkspaceShell {...travelPanels} />);

    expect(screen.queryByText("노트 내용")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "더보기" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "노트" }));
    expect(screen.getByText("노트 내용")).toBeVisible();
    expect(window.location.hash).toBe("#notes");

    fireEvent.click(screen.getByRole("tab", { name: "개요" }));
    expect(screen.getByText("노트 내용")).toBeInTheDocument();
    expect(screen.getByText("노트 내용").closest("[role=tabpanel]")).toHaveAttribute("hidden");
  });

  it("mounts files on first activation, restores #files, and reuses the mounted panel", () => {
    const { unmount } = render(<ProjectWorkspaceShell {...travelPanels} />);

    expect(screen.queryByText("파일 내용")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "파일" }));
    expect(screen.getByText("파일 내용")).toBeVisible();
    expect(window.location.hash).toBe("#files");

    fireEvent.click(screen.getByRole("tab", { name: "개요" }));
    expect(screen.getByText("파일 내용")).toBeInTheDocument();
    expect(screen.getByText("파일 내용").closest("[role=tabpanel]")).toHaveAttribute("hidden");

    window.history.replaceState(null, "", "/projects/project-1#files");
    unmount();
    render(<ProjectWorkspaceShell {...travelPanels} />);
    expect(screen.getByRole("tab", { name: "파일" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "파일" })).toBeVisible();
  });

  it("mounts the map on first activation and restores #map", () => {
    const { unmount } = render(<ProjectWorkspaceShell {...travelPanels} />);
    expect(screen.queryByText("지도 내용")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "지도" }));
    expect(screen.getByText("지도 내용")).toBeVisible();
    expect(window.location.hash).toBe("#map");
    unmount();
    render(<ProjectWorkspaceShell {...travelPanels} />);
    expect(screen.getByRole("tabpanel", { name: "지도" })).toBeVisible();
  });

  it("shows travel priorities first and keeps notes in an accessible overflow menu", () => {
    render(<ProjectWorkspaceShell {...travelPanels} />);

    expect(screen.getAllByRole("tab").map((tab) => tab.getAttribute("aria-label"))).toEqual([
      "개요", "일정", "예약", "지도", "체크리스트", "예산", "파일",
    ]);
    const more = screen.getByRole("button", { name: "더보기" });
    fireEvent.click(more);
    expect(more).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("menuitem", { name: "노트" }));
    expect(window.location.hash).toBe("#notes");
    expect(screen.getByRole("tabpanel", { name: "노트" })).toBeVisible();
    expect(screen.getByRole("button", { name: "더보기, 현재 노트" })).toHaveAttribute("aria-current", "page");
  });

  it("uses the school priority without changing panel loading", () => {
    render(<ProjectWorkspaceShell {...panels} projectType="school" />);
    expect(screen.getAllByRole("tab").map((tab) => tab.getAttribute("aria-label"))).toEqual([
      "개요", "일정", "체크리스트", "노트", "파일", "예산", "예약", "지도",
    ]);
    expect(screen.queryByRole("button", { name: "더보기" })).not.toBeInTheDocument();
  });

  it("summarizes project status in next-event, reservation, checklist, budget, and activity order", () => {
    render(
      <AppShellCreateContext value={{ openCreate: vi.fn() }}>
        <ProjectWorkspaceOverview
          budget={{
            id: "budget-1", user_id: "user-1", project_id: "project-1", budget_amount: 600_000,
            currency: "KRW", memo: null, created_at: "", updated_at: "",
          }}
          checklistItems={[
            {
              id: "item-1", user_id: "user-1", project_id: "project-1", title: "완료",
              is_completed: true, sort_order: 0, due_date: null, created_at: "", updated_at: "",
            },
            {
              id: "item-2", user_id: "user-1", project_id: "project-1", title: "진행",
              is_completed: false, sort_order: 1, due_date: null, created_at: "", updated_at: "",
            },
          ]}
          events={[{
            id: "event-1", user_id: "user-1", project_id: "project-1", title: "출발 준비",
            area: "project", start_date: "2026-07-28", end_date: "2026-07-28", is_all_day: false,
            start_time: "09:00:00", end_time: null, memo: null, description: null, created_at: "", updated_at: "",
          }]}
          expenses={[
            {
              id: "expense-1", user_id: "user-1", project_id: "project-1", reservation_id: null,
              title: "결제", category: "fee", amount: 438_000, expense_date: "2026-07-28",
              payment_status: "paid", memo: null, created_at: "", updated_at: "",
            },
          ]}
          project={project}
          reservations={[{
            id: "reservation-1", user_id: "user-1", project_id: "project-1", type: "hotel",
            title: "MJ Resort", reservation_date: "2026-08-05", start_time: null, end_time: null,
            end_date: null,
            company: null, confirmation_number: null, location: null, phone: null, website: null,
            memo: null, linked_event_id: null, created_at: "", updated_at: "",
          }]}
          today="2026-07-28"
        />
      </AppShellCreateContext>,
    );

    expect(screen.getByRole("heading", { name: "다음 일정" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /09:00.*출발 준비/ })).toBeInTheDocument();
    expect(screen.getByText("1 / 2 완료")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "체크리스트 1/2 완료" })).toHaveValue(1);
    expect(screen.getByText("MJ Resort")).toBeInTheDocument();
    expect(screen.getByText("600,000원")).toBeInTheDocument();
    expect(screen.getByText("438,000원")).toBeInTheDocument();
    expect(screen.getByText("162,000원")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "최근 활동" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "프로젝트 빠른 작업" })).toBeInTheDocument();
  });

  it("offers direct next actions when the workspace has no linked data", () => {
    const openCreate = vi.fn();
    render(
      <AppShellCreateContext value={{ openCreate }}>
        <ProjectWorkspaceOverview
          budget={null}
          checklistItems={[]}
          events={[]}
          expenses={[]}
          project={project}
          reservations={[]}
          today="2026-07-30"
        />
      </AppShellCreateContext>,
    );

    fireEvent.click(screen.getByRole("button", { name: "일정 추가" }));
    expect(openCreate).toHaveBeenCalledWith(
      expect.any(HTMLButtonElement),
      "event",
      expect.objectContaining({ projectId: project.id }),
    );
    expect(screen.getByRole("link", { name: "예약 추가" })).toHaveAttribute("href", "#reservations");
    expect(screen.getByRole("link", { name: "체크리스트 추가" })).toHaveAttribute("href", "#checklist");
    expect(screen.getByRole("link", { name: "지도에 장소 추가" })).toHaveAttribute("href", "#map");
  });
});
