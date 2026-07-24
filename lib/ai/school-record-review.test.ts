import { describe, expect, it } from "vitest";

import { reviewSchoolRecordDraft } from "@/lib/ai/school-record-review";

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
});
