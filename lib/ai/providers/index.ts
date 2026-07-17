import { createOpenAiProvider } from "@/lib/ai/providers/openai";
import type { AiProvider } from "@/lib/ai/providers/provider";
import { AiProviderConfigurationError } from "@/lib/ai/providers/provider";
import { createRulesProvider } from "@/lib/ai/providers/rules";

const DEFAULT_MODEL = "gpt-5.6-luna";
const DEFAULT_PROVIDER_TIMEOUT_MS = 10_000;

export type ProviderConfig =
  | { readonly mode: "mock"; readonly model: string }
  | { readonly mode: "openai"; readonly model: string; readonly apiKey: string };

export function resolveProviderConfig(
  environment: Readonly<Record<string, string | undefined>>,
): ProviderConfig {
  const requested = environment["AI_PROVIDER"]?.trim().toLowerCase();
  if (requested && requested !== "mock" && requested !== "openai") {
    throw new AiProviderConfigurationError();
  }
  const apiKey = environment["OPENAI_API_KEY"]?.trim();
  const model = environment["AI_MODEL"]?.trim() || DEFAULT_MODEL;
  if (requested === "openai" && !apiKey) throw new AiProviderConfigurationError();
  const mode = requested ?? (apiKey ? "openai" : "mock");
  return mode === "openai" && apiKey
    ? { mode, model, apiKey }
    : { mode: "mock", model };
}

export function createConfiguredProvider(): AiProvider {
  const config = resolveProviderConfig(process.env);
  if (config.mode === "mock") return createRulesProvider();
  return createOpenAiProvider(config.apiKey, {
    model: config.model,
    timeoutMs: DEFAULT_PROVIDER_TIMEOUT_MS,
  });
}

export {
  AiProviderConfigurationError,
  AiProviderError,
} from "@/lib/ai/providers/provider";
export type {
  AiProvider,
  AiProviderRequest,
  AiProviderResult,
} from "@/lib/ai/providers/provider";
