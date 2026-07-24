import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EventList } from "@/components/calendar/event-list";
import type { WorkflowData } from "@/lib/work-items/phase5-repository";
import type { EventRow } from "@/types/database";

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
});
