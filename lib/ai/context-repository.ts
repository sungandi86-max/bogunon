import type { AiContextCandidate } from "@/lib/ai/context";
import { createClient } from "@/lib/supabase/server";

export interface AiContextLoadResult {
  readonly candidates: readonly AiContextCandidate[];
  readonly warnings: readonly string[];
}

const QUERY_LIMIT = 30;

function hasError(error: { readonly code?: string } | null): boolean {
  return error !== null && error.code !== "PGRST205" && error.code !== "42P01";
}

export async function loadAiContextCandidates(userId: string): Promise<AiContextLoadResult> {
  const supabase = await createClient();
  const [tasks, events, workflows, templates] = await Promise.all([
    supabase.from("tasks")
      .select("id,title,scheduled_date,due_date,updated_at")
      .eq("user_id", userId).order("updated_at", { ascending: false }).limit(QUERY_LIMIT),
    supabase.from("events")
      .select("id,title,start_date,updated_at")
      .eq("user_id", userId).order("updated_at", { ascending: false }).limit(QUERY_LIMIT),
    supabase.from("task_workflow_instances")
      .select("id,name,updated_at")
      .eq("user_id", userId).order("updated_at", { ascending: false }).limit(QUERY_LIMIT),
    supabase.from("workflow_templates")
      .select("id,name,updated_at")
      .eq("user_id", userId).order("updated_at", { ascending: false }).limit(QUERY_LIMIT),
  ]);
  const candidates: AiContextCandidate[] = [
    ...(tasks.data ?? []).map((item) => ({
      id: item.id,
      kind: "task" as const,
      title: item.title,
      detail: null,
      date: item.scheduled_date ?? item.due_date ?? item.updated_at.slice(0, 10),
      surface: "task",
    })),
    ...(events.data ?? []).map((item) => ({
      id: item.id,
      kind: "event" as const,
      title: item.title,
      detail: null,
      date: item.start_date,
      surface: "calendar",
    })),
    ...(workflows.data ?? []).map((item) => ({
      id: item.id,
      kind: "workflow" as const,
      title: item.name,
      detail: null,
      date: item.updated_at.slice(0, 10),
      surface: "workflow",
    })),
    ...(templates.data ?? []).map((item) => ({
      id: item.id,
      kind: "workflow_template" as const,
      title: item.name,
      detail: null,
      date: item.updated_at.slice(0, 10),
      surface: "workflow",
    })),
  ];
  const errors = [tasks.error, events.error, workflows.error, templates.error];
  return {
    candidates,
    warnings: errors.some(hasError) ? ["일부 업무 컨텍스트를 불러오지 못했습니다."] : [],
  };
}
