import { describe, expect, it } from "vitest";

import { getAedStatus, nextInspectionDateFrom } from "@/lib/aed/domain";

const today = "2026-08-19";

describe("AED status domain", () => {
  it("prioritizes expired consumables over inspection needed", () => {
    expect(getAedStatus({ batteryExpiryDate: "2026-08-18", padExpiryDate: null, nextInspectionDate: today }, today)).toBe("expired");
  });

  it.each([
    [{ batteryExpiryDate: null, padExpiryDate: null, nextInspectionDate: today }, "inspectionNeeded"],
    [{ batteryExpiryDate: null, padExpiryDate: "2026-09-18", nextInspectionDate: "2026-10-01" }, "replacementSoon"],
    [{ batteryExpiryDate: null, padExpiryDate: null, nextInspectionDate: "2026-09-18" }, "inspectionSoon"],
    [{ batteryExpiryDate: "2027-01-01", padExpiryDate: "2027-01-01", nextInspectionDate: "2026-12-01" }, "normal"],
  ] as const)("calculates %s", (device, expected) => {
    expect(getAedStatus(device, today)).toBe(expected);
  });

  it("calculates the next inspection date without local timezone drift", () => {
    expect(nextInspectionDateFrom("2026-08-19", 1)).toBe("2026-09-19");
    expect(nextInspectionDateFrom("2026-01-31", 1)).toBe("2026-02-28");
    expect(nextInspectionDateFrom("2026-08-19", 0)).toBeNull();
  });
});
