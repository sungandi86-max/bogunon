import { describe, expect, it } from "vitest";

import { currentTerm, phoneHref, schoolKey } from "@/lib/staff-contacts/domain";

describe("staff contacts term helpers", () => {
  it("uses July as the first-semester boundary", () => {
    expect(currentTerm(new Date("2026-07-31T00:00:00+09:00"))).toEqual({ schoolYear: 2026, semester: 1 });
    expect(currentTerm(new Date("2026-08-01T00:00:00+09:00"))).toEqual({ schoolYear: 2026, semester: 2 });
  });
  it("keeps school scope and safe phone links deterministic", () => {
    expect(schoolKey("B10", "7010198", "세화여자고등학교")).toBe("B10:7010198");
    expect(phoneHref("010-1234-5678")).toBe("tel:01012345678");
  });
});
