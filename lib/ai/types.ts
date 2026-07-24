import { z } from "zod";

export const AI_PROVIDER_IDS = ["openai", "gemini"] as const;
export const AiProviderIdSchema = z.enum(AI_PROVIDER_IDS);

export const AiConnectionInputSchema = z.object({
  provider: AiProviderIdSchema,
  apiKey: z.string().trim().min(8).max(512),
  model: z.string().trim().min(1).max(100),
}).strict();

export type AiProviderId = z.infer<typeof AiProviderIdSchema>;
export type AiConnectionInput = z.infer<typeof AiConnectionInputSchema>;
export type AiProviderCredentials = Readonly<Omit<AiConnectionInput, "provider">>;

export type AiStructuredGenerationRequest<TSchema extends z.ZodType> = {
  readonly systemPrompt: string;
  readonly prompt: string;
  readonly responseSchema: TSchema;
  readonly schemaName: string;
};

export interface AiTextProvider {
  validateConnection(
    credentials: AiProviderCredentials,
    signal?: AbortSignal,
  ): Promise<void>;
  generateText<TSchema extends z.ZodType>(
    credentials: AiProviderCredentials,
    request: AiStructuredGenerationRequest<TSchema>,
    signal?: AbortSignal,
  ): Promise<z.output<TSchema>>;
  normalizeError(error: unknown): import("@/lib/ai/errors").AiGatewayError;
}

export type AiProviderRegistry = Readonly<Record<AiProviderId, AiTextProvider>>;
