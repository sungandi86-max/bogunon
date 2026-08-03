import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const deleteSecondEq = vi.fn();
  const deleteFirstEq = vi.fn(() => ({ eq: deleteSecondEq }));
  const deleteCall = vi.fn(() => ({ eq: deleteFirstEq }));
  const from = vi.fn(() => ({ delete: deleteCall }));
  return { authGetUser: vi.fn(), deleteCall, deleteFirstEq, deleteSecondEq, from };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.authGetUser },
    from: mocks.from,
  })),
}));

import { deleteCalendarSticker } from "@/lib/calendar-stickers/repository";

describe("legacy calendar sticker repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mocks.deleteSecondEq.mockResolvedValue({ error: null });
  });

  it("keeps only the owned delete path needed for migration collision cleanup", async () => {
    await expect(deleteCalendarSticker("a5000000-0000-4000-8000-000000000004")).resolves.toBeUndefined();
    expect(mocks.from).toHaveBeenCalledWith("calendar_stickers");
    expect(mocks.deleteCall).toHaveBeenCalledOnce();
    expect(mocks.deleteFirstEq).toHaveBeenCalledWith("id", "a5000000-0000-4000-8000-000000000004");
    expect(mocks.deleteSecondEq).toHaveBeenCalledWith("user_id", "user-1");
  });
});
