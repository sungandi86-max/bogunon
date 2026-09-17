import { describe, expect, it } from "vitest";
import { validatePracticalToolScope } from "@/lib/practical-tools/domain";

describe("practical tool scope rules", () => {
  it("allows personal tools for regular users", () => {
    expect(validatePracticalToolScope("personal", "website", false)).toBeNull();
  });

  it("rejects public tools for regular users", () => {
    expect(validatePracticalToolScope("public", "website", false)).toBe("공용 도구는 관리자만 등록할 수 있습니다.");
  });

  it("allows administrators to create public non-health tools", () => {
    expect(validatePracticalToolScope("public", "website", true)).toBeNull();
  });

  it("always keeps online health tools personal", () => {
    expect(validatePracticalToolScope("public", "online_health", true)).toBe("온라인 보건실은 개인 도구로만 등록할 수 있습니다.");
  });
});
