import type { AiContextCandidate } from "@/lib/ai/context";
import type { AiAssistantRequest } from "@/lib/ai/schemas/request";

export function buildAssistantPrompt(
  request: AiAssistantRequest,
  selectedContext: readonly AiContextCandidate[],
): string {
  return JSON.stringify({
    request: request.input,
    surface: request.context?.surface ?? "global",
    context: selectedContext.map(({ date, kind, surface, title }) => ({ date, kind, surface, title })),
  });
}
