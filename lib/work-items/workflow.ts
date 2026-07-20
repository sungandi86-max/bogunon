import type {
  EventRow,
  ReminderReference,
  RecurrenceFrequency,
  TaskCategory,
  TaskChecklistItemRow,
  TaskPriority,
  TaskRow,
  WorkItemKind,
} from "@/types/database";
import type { ChecklistDraft, LinkDraft, ReminderDraft } from "@/lib/work-items/phase5-repository";

export type TemplateDefinition = {
  readonly key: string;
  readonly name: string;
  readonly kind: WorkItemKind;
  readonly area?: "healthWork" | "schoolSchedule" | "exercise" | "personal" | "project";
  readonly category: TaskCategory;
  readonly title: string;
  readonly description: string;
  readonly priority: TaskPriority;
  readonly estimatedMinutes: number;
  readonly recommendedTiming: string;
  readonly recurrenceFrequency: RecurrenceFrequency | null;
  readonly checklist: readonly string[];
  readonly memo: string;
  readonly scheduledDate?: string;
  readonly dueDate?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly startTime?: string;
  readonly endTime?: string;
  readonly isAllDay?: boolean;
  readonly colorKey?: EventRow["color_key"];
  readonly aiDraftId?: string;
  readonly customId?: string;
  readonly reminderOffsets?: readonly number[];
  readonly requiredDate?: boolean;
  readonly suggestedMonth?: number;
  readonly suggestedYear?: number;
};

export const BUILT_IN_TEMPLATES = [
  { key: "health-screening", name: "학생건강검진 안내", kind: "task", category: "studentHealthScreening", title: "학생건강검진 안내", description: "검진 일정과 제출 안내를 준비하고 진행 상태를 확인합니다.", priority: "high", estimatedMinutes: 40, recommendedTiming: "검진 2~3주 전", recurrenceFrequency: "yearly", checklist: ["일정 확인", "안내문 준비", "제출 현황 확인"], memo: "개인 식별정보 없이 미제출 수량만 기록하세요." },
  { key: "additional-screening", name: "별도검사 운영", kind: "task", category: "additionalScreening", title: "별도검사 운영", description: "검사 일정과 준비물을 점검합니다.", priority: "high", estimatedMinutes: 60, recommendedTiming: "검사 2주 전", recurrenceFrequency: "yearly", checklist: ["대상 범위 확인", "일정 공유", "준비물 점검"], memo: "" },
  { key: "tuberculosis", name: "결핵검진 안내", kind: "task", category: "additionalScreening", title: "결핵검진 안내", description: "검진 일정과 안내 절차를 준비합니다.", priority: "high", estimatedMinutes: 30, recommendedTiming: "검진 2주 전", recurrenceFrequency: "yearly", checklist: ["검진 일정 확인", "안내 발송", "완료 수량 확인"], memo: "" },
  { key: "cpr-certificate", name: "심폐소생술 이수증 제출", kind: "task", category: "training", title: "심폐소생술 이수증 제출", description: "이수증 제출 현황을 확인하고 마감 전에 안내합니다.", priority: "high", estimatedMinutes: 25, recommendedTiming: "제출 마감 1주 전", recurrenceFrequency: "yearly", checklist: ["마감일 확인", "제출 안내", "미제출 수량 확인"], memo: "" },
  { key: "infectious-notice", name: "감염병 안내", kind: "task", category: "infectiousDisease", title: "감염병 예방 안내", description: "공식 지침을 기준으로 예방 안내를 준비합니다.", priority: "high", estimatedMinutes: 30, recommendedTiming: "필요 시", recurrenceFrequency: null, checklist: ["공식 지침 확인", "안내문 작성", "발송 여부 확인"], memo: "개인 건강정보를 기록하지 마세요." },
  { key: "supplies", name: "약품 및 응급물품 점검", kind: "task", category: "medication", title: "약품 및 응급물품 점검", description: "재고와 유효기간, 보관 상태를 점검합니다.", priority: "normal", estimatedMinutes: 30, recommendedTiming: "매월 첫째 주", recurrenceFrequency: "monthly", checklist: ["재고 확인", "유효기간 확인", "보관 상태 확인", "보충 항목 정리"], memo: "" },
  { key: "monthly-statistics", name: "보건실 월간 통계", kind: "task", category: "other", title: "보건실 월간 통계 정리", description: "비식별 집계 수량과 업무 현황을 정리합니다.", priority: "normal", estimatedMinutes: 45, recommendedTiming: "매월 마지막 주", recurrenceFrequency: "monthly", checklist: ["집계 기간 확인", "비식별 수량 정리", "보고 자료 확인"], memo: "개인별 기록을 입력하지 마세요." },
  { key: "health-education", name: "보건교육 일정", kind: "event", category: "event", title: "보건교육", description: "보건교육 일정과 준비 사항을 관리합니다.", priority: "normal", estimatedMinutes: 50, recommendedTiming: "학기 초", recurrenceFrequency: null, checklist: ["교육 자료 확인", "장소 확인"], memo: "" },
  { key: "staff-screening", name: "교직원 건강검진 안내", kind: "task", category: "studentHealthScreening", title: "교직원 건강검진 안내", description: "검진 기간과 제출 절차를 안내합니다.", priority: "normal", estimatedMinutes: 25, recommendedTiming: "검진 기간 전", recurrenceFrequency: "yearly", checklist: ["검진 기간 확인", "안내 발송", "완료 현황 확인"], memo: "" },
  { key: "event-medical", name: "행사 의료지원", kind: "event", category: "event", title: "행사 의료지원", description: "행사 일정과 응급 대응 준비를 점검합니다.", priority: "high", estimatedMinutes: 120, recommendedTiming: "행사 1주 전", recurrenceFrequency: null, checklist: ["행사 동선 확인", "응급물품 준비", "연락 체계 확인"], memo: "" },
  { key: "official-document", name: "보건 관련 공문 처리", kind: "task", category: "officialDocument", title: "보건 관련 공문 처리", description: "공문 내용을 확인하고 제출·회신 일정을 관리합니다.", priority: "high", estimatedMinutes: 30, recommendedTiming: "수신 당일", recurrenceFrequency: null, checklist: ["요청 사항 확인", "마감일 등록", "처리 결과 확인"], memo: "" },
  { key: "guardian-notice", name: "보호자 안내 발송", kind: "task", category: "other", title: "보호자 안내 발송", description: "업무 단위의 안내 내용을 준비하고 발송 여부를 확인합니다.", priority: "normal", estimatedMinutes: 25, recommendedTiming: "안내 3일 전", recurrenceFrequency: null, checklist: ["안내 내용 검토", "발송 채널 확인", "발송 완료 확인"], memo: "개인 식별정보를 기록하지 마세요." },
] as const satisfies readonly TemplateDefinition[];

export type QuickInputResult = {
  readonly original: string;
  readonly title: string;
  readonly kind: WorkItemKind;
  readonly category: TaskCategory;
  readonly priority: TaskPriority;
  readonly recurrenceFrequency: RecurrenceFrequency | null;
  readonly scheduledDate: string | null;
  readonly startDate: string | null;
  readonly startTime: string | null;
  readonly isAllDay: boolean;
};

function dateText(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function inferredDate(input: string, now: Date): string | null {
  if (input.includes("오늘")) return dateText(now);
  if (input.includes("내일")) return dateText(addDays(now, 1));
  if (input.includes("다음 주 월요일")) {
    const mondayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
    return dateText(addDays(now, 7 - mondayIndex));
  }
  const monthMatch = input.match(/(\d{1,2})월/);
  if (!monthMatch) return null;
  const month = Number(monthMatch[1]);
  if (month < 1 || month > 12) return null;
  const year = month < now.getMonth() + 1 ? now.getFullYear() + 1 : now.getFullYear();
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function inferredCategory(input: string): TaskCategory {
  if (/건강검진|건강조사/.test(input)) return "studentHealthScreening";
  if (/결핵|별도검사/.test(input)) return "additionalScreening";
  if (/감염병/.test(input)) return "infectiousDisease";
  if (/응급|약품/.test(input)) return "medication";
  if (/공문/.test(input)) return "officialDocument";
  if (/심폐소생술|CPR|연수/.test(input)) return "training";
  if (/행사|교육/.test(input)) return "event";
  if (/상담/.test(input)) return "counseling";
  return "other";
}

function inferredRecurrence(input: string): RecurrenceFrequency | null {
  if (input.includes("매일")) return "daily";
  if (input.includes("매주")) return "weekly";
  if (input.includes("매월")) return "monthly";
  if (input.includes("매년")) return "yearly";
  return null;
}

export function parseKoreanQuickInput(input: string, now = new Date()): QuickInputResult {
  const trimmed = input.trim();
  const hourMatch = trimmed.match(/(오전|오후)?\s*(\d{1,2})시/);
  const rawHour = hourMatch ? Number(hourMatch[2]) : null;
  const hour = rawHour === null ? null : (hourMatch?.[1] === "오후" && rawHour < 12 ? rawHour + 12 : rawHour);
  const kind: WorkItemKind = /일정|교육/.test(trimmed) || hour !== null ? "event" : "task";
  const parsedDate = inferredDate(trimmed, now);
  const title = trimmed
    .replace(/다음 주 월요일|오늘|내일|매일|매주|매월|매년|첫째 주/g, "")
    .replace(/(오전|오후)?\s*\d{1,2}시/g, "")
    .replace(/\d{1,2}월/g, "")
    .replace(/우선순위\s*높음|긴급/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return {
    original: trimmed,
    title: title || trimmed,
    kind,
    category: inferredCategory(trimmed),
    priority: /긴급|우선순위\s*높음/.test(trimmed) ? "high" : "normal",
    recurrenceFrequency: inferredRecurrence(trimmed),
    scheduledDate: kind === "task" ? parsedDate : null,
    startDate: kind === "event" ? parsedDate : null,
    startTime: hour === null ? null : `${String(hour).padStart(2, "0")}:00`,
    isAllDay: hour === null,
  };
}

export function checklistProgress(items: readonly TaskChecklistItemRow[]) {
  const completed = items.filter((item) => item.is_completed).length;
  const total = items.length;
  return { completed, total, percentage: total ? Math.round((completed / total) * 100) : 0 };
}

export type AnnualItem = { readonly kind: WorkItemKind; readonly item: TaskRow | EventRow; readonly date: string };
export type AnnualMonth = { readonly month: number; readonly items: readonly AnnualItem[] };

export function groupAnnualItems(tasks: readonly TaskRow[], events: readonly EventRow[], year: number): readonly AnnualMonth[] {
  const buckets: AnnualItem[][] = Array.from({ length: 12 }, () => []);
  for (const item of tasks) {
    const date = item.scheduled_date ?? item.due_date;
    if (date?.startsWith(`${year}-`)) buckets[Number(date.slice(5, 7)) - 1]?.push({ kind: "task", item, date });
  }
  for (const item of events) {
    if (item.start_date.startsWith(`${year}-`)) buckets[Number(item.start_date.slice(5, 7)) - 1]?.push({ kind: "event", item, date: item.start_date });
  }
  return buckets.map((items, index) => ({ month: index + 1, items: items.toSorted((a, b) => a.date.localeCompare(b.date)) }));
}

export function parseWebUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export type WorkItemRelationsDraft = {
  readonly checklist: readonly ChecklistDraft[];
  readonly links: readonly LinkDraft[];
  readonly reminders: readonly ReminderDraft[];
};

function parseJsonArray(value: FormDataEntryValue | null): unknown[] {
  if (typeof value !== "string" || !value.trim()) return [];
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) throw new Error("상세 항목 형식을 확인해 주세요.");
  return parsed;
}

export function parseWorkItemRelations(formData: FormData): WorkItemRelationsDraft {
  const checklist = parseJsonArray(formData.get("checklist")).map((entry) => {
    if (typeof entry !== "object" || entry === null || !("title" in entry) || typeof entry.title !== "string") throw new Error("체크리스트 항목을 확인해 주세요.");
    const title = entry.title.trim();
    if (!title) throw new Error("빈 체크리스트 항목을 삭제해 주세요.");
    return { title, isCompleted: "isCompleted" in entry && entry.isCompleted === true };
  });
  const links = parseJsonArray(formData.get("links")).map((entry) => {
    if (typeof entry !== "object" || entry === null || !("title" in entry) || !("url" in entry) || typeof entry.title !== "string" || typeof entry.url !== "string") throw new Error("관련 링크를 확인해 주세요.");
    const title = entry.title.trim();
    const url = parseWebUrl(entry.url.trim());
    if (!title || !url) throw new Error("링크 제목과 올바른 HTTP 주소를 입력해 주세요.");
    return { title, url };
  });
  const reminders = parseJsonArray(formData.get("reminders")).map((entry) => {
    if (typeof entry !== "object" || entry === null || !("offsetMinutes" in entry) || typeof entry.offsetMinutes !== "number" || !Number.isInteger(entry.offsetMinutes) || entry.offsetMinutes < 0 || entry.offsetMinutes > 525600) throw new Error("알림 시점을 확인해 주세요.");
    const referenceType: ReminderReference = "referenceType" in entry && entry.referenceType === "scheduled" ? "scheduled" : "due";
    return { offsetMinutes: entry.offsetMinutes, referenceType };
  });
  return { checklist, links, reminders };
}

export function taskDuplicateValues(source: TaskRow, options: { readonly date: string | null; readonly includeDescription: boolean; readonly includeMemo: boolean; readonly includeRecurrence: boolean }) {
  const recurrenceFrequency = options.includeRecurrence ? source.recurrence_frequency : null;
  const recurrenceDate = recurrenceFrequency ? (options.date ?? source.scheduled_date) : null;
  return {
    title: `${source.title} 복사본`, area: source.area, status: "planned" as const,
    priority: source.priority, category: source.category,
    scheduled_date: options.date ?? source.scheduled_date,
    due_date: options.date ?? source.due_date,
    follow_up_date: null,
    description: options.includeDescription ? source.description : null,
    memo: options.includeMemo ? source.memo : null,
    estimated_minutes: source.estimated_minutes,
    completed_at: null,
    recurrence_frequency: recurrenceFrequency,
    recurrence_source_id: null,
    recurrence_date: recurrenceDate,
    recurrence_generated_through: recurrenceDate,
  };
}

export function eventDuplicateValues(source: EventRow, options: { readonly date: string | null; readonly includeDescription: boolean; readonly includeMemo: boolean }) {
  const date = options.date ?? source.start_date;
  return {
    title: `${source.title} 복사본`, area: source.area, start_date: date, end_date: date,
    is_all_day: source.is_all_day, start_time: source.start_time, end_time: source.end_time,
    location: source.location ?? null, color_key: source.color_key ?? null,
    recurrence_frequency: null, recurrence_source_id: null, recurrence_date: null, recurrence_generated_through: null,
    description: options.includeDescription ? source.description : null,
    memo: options.includeMemo ? source.memo : null,
  };
}
