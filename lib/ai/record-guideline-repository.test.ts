import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadRecordGuidelineContext } from "@/lib/ai/record-guideline-repository";

const { eq, getUser, order, select } = vi.hoisted(() => ({
  eq: vi.fn(),
  getUser: vi.fn(),
  order: vi.fn(),
  select: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser },
    from: () => ({ select }),
  }),
}));

describe("loadRecordGuidelineContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const query = { eq, order };
    select.mockReturnValue(query);
    eq.mockReturnValue(query);
    getUser.mockResolvedValue({
      data: { user: { id: "11111111-1111-4111-8111-111111111111" } },
      error: null,
    });
  });

  it("loads only the signed-in user's selected year and combines completed text", async () => {
    order.mockResolvedValue({
      data: [
        {
          created_at: "2026-07-25T00:00:00Z",
          document_type: "guide",
          extracted_text: "공식 기재요령",
          file_size: 256,
          id: "22222222-2222-4222-8222-222222222222",
          mime_type: "text/plain",
          original_filename: "2026-guide.txt",
          school_year: 2026,
          updated_at: "2026-07-25T00:00:00Z",
        },
        {
          created_at: "2026-07-25T00:00:00Z",
          document_type: "supplement",
          extracted_text: "   ",
          file_size: 16,
          id: "33333333-3333-4333-8333-333333333333",
          mime_type: "text/plain",
          original_filename: "incomplete.txt",
          school_year: 2026,
          updated_at: "2026-07-25T00:00:00Z",
        },
      ],
      error: null,
    });

    const context = await loadRecordGuidelineContext(2026);

    expect(eq).toHaveBeenNthCalledWith(
      1,
      "user_id",
      "11111111-1111-4111-8111-111111111111",
    );
    expect(eq).toHaveBeenNthCalledWith(2, "school_year", 2026);
    expect(context.userId).toBe("11111111-1111-4111-8111-111111111111");
    expect(context.guideline?.text).toBe("[학교생활기록부 기재요령]\n공식 기재요령");
    expect(context.guideline?.fileName).toBe("2026-guide.txt");
  });

  it("returns no applicable guideline when completed text is absent", async () => {
    order.mockResolvedValue({ data: [], error: null });

    await expect(loadRecordGuidelineContext(2026)).resolves.toEqual({
      guideline: null,
      userId: "11111111-1111-4111-8111-111111111111",
    });
  });
});
