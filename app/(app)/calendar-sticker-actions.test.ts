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

  it("stores a personal sticker through the existing owned calendar sticker path", async () => {
    const form = new FormData();
    form.set("stickerKey", "personal.hospital");
    form.set("stickerDate", "2026-07-18");

    await expect(attachCalendarStickerAction({ status: "idle" }, form)).resolves.toMatchObject({ status: "success" });
    expect(upsertCalendarSticker).toHaveBeenCalledWith({
      stickerKey: "personal.hospital",
      stickerDate: "2026-07-18",
      endDate: null,
      label: "병원",
      note: null,
    });
  });

  it("stores an academic sticker through the existing idempotent upsert path", async () => {
    const form = new FormData();
    form.set("stickerKey", "academic.sports-day");
    form.set("stickerDate", "2026-07-18");

    await expect(attachCalendarStickerAction({ status: "idle" }, form)).resolves.toMatchObject({ status: "success" });
    expect(upsertCalendarSticker).toHaveBeenCalledWith({
      stickerKey: "academic.sports-day",
      stickerDate: "2026-07-18",
      endDate: null,
      label: "체육대회",
      note: null,
    });
  });

  it("stores a health sticker through the same calendar sticker upsert path", async () => {
    const form = new FormData();
    form.set("stickerKey", "health.aed-check");
    form.set("stickerDate", "2026-07-21");

    await expect(attachCalendarStickerAction({ status: "idle" }, form)).resolves.toEqual({
      status: "success",
      message: "AED 점검 스티커를 붙였어요.",
    });
    expect(upsertCalendarSticker).toHaveBeenCalledWith({
      stickerKey: "health.aed-check",
      stickerDate: "2026-07-21",
      endDate: null,
      label: "AED 점검",
      note: null,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/calendar");
    expect(revalidatePath).toHaveBeenCalledWith("/briefing");
  });

  it("stores a holiday sticker through the existing explicit attach action", async () => {
    const form = new FormData();
    form.set("stickerKey", "holiday.hangul-day");
    form.set("stickerDate", "2026-10-09");
    form.set("note", " 한글날 행사 ");

    await expect(attachCalendarStickerAction({ status: "idle" }, form)).resolves.toEqual({
      status: "success",
      message: "한글날 스티커를 붙였어요.",
    });
    expect(upsertCalendarSticker).toHaveBeenCalledWith({
      stickerKey: "holiday.hangul-day",
      stickerDate: "2026-10-09",
      endDate: null,
      label: "한글날",
      note: "한글날 행사",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/calendar");
    expect(revalidatePath).toHaveBeenCalledWith("/briefing");
  });

  it("keeps reused holiday legacy keys on the same generic attach path", async () => {
    const publicHoliday = new FormData();
    publicHoliday.set("stickerKey", "holiday");
    publicHoliday.set("stickerDate", "2026-05-05");

    const longWeekend = new FormData();
    longWeekend.set("stickerKey", "long-weekend");
    longWeekend.set("stickerDate", "2026-10-05");

    await expect(attachCalendarStickerAction({ status: "idle" }, publicHoliday)).resolves.toEqual({
      status: "success",
      message: "공휴일 스티커를 붙였어요.",
    });
    await expect(attachCalendarStickerAction({ status: "idle" }, longWeekend)).resolves.toEqual({
      status: "success",
      message: "연휴 스티커를 붙였어요.",
    });

    expect(upsertCalendarSticker).toHaveBeenNthCalledWith(1, {
      stickerKey: "holiday",
      stickerDate: "2026-05-05",
      endDate: null,
      label: "공휴일",
      note: null,
    });
    expect(upsertCalendarSticker).toHaveBeenNthCalledWith(2, {
      stickerKey: "long-weekend",
      stickerDate: "2026-10-05",
      endDate: null,
      label: "연휴",
      note: null,
    });
  });

  it("rejects unknown holiday keys before any repository write or revalidation", async () => {
    const form = new FormData();
    form.set("stickerKey", "holiday.not-allowed");
    form.set("stickerDate", "2026-10-09");

    await expect(attachCalendarStickerAction({ status: "idle" }, form)).resolves.toEqual({
      status: "error",
      message: "스티커와 날짜를 확인해 주세요.",
    });
    expect(upsertCalendarSticker).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("deletes a holiday sticker by id and revalidates without pack-specific branching", async () => {
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
