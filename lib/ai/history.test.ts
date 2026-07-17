import { beforeEach, describe, expect, it, vi } from "vitest";

import { persistAiHistory } from "@/lib/ai/history";
import { AiActionSchema } from "@/lib/ai/schemas/actions";

const rpc = vi.fn();

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc }) }));

describe("AI history persistence", () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({ data: "draft-1", error: null });
  });

  it("stores only the sanitized prompt and structured action when requested", async () => {
    // Given a safe preview action and prompt with redundant whitespace
    const action = AiActionSchema.parse({
      action: "summarize_today",
      summary: "요약",
      highlights: [],
      item_count: 0,
    });

    // When history persistence is explicitly requested
    const result = await persistAiHistory("user-1", "  오늘   업무 요약  ", action);

    // Then the atomic RPC receives only the sanitized prompt and structured action
    expect(result).toEqual({ status: "saved", draftId: "draft-1" });
    expect(rpc).toHaveBeenCalledWith("save_ai_history_bundle", expect.objectContaining({
      p_user_id: "user-1",
      p_request_type: "summarize_today",
      p_prompt: "오늘 업무 요약",
    }));
    expect(JSON.stringify(rpc.mock.calls)).not.toContain("context");
  });
});
