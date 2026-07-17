import { describe, expect, it } from "vitest";

import { selectBoundedContext, type AiContextCandidate } from "@/lib/ai/context";

const candidates: readonly AiContextCandidate[] = [
  { id: "old", kind: "task", title: "지난 업무", detail: "완료", date: "2026-01-01", surface: "task" },
  { id: "target", kind: "task", title: "현재 업무", detail: "마감 확인", date: "2026-07-18", surface: "task" },
  { id: "event", kind: "event", title: "보건교육", detail: null, date: "2026-07-19", surface: "calendar" },
];

describe("bounded AI context selection", () => {
  it("prioritizes the requested entity and enforces item and character budgets", () => {
    // Given context containing a requested entity and multiple nearby records
    const options = { entityId: "target", surface: "task", maxItems: 2, maxCharacters: 60 } as const;

    // When bounded context is selected
    const result = selectBoundedContext(candidates, options);

    // Then the target leads and both budgets are respected
    expect(result.items[0]?.id).toBe("target");
    expect(result.items.length).toBeLessThanOrEqual(2);
    expect(result.characterCount).toBeLessThanOrEqual(60);
  });

  it("drops records containing prohibited personal data", () => {
    // Given a context record with a student identifier
    const sensitive: AiContextCandidate = {
      id: "sensitive",
      kind: "task",
      title: "학번 1234 확인",
      detail: null,
      date: "2026-07-18",
      surface: "task",
    };

    // When context selection runs
    const result = selectBoundedContext([sensitive, ...candidates], {
      surface: "task",
      maxItems: 10,
      maxCharacters: 500,
    });

    // Then the sensitive record never enters provider context
    expect(result.items.map((item) => item.id)).not.toContain("sensitive");
    expect(result.warnings).toContain("민감정보가 포함된 컨텍스트 1건을 제외했습니다.");
  });
});
