import { describe, expect, it } from "vitest";

import {
  BUILT_IN_TEMPLATES,
  checklistProgress,
  eventDuplicateValues,
  groupAnnualItems,
  parseKoreanQuickInput,
  parseWorkItemRelations,
  parseWebUrl,
  taskDuplicateValues,
} from "@/lib/work-items/workflow";
import type { EventRow, TaskChecklistItemRow, TaskRow } from "@/types/database";

const task = (overrides: Partial<TaskRow>): TaskRow => ({
  id: "task-1", user_id: "user-1", title: "업무", area: "healthWork", status: "planned",
  priority: "normal", category: "other", scheduled_date: null, due_date: null,
  follow_up_date: null, memo: null, description: null, estimated_minutes: null,
  completed_at: null, recurrence_frequency: null, recurrence_source_id: null,
  recurrence_date: null, recurrence_generated_through: null,
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z", ...overrides,
});

const event = (overrides: Partial<EventRow>): EventRow => ({
  id: "event-1", user_id: "user-1", title: "일정", area: "schoolSchedule",
  start_date: "2026-01-01", end_date: "2026-01-01", is_all_day: true,
  start_time: null, end_time: null, memo: null, description: null,
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z", ...overrides,
});

describe("health workflow templates", () => {
  it("provides twelve immutable privacy-safe defaults", () => {
    expect(BUILT_IN_TEMPLATES).toHaveLength(12);
    expect(BUILT_IN_TEMPLATES.map((item) => item.name)).toContain("학생건강검진 안내");
    expect(JSON.stringify(BUILT_IN_TEMPLATES)).not.toMatch(/학생 이름|학번|질병명|연락처/);
  });
});

describe("checklistProgress", () => {
  it("calculates completed count and percentage", () => {
    const items = [false, true, true].map((is_completed, index) => ({
      id: String(index), task_id: "task-1", user_id: "user-1", title: `항목 ${index}`,
      is_completed, position: index, created_at: "", updated_at: "",
    })) satisfies TaskChecklistItemRow[];
    expect(checklistProgress(items)).toEqual({ completed: 2, total: 3, percentage: 67 });
  });
});

describe("parseKoreanQuickInput", () => {
  const now = new Date("2026-07-17T09:00:00+09:00");

  it("parses a recurring high-priority task without saving it", () => {
    expect(parseKoreanQuickInput("오늘 긴급 공문 처리 우선순위 높음", now)).toMatchObject({
      kind: "task", scheduledDate: "2026-07-17", category: "officialDocument", priority: "high",
    });
  });

  it("parses a timed event", () => {
    expect(parseKoreanQuickInput("내일 오후 2시 보건교육", now)).toMatchObject({
      kind: "event", startDate: "2026-07-18", startTime: "14:00", isAllDay: false,
    });
  });

  it("parses monthly and yearly recurrence phrases", () => {
    expect(parseKoreanQuickInput("매월 첫째 주 약품 점검", now)).toMatchObject({ recurrenceFrequency: "monthly", category: "medication" });
    expect(parseKoreanQuickInput("매년 3월 건강조사 안내", now)).toMatchObject({ recurrenceFrequency: "yearly", scheduledDate: "2027-03-01" });
  });
});

describe("annual planning", () => {
  it("groups tasks and events into twelve months", () => {
    const months = groupAnnualItems(
      [task({ scheduled_date: "2026-03-02" }), task({ due_date: "2026-12-10" })],
      [event({ start_date: "2026-03-05", end_date: "2026-03-05" })],
      2026,
    );
    expect(months).toHaveLength(12);
    expect(months[2]?.items).toHaveLength(2);
    expect(months[11]?.items).toHaveLength(1);
  });
});

describe("parseWebUrl", () => {
  it("accepts http links and rejects unsafe protocols", () => {
    expect(parseWebUrl("https://example.com/form")).toBe("https://example.com/form");
    expect(parseWebUrl("javascript:alert(1)")).toBeNull();
  });
});

describe("Phase 5 relation payloads", () => {
  it("validates checklist, links, and custom reminders at the server boundary", () => {
    const formData = new FormData();
    formData.set("checklist", JSON.stringify([{ title: " 안내문 확인 ", isCompleted: true }]));
    formData.set("links", JSON.stringify([{ title: "공문", url: "https://example.com/document" }]));
    formData.set("reminders", JSON.stringify([{ offsetMinutes: 2880, referenceType: "due" }]));
    expect(parseWorkItemRelations(formData)).toEqual({
      checklist: [{ title: "안내문 확인", isCompleted: true }],
      links: [{ title: "공문", url: "https://example.com/document" }],
      reminders: [{ offsetMinutes: 2880, referenceType: "due" }],
    });
  });

  it("rejects an unsafe related link", () => {
    const formData = new FormData();
    formData.set("links", JSON.stringify([{ title: "위험", url: "javascript:alert(1)" }]));
    expect(() => parseWorkItemRelations(formData)).toThrow("올바른 HTTP 주소");
  });
});

describe("work item reuse", () => {
  it("duplicates a completed task with reset completion and selected fields", () => {
    const values = taskDuplicateValues(task({ status: "completed", description: "설명", memo: "메모", recurrence_frequency: "yearly", scheduled_date: "2025-03-01" }), {
      date: "2026-03-01", includeDescription: true, includeMemo: false, includeRecurrence: true,
    });
    expect(values).toMatchObject({ status: "planned", completed_at: null, scheduled_date: "2026-03-01", description: "설명", memo: null, recurrence_frequency: "yearly" });
  });

  it("does not add recurrence metadata to a non-recurring task", () => {
    const values = taskDuplicateValues(task({ recurrence_frequency: null, recurrence_date: null }), {
      date: "2027-07-18", includeDescription: true, includeMemo: true, includeRecurrence: true,
    });
    expect(values).toMatchObject({ recurrence_frequency: null, recurrence_date: null, recurrence_generated_through: null });
  });

  it("duplicates an event onto the selected date", () => {
    expect(eventDuplicateValues(event({ description: "자료 준비", memo: "메모" }), { date: "2027-05-03", includeDescription: true, includeMemo: false })).toMatchObject({
      start_date: "2027-05-03", end_date: "2027-05-03", description: "자료 준비", memo: null,
    });
  });
});
