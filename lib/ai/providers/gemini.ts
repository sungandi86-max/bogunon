import { ApiError, GoogleGenAI } from "@google/genai";
import { z } from "zod";

import {
  AiGatewayError,
  commonProviderError,
  gatewayError,
  providerErrorDetails,
} from "@/lib/ai/errors";
import type { AiTextProvider } from "@/lib/ai/types";

const PROVIDER = "gemini";

export function normalizeGeminiError(error: unknown): AiGatewayError {
  const common = commonProviderError(error, PROVIDER);
  if (common) return common;

  const details = providerErrorDetails(error);
  const normalized = `${details.code ?? ""} ${details.message ?? ""}`.toLowerCase();
  if (
    details.status === 401
    || /api[_ -]?key[_ -]?invalid|api key not valid|invalid api key/.test(normalized)
  ) {
    return gatewayError("INVALID_API_KEY", PROVIDER);
  }
  if (details.status === 403) return gatewayError("PERMISSION_DENIED", PROVIDER);
  if (details.status === 429 && /quota|billing|resource_exhausted/.test(normalized)) {
    return gatewayError("QUOTA_OR_BILLING", PROVIDER);
  }
  if (details.status === 429) return gatewayError("RATE_LIMITED", PROVIDER);
  if (details.status === 400 || details.status === 404) {
    return gatewayError("MODEL_NOT_SUPPORTED", PROVIDER);
  }
  if (details.status && details.status >= 500) {
    return gatewayError("PROVIDER_UNAVAILABLE", PROVIDER);
  }
  if (error instanceof SyntaxError || error instanceof z.ZodError) {
    return gatewayError("INVALID_RESPONSE", PROVIDER);
  }
  if (error instanceof ApiError) return gatewayError("UNKNOWN", PROVIDER);
  return gatewayError("UNKNOWN", PROVIDER);
}

export function createGeminiTextProvider(): AiTextProvider {
  return {
    async validateConnection(credentials, signal): Promise<void> {
      const client = new GoogleGenAI({ apiKey: credentials.apiKey });
      await client.models.generateContent({
        model: credentials.model,
        contents: "Reply with OK.",
        config: {
          ...(signal ? { abortSignal: signal } : {}),
          maxOutputTokens: 8,
          temperature: 0,
        },
      });
    },
    async generateText(credentials, request, signal) {
      const client = new GoogleGenAI({ apiKey: credentials.apiKey });
      const response = await client.models.generateContent({
        model: credentials.model,
        contents: request.prompt,
        config: {
          ...(signal ? { abortSignal: signal } : {}),
          responseJsonSchema: z.toJSONSchema(request.responseSchema),
          responseMimeType: "application/json",
          systemInstruction: request.systemPrompt,
          temperature: 0.2,
        },
      });
      if (!response.text?.trim()) throw gatewayError("INVALID_RESPONSE", PROVIDER);
      return request.responseSchema.parse(JSON.parse(response.text));
    },
    normalizeError: normalizeGeminiError,
  };
}
