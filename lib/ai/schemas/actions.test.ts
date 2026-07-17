import { describe, expect, it } from "vitest";

import {
  AI_ACTION_TYPES,
  AiAssistantResponseSchema,
  type AiAction,
  type AiActionType,
} from "@/lib/ai/schemas/actions";

const actions = [
  {
    action: "create_task",
    title: "공문 회신 준비",
    description: null,
    category: "officialDocument",
    priority: "normal",
    scheduled_date: "2026-07-20",
    due_date: null,
    recurrence: null,
    checklist: [],
    links: [],
    reminder: null,
  },
  {
    action: "create_event",
    title: "보건교육",
    description: null,
    start_date: "2026-07-21",
    end_date: "2026-07-21",
    start_time: "14:00",
    end_time: "15:00",
    is_all_day: false,
    checklist: [],
    links: [],
    reminder: null,
  },
  {
    action: "create_workflow",
    task_id: null,
    template_id: null,
    name: "검진 준비",
    description: null,
    category: "studentHealthScreening",
    priority: "high",
    steps: [{ name: "일정 확인", description: null, checklist: [] }],
  },
  {
    action: "create_checklist",
    target_id: null,
    title: "준비 항목",
    items: [{ title: "일정 확인", is_completed: false }],
  },
  {
    action: "create_workflow_template",
    name: "월간 물품 점검",
    description: null,
    category: "medication",
    default_priority: "normal",
    recommended_timing: "매월 첫째 주",
    steps: [{ name: "재고 확인", description: null, checklist: [] }],
  },
  { action: "summarize_today", summary: "오늘 업무가 없습니다.", highlights: [], item_count: 0 },
  {
    action: "summarize_period",
    start_date: "2026-07-01",
    end_date: "2026-07-31",
    summary: "기간 업무 요약",
    highlights: [],
    item_count: 0,
  },
  { action: "recommend_priority", target_id: null, priority: "high", reason: "마감이 임박했습니다." },
  { action: "find_similar_work", query: "검진", matches: [] },
  {
    action: "duplicate_previous_work",
    source_id: "task-1",
    source_type: "task",
    title: "지난 업무 재사용",
    target_date: null,
    include_description: false,
    include_memo: false,
  },
] satisfies readonly AiAction[];

describe("AI action schemas", () => {
  it("parses every stable UI-facing action variant", () => {
    // Given all supported action payloads
    const parsed = actions.map((action) => AiAssistantResponseSchema.parse({ action, warnings: [] }));

    // When their discriminants are read through the exported union
    const types: readonly AiActionType[] = parsed.map((item) => item.action.action);

    // Then every public action type is represented exactly once
    expect(types).toEqual(AI_ACTION_TYPES);
  });

  it("rejects unknown fields at nested action boundaries", () => {
    // Given an otherwise valid action with an undeclared field
    const candidate = { action: { ...actions[0], user_id: "another-user" }, warnings: [] };

    // When the structured response is parsed
    const result = AiAssistantResponseSchema.safeParse(candidate);

    // Then the undeclared ownership field is rejected
    expect(result.success).toBe(false);
  });

  it("rejects impossible calendar dates", () => {
    // Given a task with a syntactically shaped but impossible date
    const candidate = { action: { ...actions[0], scheduled_date: "2026-02-31" }, warnings: [] };

    // When the structured response is parsed
    const result = AiAssistantResponseSchema.safeParse(candidate);

    // Then the date boundary rejects it
    expect(result.success).toBe(false);
  });
});
