import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { ProjectWorkspaceShell } from "@/components/projects/project-detail-workspace";
import { ProjectWorkspaceOverview } from "@/components/projects/project-workspace-overview";

const panels = {
  overview: <p>개요 내용</p>,
  schedule: <p>일정 내용</p>,
  checklist: <p>체크리스트 내용</p>,
  reservations: <p>예약 내용</p>,
  budget: <p>예산 내용</p>,
  notes: <p>노트 내용</p>,
  files: <p>파일 내용</p>,
};

describe("project detail workspace", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/projects/project-1");
  });

  it("opens overview by default and keeps every loaded panel mounted", () => {
    render(<ProjectWorkspaceShell {...panels} />);

    expect(screen.getByRole("tab", { name: "개요" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "개요" })).toBeVisible();
    expect(screen.getByText("예약 내용")).toBeInTheDocument();
    expect(screen.getByText("예약 내용").closest("[role=tabpanel]")).toHaveAttribute("hidden");
  });

  it("writes the active tab to the hash and restores it after refresh", () => {
    const { unmount } = render(<ProjectWorkspaceShell {...panels} />);

    fireEvent.click(screen.getByRole("tab", { name: "예약" }));
    expect(window.location.hash).toBe("#reservations");
    expect(screen.getByRole("tabpanel", { name: "예약" })).toBeVisible();

    unmount();
    render(<ProjectWorkspaceShell {...panels} />);
    expect(screen.getByRole("tab", { name: "예약" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "예약" })).toBeVisible();
  });

  it("supports arrow-key tab navigation", () => {
    render(<ProjectWorkspaceShell {...panels} />);

    const overviewTab = screen.getByRole("tab", { name: "개요" });
    fireEvent.keyDown(overviewTab, { key: "ArrowRight" });

    expect(screen.getByRole("tab", { name: "일정" })).toHaveAttribute("aria-selected", "true");
    expect(window.location.hash).toBe("#schedule");
  });

  it("mounts notes on first activation and reuses the mounted panel", () => {
    render(<ProjectWorkspaceShell {...panels} />);

    expect(screen.queryByText("노트 내용")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "노트" }));
    expect(screen.getByText("노트 내용")).toBeVisible();
    expect(window.location.hash).toBe("#notes");

    fireEvent.click(screen.getByRole("tab", { name: "개요" }));
    expect(screen.getByText("노트 내용")).toBeInTheDocument();
    expect(screen.getByText("노트 내용").closest("[role=tabpanel]")).toHaveAttribute("hidden");
  });

  it("mounts files on first activation, restores #files, and reuses the mounted panel", () => {
    const { unmount } = render(<ProjectWorkspaceShell {...panels} />);

    expect(screen.queryByText("파일 내용")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "파일" }));
    expect(screen.getByText("파일 내용")).toBeVisible();
    expect(window.location.hash).toBe("#files");

    fireEvent.click(screen.getByRole("tab", { name: "개요" }));
    expect(screen.getByText("파일 내용")).toBeInTheDocument();
    expect(screen.getByText("파일 내용").closest("[role=tabpanel]")).toHaveAttribute("hidden");

    window.history.replaceState(null, "", "/projects/project-1#files");
    unmount();
    render(<ProjectWorkspaceShell {...panels} />);
    expect(screen.getByRole("tab", { name: "파일" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "파일" })).toBeVisible();
  });

  it("summarizes today's work, checklist progress, next reservation, and budget", () => {
    render(
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
        reservations={[{
          id: "reservation-1", user_id: "user-1", project_id: "project-1", type: "hotel",
          title: "MJ Resort", reservation_date: "2026-08-05", start_time: null, end_time: null,
          company: null, confirmation_number: null, location: null, phone: null, website: null,
          memo: null, linked_event_id: null, created_at: "", updated_at: "",
        }]}
        today="2026-07-28"
      />,
    );

    expect(screen.getByRole("link", { name: /09:00.*출발 준비/ })).toBeInTheDocument();
    expect(screen.getByText("1 / 2 완료")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "체크리스트 1/2 완료" })).toHaveValue(1);
    expect(screen.getByText("MJ Resort")).toBeInTheDocument();
    expect(screen.getByText("600,000원")).toBeInTheDocument();
    expect(screen.getByText("438,000원")).toBeInTheDocument();
    expect(screen.getByText("162,000원")).toBeInTheDocument();
  });
});
