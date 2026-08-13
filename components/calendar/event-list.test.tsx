import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EventList } from "@/components/calendar/event-list";
import type { WorkflowData } from "@/lib/work-items/phase5-repository";
import type { EventRow, ExerciseLogRow } from "@/types/database";

vi.mock("@/components/layout/create-item-form", () => ({
  CreateItemForm: () => null,
}));

const workflow: WorkflowData = {
  templates: [],
  templateChecklistItems: [],
  checklistItems: [],
  taskLinks: [],
  eventLinks: [],
  taskReminders: [],
  eventReminders: [],
};

function event(values: Partial<EventRow> = {}): EventRow {
  return {
    id: "event-1",
    user_id: "user-1",
    title: "성동구 배드민턴 대회",
    area: "exercise",
    event_type: "tournament",
    event_details: {
      kind: "tournament",
      tournamentName: "성동구 배드민턴 대회",
      discipline: "",
      partner: "",
      level: "",
      applicationStatus: "planned",
    },
    start_date: "2026-07-26",
    end_date: "2026-07-26",
    is_all_day: true,
    start_time: null,
    end_time: null,
    memo: null,
    description: null,
    created_at: "",
    updated_at: "",
    ...values,
  };
}

describe("EventList time details", () => {
  it("delegates editing without rendering a nested inline editor", () => {
    const onEdit = vi.fn();
    const selectedEvent = event({
      event_type: "workout",
      event_details: { kind: "workout", workoutType: "배드민턴" },
    });

    const { container } = render(<EventList date="2026-07-26" events={[selectedEvent]} onEdit={onEdit} workflow={workflow} />);
    fireEvent.click(screen.getByRole("button", { name: "편집" }));

    expect(onEdit).toHaveBeenCalledWith(selectedEvent);
    expect(container.querySelector(".inline-editor")).not.toBeInTheDocument();
  });

  it("labels an all-day event as all-day", () => {
    render(<EventList date="2026-07-26" events={[event()]} workflow={workflow} />);

    expect(screen.getByText("2026-07-26 · 종일")).toBeInTheDocument();
  });

  it("shows the start and end time for a bounded event", () => {
    render(<EventList date="2026-07-26" events={[event({
      is_all_day: false,
      start_time: "08:30:00",
      end_time: "18:00:00",
    })]} workflow={workflow} />);

    expect(screen.getByText("2026-07-26 · 08:30 ~ 18:00")).toBeInTheDocument();
  });

  it("shows only the start time when an event has no end time", () => {
    render(<EventList date="2026-07-26" events={[event({
      is_all_day: false,
      start_time: "19:00:00",
    })]} workflow={workflow} />);

    expect(screen.getByText("2026-07-26 · 19:00")).toBeInTheDocument();
  });

  it("offers exercise record creation for a past workout and passes its event id", () => {
    render(<EventList date="2026-07-20" events={[event({
      event_type: "workout",
      event_details: { kind: "workout", workoutType: "배드민턴" },
      start_date: "2026-07-20",
      end_date: "2026-07-20",
      title: "배드민턴",
    })]} workflow={workflow} />);

    expect(screen.getByRole("link", { name: "운동 기록 작성" })).toHaveAttribute(
      "href",
      expect.stringContaining("eventId=event-1"),
    );
  });

  it("shows tournament details and opens result entry with the event id", () => {
    render(<EventList currentTime="12:00" date="2026-07-20" events={[event({
      end_date: "2026-07-20",
      event_details: {
        kind: "tournament",
        tournamentName: "성동구 배드민턴 대회",
        discipline: "혼합복식",
        partner: "S002",
        level: "D급",
        applicationStatus: "applied",
      },
      start_date: "2026-07-20",
    })]} today="2026-07-25" workflow={workflow} />);

    expect(screen.getByText("종목 · 혼합복식")).toBeInTheDocument();
    expect(screen.getByText("파트너 · S002 · 급수 · D급")).toBeInTheDocument();
    expect(screen.getByText("신청 · 신청 완료")).toBeInTheDocument();
    const resultLink = screen.getByRole("link", { name: "결과 기록하기" });
    expect(resultLink).toHaveAttribute("href", expect.stringMatching(/eventId=event-1.*recordType=competition/));
    expect(resultLink).not.toHaveAttribute("href", expect.stringContaining("returnTo="));
  });

  it("opens the connected exercise record instead of creating another one", () => {
    const linkedLog: ExerciseLogRow = {
      id: "log-1",
      user_id: "user-1",
      sticker_id: "sticker-1",
      exercise_date: "2026-07-20",
      duration_minutes: null,
      note: null,
      record_type: "exercise",
      event_id: "event-1",
      created_at: "",
      updated_at: "",
    };
    render(<EventList date="2026-07-20" events={[event({
      event_type: "workout",
      event_details: { kind: "workout", workoutType: "배드민턴" },
    })]} exerciseLogs={[linkedLog]} workflow={workflow} />);

    const link = screen.getByRole("link", { name: "운동 기록 수정" });
    expect(link).toHaveAttribute("href", expect.stringContaining("eventId=event-1"));
    expect(link).toHaveAttribute("href", expect.stringContaining("create=sticker"));
    expect(link).toHaveAttribute("href", expect.stringContaining("returnTo="));
  });
});
