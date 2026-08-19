import {
  countUtf8Bytes,
  MAX_SCHOOL_RECORD_BYTES,
} from "@/lib/ai/document-writer";
import type { StudentRecordAiResponse } from "@/lib/ai/prompts/student-record";

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
  readonly activityReport?: string | undefined;
  readonly additionalRecord?: string | undefined;
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

const UNSUPPORTED_CLAIM_RULES = [
  "리더십을 발휘함",
  "친구들과 적극적으로 협력함",
  "발표를 주도함",
  "토론에 적극 참여함",
  "책임감이 뛰어남",
  "성실하게 참여함",
  "높은 관심을 보임",
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

  const source = `${options.activityReport ?? ""}\n${options.additionalRecord ?? ""}`;
  for (const [index, expression] of UNSUPPORTED_CLAIM_RULES.entries()) {
    if (!draft.includes(expression) || source.includes(expression)) continue;
    issues.push({
      category: "입력 근거 확인",
      expression,
      guidelineBasis: null,
      id: `unsupported-claim-${index}-${expression}`,
      level: "error",
      reason: "입력 자료에 없는 사실이나 평가 표현입니다. 근거가 있는 내용으로 바꿔 주세요.",
      suggestion: null,
    });
  }

  if (countUtf8Bytes(draft) > MAX_SCHOOL_RECORD_BYTES) {
    issues.push({
      category: "분량",
      expression: `${MAX_SCHOOL_RECORD_BYTES}바이트 초과`,
      guidelineBasis: null,
      id: "byte-limit",
      level: "error",
      reason: `UTF-8 기준 ${MAX_SCHOOL_RECORD_BYTES}바이트를 초과했습니다. 핵심 탐구와 실제 활동을 우선해 축약해 주세요.`,
      suggestion: null,
    });
  }
  return issues;
}

type AiReview = StudentRecordAiResponse["review"];

function aiReviewIssues(
  draft: string,
  review: AiReview | undefined,
): readonly SchoolRecordReviewIssue[] {
  if (!review) return [];
  const groups = [
    { items: review.errors, level: "error" },
    { items: review.needsConfirmation, level: "check" },
    { items: review.suggestions, level: "suggestion" },
  ] as const;

  return groups.flatMap(({ items, level }) => items
    .filter(({ expression }) => draft.includes(expression))
    .map((item, index) => ({
      ...item,
      id: `ai-${level}-${index}-${item.category}-${item.expression}`,
      level,
    })));
}

export function mergeSchoolRecordReview(
  draft: string,
  review: AiReview | undefined,
  options: ReviewOptions = {},
): readonly SchoolRecordReviewIssue[] {
  const combined = [
    ...reviewSchoolRecordDraft(draft, options),
    ...aiReviewIssues(draft, review),
  ];
  const seen = new Set<string>();
  return combined.filter((issue) => {
    const key = `${issue.level}:${issue.category}:${issue.expression}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
