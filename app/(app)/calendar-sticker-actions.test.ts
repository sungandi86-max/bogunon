import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";

import { removeCalendarStickerAction } from "@/app/(app)/calendar-sticker-actions";
import { deleteCalendarSticker } from "@/lib/calendar-stickers/repository";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/calendar-stickers/repository", () => ({ deleteCalendarSticker: vi.fn() }));

describe("legacy calendar sticker cleanup action", () => {
  beforeEach(() => vi.clearAllMocks());

  it("removes a migrated legacy row only by its validated id", async () => {
    const invalid = new FormData();
    invalid.set("stickerId", "not-a-uuid");
    await expect(removeCalendarStickerAction({ status: "idle" }, invalid)).resolves.toMatchObject({ status: "error" });
    expect(deleteCalendarSticker).not.toHaveBeenCalled();

    const form = new FormData();
    form.set("stickerId", "a5000000-0000-4000-8000-000000000009");
    await expect(removeCalendarStickerAction({ status: "idle" }, form)).resolves.toEqual({
      status: "success",
      message: "학교 일정 스티커를 제거했어요.",
    });
    expect(deleteCalendarSticker).toHaveBeenCalledWith("a5000000-0000-4000-8000-000000000009");
    expect(revalidatePath).toHaveBeenCalledWith("/calendar");
    expect(revalidatePath).toHaveBeenCalledWith("/briefing");
  });
});
