import { parseKoreanQuickInput } from "@/lib/work-items/workflow";
import type { AiContextCandidate } from "@/lib/ai/context";
import type { AiAction } from "@/lib/ai/schemas/actions";

function localDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function cleanTitle(title: string): string {
  const cleaned = title
    .replace(/(?:업무|일정|초안)?\s*(?:만들어|생성해|추가해)\s*(?:줘|주세요)?/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "새 업무";
}

function highlights(context: readonly AiContextCandidate[]): readonly string[] {
  return context.slice(0, 5).map((item) => item.title);
}

export function taskOrEventAction(input: string, now: Date): AiAction {
  const parsed = parseKoreanQuickInput(input, now);
  const title = cleanTitle(parsed.title);
  if (parsed.kind === "event") {
    const date = parsed.startDate ?? localDate(now);
    return {
      action: "create_event",
      title,
      description: null,
      start_date: date,
      end_date: date,
      start_time: parsed.startTime,
      end_time: null,
      is_all_day: parsed.isAllDay,
      checklist: [],
      links: [],
      reminder: null,
    };
  }
  return {
    action: "create_task",
    title,
    description: null,
    category: parsed.category,
    priority: parsed.priority,
    scheduled_date: parsed.scheduledDate,
    due_date: null,
    recurrence: parsed.recurrenceFrequency,
    checklist: [],
    links: [],
    reminder: null,
  };
}

export function todaySummary(context: readonly AiContextCandidate[]): AiAction {
  const titles = highlights(context);
  return {
    action: "summarize_today",
    summary: context.length === 0
      ? "오늘 등록된 일정과 핵심 업무가 없습니다."
      : `오늘 확인할 업무와 일정이 ${context.length}건 있습니다.`,
    highlights: [...titles],
    item_count: context.length,
  };
}

export function periodSummary(context: readonly AiContextCandidate[], now: Date): AiAction {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    action: "summarize_period",
    start_date: localDate(start),
    end_date: localDate(end),
    summary: context.length === 0
      ? "선택한 기간에 등록된 업무와 일정이 없습니다."
      : `선택한 기간에 업무와 일정이 ${context.length}건 있습니다.`,
    highlights: [...highlights(context)],
    item_count: context.length,
  };
}

export function workflowAction(input: string, entityId?: string): AiAction {
  const template = /템플릿/i.test(input);
  const steps = [{ name: "요청 사항 확인", description: null, checklist: [] }];
  if (template) {
    return {
      action: "create_workflow_template",
      name: cleanTitle(input.replace(/workflow\s*템플릿/gi, "")),
      description: null,
      category: "other",
      default_priority: "normal",
      recommended_timing: "사용자 확인 후",
      steps,
    };
  }
  return {
    action: "create_workflow",
    task_id: entityId ?? null,
    template_id: null,
    name: cleanTitle(input.replace(/workflow/gi, "")),
    description: null,
    category: "other",
    priority: "normal",
    steps,
  };
}

export function checklistAction(input: string, entityId?: string): AiAction {
  return {
    action: "create_checklist",
    target_id: entityId ?? null,
    title: cleanTitle(input.replace(/체크리스트/g, "")),
    items: [{ title: "요청 사항 확인", is_completed: false }],
  };
}

export function recommendationAction(input: string, entityId?: string): AiAction {
  return {
    action: "recommend_priority",
    target_id: entityId ?? null,
    priority: /긴급|마감|높/.test(input) ? "high" : "normal",
    reason: /긴급|마감|높/.test(input)
      ? "요청에 긴급 또는 마감 조건이 포함되어 우선 확인이 필요합니다."
      : "명시된 긴급 조건이 없어 기본 우선순위를 제안합니다.",
  };
}

export function similarAction(input: string, context: readonly AiContextCandidate[]): AiAction {
  const query = input.replace(/유사|비슷한|업무|찾아|추천|줘|주세요/g, " ").replace(/\s+/g, " ").trim() || "업무";
  return {
    action: "find_similar_work",
    query,
    matches: context.slice(0, 10).map((item) => ({
      id: item.id,
      kind: item.kind,
      title: item.title,
      reason: "선택한 컨텍스트에서 관련 업무로 확인되었습니다.",
    })),
  };
}

export function duplicateAction(
  context: readonly AiContextCandidate[],
  entityId?: string,
): AiAction {
  const source = context.find((item) => item.id === entityId) ?? context[0];
  return {
    action: "duplicate_previous_work",
    source_id: source?.id ?? entityId ?? "source-required",
    source_type: source?.kind === "event" ? "event" : "task",
    title: source?.title ?? "지난 업무 재사용",
    target_date: null,
    include_description: false,
    include_memo: false,
  };
}
