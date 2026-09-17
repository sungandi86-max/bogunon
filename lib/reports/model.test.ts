import { describe, expect, it } from "vitest";
import { isReportStatus, isReportType, sanitizePathname } from "./model";

describe("report model", () => {
  it("sanitizes query strings and hashes from the captured path", () => {
    expect(sanitizePathname("/practical-schedules?id=private#details")).toBe("/practical-schedules");
    expect(sanitizePathname("https://example.com/private")).toBe("/");
  });

  it("validates report type and status enums", () => {
    expect(isReportType("bug")).toBe(true);
    expect(isReportType("ticket")).toBe(false);
    expect(isReportStatus("reviewing")).toBe(true);
    expect(isReportStatus("pending")).toBe(false);
  });
});
