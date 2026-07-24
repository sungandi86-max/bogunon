import { countUtf8Bytes } from "@/lib/ai/document-writer";

export type SchoolRecordReviewLevel = "error" | "check" | "suggestion";

export interface SchoolRecordReviewIssue {
  readonly category: string;
  readonly expression: string;
  readonly guidelineBasis: string | null;
  readonly id: string;
  readonly level: SchoolRecordReviewLevel;
  readonly reason: string;
  readonly suggestion: string | null;
}

interface ReviewOptions {
  readonly guidelineText?: string | undefined;
}

interface ReviewRule {
  readonly category: string;
  readonly level: SchoolRecordReviewLevel;
  readonly pattern: RegExp;
  readonly reason: string;
  readonly replacement?: string;
}

const REVIEW_RULES: readonly ReviewRule[] = [
  {
    category: "개인정보",
    level: "error",
    pattern: /(?:(?:연락처\s*)?01[016789][-\s]?\d{3,4}[-\s]?\d{4}[을를]?\s*)|(?:학번\s*\d{2,})|(?:주민등록번호)/,
    reason: "개인정보로 보이는 내용은 초안에서 제거해야 합니다.",
    replacement: "",
  },
  {
    category: "외부 활동",
    level: "check",
    pattern: /(?:외부기관|교외)\s*[^.!?\n]{0,20}(?:대회|수상|자격)|(?:대회에서 수상|자격증을 취득)/,
    reason: "외부기관·대회·수상·자격 관련 사실과 기재 가능 여부를 교사가 확인해야 합니다.",
  },
  {
    category: "직접 관찰",
    level: "check",
    pattern: /(?:느꼈다고|생각했다고|깨달았다고|이해했다고)\s*(?:함|기재함|작성함)?/,
    reason: "학생 제출자료의 서술인지 교사가 직접 관찰한 내용인지 구분해 확인해 주세요.",
  },
  {
    category: "과장과 단정",
    level: "suggestion",
    pattern: /(?:최고의|완벽한|탁월한|매우 우수한|천재적인)\s*(?:역량|능력|성과|태도)?[을를]?/,
    reason: "근거가 충분하지 않은 우수성 평가나 단정으로 읽힐 수 있습니다.",
    replacement: "활동 자료에서 확인되는 참여 모습을",
  },
  {
    category: "문장부호",
    level: "suggestion",
    pattern: /[!?]{2,}/,
    reason: "생활기록부 문장에 맞게 문장부호를 한 번만 사용하는 편이 자연스럽습니다.",
    replacement: ".",
  },
  {
    category: "맞춤법과 문장",
    level: "suggestion",
    pattern: / {2,}/,
    reason: "불필요하게 반복된 공백을 정리해 주세요.",
    replacement: " ",
  },
  {
    category: "중복 표현",
    level: "suggestion",
    pattern: /([가-힣]{2,})(?:\s+\1)+/,
    reason: "같은 표현이 연달아 반복되어 문장을 다듬을 수 있습니다.",
  },
] as const;

function guidelineBasis(
  expression: string,
  guidelineText: string | undefined,
): string | null {
  if (!guidelineText?.trim() || !guidelineText.includes(expression)) return null;
  return `등록된 공식 기준자료에서 '${expression}' 관련 내용을 확인했습니다.`;
}

export function reviewSchoolRecordDraft(
  draft: string,
  options: ReviewOptions = {},
): readonly SchoolRecordReviewIssue[] {
  const issues: SchoolRecordReviewIssue[] = [];
  for (const [index, rule] of REVIEW_RULES.entries()) {
    const match = draft.match(rule.pattern);
    if (!match?.[0]) continue;
    const expression = match[0];
    issues.push({
      category: rule.category,
      expression,
      guidelineBasis: guidelineBasis(expression, options.guidelineText),
      id: `${rule.category}-${index}-${expression}`,
      level: rule.level,
      reason: rule.reason,
      suggestion: rule.replacement ?? null,
    });
  }

  if (countUtf8Bytes(draft) > 1_500) {
    issues.push({
      category: "분량",
      expression: "1500바이트 초과",
      guidelineBasis: null,
      id: "byte-limit",
      level: "error",
      reason: "UTF-8 기준 1500바이트를 초과했습니다.",
      suggestion: null,
    });
  }
  return issues;
}
