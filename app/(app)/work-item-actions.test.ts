import { beforeEach, describe, expect, it, vi } from "vitest";

import { moveCalendarItemAction, saveWorkItemAction } from "@/app/(app)/work-item-actions";
import { deleteWorkItemAction, toggleTaskAction } from "@/app/(app)/work-item-actions";
import { moveCalendarItem, removeWorkItem, setTaskCompleted } from "@/lib/work-items/repository";
import { saveEventBundle, saveTaskBundle } from "@/lib/work-items/phase5-repository";
import { markAiDraftApplied } from "@/lib/ai/history";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/work-items/repository", () => ({
  removeWorkItem: vi.fn(),
  setTaskCompleted: vi.fn(),
  moveCalendarItem: vi.fn(),
  listAllEvents: vi.fn(),
  listTasks: vi.fn(),
}));
vi.mock("@/lib/work-items/phase5-repository", () => ({
  duplicateEvent: vi.fn(), duplicateTask: vi.fn(), listWorkflowData: vi.fn(),
  saveCustomTemplate: vi.fn(), saveEventBundle: vi.fn(), saveTaskBundle: vi.fn(), setChecklistItemCompleted: vi.fn(),
  templateFromEvent: vi.fn(), templateFromTask: vi.fn(),
}));
vi.mock("@/lib/ai/history", () => ({ markAiDraftApplied: vi.fn() }));

describe("saveWorkItemAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an empty title before database access", async () => {
    const formData = new FormData();
    formData.set("kind", "task");
    formData.set("title", "   ");
    formData.set("area", "healthWork");

    await expect(saveWorkItemAction({ status: "idle" }, formData)).resolves.toEqual({
      status: "error",
      message: "제목을 입력해 주세요.",
    });
  });

  it("rejects an event whose end date precedes its start date", async () => {
    const formData = new FormData();
    formData.set("kind", "event");
    formData.set("title", "교직원 회의");
    formData.set("area", "schoolSchedule");
    formData.set("startDate", "2026-07-18");
    formData.set("endDate", "2026-07-17");

    const result = await saveWorkItemAction({ status: "idle" }, formData);
    expect(result).toEqual({ status: "error", message: "일정 날짜를 확인해 주세요." });
  });

  it("saves an authenticated task payload without accepting a user id", async () => {
    const formData = new FormData();
    formData.set("kind", "task");
    formData.set("title", "  보건교육 결과 제출  ");
    formData.set("area", "healthWork");
    formData.set("status", "waitingForReply");
    formData.set("priority", "high");
    formData.set("category", "officialDocument");
    formData.set("dueDate", "2026-07-17");

    await expect(saveWorkItemAction({ status: "idle" }, formData)).resolves.toEqual({ status: "success", message: "저장했습니다." });
    expect(vi.mocked(saveTaskBundle)).toHaveBeenCalledWith(expect.objectContaining({ title: "보건교육 결과 제출", status: "waitingForReply", priority: "high", category: "officialDocument", due_date: "2026-07-17" }), { checklist: [], links: [], reminders: [] }, undefined);
  });

  it("keeps an AI-created task save successful when optional history marking fails", async () => {
    vi.mocked(markAiDraftApplied).mockRejectedValueOnce(new Error("history unavailable"));
    const formData = new FormData();
    formData.set("kind", "task");
    formData.set("title", "보건교육 결과 제출");
    formData.set("area", "healthWork");
    formData.set("aiDraftId", "draft-1");

    await expect(saveWorkItemAction({ status: "idle" }, formData)).resolves.toEqual({
      status: "success",
      message: "저장했지만 AI 기록 상태를 갱신하지 못했습니다.",
    });
    expect(saveTaskBundle).toHaveBeenCalledOnce();
  });

  it("requires a scheduled date for a recurring task", async () => {
    const formData = new FormData();
    formData.set("kind", "task");
    formData.set("title", "약품 점검");
    formData.set("area", "healthWork");
    formData.set("category", "medication");
    formData.set("recurrenceFrequency", "monthly");

    await expect(saveWorkItemAction({ status: "idle" }, formData)).resolves.toEqual({
      status: "error",
      message: "반복 업무는 수행일을 입력해 주세요.",
    });
    expect(vi.mocked(saveTaskBundle)).not.toHaveBeenCalled();
  });

  it("does not save an annual planner task until its date is selected", async () => {
    const formData = new FormData();
    formData.set("kind", "task");
    formData.set("title", "학생건강검진 준비");
    formData.set("area", "healthWork");
    formData.set("requiredDate", "true");

    await expect(saveWorkItemAction({ status: "idle" }, formData)).resolves.toEqual({
      status: "error",
      message: "연간 플래너 업무의 수행일을 선택해 주세요.",
    });
    expect(vi.mocked(saveTaskBundle)).not.toHaveBeenCalled();
  });

  it("rejects a malformed annual planner date", async () => {
    const formData = new FormData();
    formData.set("kind", "task");
    formData.set("title", "학생건강검진 준비");
    formData.set("area", "healthWork");
    formData.set("requiredDate", "true");
    formData.set("scheduledDate", "2026-02-31");

    await expect(saveWorkItemAction({ status: "idle" }, formData)).resolves.toEqual({
      status: "error",
      message: "업무 날짜를 확인해 주세요.",
    });
    expect(vi.mocked(saveTaskBundle)).not.toHaveBeenCalled();
  });

  it("saves an all-day event through the shared action", async () => {
    const formData = new FormData();
    formData.set("kind", "event");
    formData.set("title", "교직원 회의");
    formData.set("area", "schoolSchedule");
    formData.set("startDate", "2026-07-17");
    formData.set("endDate", "2026-07-17");
    formData.set("isAllDay", "on");

    await saveWorkItemAction({ status: "idle" }, formData);
    expect(vi.mocked(saveEventBundle)).toHaveBeenCalledWith(expect.objectContaining({ title: "교직원 회의", is_all_day: true, start_time: null, end_time: null }), { links: [], reminders: [] }, undefined);
  });

  it("stores validated checklist, link, and reminder settings with a task", async () => {
    const formData = new FormData();
    formData.set("kind", "task");
    formData.set("title", "월간 약품 점검");
    formData.set("area", "healthWork");
    formData.set("category", "medication");
    formData.set("checklist", JSON.stringify([{ title: "재고 확인" }]));
    formData.set("links", JSON.stringify([{ title: "점검표", url: "https://example.com/check" }]));
    formData.set("reminders", JSON.stringify([{ offsetMinutes: 1440, referenceType: "due" }]));

    await expect(saveWorkItemAction({ status: "idle" }, formData)).resolves.toEqual({ status: "success", message: "저장했습니다." });
    expect(vi.mocked(saveTaskBundle)).toHaveBeenCalledWith(expect.objectContaining({ title: "월간 약품 점검" }), {
      checklist: [{ title: "재고 확인", isCompleted: false }],
      links: [{ title: "점검표", url: "https://example.com/check" }],
      reminders: [{ offsetMinutes: 1440, referenceType: "due" }],
    }, undefined);
  });

  it("rejects invalid relation input before mutating the parent item", async () => {
    const formData = new FormData();
    formData.set("kind", "task");
    formData.set("title", "월간 약품 점검");
    formData.set("area", "healthWork");
    formData.set("category", "medication");
    formData.set("links", JSON.stringify([{ title: "주소 누락", url: "" }]));

    await expect(saveWorkItemAction({ status: "idle" }, formData)).resolves.toEqual({
      status: "error", message: "링크 제목과 올바른 HTTP 주소를 입력해 주세요.",
    });
    expect(vi.mocked(saveTaskBundle)).not.toHaveBeenCalled();
  });

  it("routes completion and deletion to the owned repository methods", async () => {
    const toggleData = new FormData();
    toggleData.set("id", "task-id");
    toggleData.set("completed", "true");
    await toggleTaskAction(toggleData);
    expect(vi.mocked(setTaskCompleted)).toHaveBeenCalledWith("task-id", true);

    const deleteData = new FormData();
    deleteData.set("id", "event-id");
    deleteData.set("kind", "event");
    await deleteWorkItemAction(deleteData);
    expect(vi.mocked(removeWorkItem)).toHaveBeenCalledWith("events", "event-id");
  });

  it("passes the selected recurrence scope to the atomic calendar move", async () => {
    const formData = new FormData();
    formData.set("id", "event-id"); formData.set("kind", "event");
    formData.set("newDate", "2026-07-25"); formData.set("scope", "following");
    await expect(moveCalendarItemAction({ status: "idle" }, formData)).resolves.toEqual({ status: "success", message: "날짜를 변경했습니다." });
    expect(vi.mocked(moveCalendarItem)).toHaveBeenCalledWith("event", "event-id", "2026-07-25", "following");
  });
});
