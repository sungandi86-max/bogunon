import { describe, expect, it } from "vitest";

import {
  exerciseEventValues,
  exerciseRecordFromEvent,
  parseExerciseQuickInput,
  serializeExerciseMetadata,
} from "@/lib/exercise/domain";
import type { EventRow } from "@/types/database";

const eventFixture: EventRow = {
  id: "event-1",
  user_id: "user-1",
  title: "배드민턴",
  area: "exercise",
  start_date: "2026-07-18",
  end_date: "2026-07-18",
  is_all_day: false,
  start_time: "19:00:00",
  end_time: "21:00:00",
  memo: "라켓 챙기기",
  description: serializeExerciseMetadata({ durationMinutes: 120, intensity: "moderate", location: "체육관", recurrence: "weekly", status: "planned" }),
  created_at: "2026-07-18T00:00:00.000Z",
  updated_at: "2026-07-18T00:00:00.000Z",
};

describe("exercise domain", () => {
  it("parses Korean exercise quick input into contextual fields", () => {
    expect(parseExerciseQuickInput("오늘 저녁 7시 배드민턴 2시간", new Date("2026-07-18T09:00:00+09:00"))).toEqual({
      date: "2026-07-18",
      durationMinutes: 120,
      exerciseType: "badminton",
      intensity: "moderate",
      recurrence: null,
      startTime: "19:00",
    });
  });

  it("keeps colon time separate from the exercise duration", () => {
    expect(parseExerciseQuickInput("오늘 7:30 배드민턴 1시간", new Date("2026-07-18T09:00:00+09:00"))).toMatchObject({
      durationMinutes: 60,
      startTime: "07:30",
    });
  });

  it("ignores invalid time and negative duration tokens", () => {
    expect(parseExerciseQuickInput("오늘 오후 25시 배드민턴 -30분", new Date("2026-07-18T09:00:00+09:00"))).toMatchObject({
      durationMinutes: 60,
      startTime: "18:00",
    });
  });

  it("round-trips exercise metadata without exposing the storage format", () => {
    const record = exerciseRecordFromEvent(eventFixture);
    expect(record).toMatchObject({ durationMinutes: 120, intensity: "moderate", location: "체육관", recurrence: "weekly", status: "planned" });
    expect(record.memo).toBe("라켓 챙기기");
  });

  it("maps a late exercise to a timed event that can cross midnight", () => {
    expect(exerciseEventValues({ date: "2026-07-18", durationMinutes: 120, exerciseType: "running", intensity: "strong", location: "운동장", memo: "", recurrence: null, startTime: "23:00", status: "planned" })).toMatchObject({
      area: "exercise",
      end_date: "2026-07-19",
      end_time: "01:00",
      is_all_day: false,
      start_date: "2026-07-18",
      start_time: "23:00",
      title: "러닝",
    });
  });
});
