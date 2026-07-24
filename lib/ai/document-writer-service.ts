import { createHash } from "node:crypto";

import type {
  AiDocumentWriterRequest,
  AiDocumentWriterResult,
} from "@/lib/ai/document-writer";
import { AiGatewayError } from "@/lib/ai/errors";
import { aiGateway } from "@/lib/ai/gateway";
import { inspectPrivacy, inspectStructuredPrivacy } from "@/lib/ai/privacy";
import {
  buildStudentRecordPrompt,
  StudentRecordAiResponseSchema,
} from "@/lib/ai/prompts/student-record";
import {
  AiRateLimitError,
  AiTimeoutError,
  InMemoryRateLimiter,
  RequestDeduplicator,
  withTimeout,
} from "@/lib/ai/request-control";
import type { AiConnectionInput } from "@/lib/ai/types";

export class AiDocumentWriterSensitiveInputError extends Error {
  readonly code = "SENSITIVE_INPUT";
  readonly warnings: readonly string[];

  constructor(warnings: readonly string[]) {
    super("Sensitive document input rejected");
    this.name = "AiDocumentWriterSensitiveInputError";
    this.warnings = warnings;
  }
}

const REQUEST_TIMEOUT_MS = 35_000;
const limiter = new InMemoryRateLimiter({ maxRequests: 10, windowMs: 60_000 });
const deduplicator = new RequestDeduplicator<AiDocumentWriterResult>();

function requestKey(
  userId: string,
  connection: AiConnectionInput,
  request: AiDocumentWriterRequest,
): string {
  return createHash("sha256")
    .update(userId)
    .update("\0")
    .update(JSON.stringify(connection))
    .update("\0")
    .update(JSON.stringify(request))
    .digest("hex");
}

function inspectRequest(request: AiDocumentWriterRequest): readonly string[] {
  const warnings = [
    request.activityReport,
    request.additionalRecord,
  ].flatMap((value) => {
    const result = inspectPrivacy(value);
    return result.allowed ? [] : result.warnings;
  });
  return warnings.filter((warning, index, all) => all.indexOf(warning) === index);
}

export async function generateAiDocumentDraft(
  userId: string,
  connection: AiConnectionInput,
  request: AiDocumentWriterRequest,
): Promise<AiDocumentWriterResult> {
  return deduplicator.run(requestKey(userId, connection, request), async () => {
    if (!limiter.consume(userId)) throw new AiRateLimitError();
    const warnings = inspectRequest(request);
    if (warnings.length > 0) throw new AiDocumentWriterSensitiveInputError(warnings);

    const controller = new AbortController();
    let result: AiDocumentWriterResult;
    try {
      const prompt = buildStudentRecordPrompt(request);
      const response = await withTimeout(
        aiGateway.generateText(
          connection,
          {
            systemPrompt: prompt.systemPrompt,
            prompt: prompt.userPrompt,
            responseSchema: StudentRecordAiResponseSchema,
            schemaName: "bogunon_student_record",
          },
          controller.signal,
        ),
        REQUEST_TIMEOUT_MS,
      );
      result = { mode: connection.provider, ...response };
    } catch (error) {
      controller.abort();
      if (
        error instanceof AiTimeoutError
        || error instanceof AiGatewayError
      ) {
        throw error;
      }
      throw new AiGatewayError("UNKNOWN", connection.provider);
    }

    const outputPrivacy = inspectStructuredPrivacy(result);
    if (!outputPrivacy.allowed) {
      throw new AiDocumentWriterSensitiveInputError(outputPrivacy.warnings);
    }
    return result;
  });
}
