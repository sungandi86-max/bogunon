import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CalendarStickerRow } from "@/types/database";

const mocks = vi.hoisted(() => {
  const upsertSingle = vi.fn();
  const upsertSelect = vi.fn(() => ({ single: upsertSingle }));
  const upsert = vi.fn(() => ({ select: upsertSelect }));
  const deleteSecondEq = vi.fn();
  const deleteFirstEq = vi.fn(() => ({ eq: deleteSecondEq }));
  const deleteCall = vi.fn(() => ({ eq: deleteFirstEq }));
  const from = vi.fn(() => ({ delete: deleteCall, upsert }));
  return {
    authGetUser: vi.fn(),
    deleteCall,
    deleteFirstEq,
    deleteSecondEq,
    from,
    upsert,
    upsertSingle,
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.authGetUser },
    from: mocks.from,
  })),
}));

import { deleteCalendarSticker, upsertCalendarSticker } from "@/lib/calendar-stickers/repository";

const savedSticker: CalendarStickerRow = {
  id: "a5000000-0000-4000-8000-000000000004",
  user_id: "user-1",
  sticker_key: "health.aed-check",
  sticker_date: "2026-07-21",
  end_date: null,
  label: "AED 점검",
  note: null,
  created_at: "",
  updated_at: "",
};

describe("calendar sticker repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mocks.upsertSingle.mockResolvedValue({ data: savedSticker, error: null });
    mocks.deleteSecondEq.mockResolvedValue({ error: null });
  });

  it("deduplicates same-date health stickers with the existing user/date/key upsert contract", async () => {
    await expect(upsertCalendarSticker({
      stickerKey: "health.aed-check",
      stickerDate: "2026-07-21",
      endDate: null,
      label: "AED 점검",
      note: null,
    })).resolves.toEqual(savedSticker);

    expect(mocks.from).toHaveBeenCalledWith("calendar_stickers");
    expect(mocks.upsert).toHaveBeenCalledWith({
      user_id: "user-1",
      sticker_key: "health.aed-check",
      sticker_date: "2026-07-21",
      end_date: null,
      label: "AED 점검",
      note: null,
    }, { onConflict: "user_id,sticker_date,sticker_key" });
  });

  it("deletes only the requested row owned by the current user", async () => {
    await expect(deleteCalendarSticker("a5000000-0000-4000-8000-000000000004")).resolves.toBeUndefined();

    expect(mocks.from).toHaveBeenCalledWith("calendar_stickers");
    expect(mocks.deleteCall).toHaveBeenCalledOnce();
    expect(mocks.deleteFirstEq).toHaveBeenCalledWith("id", "a5000000-0000-4000-8000-000000000004");
    expect(mocks.deleteSecondEq).toHaveBeenCalledWith("user_id", "user-1");
  });
});
