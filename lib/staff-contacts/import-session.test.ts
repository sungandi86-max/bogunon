import { beforeEach, describe, expect, it, vi } from "vitest";

import type { StaffContactImportRow } from "@/lib/staff-contacts/import";
import { analyzeStaffContactFiles } from "@/lib/staff-contacts/import-session";
import type { StaffContactRecord } from "@/lib/staff-contacts/domain";

const { parseStaffContactFile } = vi.hoisted(() => ({ parseStaffContactFile: vi.fn() }));
vi.mock("@/lib/staff-contacts/import", async () => {
  const actual = await vi.importActual<typeof import("@/lib/staff-contacts/import")>("@/lib/staff-contacts/import");
  return { ...actual, parseStaffContactFile };
});

function row(name: string, values: Partial<StaffContactImportRow["value"]>, sourceName = name): StaffContactImportRow {
  return { sourceName, status: "new", message: null, existingContactId: null, existingAssignmentId: null, value: { name, mobile_phone: null, memo: null, department: null, grade_team: null, subject: null, role: null, duties: null, office_location: null, seat: null, extension: null, is_favorite: false, sort_order: 0, is_active: true, ...values } };
}

describe("staff contact import session", () => {
  beforeEach(() => parseStaffContactFile.mockReset());

  it("merges two PDF sources by name and preserves fields", async () => {
    parseStaffContactFile.mockResolvedValueOnce([row("박숙현", { subject: "보건", extension: "543" }, "좌석배치표.pdf")]).mockResolvedValueOnce([row("박숙현", { department: "생활안전부", duties: "보건·방역" }, "교무분장표.pdf")]);
    const result = await analyzeStaffContactFiles([
      { id: "seat", file: new File(["seat"], "좌석배치표.pdf", { type: "application/pdf" }), documentType: "seating" },
      { id: "assignment", file: new File(["assignment"], "교무분장표.pdf", { type: "application/pdf" }), documentType: "assignment" },
    ], []);
    expect(result.rows).toHaveLength(1);
    expect(result.autoMerged).toBe(1);
    expect(result.rows[0]?.value).toMatchObject({ subject: "보건", department: "생활안전부", extension: "543" });
  });

  it("supplements an existing term contact without creating a duplicate", async () => {
    parseStaffContactFile.mockResolvedValueOnce([{ ...row("박숙현", { department: "생활안전부", duties: "보건·방역", office_location: "보건실", extension: "543" }, "교무분장표.pdf"), existingContactId: "existing-contact" }]);
    const existing: StaffContactRecord[] = [{
      id: "existing-contact",
      user_id: "user-1",
      school_key: "B10:7010198",
      name: "박숙현",
      mobile_phone: "010-1111-2222",
      memo: null,
      is_active: true,
      created_at: "",
      updated_at: "",
      assignment_id: "assignment-1",
      school_year: 2026,
      semester: 2,
      department: null,
      grade_team: null,
      subject: null,
      role: null,
      duties: null,
      office_location: null,
      seat: null,
      extension: null,
      is_favorite: false,
      sort_order: 0,
    }];
    const result = await analyzeStaffContactFiles([{ id: "assignment", file: new File(["assignment"], "교무분장표.pdf", { type: "application/pdf" }), documentType: "assignment" }], existing);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.existingContactId).toBe("existing-contact");
    expect(result.rows[0]?.value.mobile_phone).toBe("010-1111-2222");
    expect(result.rows[0]?.value.extension).toBe("543");
  });

  it("keeps a conflict for review and continues when one file fails", async () => {
    parseStaffContactFile.mockResolvedValueOnce([row("박숙현", { extension: "543" }, "좌석배치표.pdf")]).mockRejectedValueOnce(new Error("구조화된 연락처 행을 찾지 못했습니다."));
    const result = await analyzeStaffContactFiles([
      { id: "seat", file: new File(["seat"], "좌석배치표.pdf", { type: "application/pdf" }), documentType: "seating" },
      { id: "broken", file: new File(["broken"], "교무분장표.pdf", { type: "application/pdf" }), documentType: "assignment" },
    ], []);
    expect(result.rows).toHaveLength(1);
    expect(result.analyses.find((analysis) => analysis.id === "broken")?.error).toContain("구조화된");
  });

  it("analyzes PDF, XLSX, and CSV in one session", async () => {
    parseStaffContactFile.mockResolvedValue([row("김보건", { department: "생활안전부" })]);
    const result = await analyzeStaffContactFiles([
      { id: "pdf", file: new File(["pdf"], "좌석배치표.pdf", { type: "application/pdf" }), documentType: "seating" },
      { id: "xlsx", file: new File(["xlsx"], "교무분장표.xlsx"), documentType: "auto" },
      { id: "csv", file: new File(["csv"], "연락처.csv"), documentType: "auto" },
    ], []);
    expect(result.analyses).toHaveLength(3);
    expect(result.autoMerged).toBe(1);
  });

  it("uses spreadsheet names as the canonical roster for PDF enrichment", async () => {
    parseStaffContactFile
      .mockResolvedValueOnce([row("박숙현", { mobile_phone: "010-0000-0000" }, "교사 연락처.xlsx")])
      .mockResolvedValueOnce([row("박숙현", { duties: "보건·방역" }, "교무분장표.pdf"), row("고사", { duties: "시험 일정" }, "교무분장표.pdf")]);
    const result = await analyzeStaffContactFiles([
      { id: "xlsx", file: new File(["xlsx"], "교사 연락처.xlsx"), documentType: "auto" },
      { id: "pdf", file: new File(["pdf"], "교무분장표.pdf", { type: "application/pdf" }), documentType: "assignment" },
    ], []);
    expect(result.canonicalRosterCount).toBe(1);
    expect(result.pdfMatchedCount).toBe(1);
    expect(result.outsideRosterCount).toBe(1);
    expect(result.autoMerged).toBe(1);
    expect(result.rows.find((entry) => entry.value.name === "고사")?.status).toBe("needs_review");
    expect(result.rows.find((entry) => entry.value.name === "고사")?.message).toContain("기준 명단");
  });
});
