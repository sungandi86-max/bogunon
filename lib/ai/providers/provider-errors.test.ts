import OpenAI from "openai";
import { describe, expect, it } from "vitest";

import { normalizeGeminiError } from "@/lib/ai/providers/gemini";
import { normalizeOpenAiError } from "@/lib/ai/providers/openai";

describe("provider error normalization", () => {
  it.each([
    [401, "INVALID_API_KEY"],
    [403, "PERMISSION_DENIED"],
    [404, "MODEL_NOT_SUPPORTED"],
    [429, "RATE_LIMITED"],
    [503, "PROVIDER_UNAVAILABLE"],
  ] as const)("normalizes OpenAI status %s", (status, code) => {
    const error = normalizeOpenAiError({ status });

    expect(error.code).toBe(code);
    expect(error.message).not.toContain("secret");
  });

  it("distinguishes OpenAI quota errors from ordinary rate limits", () => {
    const error = normalizeOpenAiError({
      status: 429,
      code: "insufficient_quota",
      message: "secret-key",
    });

    expect(error.code).toBe("QUOTA_OR_BILLING");
    expect(error.message).not.toContain("secret-key");
  });

  it("normalizes an OpenAI request aborted by the caller as a timeout", () => {
    const error = normalizeOpenAiError(new OpenAI.APIUserAbortError());

    expect(error.code).toBe("TIMEOUT");
  });

  it.each([
    [400, "MODEL_NOT_SUPPORTED"],
    [401, "INVALID_API_KEY"],
    [403, "PERMISSION_DENIED"],
    [429, "RATE_LIMITED"],
    [500, "PROVIDER_UNAVAILABLE"],
  ] as const)("normalizes Gemini status %s", (status, code) => {
    const error = normalizeGeminiError({ status, message: "secret-key" });

    expect(error.code).toBe(code);
    expect(error.message).not.toContain("secret-key");
  });

  it("normalizes abort and network failures without returning raw details", () => {
    const timeout = normalizeGeminiError(new DOMException("secret-key", "AbortError"));
    const network = normalizeOpenAiError(new TypeError("secret-key"));

    expect(timeout.code).toBe("TIMEOUT");
    expect(network.code).toBe("NETWORK");
    expect(timeout.message).not.toContain("secret-key");
    expect(network.message).not.toContain("secret-key");
  });

  it("recognizes Gemini's API_KEY_INVALID response without exposing details", () => {
    const error = normalizeGeminiError({
      status: 400,
      code: "API_KEY_INVALID",
      message: "API key not valid. secret-key",
    });

    expect(error.code).toBe("INVALID_API_KEY");
    expect(error.message).not.toContain("secret-key");
  });
});
