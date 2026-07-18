import { describe, expect, it } from "vitest";

import {
  DEFAULT_EXERCISE_STICKERS,
  exerciseAssetPath,
  exerciseCalendarSummary,
  exerciseStreak,
} from "@/lib/exercise/stickers";
import type { ExerciseLogRow } from "@/types/database";

const log = (id: string, date: string, stickerId: string): ExerciseLogRow => ({
  id,
  user_id: "user-1",
  sticker_id: stickerId,
  exercise_date: date,
  duration_minutes: null,
  note: null,
  created_at: `${date}T00:00:00Z`,
  updated_at: `${date}T00:00:00Z`,
});

describe("exercise stickers", () => {
  it("provides stable non-emoji asset keys for all default stickers", () => {
    expect(DEFAULT_EXERCISE_STICKERS.map((item) => item.iconKey)).toEqual([
      "badminton",
      "badminton_lesson",
      "walking",
      "running",
      "strength",
      "stretching",
      "cycling",
      "swimming",
      "other",
    ]);
    for (const sticker of DEFAULT_EXERCISE_STICKERS) {
      expect(sticker.label).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(exerciseAssetPath(sticker.iconKey)).toMatch(/^\/stickers\/exercise\/[a-z-]+\.svg$/);
    }
  });

  it("shows two stickers and a remaining count when a day has three or more logs", () => {
    const logs = [log("1", "2026-07-18", "a"), log("2", "2026-07-18", "b"), log("3", "2026-07-18", "c")];
    expect(exerciseCalendarSummary(logs, "2026-07-18")).toEqual({ visible: logs.slice(0, 2), remaining: 1 });
  });

  it("calculates a unique-day current streak ending on the reference date", () => {
    const logs = [
      log("1", "2026-07-18", "a"),
      log("2", "2026-07-18", "b"),
      log("3", "2026-07-17", "a"),
      log("4", "2026-07-16", "a"),
      log("5", "2026-07-14", "a"),
    ];
    expect(exerciseStreak(logs, "2026-07-18")).toBe(3);
  });
});
