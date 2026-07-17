import { describe, expect, it } from "vitest";

import { inspectPrivacy, inspectStructuredPrivacy } from "@/lib/ai/privacy";

describe("AI privacy inspection", () => {
  it("blocks labeled student identifiers without echoing the original value", () => {
    // Given a request containing a labeled student number
    const input = "학번 1234 학생 상담 내용 정리";

    // When privacy inspection runs
    const result = inspectPrivacy(input);

    // Then it blocks with safe category warnings only
    expect(result).toEqual({ allowed: false, warnings: ["상담 내용", "학번"] });
    expect(JSON.stringify(result)).not.toContain("1234");
  });

  it("allows aggregate operational language and screening workflow names", () => {
    // Given non-identifying operational requests
    const inputs = ["결핵검진 안내 업무 만들어줘", "미제출 5건을 오늘 요약해줘"];

    // When each request is inspected
    const results = inputs.map(inspectPrivacy);

    // Then both remain eligible for local or provider processing
    expect(results).toEqual([
      { allowed: true, warnings: [] },
      { allowed: true, warnings: [] },
    ]);
  });

  it("blocks phone and resident registration number patterns", () => {
    // Given direct contact and identity number patterns
    const input = "연락처 010-1234-5678, 주민등록번호 010101-3123456";

    // When privacy inspection runs
    const result = inspectPrivacy(input);

    // Then both sensitive categories are reported
    expect(result).toEqual({ allowed: false, warnings: ["연락처", "주민등록번호"] });
  });

  it("blocks person-first health descriptions and class-number identifiers", () => {
    // Given individual-first health text and a class-number combination
    const inputs = [
      "김민수 학생 천식 상담",
      "학생 김민수 검진 결과",
      "3학년 2반 15번 확인",
    ];

    // When privacy inspection runs
    const results = inputs.map(inspectPrivacy);

    // Then each individually identifying form is blocked
    expect(results).toEqual([
      { allowed: false, warnings: ["개인 식별 건강정보"] },
      { allowed: false, warnings: ["개인 식별 건강정보"] },
      { allowed: false, warnings: ["반·번호"] },
    ]);
  });

  it("rejects sensitive content introduced while editing a structured draft", () => {
    expect(inspectStructuredPrivacy({
      action: "create_task",
      title: "안내 업무",
      checklist: ["학생 이름: 김보건 검진 결과 확인"],
    })).toEqual({ allowed: false, warnings: ["개인 식별 건강정보"] });
  });
});
