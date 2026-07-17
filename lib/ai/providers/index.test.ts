import { describe, expect, it } from "vitest";

import { resolveProviderConfig } from "@/lib/ai/providers";
import { AiProviderConfigurationError } from "@/lib/ai/providers/provider";

describe("AI provider configuration", () => {
  it("defaults to mock mode when no API key exists", () => {
    // Given no provider or key configuration
    const environment = {};

    // When provider configuration is resolved
    const config = resolveProviderConfig(environment);

    // Then the local fallback is selected
    expect(config).toEqual({ mode: "mock", model: "gpt-5.6-luna" });
  });

  it("uses AI_PROVIDER and AI_MODEL for OpenAI mode", () => {
    // Given an explicit OpenAI provider and model
    const environment = { AI_PROVIDER: "openai", AI_MODEL: "gpt-test", OPENAI_API_KEY: "secret" };

    // When provider configuration is resolved
    const config = resolveProviderConfig(environment);

    // Then only the supported environment names control the provider
    expect(config).toEqual({ mode: "openai", model: "gpt-test", apiKey: "secret" });
  });

  it("rejects explicit OpenAI mode when the server key is missing", () => {
    expect(() => resolveProviderConfig({ AI_PROVIDER: "openai" })).toThrow(AiProviderConfigurationError);
  });

  it("rejects an unsupported provider name with a typed configuration error", () => {
    // Given an unsupported provider value
    const environment = { AI_PROVIDER: "other" };

    // When configuration is resolved
    const resolve = () => resolveProviderConfig(environment);

    // Then a typed safe boundary error is raised
    expect(resolve).toThrow(AiProviderConfigurationError);
  });
});
