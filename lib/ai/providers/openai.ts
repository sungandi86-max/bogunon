import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { AI_SYSTEM_PROMPT } from "@/lib/ai/prompts/system";
import { buildAssistantPrompt } from "@/lib/ai/prompts/request";
import { AiAssistantResponseSchema } from "@/lib/ai/schemas/actions";
import type { AiAssistantRequest } from "@/lib/ai/schemas/request";
import { AiProviderError } from "@/lib/ai/providers/provider";
import type { AiProvider, AiProviderRequest, AiProviderResult } from "@/lib/ai/providers/provider";

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
