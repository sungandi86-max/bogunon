import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TodayExerciseSection } from "@/components/briefing/today-exercise-section";
import type { EventRow } from "@/types/database";

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
      "/exercise?create=sticker&date=2026-07-25&eventId=workout-1",
    );
  });
});
