import { describe, expect, it } from "vitest";

import { parseStaffContactRows } from "@/lib/staff-contacts/import";
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
});
