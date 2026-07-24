import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import {
  AiGatewayError,
  commonProviderError,
  gatewayError,
  providerErrorDetails,
} from "@/lib/ai/errors";
import { AI_SYSTEM_PROMPT } from "@/lib/ai/prompts/system";
import { buildAssistantPrompt } from "@/lib/ai/prompts/request";
import { AiAssistantResponseSchema } from "@/lib/ai/schemas/actions";
import type { AiAssistantRequest } from "@/lib/ai/schemas/request";
import { AiProviderError } from "@/lib/ai/providers/provider";
import type { AiProvider, AiProviderRequest, AiProviderResult } from "@/lib/ai/providers/provider";
import type { AiTextProvider } from "@/lib/ai/types";

export interface OpenAiProviderOptions {
  readonly model: string;
  readonly timeoutMs: number;
}

export function createOpenAiProvider(
  apiKey: string,
  options: OpenAiProviderOptions,
): AiProvider {
  const client = new OpenAI({ apiKey, maxRetries: 0, timeout: options.timeoutMs });
  return {
    async generate(request: AiProviderRequest, signal?: AbortSignal): Promise<AiProviderResult> {
      const promptRequest: AiAssistantRequest = {
        input: request.input,
        context: request.context,
        saveHistory: false,
      };
      const body = {
        model: options.model,
        instructions: AI_SYSTEM_PROMPT,
        input: buildAssistantPrompt(promptRequest, request.selectedContext),
        text: { format: zodTextFormat(AiAssistantResponseSchema, "bogunon_ai_action") },
      };
      const response = signal
        ? await client.responses.parse(body, { signal })
        : await client.responses.parse(body);
      if (response.output_parsed === null) throw new AiProviderError();
      return {
        mode: "openai",
        response: AiAssistantResponseSchema.parse(response.output_parsed),
      };
    },
  };
}

const TEXT_PROVIDER = "openai";
const TEXT_PROVIDER_TIMEOUT_MS = 25_000;

export function normalizeOpenAiError(error: unknown): AiGatewayError {
  const common = commonProviderError(error, TEXT_PROVIDER);
  if (common) return common;

  const details = providerErrorDetails(error);
  const normalized = `${details.code ?? ""} ${details.message ?? ""}`.toLowerCase();
  if (details.status === 401) return gatewayError("INVALID_API_KEY", TEXT_PROVIDER);
  if (details.status === 403) return gatewayError("PERMISSION_DENIED", TEXT_PROVIDER);
  if (details.status === 429 && /quota|billing|insufficient_quota/.test(normalized)) {
    return gatewayError("QUOTA_OR_BILLING", TEXT_PROVIDER);
  }
  if (details.status === 429) return gatewayError("RATE_LIMITED", TEXT_PROVIDER);
  if (details.status === 400 || details.status === 404) {
    return gatewayError("MODEL_NOT_SUPPORTED", TEXT_PROVIDER);
  }
  if (details.status && details.status >= 500) {
    return gatewayError("PROVIDER_UNAVAILABLE", TEXT_PROVIDER);
  }
  if (error instanceof SyntaxError) return gatewayError("INVALID_RESPONSE", TEXT_PROVIDER);
  if (
    error instanceof OpenAI.APIUserAbortError
    || error instanceof OpenAI.APIConnectionTimeoutError
  ) {
    return gatewayError("TIMEOUT", TEXT_PROVIDER);
  }
  if (error instanceof OpenAI.APIConnectionError) {
    return gatewayError("NETWORK", TEXT_PROVIDER);
  }
  return gatewayError("UNKNOWN", TEXT_PROVIDER);
}

export function createOpenAiTextProvider(): AiTextProvider {
  return {
    async validateConnection(credentials, signal): Promise<void> {
      const client = new OpenAI({
        apiKey: credentials.apiKey,
        maxRetries: 0,
        timeout: TEXT_PROVIDER_TIMEOUT_MS,
      });
      const body = {
        model: credentials.model,
        input: "Reply with OK.",
        max_output_tokens: 16,
      };
      if (signal) {
        await client.responses.create(body, { signal });
      } else {
        await client.responses.create(body);
      }
    },
    async generateText(credentials, request, signal) {
      const client = new OpenAI({
        apiKey: credentials.apiKey,
        maxRetries: 0,
        timeout: TEXT_PROVIDER_TIMEOUT_MS,
      });
      const body = {
        model: credentials.model,
        instructions: request.systemPrompt,
        input: request.prompt,
        text: { format: zodTextFormat(request.responseSchema, request.schemaName) },
      };
      const response = signal
        ? await client.responses.parse(body, { signal })
        : await client.responses.parse(body);
      const parsed = request.responseSchema.safeParse(response.output_parsed);
      if (!parsed.success) throw gatewayError("INVALID_RESPONSE", TEXT_PROVIDER);
      return parsed.data;
    },
    normalizeError: normalizeOpenAiError,
  };
}
