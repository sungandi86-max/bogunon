import { describe, expect, it } from "vitest";

import {
  mergeSchoolRecordReview,
  reviewSchoolRecordDraft,
} from "@/lib/ai/school-record-review";

describe("school record draft review", () => {
  it("checks privacy, uncertain external claims, overstatement, punctuation, and bytes", () => {
    const draft = `연락처 010-1234-5678을 확인하고 외부기관 대회에서 수상함. 최고의 역량을 보임!! ${"가".repeat(500)}`;
    const issues = reviewSchoolRecordDraft(draft);

    expect(issues.map(({ category }) => category)).toEqual(expect.arrayContaining([
      "개인정보",
      "외부 활동",
      "과장과 단정",
      "문장부호",
      "분량",
    ]));
  });

  it("does not claim a guideline prohibition without registered evidence", () => {
    const issues = reviewSchoolRecordDraft("외부기관 대회에서 수상함.");

    expect(issues[0]?.guidelineBasis).toBeNull();
    expect(issues[0]?.reason).not.toContain("금지");
  });

  it("offers an applicable replacement and clears the issue after application", () => {
    const draft = "최고의 역량을 보임.";
    const [issue] = reviewSchoolRecordDraft(draft);
    expect(issue?.suggestion).toBeTruthy();

    const updated = draft.replace(issue?.expression ?? "", issue?.suggestion ?? "");
    expect(reviewSchoolRecordDraft(updated)).toHaveLength(0);
  });

  it("removes a detected privacy expression when its suggestion is applied", () => {
    const draft = "연락처 010-1234-5678을 확인함.";
    const [issue] = reviewSchoolRecordDraft(draft);

    expect(issue?.category).toBe("개인정보");
    expect(issue?.suggestion).toBe("");
    expect(draft.replace(issue?.expression ?? "", issue?.suggestion ?? "")).toBe("확인함.");
  });

  it("merges structured AI review with local safeguards and removes stale expressions", () => {
    const draft = "외부기관 대회에서 수상함. 연락처 010-1234-5678을 확인함.";
    const issues = mergeSchoolRecordReview(draft, {
      errors: [],
      needsConfirmation: [{
        category: "공식 근거",
        expression: "외부기관 대회에서 수상함",
        guidelineBasis: null,
        reason: "공식 기재요령 근거를 확인해야 합니다.",
        suggestion: "교내 활동 내용을 중심으로 수정함",
      }],
      suggestions: [{
        category: "이미 수정됨",
        expression: "존재하지 않는 표현",
        guidelineBasis: null,
        reason: "현재 초안에는 없는 표현입니다.",
        suggestion: null,
      }],
    });

    expect(issues.map(({ category }) => category)).toEqual(expect.arrayContaining([
      "개인정보",
      "공식 근거",
    ]));
    expect(issues.some(({ category }) => category === "이미 수정됨")).toBe(false);
  });
});
