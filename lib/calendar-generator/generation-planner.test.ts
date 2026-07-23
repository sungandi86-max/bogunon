import { describe, expect, it } from "vitest";

import {
  buildSmartCalendarPreview,
  normalizeSmartCalendarTitle,
} from "@/lib/calendar-generator/generation-planner";
import type { SmartCalendarExistingEvent } from "@/lib/calendar-generator/generation-types";

const existingEvent: SmartCalendarExistingEvent = {
  id: "event-1",
  title: "  개학식  ",
  startDate: "2026-03-02",
  endDate: "2026-03-02",
};

describe("Smart Calendar generation planner", () => {
  it("normalizes whitespace and English case without changing Korean text", () => {
    expect(normalizeSmartCalendarTitle("  Spring   개학식  ")).toBe("spring 개학식");
  });

  it("resolves selected preset packs into editable event candidates", () => {
    const preview = buildSmartCalendarPreview({
      year: 2026,
      semester: "all",
      selectedPacks: ["academic"],
      existingEvents: [],
    });

    expect(preview.items.length).toBeGreaterThan(0);
    expect(preview.items.every((item) => item.area === "schoolSchedule")).toBe(true);
    expect(preview.items.every((item) => item.allDay)).toBe(true);
    expect(preview.items.every((item) => item.selected)).toBe(true);
  });

  it("filters candidates by the selected semester", () => {
    const first = buildSmartCalendarPreview({
      year: 2026,
      semester: "first",
      selectedPacks: ["academic"],
      existingEvents: [],
    });
    const second = buildSmartCalendarPreview({
      year: 2026,
      semester: "second",
      selectedPacks: ["academic"],
      existingEvents: [],
    });

    expect(first.items.every((item) => {
      const month = Number(item.startDate.slice(5, 7));
      return month >= 3 && month <= 8;
    })).toBe(true);
    expect(second.items.every((item) => {
      const month = Number(item.startDate.slice(5, 7));
      return month <= 2 || month >= 9;
    })).toBe(true);
  });

  it("marks an existing title and date match as a duplicate that defaults to skip", () => {
    const preview = buildSmartCalendarPreview({
      year: 2026,
      semester: "all",
      selectedPacks: ["academic"],
      existingEvents: [existingEvent],
    });
    const duplicate = preview.items.find((item) => item.duplicate?.eventId === existingEvent.id);

    expect(duplicate).toMatchObject({
      warning: "duplicate",
      selected: false,
      duplicateDecision: "skip",
    });
  });
});
