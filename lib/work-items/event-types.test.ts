import { describe, expect, it } from "vitest";

import {
  eventAreaForType,
  eventColorForType,
  parseEventDetails,
  resolveEventType,
} from "@/lib/work-items/event-types";

describe("event category domain", () => {
  it("maps plan categories to the existing event area and color", () => {
    expect(eventAreaForType("personal")).toBe("personal");
    expect(eventAreaForType("work")).toBe("healthWork");
    expect(eventAreaForType("school")).toBe("schoolSchedule");
    expect(eventAreaForType("workout")).toBe("exercise");
    expect(eventAreaForType("tournament")).toBe("exercise");
    expect(eventColorForType("workout")).toBe("mint");
    expect(eventColorForType("tournament")).toBe("coral");
  });

  it("preserves legacy rows by deriving a category from area", () => {
    expect(resolveEventType({ area: "personal" })).toBe("personal");
    expect(resolveEventType({ area: "schoolSchedule" })).toBe("school");
    expect(resolveEventType({ area: "exercise" })).toBe("workout");
  });

  it("parses only the detail shape allowed by the selected category", () => {
    expect(parseEventDetails("workout", {
      workoutType: "필라테스",
      tournamentName: "무시할 값",
    })).toEqual({ kind: "workout", workoutType: "필라테스" });

    expect(parseEventDetails("tournament", {
      tournamentName: "여름 클럽대회",
      discipline: "혼합복식",
      partner: "S002",
      level: "D조",
      applicationStatus: "applied",
    })).toEqual({
      kind: "tournament",
      tournamentName: "여름 클럽대회",
      discipline: "혼합복식",
      partner: "S002",
      level: "D조",
      applicationStatus: "applied",
    });
    expect(parseEventDetails("personal", { workoutType: "러닝" })).toBeNull();
  });
});
