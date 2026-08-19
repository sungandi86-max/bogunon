import { describe, expect, it } from "vitest";

import { isSafeQuickLinkUrl, quickLinkInputSchema } from "@/lib/quick-links/domain";

describe("quick link domain", () => {
  it("accepts http/https and rejects executable schemes", () => {
    expect(isSafeQuickLinkUrl("https://school.example" )).toBe(true);
    expect(isSafeQuickLinkUrl("http://school.example" )).toBe(true);
    expect(isSafeQuickLinkUrl("javascript:alert(1)" )).toBe(false);
    expect(quickLinkInputSchema.safeParse({ name: "NEIS", url: "data:text/html,unsafe", iconKey: "admin", sortOrder: 0, isVisible: true }).success).toBe(false);
  });
});
