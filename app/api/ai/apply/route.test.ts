import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/ai/apply/route";

const { applyAiAction, getUser, markAiDraftApplied, revalidatePath } = vi.hoisted(() => ({
  applyAiAction: vi.fn(),
  getUser: vi.fn(),
  markAiDraftApplied: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/ai/apply", () => ({ applyAiAction }));
vi.mock("@/lib/ai/history", () => ({ markAiDraftApplied }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

describe("AI draft apply route", () => {
  beforeEach(() => {
    applyAiAction.mockReset();
    getUser.mockReset();
    markAiDraftApplied.mockReset();
    revalidatePath.mockReset();
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    applyAiAction.mockResolvedValue({ applied: true, destination: "/tasks" });
  });

  it("keeps a successful domain mutation successful when the optional history mark fails", async () => {
    markAiDraftApplied.mockRejectedValue(new Error("history unavailable"));
    const request = new Request("http://localhost/api/ai/apply?draftId=draft-1", {
      method: "POST",
      body: JSON.stringify({
        action: "recommend_priority",
        target_id: "00000000-0000-0000-0000-000000000001",
        priority: "high",
        reason: "오늘 마감",
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      applied: true,
      destination: "/tasks",
      warning: "업무는 적용했지만 AI 기록 상태를 갱신하지 못했습니다.",
    });
  });

  it("rejects sensitive content added to an edited draft before applying it", async () => {
    const request = new Request("http://localhost/api/ai/apply", {
      method: "POST",
      body: JSON.stringify({
        action: "create_workflow_template",
        name: "학생 이름: 김보건 검진 결과",
        description: null,
        category: "studentHealthScreening",
        default_priority: "normal",
        recommended_timing: "9월",
        steps: [{ name: "안내", description: null, checklist: [] }],
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(422);
    expect(applyAiAction).not.toHaveBeenCalled();
  });
});
