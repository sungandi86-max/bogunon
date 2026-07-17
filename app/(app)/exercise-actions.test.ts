import { beforeEach, describe, expect, it, vi } from "vitest";

import { saveExerciseAction, setExerciseStatusAction } from "@/app/(app)/exercise-actions";
import { exerciseRecordFromEvent, serializeExerciseMetadata } from "@/lib/exercise/domain";
import { saveEventBundle } from "@/lib/work-items/phase5-repository";
import { listAllEvents, updateEventDescription } from "@/lib/work-items/repository";
import type { EventRow } from "@/types/database";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/work-items/phase5-repository", () => ({ saveEventBundle: vi.fn() }));
vi.mock("@/lib/work-items/repository", () => ({ listAllEvents: vi.fn(), updateEventDescription: vi.fn() }));

const storedEvent: EventRow = {
  id: "event-1", user_id: "user-1", title: "배드민턴", area: "exercise",
  start_date: "2026-07-18", end_date: "2026-07-18", is_all_day: false,
  start_time: "19:00:00", end_time: "20:00:00", memo: null,
  description: serializeExerciseMetadata({ durationMinutes: 60, intensity: "moderate", location: "체육관", recurrence: null, status: "planned" }),
  created_at: "2026-07-18T00:00:00.000Z", updated_at: "2026-07-18T00:00:00.000Z",
};

describe("exercise actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("saves an exercise through the existing atomic event RPC", async () => {
    const formData = new FormData();
    formData.set("exerciseType", "badminton");
    formData.set("date", "2026-07-18");
    formData.set("startTime", "19:00");
    formData.set("durationMinutes", "120");
    formData.set("location", "학교 체육관");
    formData.set("intensity", "moderate");
    formData.set("memo", "라켓 준비");
    formData.set("recurrence", "weekly");

    await expect(saveExerciseAction({ status: "idle" }, formData)).resolves.toEqual({ status: "success", message: "운동 기록을 저장했습니다." });
    expect(vi.mocked(saveEventBundle)).toHaveBeenCalledOnce();
    const values = vi.mocked(saveEventBundle).mock.calls[0]?.[0];
    expect(values).toMatchObject({ area: "exercise", start_date: "2026-07-18", start_time: "19:00", title: "배드민턴" });
    if (!values) throw new Error("저장된 운동 값이 필요합니다.");
    expect(exerciseRecordFromEvent({ ...storedEvent, ...values })).toMatchObject({ durationMinutes: 120, intensity: "moderate", location: "학교 체육관", recurrence: "weekly" });
  });

  it("rejects an invalid duration before database access", async () => {
    const formData = new FormData();
    formData.set("exerciseType", "walking");
    formData.set("date", "2026-07-18");
    formData.set("startTime", "08:00");
    formData.set("durationMinutes", "0");
    formData.set("intensity", "light");

    await expect(saveExerciseAction({ status: "idle" }, formData)).resolves.toEqual({ status: "error", message: "운동 시간을 확인해 주세요." });
    expect(vi.mocked(saveEventBundle)).not.toHaveBeenCalled();
  });

  it("updates only exercise metadata while preserving the event bundle", async () => {
    vi.mocked(listAllEvents).mockResolvedValue([storedEvent]);
    const formData = new FormData();
    formData.set("id", storedEvent.id);
    formData.set("status", "completed");

    await setExerciseStatusAction(formData);
    const call = vi.mocked(updateEventDescription).mock.calls[0];
    expect(call?.[0]).toBe(storedEvent.id);
    if (!call?.[1]) throw new Error("수정된 운동 메타데이터가 필요합니다.");
    expect(exerciseRecordFromEvent({ ...storedEvent, description: call[1] }).status).toBe("completed");
    expect(saveEventBundle).not.toHaveBeenCalled();
  });

  it("does not rewrite a generic event that only uses the exercise area", async () => {
    vi.mocked(listAllEvents).mockResolvedValue([{ ...storedEvent, description: "동아리 수업", title: "요가 수업" }]);
    const formData = new FormData();
    formData.set("id", storedEvent.id);
    formData.set("status", "completed");

    await setExerciseStatusAction(formData);

    expect(vi.mocked(updateEventDescription)).not.toHaveBeenCalled();
  });
});
