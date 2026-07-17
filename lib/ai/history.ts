import type { AiAction } from "@/lib/ai/schemas/actions";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export type AiHistoryPersistenceResult =
  | { readonly status: "saved"; readonly draftId: string }
  | { readonly status: "unavailable" };

export class AiHistoryPersistenceError extends Error {
  constructor() {
    super("AI history persistence failed");
    this.name = "AiHistoryPersistenceError";
  }
}

function isMissingInfrastructure(error: { readonly code?: string } | null): boolean {
  return error?.code === "PGRST202" || error?.code === "PGRST205" || error?.code === "42P01" || error?.code === "42883";
}

function sanitizedPrompt(prompt: string): string {
  return prompt.trim().replace(/\s+/g, " ").slice(0, 1_200);
}

export async function persistAiHistory(
  userId: string,
  prompt: string,
  action: AiAction,
): Promise<AiHistoryPersistenceResult> {
  const supabase = await createClient();
  const payload: Json = JSON.parse(JSON.stringify(action));
  const result = await supabase.rpc("save_ai_history_bundle", {
    p_user_id: userId,
    p_request_type: action.action,
    p_prompt: sanitizedPrompt(prompt),
    p_payload: payload,
  });
  if (isMissingInfrastructure(result.error)) return { status: "unavailable" };
  if (result.error || !result.data) throw new AiHistoryPersistenceError();
  return { status: "saved", draftId: result.data };
}

export async function markAiDraftApplied(draftId: string): Promise<void> {
  const supabase = await createClient();
  const result = await supabase.from("ai_action_drafts").update({
    status: "applied",
    applied_at: new Date().toISOString(),
  }).eq("id", draftId);
  if (result.error && !isMissingInfrastructure(result.error)) throw new AiHistoryPersistenceError();
}
