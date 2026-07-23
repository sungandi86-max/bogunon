import { describe, expect, it } from "vitest";

import { persistSmartCalendarItems } from "@/lib/calendar-generator/persistence";
import type {
  SmartCalendarEventStore,
  SmartCalendarSaveItem,
} from "@/lib/calendar-generator/persistence";

function saveItem(overrides: Partial<SmartCalendarSaveItem> = {}): SmartCalendarSaveItem {
  return {
    clientId: "academic-opening",
    title: "개학식",
    startDate: "2026-03-02",
    endDate: "2026-03-02",
    area: "schoolSchedule",
    description: "Smart Calendar · academic-v1 1.0.0",
    selected: true,
    duplicateDecision: "skip",
    ...overrides,
  };
}

describe("persistSmartCalendarItems", () => {
  it("separates created, duplicate, excluded, and failed item results", async () => {
    const store: SmartCalendarEventStore = {
      listExisting: async () => [{
        id: "existing",
        title: "개학식",
        startDate: "2026-03-02",
        endDate: "2026-03-02",
      }],
      insert: async (item) => {
        if (item.title === "저장 실패") return { ok: false, message: "DB 오류" };
        return { ok: true, eventId: `created-${item.clientId}` };
      },
    };

    const result = await persistSmartCalendarItems({
      items: [
        saveItem({ selected: false }),
        saveItem({ clientId: "forced", duplicateDecision: "force" }),
        saveItem({ clientId: "excluded", selected: false, title: "사용자 제외" }),
        saveItem({ clientId: "failed", title: "저장 실패", startDate: "2026-04-01", endDate: "2026-04-01" }),
      ],
      store,
    });

    expect(result.results.map((item) => item.status)).toEqual([
      "duplicate-excluded",
      "created",
      "user-excluded",
      "failed",
    ]);
    expect(result.summary).toEqual({ created: 1, duplicates: 1, excluded: 1, failed: 1 });
  });

  it("treats earlier successful inserts as duplicates for later items", async () => {
    const store: SmartCalendarEventStore = {
      listExisting: async () => [],
      insert: async (item) => ({ ok: true, eventId: `created-${item.clientId}` }),
    };

    const result = await persistSmartCalendarItems({
      items: [saveItem({ clientId: "first" }), saveItem({ clientId: "second" })],
      store,
    });

    expect(result.results.map((item) => item.status)).toEqual(["created", "duplicate-excluded"]);
  });

  it("continues saving later items when one store call throws", async () => {
    const store: SmartCalendarEventStore = {
      listExisting: async () => [],
      insert: async (item) => {
        if (item.clientId === "throwing") throw new Error("네트워크 오류");
        return { ok: true, eventId: `created-${item.clientId}` };
      },
    };

    const result = await persistSmartCalendarItems({
      items: [
        saveItem({ clientId: "throwing", startDate: "2026-04-01", endDate: "2026-04-01" }),
        saveItem({ clientId: "later", startDate: "2026-04-02", endDate: "2026-04-02" }),
      ],
      store,
    });

    expect(result.results.map((item) => item.status)).toEqual(["failed", "created"]);
    expect(result.summary).toEqual({ created: 1, duplicates: 0, excluded: 0, failed: 1 });
  });
});
