import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";

import { attachCalendarStickerAction, removeCalendarStickerAction } from "@/app/(app)/calendar-sticker-actions";
import { deleteCalendarSticker, upsertCalendarSticker } from "@/lib/calendar-stickers/repository";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/calendar-stickers/repository", () => ({
  deleteCalendarSticker: vi.fn(),
  upsertCalendarSticker: vi.fn(),
}));

describe("calendar sticker actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("attaches a catalog sticker with date-only range values and revalidates consumers", async () => {
    const form = new FormData();
    form.set("stickerKey", "vacation-ceremony");
    form.set("stickerDate", "2026-07-20");
    form.set("endDate", "2026-08-16");
    form.set("note", " 여름방학 ");

    await expect(attachCalendarStickerAction({ status: "idle" }, form)).resolves.toEqual({
      status: "success",
      message: "방학식 스티커를 붙였어요.",
    });
    expect(upsertCalendarSticker).toHaveBeenCalledWith({
      stickerKey: "vacation-ceremony",
      stickerDate: "2026-07-20",
      endDate: "2026-08-16",
      label: "방학식",
      note: "여름방학",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/calendar");
    expect(revalidatePath).toHaveBeenCalledWith("/briefing");
  });

  it("rejects timestamps and removes only by a validated row id", async () => {
    const invalidAttach = new FormData();
    invalidAttach.set("stickerKey", "holiday");
    invalidAttach.set("stickerDate", "2026-07-18T00:00:00Z");
    await expect(attachCalendarStickerAction({ status: "idle" }, invalidAttach)).resolves.toMatchObject({ status: "error" });
    expect(upsertCalendarSticker).not.toHaveBeenCalled();

    const remove = new FormData();
    remove.set("stickerId", "a5000000-0000-4000-8000-000000000003");
    await expect(removeCalendarStickerAction({ status: "idle" }, remove)).resolves.toMatchObject({ status: "success" });
    expect(deleteCalendarSticker).toHaveBeenCalledWith("a5000000-0000-4000-8000-000000000003");
  });
});
