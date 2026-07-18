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

  it("stores a date and sticker only, and reports duplicate taps without another row", async () => {
    vi.mocked(saveExerciseLog).mockResolvedValueOnce("created").mockResolvedValueOnce("duplicate");
    const form = new FormData();
    form.set("stickerId", stickerId);
    form.set("exerciseDate", "2026-07-18");
    await expect(attachExerciseStickerAction({ status: "idle" }, form)).resolves.toMatchObject({ status: "success" });
    await expect(attachExerciseStickerAction({ status: "idle" }, form)).resolves.toEqual({ status: "success", message: "이미 붙인 운동 스티커예요." });
    expect(saveExerciseLog).toHaveBeenCalledWith(stickerId, "2026-07-18");
  });

  it("removes a selected sticker and keeps optional details nullable", async () => {
    const removeForm = new FormData(); removeForm.set("logId", logId);
    await expect(removeExerciseStickerAction({ status: "idle" }, removeForm)).resolves.toMatchObject({ status: "success" });
    expect(removeExerciseLog).toHaveBeenCalledWith(logId);
    expect(revalidatePath).toHaveBeenCalledWith("/exercise");
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
