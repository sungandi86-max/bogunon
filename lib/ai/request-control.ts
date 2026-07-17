export class AiTimeoutError extends Error {
  readonly code = "AI_TIMEOUT";

  constructor() {
    super("AI request timed out");
    this.name = "AiTimeoutError";
  }
}

export class AiRateLimitError extends Error {
  readonly code = "RATE_LIMITED";

  constructor() {
    super("AI request rate limit exceeded");
    this.name = "AiRateLimitError";
  }
}

export interface RateLimiterOptions {
  readonly maxRequests: number;
  readonly windowMs: number;
  readonly now?: () => number;
  readonly maxUsers?: number;
}

export class InMemoryRateLimiter {
  private readonly entries = new Map<string, number[]>();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly now: () => number;
  private readonly maxUsers: number;

  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
    this.now = options.now ?? Date.now;
    this.maxUsers = options.maxUsers ?? 5_000;
  }

  consume(userId: string): boolean {
    const now = this.now();
    const active = (this.entries.get(userId) ?? []).filter((timestamp) => now - timestamp < this.windowMs);
    if (active.length >= this.maxRequests) {
      this.entries.set(userId, active);
      return false;
    }
    if (!this.entries.has(userId) && this.entries.size >= this.maxUsers) {
      const oldest = this.entries.keys().next();
      if (!oldest.done) this.entries.delete(oldest.value);
    }
    this.entries.set(userId, [...active, now]);
    return true;
  }
}

export class RequestDeduplicator<T> {
  private readonly inFlight = new Map<string, Promise<T>>();

  async run(key: string, factory: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) return existing;
    const promise = factory();
    this.inFlight.set(key, promise);
    try {
      return await promise;
    } finally {
      if (this.inFlight.get(key) === promise) this.inFlight.delete(key);
    }
  }
}

export function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new AiTimeoutError()), timeoutMs);
    operation.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
