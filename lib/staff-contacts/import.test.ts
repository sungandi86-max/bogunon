import { describe, expect, it } from "vitest";

import { parseStaffContactPdfText, parseStaffContactRows } from "@/lib/staff-contacts/import";
import type { StaffContactRecord } from "@/lib/staff-contacts/domain";

const existing: StaffContactRecord[] = [{ id: "staff-1", user_id: "user-1", school_key: "B10:7010198", name: "김보건", mobile_phone: "010-1111-2222", memo: null, is_active: true, created_at: "", updated_at: "", assignment_id: "assignment-1", school_year: 2026, semester: 2, department: "생활안전부", grade_team: "2학년부", subject: "보건", role: "담당", duties: "학교폭력", office_location: "중앙교무실", seat: null, extension: "576", is_favorite: false, sort_order: 0 }];

describe("staff contact import", () => {
  it("parses new, changed, and duplicate-name rows for a selected term", () => {
    const rows = parseStaffContactRows([
      { "이름": "박행정", "부서": "행정실", "담당업무": "구매", "내선번호": "530" },
      { "이름": "김보건", "부서": "중앙교무실", "담당업무": "감염병", "내선번호": "580" },
      { "이름": "김보건", "부서": "2학년부" },
    ], existing);
    expect(rows.map((row) => row.status)).toEqual(["new", "changed", "needs_review"]);
    expect(rows[1]?.existingContactId).toBe("staff-1");
  });

  it("extracts structured PDF rows without turning headings into error rows", () => {
    const rows = parseStaffContactPdfText(
      "2026학년도 교무분장표 안내 김보건 부서: 생활안전부 담당업무: 학교폭력 내선: 576 박행정 부서: 행정실 담당업무: 구매 내선: 530",
      "assignment",
      [],
    );
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.value.name && row.status !== "error")).toBe(true);
    expect(rows.map((row) => row.value.name)).toEqual(["김보건", "박행정"]);
  });

  it("fails safely when a PDF has no structured contact rows", () => {
    expect(() => parseStaffContactPdfText("학교 안내문 빈 페이지", "auto", [])).toThrow("구조화된 연락처 행");
  });
});
