import { beforeEach, describe, expect, it, vi } from "vitest";

import { insertAcademicEvents } from "@/lib/academic-calendar-import/repository";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const event = {
  title: "개학식",
  area: "schoolSchedule" as const,
  start_date: "2026-03-02",
  end_date: "2026-03-02",
  is_all_day: true as const,
  start_time: null,
  end_time: null,
  location: null,
  color_key: "yellow" as const,
  recurrence_frequency: null,
  recurrence_source_id: null,
  recurrence_date: null,
  recurrence_generated_through: null,
  memo: null,
  description: null,
};

describe("academic calendar import repository", () => {
  const insert = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    insert.mockResolvedValue({ error: null });
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "verified-user" } }, error: null }) },
      from: vi.fn(() => ({ insert })),
    } as never);
  });

  it("sends the bounded batch in one atomic insert with the verified user id", async () => {
    const rows = Array.from({ length: 101 }, (_, index) => ({ ...event, title: `일정 ${index}` }));

    await expect(insertAcademicEvents(rows)).resolves.toEqual({ inserted: 101, failed: 0 });
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ title: "일정 0", user_id: "verified-user" }),
      expect.objectContaining({ title: "일정 100", user_id: "verified-user" }),
    ]));
  });

  it("fails the whole batch when the single insert fails", async () => {
    insert.mockResolvedValue({ error: { message: "database error" } });

    await expect(insertAcademicEvents([event])).rejects.toThrow("학사일정을 등록하지 못했습니다.");
  });
});
