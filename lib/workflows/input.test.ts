import { describe, expect, it } from "vitest";
import { parseWorkflowFollowups, parseWorkflowLinks, parseWorkflowSteps } from "@/lib/workflows/input";

describe("workflow input", () => {
  it("accepts a complete step payload", () => {
    expect(parseWorkflowSteps([{ name: "공문 확인", checklist: ["기한 확인"], links: [{ title: "공문", url: "https://example.com" }] }])).toBeTruthy();
  });

  it("rejects invalid links instead of silently dropping them", () => {
    expect(() => parseWorkflowLinks([{ title: "위험한 링크", url: "javascript:alert(1)" }])).toThrow("http 또는 https");
  });

  it("rejects incomplete follow-up rules", () => {
    expect(() => parseWorkflowFollowups([{ title: "", triggerType: "workflow_completed" }])).toThrow("후속 업무 규칙");
  });
});
