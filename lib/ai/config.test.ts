import { describe, expect, it } from "vitest";

import {
  AI_PROVIDER_CONFIG,
  getDefaultAiModel,
  getSupportedAiModels,
} from "@/lib/ai/config";

describe("AI provider config", () => {
  it("keeps provider models in one shared config", () => {
    expect(getDefaultAiModel("openai")).toBe("gpt-5.6-terra");
    expect(getDefaultAiModel("gemini")).toBe("gemini-3.6-flash");
    expect(getSupportedAiModels("openai")).toEqual(AI_PROVIDER_CONFIG.openai.models);
    expect(getSupportedAiModels("gemini")).toEqual(AI_PROVIDER_CONFIG.gemini.models);
  });
});
