import type { CalendarTemplateDefinition, CalendarTemplateRule, MonthNumber } from "@/lib/calendar-generator/types";

const SCHOOL_CONFIRMATION = {
  confirmationReason: "School health schedules vary by school and provider; confirm before generating.",
};

const MONTHLY_OPERATION_KEYS = [
  "health.aed-check",
  "health.medicine-check",
  "health.emergency-kit-check",
  "health.health-room-check",
] as const;

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const satisfies readonly MonthNumber[];

const MONTHLY_OPERATION_RULES = MONTHLY_OPERATION_KEYS.flatMap((stickerKey) =>
  MONTHS.map((month) =>
    healthRule(
      {
        id: `${stickerKey}.${month}`,
        stickerKey,
        rule: { kind: "nth-weekday", month, weekday: 1, occurrence: 1 },
        suggestedRule: `Suggested for the first Monday of month ${month}.`,
      },
    ),
  ),
);

export const HEALTH_TEMPLATE_RULES = [
  healthRule({ id: "health-survey", stickerKey: "health.health-survey", rule: { kind: "fixed", month: 3, day: 6 }, suggestedRule: "Suggested for early March." }),
  healthRule({ id: "health-vaccination-check", stickerKey: "health.vaccination-check", rule: { kind: "fixed", month: 3, day: 13 }, suggestedRule: "Suggested for March enrollment checks." }),
  healthRule({ id: "health-student-checkup", stickerKey: "health.student-checkup", rule: { kind: "fixed", month: 4, day: 15 }, suggestedRule: "Suggested for April student health checks." }),
  healthRule({ id: "health-urine-test", stickerKey: "health.urine-test", rule: { kind: "fixed", month: 5, day: 13 }, suggestedRule: "Suggested for May screening windows." }),
  healthRule({ id: "health-tuberculosis-test", stickerKey: "health.tuberculosis-test", rule: { kind: "fixed", month: 6, day: 10 }, suggestedRule: "Suggested for June screening windows." }),
  healthRule({ id: "health-vision-test", stickerKey: "health.vision-test", rule: { kind: "fixed", month: 9, day: 8 }, suggestedRule: "Suggested after the second semester starts." }),
  healthRule({ id: "health-oral-checkup", stickerKey: "health.oral-checkup", rule: { kind: "fixed", month: 10, day: 13 }, suggestedRule: "Suggested for October oral health checks." }),
  healthRule({ id: "health-cpr-training", stickerKey: "health.cpr-training", rule: { kind: "fixed", month: 9, day: 15 }, suggestedRule: "Suggested for second-semester safety training." }),
  healthRule({ id: "health-first-aid-training", stickerKey: "health.first-aid-training", rule: { kind: "fixed", month: 9, day: 22 }, suggestedRule: "Suggested for second-semester safety training." }),
  healthRule({ id: "health-infection-prevention", stickerKey: "health.infection-prevention", rule: { kind: "fixed", month: 11, day: 10 }, suggestedRule: "Suggested before winter infection season." }),
  ...MONTHLY_OPERATION_RULES,
] as const satisfies readonly CalendarTemplateRule[];

export const HEALTH_TEMPLATE = {
  id: "health-v1",
  version: "1.0.0",
  pack: "health",
  rules: HEALTH_TEMPLATE_RULES,
} as const satisfies CalendarTemplateDefinition;

type SuggestedRuleRequest = {
  readonly id: string;
  readonly stickerKey: string;
  readonly rule: CalendarTemplateRule["rule"];
  readonly suggestedRule: string;
};

function healthRule(request: SuggestedRuleRequest): CalendarTemplateRule {
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
