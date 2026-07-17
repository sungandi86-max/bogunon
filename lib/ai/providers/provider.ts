import type { AiContextCandidate } from "@/lib/ai/context";
import type { AiAssistantResponse } from "@/lib/ai/schemas/actions";

export interface AiProviderRequest {
  readonly input: string;
  readonly context: {
    readonly surface: string;
    readonly entityId?: string;
  };
  readonly selectedContext: readonly AiContextCandidate[];
}

export interface AiProviderResult {
  readonly mode: "openai" | "mock";
  readonly response: AiAssistantResponse;
}

export interface AiProvider {
  generate(request: AiProviderRequest, signal?: AbortSignal): Promise<AiProviderResult>;
}

export class AiProviderError extends Error {
  readonly code = "AI_PROVIDER_ERROR";

  constructor() {
    super("AI provider failed");
    this.name = "AiProviderError";
  }
}

export class AiProviderConfigurationError extends Error {
  readonly code = "AI_CONFIGURATION_ERROR";

  constructor() {
    super("AI provider configuration is invalid");
    this.name = "AiProviderConfigurationError";
  }
}
