import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";

import { attachExerciseStickerAction, removeExerciseStickerAction, saveCustomExerciseStickerAction, updateExerciseStickerDetailsAction } from "@/app/(app)/exercise-sticker-actions";
import { removeExerciseLog, saveCustomExerciseSticker, saveExerciseLog, updateExerciseLog } from "@/lib/exercise/repository";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/exercise/repository", () => ({ saveExerciseLog: vi.fn(), removeExerciseLog: vi.fn(), updateExerciseLog: vi.fn(), saveCustomExerciseSticker: vi.fn(), removeCustomExerciseSticker: vi.fn() }));

const stickerId = "10000000-0000-4000-8000-000000000001";
const logId = "20000000-0000-4000-8000-000000000001";

describe("exercise sticker actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stores a confirmed exercise record with optional details and reports duplicates", async () => {
    vi.mocked(saveExerciseLog).mockResolvedValueOnce("created").mockResolvedValueOnce("duplicate");
    const form = new FormData();
    form.set("stickerId", stickerId);
    form.set("exerciseDate", "2026-07-18");
    form.set("completed", "on");
    form.set("durationMinutes", "60");
    form.set("note", "가볍게 운동함");
    await expect(attachExerciseStickerAction({ status: "idle" }, form)).resolves.toMatchObject({ status: "success" });
    await expect(attachExerciseStickerAction({ status: "idle" }, form)).resolves.toEqual({ status: "success", message: "이미 붙인 운동 스티커예요." });
    expect(saveExerciseLog).toHaveBeenCalledWith({ stickerId, exerciseDate: "2026-07-18", durationMinutes: 60, note: "가볍게 운동함" });
  });

  it("removes a selected sticker and keeps optional details nullable", async () => {
    const removeForm = new FormData(); removeForm.set("logId", logId);
    await expect(removeExerciseStickerAction({ status: "idle" }, removeForm)).resolves.toMatchObject({ status: "success" });
    expect(removeExerciseLog).toHaveBeenCalledWith(logId);
    expect(revalidatePath).toHaveBeenCalledWith("/exercise");
    expect(revalidatePath).not.toHaveBeenCalledWith("/calendar");
    expect(revalidatePath).toHaveBeenCalledWith("/briefing");
    const updateForm = new FormData(); updateForm.set("logId", logId); updateForm.set("durationMinutes", ""); updateForm.set("note", "");
    await updateExerciseStickerDetailsAction({ status: "idle" }, updateForm);
    expect(updateExerciseLog).toHaveBeenCalledWith(logId, null, null);
  });

  it("creates a custom sticker from a local icon key rather than an emoji", async () => {
    const form = new FormData(); form.set("label", "요가"); form.set("iconKey", "stretching"); form.set("colorKey", "lavender");
    await expect(saveCustomExerciseStickerAction({ status: "idle" }, form)).resolves.toMatchObject({ status: "success" });
    expect(saveCustomExerciseSticker).toHaveBeenCalledWith({ label: "요가", iconKey: "stretching", colorKey: "lavender" });
  });
});
