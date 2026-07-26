import { beforeEach, describe, expect, it, vi } from "vitest";

import { duplicateEvent } from "@/lib/work-items/phase5-repository";
import { moveSingleDayEvent } from "@/lib/work-items/repository";
import type { EventRow } from "@/types/database";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getUser: vi.fn(),
  insert: vi.fn(),
  insertSelect: vi.fn(),
  insertSingle: vi.fn(),
  linkedByEvent: vi.fn(),
  linkedByOwner: vi.fn(),
  linkedMaybeSingle: vi.fn(),
  linkedSelect: vi.fn(),
  select: vi.fn(),
  selectById: vi.fn(),
  selectByOwner: vi.fn(),
  selectSingle: vi.fn(),
  update: vi.fn(),
  updateByEnd: vi.fn(),
  updateById: vi.fn(),
  updateByOwner: vi.fn(),
  updateByStart: vi.fn(),
  updateIsRecurring: vi.fn(),
  updateMaybeSingle: vi.fn(),
  updateSelect: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  })),
}));

function event(values: Partial<EventRow> = {}): EventRow {
  return {
    id: "event-1",
    user_id: "user-1",
    title: "배드민턴 레슨",
    area: "exercise",
    event_type: "workout",
    event_details: { kind: "workout", workoutType: "배드민턴" },
    start_date: "2026-07-22",
    end_date: "2026-07-22",
    is_all_day: false,
    start_time: "19:40:00",
    end_time: "21:10:00",
    location: "체육관",
    color_key: "mint",
    recurrence_frequency: null,
    recurrence_source_id: null,
    recurrence_date: null,
    recurrence_generated_through: null,
    memo: "레슨",
    description: "드롭과 헤어핀 연습",
    created_at: "2026-07-20T00:00:00Z",
    updated_at: "2026-07-20T00:00:00Z",
    ...values,
  };
}

describe("event calendar persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mocks.select.mockReturnValue({ eq: mocks.selectById });
    mocks.selectById.mockReturnValue({ eq: mocks.selectByOwner });
    mocks.selectByOwner.mockReturnValue({ single: mocks.selectSingle });
    mocks.linkedSelect.mockReturnValue({ eq: mocks.linkedByEvent });
    mocks.linkedByEvent.mockReturnValue({ eq: mocks.linkedByOwner });
    mocks.linkedByOwner.mockReturnValue({ maybeSingle: mocks.linkedMaybeSingle });
    mocks.linkedMaybeSingle.mockResolvedValue({ data: null, error: null });
    mocks.update.mockReturnValue({ eq: mocks.updateById });
    mocks.updateById.mockReturnValue({ eq: mocks.updateByOwner });
    mocks.updateByOwner.mockReturnValue({ eq: mocks.updateByStart });
    mocks.updateByStart.mockReturnValue({ eq: mocks.updateByEnd });
    mocks.updateByEnd.mockReturnValue({ is: mocks.updateIsRecurring });
    mocks.updateIsRecurring.mockReturnValue({ select: mocks.updateSelect });
    mocks.updateSelect.mockReturnValue({ maybeSingle: mocks.updateMaybeSingle });
    mocks.updateMaybeSingle.mockResolvedValue({ data: { id: "event-1" }, error: null });
    mocks.insert.mockReturnValue({ select: mocks.insertSelect });
    mocks.insertSelect.mockReturnValue({ single: mocks.insertSingle });
    mocks.from.mockImplementation((table: string) => table === "exercise_logs"
      ? { select: mocks.linkedSelect }
      : {
          insert: mocks.insert,
          select: mocks.select,
          update: mocks.update,
        });
  });

  it("moves only the dates of an owned single-day workout event", async () => {
    mocks.selectSingle.mockResolvedValue({
      data: {
        start_date: "2026-07-22",
        end_date: "2026-07-22",
        recurrence_frequency: null,
        event_type: "workout",
      },
      error: null,
    });

    await moveSingleDayEvent("event-1", "2026-07-24");

    expect(mocks.update).toHaveBeenCalledWith({
      start_date: "2026-07-24",
      end_date: "2026-07-24",
    });
    expect(mocks.updateById).toHaveBeenCalledWith("id", "event-1");
    expect(mocks.updateByOwner).toHaveBeenCalledWith("user_id", "user-1");
    expect(mocks.updateByStart).toHaveBeenCalledWith("start_date", "2026-07-22");
    expect(mocks.updateByEnd).toHaveBeenCalledWith("end_date", "2026-07-22");
    expect(mocks.updateIsRecurring).toHaveBeenCalledWith("recurrence_frequency", null);
  });

  it("rejects moving a workout event that already has a linked exercise log", async () => {
    mocks.selectSingle.mockResolvedValue({
      data: {
        start_date: "2026-07-22",
        end_date: "2026-07-22",
        recurrence_frequency: null,
        event_type: "workout",
      },
      error: null,
    });
    mocks.linkedMaybeSingle.mockResolvedValue({
      data: { id: "log-1" },
      error: null,
    });

    await expect(moveSingleDayEvent("event-1", "2026-07-24"))
      .rejects.toThrow("운동 기록이 연결된 일정은 날짜를 이동할 수 없습니다.");

    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects a move when the source event changes before the date update", async () => {
    mocks.selectSingle.mockResolvedValue({
      data: {
        start_date: "2026-07-22",
        end_date: "2026-07-22",
        recurrence_frequency: null,
        event_type: "personal",
      },
      error: null,
    });
    mocks.updateMaybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(moveSingleDayEvent("event-1", "2026-07-24"))
      .rejects.toThrow("일정을 이동하지 못했습니다. 원래 날짜로 되돌렸습니다.");
  });

  it("copies the workout schedule without reading or creating an exercise log", async () => {
    mocks.selectSingle.mockResolvedValue({ data: event(), error: null });
    mocks.insertSingle.mockResolvedValue({ data: { id: "event-2" }, error: null });

    await expect(duplicateEvent("event-1", "2026-07-29", true, true)).resolves.toBe("event-2");

    expect(mocks.from).toHaveBeenCalledWith("events");
    expect(mocks.from).not.toHaveBeenCalledWith("exercise_logs");
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      event_type: "workout",
      event_details: { kind: "workout", workoutType: "배드민턴" },
      start_date: "2026-07-29",
      end_date: "2026-07-29",
      title: "배드민턴 레슨",
      user_id: "user-1",
    }));
    expect(mocks.insert.mock.calls[0]?.[0]).not.toHaveProperty("id");
  });
});
