import { beforeEach, describe, expect, it, vi } from "vitest";
const { saveNotice, deleteNotice, markNoticeRead } = vi.hoisted(() => ({ saveNotice: vi.fn(), deleteNotice: vi.fn(), markNoticeRead: vi.fn() }));
vi.mock("@/lib/notices/repository", () => ({ saveNotice, deleteNotice, markNoticeRead }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { markNoticeReadAction, saveNoticeAction } from "@/app/(app)/notices/actions";

function form(values: Readonly<Record<string, string>>): FormData { const data = new FormData(); Object.entries(values).forEach(([key, value]) => data.set(key, value)); return data; }
describe("notice server actions", () => {
  beforeEach(() => { saveNotice.mockReset(); deleteNotice.mockReset(); markNoticeRead.mockReset(); });
  it("parses a valid Korean-time form before saving", async () => { await saveNoticeAction(form({ title: "점검 안내", summary: "서비스 점검", content: "점검 내용", category: "maintenance", isPublished: "on", publishStartAt: "2026-07-20T09:00", publishEndAt: "2026-07-20T10:00" })); expect(saveNotice).toHaveBeenCalledWith(null, expect.objectContaining({ title: "점검 안내", summary: "서비스 점검", category: "maintenance", isPublished: true, publishStartAt: "2026-07-20T00:00:00.000Z", publishEndAt: "2026-07-20T01:00:00.000Z" })); });
  it("blocks an end time earlier than its start time", async () => { await expect(saveNoticeAction(form({ title: "예약", content: "내용", category: "notice", publishStartAt: "2026-07-20T10:00", publishEndAt: "2026-07-20T09:00" }))).rejects.toThrow(); expect(saveNotice).not.toHaveBeenCalled(); });
  it("marks only a UUID notice as read", async () => { await markNoticeReadAction(form({ id: "10000000-0000-4000-8000-000000000001" })); expect(markNoticeRead).toHaveBeenCalledWith("10000000-0000-4000-8000-000000000001"); });
});
