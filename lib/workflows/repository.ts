import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import type { HealthWorkflowData } from "@/types/workflows";

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("로그인이 필요합니다.");
  return { supabase, userId: user.id };
}

export async function listHealthWorkflowData(): Promise<HealthWorkflowData> {
  const { supabase, userId } = await ownedClient();
  const results = await Promise.all([
    supabase.from("workflow_templates").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
    supabase.from("workflow_template_steps").select("*").eq("user_id", userId).order("position"),
    supabase.from("workflow_template_step_checklist_items").select("*").eq("user_id", userId).order("position"),
    supabase.from("workflow_template_step_links").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("task_workflow_instances").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
    supabase.from("task_workflow_steps").select("*").eq("user_id", userId).order("position"),
    supabase.from("task_workflow_step_checklist_items").select("*").eq("user_id", userId).order("position"),
    supabase.from("workflow_step_links").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("workflow_timeline_events").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("workflow_followup_rules").select("*").eq("user_id", userId).order("created_at"),
  ]);
  const errors = results.flatMap((result) => result.error ? [result.error] : []);
  if (errors.length && errors.every((error) => error.code === "PGRST205" || error.code === "42P01")) {
    return { templates: [], templateSteps: [], templateChecklistItems: [], templateLinks: [], instances: [], steps: [], checklistItems: [], links: [], timeline: [], followups: [] };
  }
  if (errors.length) throw new Error("Workflow 데이터를 불러오지 못했습니다.");
  return {
    templates: results[0].data ?? [], templateSteps: results[1].data ?? [],
    templateChecklistItems: results[2].data ?? [], templateLinks: results[3].data ?? [],
    instances: results[4].data ?? [], steps: results[5].data ?? [], checklistItems: results[6].data ?? [],
    links: results[7].data ?? [], timeline: results[8].data ?? [], followups: results[9].data ?? [],
  };
}

function resultOrThrow<T>(data: T, error: { message: string } | null) {
  if (error) throw new Error(error.message);
  return data;
}

export async function saveWorkflowTemplateBundle(templateId: string | null, values: Json, steps: Json, followups: Json) {
  const { supabase } = await ownedClient();
  const { data, error } = await supabase.rpc("save_workflow_template_bundle", { p_template_id: templateId, p_values: values, p_steps: steps, p_followups: followups });
  return resultOrThrow(data, error);
}

export async function createWorkflowInstanceBundle(taskId: string, templateId: string | null, values: Json, steps: Json, followups: Json) {
  const { supabase } = await ownedClient();
  const { data, error } = await supabase.rpc("create_workflow_instance_bundle", { p_task_id: taskId, p_template_id: templateId, p_values: values, p_steps: steps, p_followups: followups });
  return resultOrThrow(data, error);
}

export async function updateWorkflowStepBundle(stepId: string, values: Json, checklist: Json, links: Json) {
  const { supabase } = await ownedClient();
  const { data, error } = await supabase.rpc("update_workflow_step_bundle", { p_step_id: stepId, p_values: values, p_checklist: checklist, p_links: links });
  return resultOrThrow(data, error);
}

export async function transitionWorkflowStep(stepId: string, status: string, force: boolean) {
  const { supabase } = await ownedClient();
  const { data, error } = await supabase.rpc("transition_workflow_step", { p_step_id: stepId, p_target_status: status, p_force: force });
  return resultOrThrow(data, error);
}

export async function transitionWorkflowInstance(instanceId: string, status: string) {
  const { supabase } = await ownedClient();
  const { data, error } = await supabase.rpc("transition_workflow_instance", { p_instance_id: instanceId, p_target_status: status });
  return resultOrThrow(data, error);
}

export async function completeWorkflowInstance(instanceId: string) {
  const { supabase } = await ownedClient();
  const { data, error } = await supabase.rpc("complete_workflow_instance", { p_instance_id: instanceId });
  return resultOrThrow(data, error);
}
