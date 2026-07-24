import type { AiProviderId } from "@/lib/ai/types";

type AiModelOption = {
  readonly id: string;
  readonly label: string;
  readonly recommended?: boolean;
};

type AiProviderConfig = {
  readonly defaultModel: string;
  readonly label: string;
  readonly models: readonly AiModelOption[];
};

export const AI_PROVIDER_CONFIG = {
  openai: {
    defaultModel: "gpt-5.6-terra",
    label: "OpenAI",
    models: [
      { id: "gpt-5.6-terra", label: "GPT-5.6 Terra", recommended: true },
      { id: "gpt-5.6-sol", label: "GPT-5.6 Sol" },
      { id: "gpt-5.6-luna", label: "GPT-5.6 Luna" },
    ],
  },
  gemini: {
    defaultModel: "gemini-3.6-flash",
    label: "Gemini",
    models: [
      { id: "gemini-3.6-flash", label: "Gemini 3.6 Flash", recommended: true },
      { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    ],
  },
} as const satisfies Readonly<Record<AiProviderId, AiProviderConfig>>;

export function getDefaultAiModel(provider: AiProviderId): string {
  return AI_PROVIDER_CONFIG[provider].defaultModel;
}

export function getSupportedAiModels(provider: AiProviderId): readonly AiModelOption[] {
  return AI_PROVIDER_CONFIG[provider].models;
}

export function getAiModelLabel(provider: AiProviderId, model: string): string {
  return getSupportedAiModels(provider).find((option) => option.id === model)?.label ?? model;
}
