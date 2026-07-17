import { describe, expect, it } from "vitest";

import { createLoginPath, getSafeNextPath, parseAuthErrorCode } from "@/lib/auth/redirects";

describe("auth redirects", () => {
  it("keeps a local protected path when the OAuth callback provides one", () => {
    const result = getSafeNextPath("/calendar?view=week");

    expect(result).toBe("/calendar?view=week");
  });

  it.each(["https://attacker.example", "//attacker.example", "/\\attacker.example", "briefing", null])(
    "falls back to briefing when the next path is unsafe: %s",
    (nextPath) => {
      const result = getSafeNextPath(nextPath);

      expect(result).toBe("/briefing");
    },
  );

  it("preserves the protected destination in a session-expired login URL", () => {
    const result = createLoginPath("sessionExpired", "/tasks?filter=today");

    expect(result).toBe("/login?error=session_expired&next=%2Ftasks%3Ffilter%3Dtoday");
  });

  it("parses only supported login error codes", () => {
    expect(parseAuthErrorCode("logout")).toBe("logout");
    expect(parseAuthErrorCode("internal-policy-name")).toBeNull();
  });
});
