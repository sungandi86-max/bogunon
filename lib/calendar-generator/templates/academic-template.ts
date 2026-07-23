import type { CalendarTemplateDefinition, CalendarTemplateRule } from "@/lib/calendar-generator/types";

const SCHOOL_CONFIRMATION = {
  confirmationReason: "School calendars vary by region and year; confirm before generating.",
};

export const ACADEMIC_TEMPLATE_RULES = [
  academicRule({ id: "academic-admission", stickerKey: "academic.admission", rule: { kind: "fixed", month: 3, day: 2 }, suggestedRule: "Suggested near the first school day of March." }),
  academicRule({ id: "academic-opening-ceremony", stickerKey: "opening-ceremony", rule: { kind: "fixed", month: 3, day: 2 }, suggestedRule: "Suggested near the first school day of March." }),
  academicRule({ id: "academic-diagnostic-assessment", stickerKey: "academic.diagnostic-assessment", rule: { kind: "nth-weekday", month: 3, weekday: 1, occurrence: 2 }, suggestedRule: "Suggested for the second Monday in March." }),
  academicRule({ id: "academic-midterm", stickerKey: "academic.midterm", rule: { kind: "fixed", month: 4, day: 24 }, suggestedRule: "Suggested for late April." }),
  academicRule({ id: "academic-final", stickerKey: "academic.final", rule: { kind: "fixed", month: 7, day: 8 }, suggestedRule: "Suggested for early July." }),
  academicRule({ id: "academic-vacation-ceremony", stickerKey: "vacation-ceremony", rule: { kind: "fixed", month: 7, day: 24 }, suggestedRule: "Suggested near late July." }),
  academicRule({ id: "academic-summer-break", stickerKey: "academic.summer-break", rule: { kind: "range", start: { kind: "fixed", month: 7, day: 25 }, end: { kind: "fixed", month: 8, day: 20 } }, suggestedRule: "Suggested summer break range." }),
  academicRule({ id: "academic-winter-break", stickerKey: "academic.winter-break", rule: { kind: "range", start: { kind: "fixed", month: 1, day: 2 }, end: { kind: "fixed", month: 2, day: 28 } }, suggestedRule: "Suggested winter break range." }),
  academicRule({ id: "academic-graduation", stickerKey: "academic.graduation", rule: { kind: "fixed", month: 1, day: 10 }, suggestedRule: "Suggested for January graduation season." }),
] as const satisfies readonly CalendarTemplateRule[];

export const ACADEMIC_TEMPLATE = {
  id: "academic-v1",
  version: "1.0.0",
  pack: "academic",
  rules: ACADEMIC_TEMPLATE_RULES,
} as const satisfies CalendarTemplateDefinition;

type SuggestedRuleRequest = {
  readonly id: string;
  readonly stickerKey: string;
  readonly rule: CalendarTemplateRule["rule"];
  readonly suggestedRule: string;
};

function academicRule(request: SuggestedRuleRequest): CalendarTemplateRule {
  return {
    id: request.id,
    stickerKey: request.stickerKey,
    rule: request.rule,
    requiresConfirmation: true,
    metadata: {
      schoolAdjustment: {
        ...SCHOOL_CONFIRMATION,
        suggestedRule: request.suggestedRule,
      },
    },
  };
}
