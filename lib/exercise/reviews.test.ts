import { describe, expect, it } from "vitest";

import {
  competitionReviewInputSchema,
  exerciseLogInputSchema,
  lessonReviewInputSchema,
} from "@/lib/exercise/reviews";

describe("exercise V2 input schemas", () => {
  it.each(["exercise", "lesson", "competition"] as const)("accepts the %s record type", (recordType) => {
    expect(exerciseLogInputSchema.parse({
      stickerId: "10000000-0000-4000-8000-000000000001",
      exerciseDate: "2026-07-22",
      recordType,
      durationMinutes: null,
      note: null,
    }).recordType).toBe(recordType);
  });

  it("parses a lesson log while keeping duration and note optional", () => {
    expect(exerciseLogInputSchema.parse({
      stickerId: "10000000-0000-4000-8000-000000000001",
      exerciseDate: "2026-07-22",
      recordType: "lesson",
      durationMinutes: null,
      note: "  드라이브 연습  ",
    })).toEqual({
      stickerId: "10000000-0000-4000-8000-000000000001",
      exerciseDate: "2026-07-22",
      recordType: "lesson",
      durationMinutes: null,
      note: "드라이브 연습",
    });
  });

  it("rejects invalid calendar dates and unknown record types", () => {
    expect(exerciseLogInputSchema.safeParse({
      stickerId: "10000000-0000-4000-8000-000000000001",
      exerciseDate: "2026-02-30",
      recordType: "training",
      durationMinutes: null,
      note: null,
    }).success).toBe(false);
  });

  it("requires at least one trimmed lesson review field", () => {
    expect(lessonReviewInputSchema.safeParse({ exerciseLogId: "20000000-0000-4000-8000-000000000001" }).success).toBe(false);
    expect(lessonReviewInputSchema.parse({
      exerciseLogId: "20000000-0000-4000-8000-000000000001",
      lessonFocus: "  드라이브  ",
    }).lessonFocus).toBe("드라이브");
  });

  it("rejects blank and overlength lesson fields at their database boundaries", () => {
    expect(lessonReviewInputSchema.safeParse({
      exerciseLogId: "20000000-0000-4000-8000-000000000001",
      lessonFocus: "   ",
    }).success).toBe(false);
    expect(lessonReviewInputSchema.safeParse({
      exerciseLogId: "20000000-0000-4000-8000-000000000001",
      lessonFocus: "가".repeat(201),
    }).success).toBe(false);
    expect(lessonReviewInputSchema.safeParse({
      exerciseLogId: "20000000-0000-4000-8000-000000000001",
      memo: "가".repeat(2001),
    }).success).toBe(false);
  });

  it("validates competition game counts and trims review text", () => {
    expect(competitionReviewInputSchema.safeParse({
      exerciseLogId: "20000000-0000-4000-8000-000000000001",
      totalGames: 2,
      wins: 2,
      losses: 1,
    }).success).toBe(false);
    expect(competitionReviewInputSchema.parse({
      exerciseLogId: "20000000-0000-4000-8000-000000000001",
      eventCategory: "  여자복식 40C  ",
      totalGames: 3,
      wins: 2,
      losses: 1,
    }).eventCategory).toBe("여자복식 40C");
  });

  it("rejects empty competition reviews and count/text boundaries", () => {
    const exerciseLogId = "20000000-0000-4000-8000-000000000001";
    expect(competitionReviewInputSchema.safeParse({ exerciseLogId }).success).toBe(false);
    expect(competitionReviewInputSchema.safeParse({ exerciseLogId, competitionName: "   " }).success).toBe(false);
    expect(competitionReviewInputSchema.safeParse({ exerciseLogId, competitionName: "대", wins: 1 }).success).toBe(false);
    expect(competitionReviewInputSchema.safeParse({ exerciseLogId, competitionName: "대", totalGames: -1 }).success).toBe(false);
    expect(competitionReviewInputSchema.safeParse({ exerciseLogId, competitionName: "대", totalGames: 1001 }).success).toBe(false);
    expect(competitionReviewInputSchema.safeParse({ exerciseLogId, competitionName: "가".repeat(201) }).success).toBe(false);
    expect(competitionReviewInputSchema.safeParse({ exerciseLogId, competitionName: "대", totalGames: 0, wins: 0, losses: 0 }).success).toBe(true);
  });
});
