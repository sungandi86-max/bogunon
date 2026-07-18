import type { TemplateDefinition } from "@/lib/work-items/workflow";

export const HEALTH_PRESET_GROUPS = ["일지·기록", "안내·소식", "검진", "교육", "시설·물품", "보고·제출"] as const;

export type HealthPresetDefinition = TemplateDefinition & {
  readonly group: (typeof HEALTH_PRESET_GROUPS)[number];
  readonly desktopQuickOrder: number;
  readonly mobileQuickOrder: number;
  readonly reminderOffsets: readonly number[];
};

export const HEALTH_PRESETS = [
  { key: "health-log", name: "보건일지 작성", kind: "task", area: "healthWork", category: "other", title: "보건일지 작성", description: "당일 보건실 운영 내용을 확인하고 필요한 기록을 정리합니다.", priority: "normal", estimatedMinutes: 10, recommendedTiming: "평일 또는 매일", recurrenceFrequency: "daily", checklist: ["당일 보건실 운영 내용 확인", "필요한 기록 정리", "일지 작성 완료"], memo: "", group: "일지·기록", desktopQuickOrder: 1, mobileQuickOrder: 1, reminderOffsets: [0] },
  { key: "health-newsletter", name: "보건소식지 작성·게시", kind: "task", area: "healthWork", category: "officialDocument", title: "보건소식지 작성·게시", description: "보건소식지의 주제와 내용을 정리하고 게시 또는 배포합니다.", priority: "normal", estimatedMinutes: 60, recommendedTiming: "매월", recurrenceFrequency: "monthly", checklist: ["주제 정하기", "내용 작성", "내용 검토", "게시 또는 배포"], memo: "", group: "안내·소식", desktopQuickOrder: 2, mobileQuickOrder: 6, reminderOffsets: [0] },
  { key: "bedding-laundry", name: "보건실 침구 세탁", kind: "task", area: "healthWork", category: "other", title: "보건실 침구 세탁", description: "보건실 침구를 세탁하고 다시 사용할 수 있게 정리합니다.", priority: "normal", estimatedMinutes: 30, recommendedTiming: "사용자 선택", recurrenceFrequency: null, checklist: ["세탁할 침구 확인", "세탁", "건조", "보건실에 다시 정리"], memo: "", group: "시설·물품", desktopQuickOrder: 3, mobileQuickOrder: 5, reminderOffsets: [0] },
  { key: "health-screening-preparation", name: "건강검진 준비", kind: "task", area: "healthWork", category: "studentHealthScreening", title: "건강검진 준비", description: "검진 일정과 안내, 장소·동선 및 준비물을 확인합니다.", priority: "high", estimatedMinutes: 60, recommendedTiming: "검진 전", recurrenceFrequency: null, checklist: ["검진 일정 확인", "필요한 안내 준비", "장소와 동선 확인", "준비물 확인", "협조 사항 확인"], memo: "", group: "검진", desktopQuickOrder: 4, mobileQuickOrder: 2, reminderOffsets: [0] },
  { key: "health-education-approval", name: "보건교육 기안", kind: "task", area: "healthWork", category: "officialDocument", title: "보건교육 기안 올리기", description: "보건교육 주제와 일정을 확인하고 기안을 작성합니다.", priority: "normal", estimatedMinutes: 30, recommendedTiming: "교육 전", recurrenceFrequency: null, checklist: ["교육 주제와 대상 확인", "일정 확인", "기안 작성", "결재 요청"], memo: "", group: "교육", desktopQuickOrder: 5, mobileQuickOrder: 3, reminderOffsets: [0] },
  { key: "health-education-event", name: "보건교육 실시", kind: "event", area: "healthWork", category: "event", title: "보건교육", description: "보건교육 일정을 등록합니다. 필요하면 보건교육 기안 업무를 먼저 확인하세요.", priority: "normal", estimatedMinutes: 50, recommendedTiming: "선택한 날짜", recurrenceFrequency: null, checklist: [], memo: "", startTime: "09:00", endTime: "09:50", isAllDay: false, reminderOffsets: [30], group: "교육", desktopQuickOrder: 7, mobileQuickOrder: 7 },
  { key: "health-education-report", name: "보건교육 결과 보고", kind: "task", area: "healthWork", category: "officialDocument", title: "보건교육 결과 보고 올리기", description: "보건교육 실시 내용을 정리하고 결과 보고를 작성합니다.", priority: "normal", estimatedMinutes: 30, recommendedTiming: "교육 후", recurrenceFrequency: null, checklist: ["실시 내용 정리", "필요한 자료 확인", "결과 보고 작성", "결재 또는 제출"], memo: "", group: "교육", desktopQuickOrder: 6, mobileQuickOrder: 4, reminderOffsets: [0] },
  { key: "screening-results-report", name: "검진 결과 보고", kind: "task", area: "healthWork", category: "studentHealthScreening", title: "검진 결과 보고 올리기", description: "검진 결과 자료를 업무 단위로 확인하고 보고를 작성합니다.", priority: "normal", estimatedMinutes: 30, recommendedTiming: "검진 후", recurrenceFrequency: null, checklist: ["결과 자료 확인", "보고 내용 정리", "결과 보고 작성", "제출 또는 결재"], memo: "", group: "검진", desktopQuickOrder: 8, mobileQuickOrder: 8, reminderOffsets: [0] },
  { key: "emergency-supplies-check", name: "약품·응급물품 점검", kind: "task", area: "healthWork", category: "medication", title: "약품·응급물품 점검", description: "재고, 유효기간과 보관 상태를 점검합니다.", priority: "normal", estimatedMinutes: 30, recommendedTiming: "매월", recurrenceFrequency: "monthly", checklist: ["재고 확인", "유효기간 확인", "보관 상태 확인", "부족 물품 정리"], memo: "", group: "시설·물품", desktopQuickOrder: 9, mobileQuickOrder: 9, reminderOffsets: [0] },
  { key: "monthly-statistics", name: "보건실 월간 통계", kind: "task", area: "healthWork", category: "other", title: "보건실 월간 통계 정리", description: "월간 자료를 확인하고 비식별 통계와 보고 자료를 정리합니다.", priority: "normal", estimatedMinutes: 30, recommendedTiming: "매월 마지막 평일 또는 사용자 선택", recurrenceFrequency: "monthly", checklist: ["월간 자료 확인", "통계 정리", "필요한 보고 자료 작성", "저장 또는 제출"], memo: "", group: "보고·제출", desktopQuickOrder: 10, mobileQuickOrder: 10, reminderOffsets: [0] },
  { key: "official-document-review", name: "보건 관련 공문 확인·처리", kind: "task", area: "healthWork", category: "officialDocument", title: "보건 관련 공문 확인·처리", description: "공문 내용과 마감일을 확인하고 필요한 업무를 등록합니다.", priority: "normal", estimatedMinutes: 20, recommendedTiming: "수신 시", recurrenceFrequency: null, checklist: ["공문 내용 확인", "마감일 확인", "필요한 업무 등록", "처리 완료 확인"], memo: "", group: "보고·제출", desktopQuickOrder: 11, mobileQuickOrder: 11, reminderOffsets: [0] },
  { key: "submission-reply-check", name: "제출·회신 확인", kind: "task", area: "healthWork", category: "officialDocument", title: "제출·회신 확인", description: "제출 현황을 확인하고 필요한 재안내와 최종 확인을 진행합니다.", priority: "normal", estimatedMinutes: 20, recommendedTiming: "필요 시", recurrenceFrequency: null, checklist: ["제출 현황 확인", "미제출 건 확인", "필요한 재안내", "최종 확인"], memo: "", group: "보고·제출", desktopQuickOrder: 12, mobileQuickOrder: 12, reminderOffsets: [0] },
] as const satisfies readonly HealthPresetDefinition[];

export function healthPresetsForSurface(surface: "desktop" | "mobile"): readonly HealthPresetDefinition[] {
  const order = surface === "desktop" ? "desktopQuickOrder" : "mobileQuickOrder";
  return [...HEALTH_PRESETS].sort((left, right) => left[order] - right[order]);
}
