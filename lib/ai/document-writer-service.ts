import { createHash } from "node:crypto";

import type {
  AiDocumentWriterRequest,
  AiDocumentWriterResult,
} from "@/lib/ai/document-writer";
import { inspectPrivacy, inspectStructuredPrivacy } from "@/lib/ai/privacy";
import { AiProviderConfigurationError } from "@/lib/ai/providers";
import { createDocumentWriterProvider } from "@/lib/ai/providers/document-writer";
import { AiProviderError } from "@/lib/ai/providers/provider";
import {
  AiRateLimitError,
  AiTimeoutError,
  InMemoryRateLimiter,
  RequestDeduplicator,
  withTimeout,
} from "@/lib/ai/request-control";

export class AiDocumentWriterSensitiveInputError extends Error {
  readonly code = "SENSITIVE_INPUT";
  readonly warnings: readonly string[];

  constructor(warnings: readonly string[]) {
    super("Sensitive document input rejected");
    this.name = "AiDocumentWriterSensitiveInputError";
    this.warnings = warnings;
  }
}

const REQUEST_TIMEOUT_MS = 12_000;
const limiter = new InMemoryRateLimiter({ maxRequests: 10, windowMs: 60_000 });
const deduplicator = new RequestDeduplicator<AiDocumentWriterResult>();

function requestKey(userId: string, request: AiDocumentWriterRequest): string {
  return createHash("sha256")
    .update(userId)
    .update("\0")
    .update(JSON.stringify(request))
    .digest("hex");
}

function inspectRequest(request: AiDocumentWriterRequest): readonly string[] {
  const warnings = [
    request.activityReport,
    request.selfEvaluation,
    request.teacherMemo,
  ].flatMap((value) => {
    const result = inspectPrivacy(value);
    return result.allowed ? [] : result.warnings;
  });
  return warnings.filter((warning, index, all) => all.indexOf(warning) === index);
}

export async function generateAiDocumentDraft(
  userId: string,
  request: AiDocumentWriterRequest,
): Promise<AiDocumentWriterResult> {
  return deduplicator.run(requestKey(userId, request), async () => {
    if (!limiter.consume(userId)) throw new AiRateLimitError();
    const warnings = inspectRequest(request);
    if (warnings.length > 0) throw new AiDocumentWriterSensitiveInputError(warnings);

    const controller = new AbortController();
    let result: AiDocumentWriterResult;
    try {
      const provider = createDocumentWriterProvider();
      result = await withTimeout(
        provider.generate(request, controller.signal),
        REQUEST_TIMEOUT_MS,
      );
    } catch (error) {
      controller.abort();
      if (
        error instanceof AiTimeoutError
        || error instanceof AiProviderError
        || error instanceof AiProviderConfigurationError
      ) {
        throw error;
      }
      throw new AiProviderError();
    }

    const outputPrivacy = inspectStructuredPrivacy(result);
    if (!outputPrivacy.allowed) {
      throw new AiDocumentWriterSensitiveInputError(outputPrivacy.warnings);
    }
    return result;
  });
}
