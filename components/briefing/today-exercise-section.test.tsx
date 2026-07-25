import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TodayExerciseSection } from "@/components/briefing/today-exercise-section";
import type { EventRow, ExerciseLogRow } from "@/types/database";

const workout: EventRow = {
  id: "workout-1",
  user_id: "user-1",
  title: "배드민턴 레슨",
  area: "exercise",
  event_type: "workout",
  event_details: { kind: "workout", workoutType: "배드민턴" },
  start_date: "2026-07-25",
  end_date: "2026-07-25",
  is_all_day: false,
  start_time: "19:40",
  end_time: "21:00",
  memo: null,
  description: null,
  created_at: "",
  updated_at: "",
};

describe("TodayExerciseSection", () => {
  it("uses a compact empty state", () => {
    render(<TodayExerciseSection events={[]} logs={[]} stickers={[]} today="2026-07-25" />);

    expect(screen.getByText("아직 오늘 운동 기록이 없어요.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "운동 기록하기" })).toHaveAttribute(
      "href",
      "/exercise?create=sticker&date=2026-07-25",
    );
  });

  it("shows today's workout schedule and a linked record action", () => {
    render(
      <TodayExerciseSection
        events={[workout]}
        logs={[]}
        stickers={[]}
        today="2026-07-25"
      />,
    );

    expect(screen.getByText("19:40")).toBeInTheDocument();
    expect(screen.getByText("배드민턴 레슨")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "기록하기" })).toHaveAttribute(
      "href",
      "/exercise?create=sticker&date=2026-07-25&eventId=workout-1&returnTo=%2Fbriefing",
    );
  });

  it("opens the existing linked record for editing instead of creating a duplicate", () => {
    const linkedLog: ExerciseLogRow = {
      id: "log-1",
      user_id: "user-1",
      sticker_id: "sticker-1",
      exercise_date: "2026-07-25",
      duration_minutes: 80,
      note: "레슨",
      record_type: "exercise",
      event_id: workout.id,
      created_at: "",
      updated_at: "",
    };

    render(
      <TodayExerciseSection
        events={[workout]}
        logs={[linkedLog]}
        stickers={[]}
        today="2026-07-25"
      />,
    );

    const link = screen.getByRole("link", { name: "수정하기" });
    expect(link).toHaveAttribute("href", expect.stringContaining(`eventId=${workout.id}`));
    expect(link).toHaveAttribute("href", expect.stringContaining("returnTo=%2Fbriefing"));
  });

  it("keeps tournament records in the competition review flow", () => {
    const tournament = {
      ...workout,
      id: "tournament-1",
      event_type: "tournament" as const,
      event_details: null,
    };
    render(<TodayExerciseSection events={[tournament]} logs={[]} stickers={[]} today="2026-07-25" />);

    const link = screen.getByRole("link", { name: "기록하기" });
    expect(link).toHaveAttribute("href", expect.stringContaining("recordType=competition"));
    expect(link).not.toHaveAttribute("href", expect.stringContaining("returnTo="));
  });
});
