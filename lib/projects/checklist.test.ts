import { describe, expect, it } from "vitest";

import {
  checklistDueStatus,
  normalizeChecklistOrder,
  placeChecklistItem,
} from "@/lib/projects/checklist";
import type { ProjectChecklistItemRow } from "@/types/database";

const items: readonly ProjectChecklistItemRow[] = [
  {
    id: "item-a",
    user_id: "user-1",
    project_id: "project-1",
    title: "항공권 확인",
    is_completed: false,
    sort_order: 0,
    due_date: null,
    created_at: "",
    updated_at: "",
  },
  {
    id: "item-b",
    user_id: "user-1",
    project_id: "project-1",
    title: "숙소 확인",
    is_completed: false,
    sort_order: 1,
    due_date: "2026-07-28",
    created_at: "",
    updated_at: "",
  },
];

describe("project checklist domain", () => {
  it("classifies optional due dates against the current local date", () => {
    expect(checklistDueStatus(null, "2026-07-27")).toBe("none");
    expect(checklistDueStatus("2026-07-26", "2026-07-27")).toBe("overdue");
    expect(checklistDueStatus("2026-07-27", "2026-07-27")).toBe("today");
    expect(checklistDueStatus("2026-07-28", "2026-07-27")).toBe("upcoming");
  });

  it("moves one item and normalizes persisted sort order", () => {
    const moved = placeChecklistItem(items, "item-b", "item-a");

    expect(moved.map((item) => item.id)).toEqual(["item-b", "item-a"]);
    expect(moved.map((item) => item.sort_order)).toEqual([0, 1]);
  });

  it("normalizes stale sort values and ignores unknown drop targets", () => {
    const stale = items.map((item, index) => ({ ...item, sort_order: 9 - index }));
    expect(normalizeChecklistOrder(stale).map((item) => item.sort_order)).toEqual([0, 1]);
    expect(placeChecklistItem(items, "item-a", "missing")).toEqual(items);
  });
});
