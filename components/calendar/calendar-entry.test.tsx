import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CalendarEntry } from "@/components/calendar/calendar-entry";
import type { EventRow } from "@/types/database";

const exerciseEvent: EventRow = {
  id: "exercise-event",
  user_id: "user",
  title: "레거시 운동 일정",
  area: "exercise",
  start_date: "2026-07-18",
  end_date: "2026-07-18",
  is_all_day: false,
  start_time: "19:00",
  end_time: "20:00",
  memo: null,
  description: null,
  created_at: "",
  updated_at: "",
};

const legacyProjectEvent: EventRow = {
  ...exerciseEvent,
  id: "legacy-project-event",
  title: "기존 프로젝트 일정",
  area: "project",
};

describe("CalendarEntry", () => {
  it("keeps workout plans movable in the shared calendar", () => {
    const onMove = vi.fn();
    const { container } = render(<CalendarEntry item={exerciseEvent} kind="event" onMove={onMove} />);

    expect(container.firstElementChild).toHaveAttribute("draggable", "true");
    expect(screen.getByRole("button", { name: /날짜 변경/ })).toBeInTheDocument();
    expect(screen.getByText("운동")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass("calendar-item--event-workout");
  });

  it("renders tournament plans with a restrained tournament category style", () => {
    const tournament = {
      ...exerciseEvent,
      id: "tournament",
      event_type: "tournament" as const,
      event_details: {
        kind: "tournament" as const,
        tournamentName: "클럽대회",
        discipline: "혼합복식",
        partner: "",
        level: "D조",
        applicationStatus: "applied" as const,
      },
    };
    const { container } = render(<CalendarEntry item={tournament} kind="event" />);

    expect(screen.getByText("대회")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass("calendar-item--event-tournament");
  });

  it("renders a legacy project item as a regular work item", () => {
    const { container } = render(<CalendarEntry item={legacyProjectEvent} kind="event" />);

    expect(screen.getByText("업무")).toBeInTheDocument();
    expect(screen.queryByText("프로젝트")).not.toBeInTheDocument();
    expect(container.firstElementChild).not.toHaveClass("calendar-item--project");
  });
});
