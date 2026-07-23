import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  generateSmartCalendarPreviewAction,
  saveSmartCalendarAction,
} from "@/app/(app)/calendar/generator/actions";
import { buildSmartCalendarPreview } from "@/lib/calendar-generator/generation-planner";
import { persistSmartCalendarItems } from "@/lib/calendar-generator/persistence";

const listExisting = vi.fn(async () => []);
const insert = vi.fn(async () => ({ ok: true as const, eventId: "event-1" }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/calendar-generator/event-repository", () => ({
  createSmartCalendarEventStore: vi.fn(async () => ({ listExisting, insert })),
}));
vi.mock("@/lib/calendar-generator/generation-planner", () => ({
  buildSmartCalendarPreview: vi.fn(() => ({ year: 2026, semester: "all", items: [], warnings: [] })),
}));
vi.mock("@/lib/calendar-generator/persistence", () => ({
  persistSmartCalendarItems: vi.fn(async () => ({
    results: [{ clientId: "one", title: "개학식", status: "failed", message: "DB 오류" }],
    summary: { created: 0, duplicates: 0, excluded: 0, failed: 1 },
  })),
}));

describe("Smart Calendar generator actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads owned events before building a preview", async () => {
    await generateSmartCalendarPreviewAction({
      year: 2026,
      semester: "all",
      selectedPacks: ["academic"],
    });

    expect(listExisting).toHaveBeenCalledOnce();
    expect(buildSmartCalendarPreview).toHaveBeenCalledWith(expect.objectContaining({
      year: 2026,
      semester: "all",
      selectedPacks: ["academic"],
      existingEvents: [],
    }));
  });

  it("returns item-level partial failure results instead of overall success", async () => {
    const result = await saveSmartCalendarAction([{
      clientId: "one",
      title: "개학식",
      startDate: "2026-03-02",
      endDate: "2026-03-02",
      area: "schoolSchedule",
      description: "Smart Calendar · academic-v1 1.0.0",
      selected: true,
      duplicateDecision: "skip",
    }]);

    expect(persistSmartCalendarItems).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      status: "completed",
      result: { summary: { created: 0, failed: 1 } },
    });
  });

  it("rejects an invalid date range at the server boundary", async () => {
    const result = await saveSmartCalendarAction([{
      clientId: "one",
      title: "개학식",
      startDate: "2026-03-03",
      endDate: "2026-03-02",
      area: "schoolSchedule",
      description: "Smart Calendar",
      selected: true,
      duplicateDecision: "skip",
    }]);

    expect(result).toEqual({ status: "error", message: "생성할 일정 내용을 다시 확인해 주세요." });
    expect(persistSmartCalendarItems).not.toHaveBeenCalled();
  });
});
