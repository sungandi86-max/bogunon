import { resolveCalendarTemplates } from "@/lib/calendar-generator/template-resolver";
import { BUILT_IN_CALENDAR_TEMPLATES } from "@/lib/calendar-generator/templates";
import type {
  BuildSmartCalendarPreviewRequest,
  SmartCalendarExistingEvent,
  SmartCalendarPreview,
  SmartCalendarPreviewItem,
  SmartCalendarSemester,
} from "@/lib/calendar-generator/generation-types";
import type { CalendarTemplatePack } from "@/lib/calendar-generator/types";

const packDetails = {
  academic: { area: "schoolSchedule", categoryLabel: "학사일정" },
  health: { area: "healthWork", categoryLabel: "보건업무" },
  holiday: { area: "schoolSchedule", categoryLabel: "공휴일" },
} as const satisfies Record<CalendarTemplatePack, {
  readonly area: "schoolSchedule" | "healthWork";
  readonly categoryLabel: string;
}>;

export function normalizeSmartCalendarTitle(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("ko-KR");
}

export function smartCalendarEventIdentity(event: {
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
}): string {
  return `${normalizeSmartCalendarTitle(event.title)}|${event.startDate}|${event.endDate}`;
}

export function buildSmartCalendarPreview(request: BuildSmartCalendarPreviewRequest): SmartCalendarPreview {
  const templates = BUILT_IN_CALENDAR_TEMPLATES.filter((template) => request.selectedPacks.includes(template.pack));
  const resolved = resolveCalendarTemplates({
    year: request.year,
    templates,
    overrides: [],
    variableHolidays: [],
  });
  const existingByIdentity = new Map(
    request.existingEvents.map((event) => [smartCalendarEventIdentity(event), event]),
  );
  const items = resolved.candidates
    .filter((candidate) => isInSemester(candidate.stickerDate, request.semester))
    .map((candidate): SmartCalendarPreviewItem => {
      const endDate = candidate.endDate ?? candidate.stickerDate;
      const duplicate = existingByIdentity.get(smartCalendarEventIdentity({
        title: candidate.label,
        startDate: candidate.stickerDate,
        endDate,
      }));
      const details = packDetails[candidate.pack];
      const base = {
        clientId: `${candidate.ruleId}:${candidate.stickerDate}`,
        ruleId: candidate.ruleId,
        pack: candidate.pack,
        title: candidate.label,
        startDate: candidate.stickerDate,
        endDate,
        area: details.area,
        allDay: true,
        description: `Smart Calendar · ${candidate.templateId} ${candidate.templateVersion}`,
        categoryLabel: details.categoryLabel,
      } as const;
      return duplicate === undefined
        ? {
            ...base,
            warning: candidate.requiresConfirmation ? "needs-confirmation" : "ready",
            selected: true,
            duplicateDecision: "unchecked",
          }
        : {
            ...base,
            warning: "duplicate",
            selected: false,
            duplicateDecision: "skip",
            duplicate: duplicateDetails(duplicate),
          };
    });
  return {
    year: request.year,
    semester: request.semester,
    items,
    warnings: resolved.warnings.map((item) => item.message),
  };
}

function duplicateDetails(event: SmartCalendarExistingEvent) {
  return {
    eventId: event.id,
    title: event.title,
    startDate: event.startDate,
    endDate: event.endDate,
  };
}

function isInSemester(date: string, semester: SmartCalendarSemester): boolean {
  if (semester === "all") return true;
  const month = Number(date.slice(5, 7));
  return semester === "first" ? month >= 3 && month <= 8 : month <= 2 || month >= 9;
}

export function refreshPreviewItemValidity(item: SmartCalendarPreviewItem): SmartCalendarPreviewItem {
  const title = item.title.trim().replace(/\s+/g, " ");
  if (!title || item.endDate < item.startDate) {
    return { ...item, title, warning: "date-error", selected: false, duplicateDecision: "unchecked" };
  }
  const { duplicate, ...withoutDuplicate } = item;
  void duplicate;
  return {
    ...withoutDuplicate,
    title,
    warning: item.warning === "needs-confirmation" ? "needs-confirmation" : "ready",
    duplicateDecision: "unchecked",
  };
}
