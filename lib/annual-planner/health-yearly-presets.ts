import { HEALTH_PRESETS } from "@/lib/work-items/health-presets";
import type { TemplateDefinition } from "@/lib/work-items/workflow";
import type { RecurrenceFrequency, TaskCategory, WorkItemKind } from "@/types/database";

export type AnnualPlannerPreset = {
  readonly id: string;
  readonly month: number;
  readonly title: string;
  readonly kind: WorkItemKind;
  readonly recommendedPeriod: string;
  readonly estimatedMinutes: number;
  readonly recurrence: RecurrenceFrequency | null;
  readonly checklist: readonly string[];
  readonly description: string;
  readonly suggestedCategory: TaskCategory;
  readonly presetKey?: string;
  readonly baseTemplate?: TemplateDefinition;
  readonly source: "default" | "custom";
};

export type AnnualPlannerMonth = {
  readonly month: number;
  readonly items: readonly AnnualPlannerPreset[];
};

type StandalonePreset = Omit<AnnualPlannerPreset, "source">;

class AnnualPlannerPresetError extends Error {
  constructor(readonly presetKey: string) {
    super(`연간 플래너 프리셋을 찾지 못했습니다: ${presetKey}`);
    this.name = "AnnualPlannerPresetError";
  }
}

function sharedPreset(month: number, title: string, presetKey: string, recommendedPeriod: string): AnnualPlannerPreset {
  const preset = HEALTH_PRESETS.find((item) => item.key === presetKey);
  if (!preset) throw new AnnualPlannerPresetError(presetKey);
  return {
    id: `${month}-${presetKey}`,
    month,
    title,
    kind: preset.kind,
    recommendedPeriod,
    estimatedMinutes: preset.estimatedMinutes,
    recurrence: preset.recurrenceFrequency,
    checklist: preset.checklist,
    description: preset.description,
    suggestedCategory: preset.category,
    presetKey,
    baseTemplate: preset,
    source: "default",
  };
}

function standalonePreset(values: StandalonePreset): AnnualPlannerPreset {
  return { ...values, source: "default" };
}

const annualMonths = [
  { month: 1, items: [
    standalonePreset({ id: "1-previous-year-review", month: 1, title: "전년도 보건업무 정리", kind: "task", recommendedPeriod: "1월 초", estimatedMinutes: 60, recurrence: null, checklist: ["완료 업무 확인", "미완료 항목 정리", "참고 자료 보관"], description: "전년도 업무 진행 내용을 비식별 업무 단위로 정리합니다.", suggestedCategory: "other" }),
    standalonePreset({ id: "1-annual-plan-draft", month: 1, title: "보건실 연간 운영계획 초안", kind: "task", recommendedPeriod: "1월 중", estimatedMinutes: 90, recurrence: null, checklist: ["전년도 개선사항 확인", "월별 주요 일정 정리", "운영계획 초안 작성"], description: "새 학년도 운영계획을 준비하기 위한 초안을 작성합니다.", suggestedCategory: "officialDocument" }),
    sharedPreset(1, "약품·응급물품 재고 확인", "emergency-supplies-check", "1월 중"),
  ] },
  { month: 2, items: [
    standalonePreset({ id: "2-new-school-year", month: 2, title: "새 학년도 보건실 준비", kind: "task", recommendedPeriod: "개학 전", estimatedMinutes: 90, recurrence: null, checklist: ["공간 정리", "운영 물품 확인", "안내 자료 준비"], description: "새 학년도 보건실 운영에 필요한 항목을 점검합니다.", suggestedCategory: "other" }),
    standalonePreset({ id: "2-bedding-supplies", month: 2, title: "보건실 침구·비품 점검", kind: "task", recommendedPeriod: "개학 전", estimatedMinutes: 45, recurrence: null, checklist: ["침구 상태 확인", "비품 수량 확인", "교체 항목 정리"], description: "침구와 비품 상태를 확인하고 필요한 보충 항목을 정리합니다.", suggestedCategory: "other" }),
    standalonePreset({ id: "2-health-survey", month: 2, title: "건강조사 준비", kind: "task", recommendedPeriod: "2월 말", estimatedMinutes: 45, recurrence: null, checklist: ["조사 일정 확인", "안내 자료 준비", "업무 일정 등록"], description: "개인 건강정보를 기록하지 않고 조사 운영 일정과 안내를 준비합니다.", suggestedCategory: "studentHealthScreening" }),
    standalonePreset({ id: "2-education-plan", month: 2, title: "연간 보건교육 계획", kind: "task", recommendedPeriod: "2월 중", estimatedMinutes: 60, recurrence: null, checklist: ["교육 주제 정리", "학기 일정 확인", "연간 계획 작성"], description: "학기별 보건교육 일정과 주제를 업무 단위로 정리합니다.", suggestedCategory: "training" }),
  ] },
  { month: 3, items: [
    standalonePreset({ id: "3-health-survey-notice", month: 3, title: "학생 건강조사 안내", kind: "task", recommendedPeriod: "개학 직후", estimatedMinutes: 30, recurrence: null, checklist: ["안내 일정 확인", "안내 내용 준비", "발송 여부 확인"], description: "건강조사 운영 안내를 준비합니다. 개인별 응답 내용은 기록하지 않습니다.", suggestedCategory: "studentHealthScreening" }),
    standalonePreset({ id: "3-office-guide", month: 3, title: "보건실 운영 안내", kind: "task", recommendedPeriod: "3월 초", estimatedMinutes: 30, recurrence: null, checklist: ["운영 시간 확인", "이용 안내 정리", "안내 게시"], description: "보건실 운영 방식과 이용 안내를 정리합니다.", suggestedCategory: "other" }),
    standalonePreset({ id: "3-emergency-contact", month: 3, title: "응급연락체계 점검", kind: "task", recommendedPeriod: "3월 초", estimatedMinutes: 20, recurrence: null, checklist: ["연락 절차 확인", "기관 연락망 확인", "변경 사항 반영"], description: "개인 연락처를 저장하지 않고 학교의 공식 응급연락 절차를 점검합니다.", suggestedCategory: "firstAid" }),
    standalonePreset({ id: "3-staff-guide", month: 3, title: "교직원 보건업무 안내", kind: "task", recommendedPeriod: "3월 중", estimatedMinutes: 30, recurrence: null, checklist: ["안내 항목 정리", "공유 일정 확인", "안내 완료"], description: "교직원에게 필요한 보건업무 절차와 일정을 안내합니다.", suggestedCategory: "training" }),
    sharedPreset(3, "보건일지 작성 시작", "health-log", "3월부터"),
  ] },
  { month: 4, items: [
    standalonePreset({ id: "4-additional-screening", month: 4, title: "별도검사 일정 준비", kind: "task", recommendedPeriod: "검사 전", estimatedMinutes: 45, recurrence: null, checklist: ["검사 일정 확인", "준비 항목 확인", "협조 일정 등록"], description: "별도검사의 운영 일정과 준비 항목을 확인합니다.", suggestedCategory: "additionalScreening" }),
    standalonePreset({ id: "4-screening-notice", month: 4, title: "검사 안내문 준비", kind: "task", recommendedPeriod: "검사 1~2주 전", estimatedMinutes: 30, recurrence: null, checklist: ["안내 일정 확인", "안내문 작성", "내용 검토"], description: "검사 운영을 위한 일반 안내문을 준비합니다.", suggestedCategory: "additionalScreening" }),
    sharedPreset(4, "보건소식지 작성·게시", "health-newsletter", "4월 중"),
    standalonePreset({ id: "4-infection-prevention", month: 4, title: "감염병 예방 안내", kind: "task", recommendedPeriod: "4월 중", estimatedMinutes: 30, recurrence: null, checklist: ["공식 안내 확인", "예방 안내 작성", "게시 또는 배포"], description: "공식 지침에 따른 일반 예방 안내를 준비합니다.", suggestedCategory: "infectiousDisease" }),
  ] },
  { month: 5, items: [
    sharedPreset(5, "학생건강검진 준비", "health-screening-preparation", "검진 전"),
    standalonePreset({ id: "5-screening-schedule", month: 5, title: "검진 일정 확인", kind: "event", recommendedPeriod: "5월 중", estimatedMinutes: 30, recurrence: null, checklist: [], description: "학생건강검진 운영 일정을 확인하고 캘린더에 등록합니다.", suggestedCategory: "studentHealthScreening" }),
    standalonePreset({ id: "5-screening-route", month: 5, title: "검진 장소·동선 확인", kind: "task", recommendedPeriod: "검진 전", estimatedMinutes: 30, recurrence: null, checklist: ["장소 확인", "이동 동선 확인", "필요 물품 확인"], description: "검진 장소와 운영 동선을 점검합니다.", suggestedCategory: "studentHealthScreening" }),
    standalonePreset({ id: "5-cooperation-notice", month: 5, title: "협조사항 안내", kind: "task", recommendedPeriod: "검진 전", estimatedMinutes: 20, recurrence: null, checklist: ["협조 항목 확인", "안내 작성", "공유 완료"], description: "검진 운영에 필요한 일반 협조사항을 안내합니다.", suggestedCategory: "studentHealthScreening" }),
  ] },
  { month: 6, items: [
    sharedPreset(6, "보건교육 기안", "health-education-approval", "교육 전"),
    sharedPreset(6, "보건교육 실시", "health-education-event", "6월 중"),
    sharedPreset(6, "보건교육 결과 보고", "health-education-report", "교육 후"),
    sharedPreset(6, "상반기 약품·물품 점검", "emergency-supplies-check", "6월 말"),
  ] },
  { month: 7, items: [
    standalonePreset({ id: "7-semester-review", month: 7, title: "1학기 보건업무 정리", kind: "task", recommendedPeriod: "방학 전", estimatedMinutes: 60, recurrence: null, checklist: ["완료 업무 확인", "미완료 업무 정리", "2학기 참고사항 기록"], description: "1학기 업무 진행 상태를 정리합니다.", suggestedCategory: "other" }),
    sharedPreset(7, "검진 결과 보고", "screening-results-report", "검진 후"),
    sharedPreset(7, "보건실 침구 세탁", "bedding-laundry", "방학 전"),
    standalonePreset({ id: "7-vacation-cleanup", month: 7, title: "방학 중 보건실 정리", kind: "task", recommendedPeriod: "방학 중", estimatedMinutes: 60, recurrence: null, checklist: ["공간 정리", "보관 자료 확인", "다음 학기 준비 항목 정리"], description: "방학 중 보건실 공간과 업무 자료를 정리합니다.", suggestedCategory: "other" }),
  ] },
  { month: 8, items: [
    standalonePreset({ id: "8-second-semester", month: 8, title: "2학기 보건실 준비", kind: "task", recommendedPeriod: "개학 전", estimatedMinutes: 60, recurrence: null, checklist: ["운영 물품 확인", "공간 정리", "안내 일정 확인"], description: "2학기 보건실 운영 준비 사항을 점검합니다.", suggestedCategory: "other" }),
    sharedPreset(8, "약품·응급물품 점검", "emergency-supplies-check", "개학 전"),
    sharedPreset(8, "보건소식지 준비", "health-newsletter", "8월 중"),
    standalonePreset({ id: "8-schedule-review", month: 8, title: "2학기 일정 확인", kind: "event", recommendedPeriod: "개학 전", estimatedMinutes: 30, recurrence: null, checklist: [], description: "2학기 주요 보건업무와 학교 일정을 확인합니다.", suggestedCategory: "event" }),
  ] },
  { month: 9, items: [
    standalonePreset({ id: "9-infection-education", month: 9, title: "감염병 예방교육", kind: "event", recommendedPeriod: "9월 중", estimatedMinutes: 50, recurrence: null, checklist: [], description: "공식 지침에 따른 감염병 예방교육 일정을 등록합니다.", suggestedCategory: "infectiousDisease" }),
    standalonePreset({ id: "9-health-guide", month: 9, title: "2학기 건강관리 안내", kind: "task", recommendedPeriod: "개학 후", estimatedMinutes: 30, recurrence: null, checklist: ["안내 항목 확인", "안내 작성", "게시 또는 배포"], description: "2학기 건강관리 일반 안내를 준비합니다.", suggestedCategory: "other" }),
    standalonePreset({ id: "9-office-review", month: 9, title: "보건실 운영 점검", kind: "task", recommendedPeriod: "9월 중", estimatedMinutes: 30, recurrence: null, checklist: ["운영 현황 확인", "보완 항목 정리", "필요 일정 등록"], description: "2학기 보건실 운영 상태를 점검합니다.", suggestedCategory: "other" }),
    standalonePreset({ id: "9-staff-education", month: 9, title: "교직원 보건교육", kind: "event", recommendedPeriod: "9월 중", estimatedMinutes: 50, recurrence: null, checklist: [], description: "교직원 대상 보건교육 일정을 등록합니다.", suggestedCategory: "training" }),
  ] },
  { month: 10, items: [
    sharedPreset(10, "약품 유효기간 점검", "emergency-supplies-check", "10월 중"),
    sharedPreset(10, "보건교육 실시", "health-education-event", "10월 중"),
    sharedPreset(10, "결과 보고", "health-education-report", "교육 후"),
    sharedPreset(10, "보건소식지 작성·게시", "health-newsletter", "10월 중"),
  ] },
  { month: 11, items: [
    standalonePreset({ id: "11-annual-materials", month: 11, title: "연간 보건업무 자료 정리", kind: "task", recommendedPeriod: "11월 중", estimatedMinutes: 60, recurrence: null, checklist: ["업무 자료 확인", "보관 항목 정리", "누락 자료 확인"], description: "연간 업무 자료를 비식별 업무 단위로 정리합니다.", suggestedCategory: "other" }),
    standalonePreset({ id: "11-incomplete-screening", month: 11, title: "미완료 검진 업무 확인", kind: "task", recommendedPeriod: "11월 중", estimatedMinutes: 30, recurrence: null, checklist: ["미완료 업무 확인", "후속 일정 등록", "완료 여부 재확인"], description: "개별 결과 없이 남은 검진 관련 업무 상태만 확인합니다.", suggestedCategory: "studentHealthScreening" }),
    standalonePreset({ id: "11-next-year-notes", month: 11, title: "차년도 개선사항 메모", kind: "task", recommendedPeriod: "11월 말", estimatedMinutes: 20, recurrence: null, checklist: ["개선 항목 정리", "우선순위 확인", "차년도 참고사항 기록"], description: "차년도 운영계획에 반영할 업무 개선사항을 정리합니다.", suggestedCategory: "other" }),
    standalonePreset({ id: "11-supply-demand", month: 11, title: "보건실 물품 수요 조사", kind: "task", recommendedPeriod: "11월 중", estimatedMinutes: 30, recurrence: null, checklist: ["재고 확인", "필요 물품 정리", "수요 목록 작성"], description: "보건실 운영 물품의 차년도 수요를 정리합니다.", suggestedCategory: "medication" }),
  ] },
  { month: 12, items: [
    sharedPreset(12, "보건실 월간·연간 통계", "monthly-statistics", "12월 말"),
    standalonePreset({ id: "12-annual-report", month: 12, title: "연간 업무 결과 보고", kind: "task", recommendedPeriod: "12월 말", estimatedMinutes: 60, recurrence: null, checklist: ["연간 업무 확인", "결과 보고 작성", "제출 또는 보관"], description: "연간 보건업무 결과를 비식별 업무 단위로 정리합니다.", suggestedCategory: "officialDocument" }),
    standalonePreset({ id: "12-next-year-plan", month: 12, title: "차년도 운영계획 준비", kind: "task", recommendedPeriod: "12월 중", estimatedMinutes: 60, recurrence: null, checklist: ["차년도 일정 확인", "개선사항 반영", "운영계획 자료 준비"], description: "차년도 보건실 운영계획에 필요한 자료를 준비합니다.", suggestedCategory: "other" }),
    standalonePreset({ id: "12-bedding-supplies", month: 12, title: "침구·비품 정리", kind: "task", recommendedPeriod: "방학 전", estimatedMinutes: 45, recurrence: null, checklist: ["침구 상태 확인", "비품 정리", "교체 항목 기록"], description: "연말 침구와 비품 상태를 점검하고 정리합니다.", suggestedCategory: "other" }),
  ] },
] as const satisfies readonly AnnualPlannerMonth[];

export const HEALTH_YEARLY_PRESETS: readonly AnnualPlannerMonth[] = annualMonths;

type YearlyPresetTemplateOptions = {
  readonly year?: number;
  readonly kind?: WorkItemKind;
  readonly date?: string;
};

export function yearlyPresetTemplate(
  preset: AnnualPlannerPreset,
  options: YearlyPresetTemplateOptions = {},
): TemplateDefinition {
  const kind = options.kind ?? preset.kind;
  const dateValues = options.date
    ? kind === "task"
      ? { scheduledDate: options.date }
      : { startDate: options.date, endDate: options.date }
    : {};
  return {
    ...preset.baseTemplate,
    key: `annual-${preset.id}`,
    name: preset.title,
    kind,
    area: "healthWork",
    category: preset.suggestedCategory,
    title: preset.title,
    description: preset.description,
    priority: "normal",
    estimatedMinutes: preset.estimatedMinutes,
    recommendedTiming: preset.recommendedPeriod,
    recurrenceFrequency: preset.recurrence,
    checklist: preset.checklist,
    memo: "",
    requiredDate: true,
    suggestedMonth: preset.month,
    ...(options.year ? { suggestedYear: options.year } : {}),
    ...dateValues,
  };
}
