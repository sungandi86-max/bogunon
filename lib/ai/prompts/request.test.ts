import { describe, expect, it } from "vitest";

import { buildAssistantPrompt } from "@/lib/ai/prompts/request";

describe("AI provider prompt", () => {
  it("omits internal ids and default-excluded descriptions", () => {
    const prompt = buildAssistantPrompt(
      {
        input: "오늘 업무를 정리해줘",
        context: { surface: "task", entityId: "internal-entity-id" },
        saveHistory: false,
      },
      [{
        id: "internal-row-id",
        kind: "task",
        title: "공문 확인",
        detail: "provider에 보내면 안 되는 설명",
        date: "2026-07-18",
        surface: "task",
      }],
    );

    expect(prompt).toContain("공문 확인");
    expect(prompt).not.toContain("internal-entity-id");
    expect(prompt).not.toContain("internal-row-id");
    expect(prompt).not.toContain("provider에 보내면 안 되는 설명");
    expect(prompt).not.toContain("entity_id");
  });
});
