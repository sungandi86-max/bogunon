import { describe, expect, it } from "vitest";

import {
  parseStaffContactPdfLayout,
  parseStaffContactPdfText,
  parseStaffContactRows,
} from "@/lib/staff-contacts/import";
import type { DocumentPdfTextItem } from "@/lib/ai/document-text-extraction";
import type { StaffContactRecord } from "@/lib/staff-contacts/domain";

const existing: StaffContactRecord[] = [
  {
    id: "staff-1",
    user_id: "user-1",
    school_key: "B10:7010198",
    name: "김보건",
    mobile_phone: "010-1111-2222",
    memo: null,
    is_active: true,
    created_at: "",
    updated_at: "",
    assignment_id: "assignment-1",
    school_year: 2026,
    semester: 2,
    department: "생활안전부",
    grade_team: "2학년부",
    subject: "보건",
    role: "담당",
    duties: "학교폭력",
    office_location: "중앙교무실",
    seat: null,
    extension: "576",
    is_favorite: false,
    sort_order: 0,
  },
];

describe("staff contact import", () => {
  it("parses new, changed, and duplicate-name rows for a selected term", () => {
    const rows = parseStaffContactRows(
      [
        { 이름: "박행정", 부서: "행정실", 담당업무: "구매", 내선번호: "530" },
        {
          이름: "김보건",
          부서: "중앙교무실",
          담당업무: "감염병",
          내선번호: "580",
        },
        { 이름: "김보건", 부서: "2학년부" },
      ],
      existing,
    );
    expect(rows.map((row) => row.status)).toEqual([
      "new",
      "changed",
      "needs_review",
    ]);
    expect(rows[1]?.existingContactId).toBe("staff-1");
  });

  it("extracts structured PDF rows without turning headings into error rows", () => {
    const rows = parseStaffContactPdfText(
      "2026학년도 교무분장표 안내 김보건 부서: 생활안전부 담당업무: 학교폭력 내선: 576 박행정 부서: 행정실 담당업무: 구매 내선: 530",
      "assignment",
      [],
    );
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.value.name && row.status !== "error")).toBe(
      true,
    );
    expect(rows.map((row) => row.value.name)).toEqual(["김보건", "박행정"]);
  });

  it("fails safely when a PDF has no structured contact rows", () => {
    expect(() =>
      parseStaffContactPdfText("학교 안내문 빈 페이지", "auto", []),
    ).toThrow("구조화된 연락처 행");
  });

  it("parses assignment headers and duties across a school-sized table", () => {
    const items: DocumentPdfTextItem[] = [
      { page: 1, text: "생활안전부", x: 20, y: 800, width: 70, height: 10 },
    ];
    for (let index = 0; index < 60; index += 1) {
      items.push({
        page: 1,
        text: "강지희",
        x: 20,
        y: 780 - index * 10,
        width: 45,
        height: 10,
      });
      items.push({
        page: 1,
        text: index % 2 === 0 ? "보건" : "체육",
        x: 120,
        y: 780 - index * 10,
        width: 30,
        height: 10,
      });
      items.push({
        page: 1,
        text: "학교폭력·생활교육",
        x: 180,
        y: 780 - index * 10,
        width: 100,
        height: 10,
      });
    }
    const rows = parseStaffContactPdfLayout(items, "assignment", []);
    expect(rows).toHaveLength(60);
    expect(rows[0]?.value.department).toBe("생활안전부");
    expect(rows[0]?.value.duties).toContain("학교폭력");
  });

  it("keeps assignment duties inside the same x/y row", () => {
    const items: DocumentPdfTextItem[] = [
      { page: 1, text: "생활안전부", x: 20, y: 800, width: 70, height: 10 },
      { page: 1, text: "박숙현", x: 20, y: 780, width: 45, height: 10 },
      { page: 1, text: "보건", x: 120, y: 780, width: 30, height: 10 },
      {
        page: 1,
        text: "보건·방역·금연지도·성폭력 예방교육",
        x: 180,
        y: 780,
        width: 180,
        height: 10,
      },
      { page: 1, text: "현혜영", x: 20, y: 760, width: 45, height: 10 },
      { page: 1, text: "사서", x: 120, y: 760, width: 30, height: 10 },
      {
        page: 1,
        text: "도서관 운영·도서관 행사",
        x: 180,
        y: 760,
        width: 150,
        height: 10,
      },
      { page: 1, text: "우혜림", x: 20, y: 740, width: 45, height: 10 },
      { page: 1, text: "상담", x: 120, y: 740, width: 30, height: 10 },
      {
        page: 1,
        text: "상담실 운영·학생맞춤형통합지원",
        x: 180,
        y: 740,
        width: 170,
        height: 10,
      },
    ];
    const rows = parseStaffContactPdfLayout(items, "assignment", []);
    const byName = new Map(rows.map((row) => [row.value.name, row.value]));
    expect(byName.get("박숙현")?.duties).toContain("보건·방역");
    expect(byName.get("박숙현")?.duties).not.toContain("도서관");
    expect(byName.get("현혜영")?.duties).toContain("도서관 운영");
    expect(byName.get("현혜영")?.duties).not.toContain("상담실");
    expect(byName.get("우혜림")?.duties).toContain("상담실 운영");
    expect(byName.get("우혜림")?.duties).not.toContain("박숙현");
  });

  it("connects seating-room names with nearby extension numbers", () => {
    const items: DocumentPdfTextItem[] = [
      { page: 1, text: "중앙교무실", x: 20, y: 800, width: 70, height: 10 },
      { page: 1, text: "박숙현", x: 20, y: 780, width: 45, height: 10 },
      { page: 1, text: "보건", x: 120, y: 780, width: 30, height: 10 },
      { page: 1, text: "543", x: 200, y: 780, width: 20, height: 10 },
    ];
    const rows = parseStaffContactPdfLayout(items, "seating", []);
    expect(rows[0]?.value.name).toBe("박숙현");
    expect(rows[0]?.value.office_location).toBe("중앙교무실");
    expect(rows[0]?.value.extension).toBe("543");
  });

  it("auto-detects a seating layout from its document heading", () => {
    const rows = parseStaffContactPdfLayout(
      [
        { page: 1, text: "좌석배치표", x: 20, y: 800, width: 70, height: 10 },
        { page: 1, text: "보건실", x: 20, y: 780, width: 45, height: 10 },
        { page: 1, text: "박숙현", x: 20, y: 760, width: 45, height: 10 },
        { page: 1, text: "543", x: 200, y: 760, width: 20, height: 10 },
      ],
      "auto",
      [],
    );
    expect(rows[0]?.value.office_location).toBe("보건실");
    expect(rows[0]?.value.extension).toBe("543");
  });
});
