import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { createAiGateway } from "@/lib/ai/gateway";
import type { AiTextProvider } from "@/lib/ai/types";

const responseSchema = z.object({ draft: z.string() });

function provider(label: string): AiTextProvider {
  return {
    generateText: vi.fn().mockResolvedValue({ draft: `${label} draft` }),
    normalizeError: vi.fn(),
    validateConnection: vi.fn().mockResolvedValue(undefined),
  };
}

describe("AI gateway", () => {
  it("routes connection validation to the selected provider", async () => {
    const openai = provider("openai");
    const gemini = provider("gemini");
    const gateway = createAiGateway({ openai, gemini });

    await gateway.validateConnection({
      provider: "gemini",
      apiKey: "secret-key",
      model: "gemini-3.6-flash",
    });

    expect(gemini.validateConnection).toHaveBeenCalledWith(
      { apiKey: "secret-key", model: "gemini-3.6-flash" },
      undefined,
    );
    expect(openai.validateConnection).not.toHaveBeenCalled();
  });

  it("routes structured generation without exposing provider details to the caller", async () => {
    const openai = provider("openai");
    const gateway = createAiGateway({ openai, gemini: provider("gemini") });

    const result = await gateway.generateText(
      { provider: "openai", apiKey: "secret-key", model: "gpt-5.6-terra" },
      {
        systemPrompt: "system",
        prompt: "prompt",
        responseSchema,
        schemaName: "student_record",
      },
    );

    expect(result).toEqual({ draft: "openai draft" });
    expect(openai.generateText).toHaveBeenCalledWith(
      { apiKey: "secret-key", model: "gpt-5.6-terra" },
      expect.objectContaining({ schemaName: "student_record" }),
      undefined,
    );
  });
});
