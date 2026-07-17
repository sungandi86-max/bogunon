import {
  checklistAction,
  duplicateAction,
  periodSummary,
  recommendationAction,
  similarAction,
  taskOrEventAction,
  todaySummary,
  workflowAction,
} from "@/lib/ai/providers/rules-actions";
import type { AiAction } from "@/lib/ai/schemas/actions";
import type { AiProvider, AiProviderRequest, AiProviderResult } from "@/lib/ai/providers/provider";

export function createRulesProvider(now = new Date()): AiProvider {
  return {
    async generate(request: AiProviderRequest): Promise<AiProviderResult> {
      const input = request.input;
      let action: AiAction;
      if (/유사|비슷한/.test(input)) {
        action = similarAction(input, request.selectedContext);
      } else if (/복제|재사용|지난\s*업무/.test(input)) {
        action = duplicateAction(request.selectedContext, request.context.entityId);
      } else if (/우선순위/.test(input)) {
        action = recommendationAction(input, request.context.entityId);
      } else if (/체크리스트/.test(input)) {
        action = checklistAction(input, request.context.entityId);
      } else if (/workflow/i.test(input)) {
        action = workflowAction(input, request.context.entityId);
      } else if (/기간|주간|월간/.test(input) && /요약/.test(input)) {
        action = periodSummary(request.selectedContext, now);
      } else if (/요약/.test(input)) {
        action = todaySummary(request.selectedContext);
      } else {
        action = taskOrEventAction(input, now);
      }
      return { mode: "mock", response: { action, warnings: [] } };
    },
  };
}
