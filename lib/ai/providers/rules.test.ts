import { describe, expect, it } from "vitest";

import { createRulesProvider } from "@/lib/ai/providers/rules";

describe("rules-only AI provider", () => {
  it("creates a Korean task preview without an API key", async () => {
    // Given a provider request for a dated, urgent task
    const provider = createRulesProvider(new Date("2026-07-18T00:00:00+09:00"));

    // When the rules provider generates a preview
    const result = await provider.generate({
      input: "다음 주 월요일 긴급 결핵검진 안내 업무 만들어줘",
      context: { surface: "global" },
      selectedContext: [],
    });

    // Then it returns a strict create_task preview in mock mode
    expect(result.mode).toBe("mock");
    expect(result.response.action).toMatchObject({
      action: "create_task",
      category: "additionalScreening",
      priority: "high",
      scheduled_date: "2026-07-20",
    });
  });

  it("returns deterministic summary output for an empty context", async () => {
    // Given a summary request with no selected records
    const provider = createRulesProvider(new Date("2026-07-18T00:00:00+09:00"));

    // When the provider generates a preview
    const result = await provider.generate({
      input: "오늘 업무 요약",
      context: { surface: "dashboard" },
      selectedContext: [],
    });

    // Then the fallback remains useful and deterministic
    expect(result.response.action).toEqual({
      action: "summarize_today",
      summary: "오늘 등록된 일정과 핵심 업무가 없습니다.",
      highlights: [],
      item_count: 0,
    });
  });

  it("targets a priority recommendation without applying it", async () => {
    // Given a priority request from a task surface
    const provider = createRulesProvider(new Date("2026-07-18T00:00:00+09:00"));

    // When the rules provider generates the recommendation
    const result = await provider.generate({
      input: "이 업무 우선순위 추천해줘",
      context: { surface: "task", entityId: "task-1" },
      selectedContext: [],
    });

    // Then the preview points at the task without mutating it
    expect(result.response.action).toMatchObject({
      action: "recommend_priority",
      target_id: "task-1",
    });
  });
});
