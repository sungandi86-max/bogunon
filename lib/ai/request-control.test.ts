import { describe, expect, it, vi } from "vitest";

import {
  AiTimeoutError,
  InMemoryRateLimiter,
  RequestDeduplicator,
  withTimeout,
} from "@/lib/ai/request-control";

describe("AI request controls", () => {
  it("limits each authenticated user independently within the window", () => {
    // Given a two-request window for each user
    const limiter = new InMemoryRateLimiter({ maxRequests: 2, windowMs: 1_000, now: () => 100 });

    // When one user consumes the quota and another sends one request
    const results = [limiter.consume("user-a"), limiter.consume("user-a"), limiter.consume("user-a"), limiter.consume("user-b")];

    // Then only the over-quota request is rejected
    expect(results).toEqual([true, true, false, true]);
  });

  it("deduplicates concurrent identical requests", async () => {
    // Given two callers using the same request key
    const deduplicator = new RequestDeduplicator<string>();
    const factory = vi.fn(async () => "preview");

    // When both requests run concurrently
    const results = await Promise.all([
      deduplicator.run("user:hash", factory),
      deduplicator.run("user:hash", factory),
    ]);

    // Then one provider call serves both callers
    expect(results).toEqual(["preview", "preview"]);
    expect(factory).toHaveBeenCalledOnce();
  });

  it("turns an overlong provider call into a typed timeout", async () => {
    // Given a provider operation that never settles
    const operation = new Promise<never>(() => undefined);

    // When the configured timeout elapses
    const result = withTimeout(operation, 1);

    // Then callers receive the typed timeout boundary
    await expect(result).rejects.toBeInstanceOf(AiTimeoutError);
  });
});
