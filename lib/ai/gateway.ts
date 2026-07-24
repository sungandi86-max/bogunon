import type { z } from "zod";

import { createGeminiTextProvider } from "@/lib/ai/providers/gemini";
import { createOpenAiTextProvider } from "@/lib/ai/providers/openai";
import type {
  AiConnectionInput,
  AiProviderCredentials,
  AiProviderRegistry,
  AiStructuredGenerationRequest,
} from "@/lib/ai/types";

function credentials(connection: AiConnectionInput): AiProviderCredentials {
  return { apiKey: connection.apiKey, model: connection.model };
}

export function createAiGateway(providers: AiProviderRegistry) {
  return {
    async validateConnection(
      connection: AiConnectionInput,
      signal?: AbortSignal,
    ): Promise<void> {
      const provider = providers[connection.provider];
      try {
        await provider.validateConnection(credentials(connection), signal);
      } catch (error) {
        throw provider.normalizeError(error);
      }
    },
    async generateText<TSchema extends z.ZodType>(
      connection: AiConnectionInput,
      request: AiStructuredGenerationRequest<TSchema>,
      signal?: AbortSignal,
    ): Promise<z.output<TSchema>> {
      const provider = providers[connection.provider];
      try {
        return await provider.generateText(credentials(connection), request, signal);
      } catch (error) {
        throw provider.normalizeError(error);
      }
    },
  };
}

export const aiGateway = createAiGateway({
  openai: createOpenAiTextProvider(),
  gemini: createGeminiTextProvider(),
});
