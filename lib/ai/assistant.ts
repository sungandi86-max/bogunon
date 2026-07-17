import { createHash } from "node:crypto";

import { selectBoundedContext } from "@/lib/ai/context";
import { loadAiContextCandidates } from "@/lib/ai/context-repository";
import { AiHistoryPersistenceError, persistAiHistory } from "@/lib/ai/history";
import { inspectPrivacy, inspectStructuredPrivacy } from "@/lib/ai/privacy";
import { createConfiguredProvider } from "@/lib/ai/providers";
import { AiProviderError } from "@/lib/ai/providers";
import type { AiProviderResult } from "@/lib/ai/providers";
import type { AiAction } from "@/lib/ai/schemas/actions";
import type { AiAssistantRequest } from "@/lib/ai/schemas/request";
import {
  AiRateLimitError,
  AiTimeoutError,
  InMemoryRateLimiter,
  RequestDeduplicator,
  withTimeout,
} from "@/lib/ai/request-control";

export interface AiPreview {
  readonly mode: "openai" | "mock";
  readonly action: AiAction;
  readonly warnings?: readonly string[];
  readonly draftId?: string;
}

export class AiSensitiveInputError extends Error {
  readonly code = "SENSITIVE_INPUT";
  readonly warnings: readonly string[];

  constructor(warnings: readonly string[]) {
    super("Sensitive AI input rejected");
    this.name = "AiSensitiveInputError";
    this.warnings = warnings;
  }
}

const REQUEST_TIMEOUT_MS = 12_000;
const limiter = new InMemoryRateLimiter({ maxRequests: 10, windowMs: 60_000 });
const deduplicator = new RequestDeduplicator<AiPreview>();

function requestKey(userId: string, request: AiAssistantRequest): string {
  return createHash("sha256")
    .update(userId)
    .update("\0")
    .update(JSON.stringify(request))
    .digest("hex");
}

export async function generateAiPreview(
  userId: string,
  request: AiAssistantRequest,
): Promise<AiPreview> {
  return deduplicator.run(requestKey(userId, request), async () => {
    if (!limiter.consume(userId)) throw new AiRateLimitError();
    const privacy = inspectPrivacy(request.input);
    if (!privacy.allowed) throw new AiSensitiveInputError(privacy.warnings);

    const context = request.context?.entityId
      ? { surface: request.context.surface, entityId: request.context.entityId }
      : { surface: request.context?.surface ?? "global" };
    const loaded = await loadAiContextCandidates(userId);
    const selected = selectBoundedContext(loaded.candidates, {
      surface: context.surface,
      ...(context.entityId ? { entityId: context.entityId } : {}),
    });
    const provider = createConfiguredProvider();
    const controller = new AbortController();
    let result: AiProviderResult;
    try {
      result = await withTimeout(provider.generate({
        input: request.input,
        context,
        selectedContext: selected.items,
      }, controller.signal), REQUEST_TIMEOUT_MS);
    } catch (error) {
      controller.abort();
      if (error instanceof AiTimeoutError || error instanceof AiProviderError) throw error;
      throw new AiProviderError();
    }

    const actionPrivacy = inspectStructuredPrivacy(result.response.action);
    if (!actionPrivacy.allowed) throw new AiSensitiveInputError(actionPrivacy.warnings);

    const historyWarnings: string[] = [];
    let draftId: string | undefined;
    if (request.saveHistory) {
      try {
        const history = await persistAiHistory(userId, request.input, result.response.action);
        if (history.status === "unavailable") {
          historyWarnings.push("AI 기록 테이블이 준비되지 않아 요청 기록을 저장하지 못했습니다.");
        } else {
          draftId = history.draftId;
        }
      } catch (error) {
        if (error instanceof AiHistoryPersistenceError) {
          historyWarnings.push("AI 요청 기록을 저장하지 못했습니다.");
        } else {
          throw error;
        }
      }
    }
    const warnings = [
      ...historyWarnings,
      ...loaded.warnings,
      ...selected.warnings,
      ...result.response.warnings,
    ].filter((warning, index, all) => all.indexOf(warning) === index);
    return {
      mode: result.mode,
      action: result.response.action,
      ...(warnings.length > 0 ? { warnings } : {}),
      ...(draftId ? { draftId } : {}),
    };
  });
}
