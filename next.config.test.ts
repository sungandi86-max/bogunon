import { describe, expect, it } from "vitest";

import nextConfig from "./next.config";

describe("Next.js production security configuration", () => {
  it("disables the framework fingerprint and provides fallback security headers", async () => {
    expect(nextConfig.poweredByHeader).toBe(false);

    const rules = await nextConfig.headers?.();
    const headers = new Map(rules?.flatMap((rule) => rule.headers.map((header) => [header.key, header.value])));

    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("Permissions-Policy")).toBe("camera=(), geolocation=(), microphone=()");
  });
});
