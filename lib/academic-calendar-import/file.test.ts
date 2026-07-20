import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { AcademicImportFileError, readAcademicWorkbook } from "@/lib/academic-calendar-import/file";
import { parseAcademicRows } from "@/lib/academic-calendar-import/parser";

function workbookFile(extension: "xlsx" | "xls"): File {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["날짜", "일정명"], ["2026-03-02", "개학식"]]), "학사일정");
  const bytes = XLSX.write(workbook, { bookType: extension === "xls" ? "biff8" : "xlsx", type: "array" });
  return new File([bytes], `sample.${extension}`, { type: extension === "xls" ? "application/vnd.ms-excel" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

describe("academic calendar workbook files", () => {
  it.each(["xlsx", "xls"] as const)("reads a %s workbook", async (extension) => {
    const workbook = await readAcademicWorkbook(workbookFile(extension));
    expect(workbook.sheets[0]).toEqual(expect.objectContaining({ name: "학사일정", likely: true }));
  });

  it("reads CSV without uploading it", async () => {
    const workbook = await readAcademicWorkbook(new File(["날짜,일정명\n2026-03-02,개학식"], "sample.csv", { type: "text/csv" }));
    expect(parseAcademicRows(workbook.sheets[0]?.rows ?? [], { academicYear: 2026, academicYearMode: false }).items[0]).toEqual(expect.objectContaining({ startDate: "2026-03-02", title: "개학식" }));
  });

  it.each([
    ["standard.csv", false, ["2026-03-02", "2026-03-17"]],
    ["month-day-columns.csv", false, ["2026-03-02", "2026-05-15"]],
    ["academic-year.csv", true, ["2026-03-02", "2026-07-20", "2027-01-08", "2027-02-12"]],
    ["date-ranges.csv", false, ["2026-04-20", "2026-07-20"]],
    ["errors-and-duplicates.csv", false, ["2026-03-02", "", "2026-03-03", "2026-03-02"]],
  ] as const)("parses the documented %s fixture", async (name, academicYearMode, expectedDates) => {
    const bytes = await readFile(join(process.cwd(), "fixtures", "academic-calendar-import", name));
    const workbook = await readAcademicWorkbook(new File([bytes], name, { type: "text/csv" }));
    const result = parseAcademicRows(workbook.sheets[0]?.rows ?? [], { academicYear: 2026, academicYearMode });

    expect(result.items.map((item) => item.startDate)).toEqual(expectedDates);
  });

  it("blocks unsupported, oversized, and empty files", async () => {
    await expect(readAcademicWorkbook(new File(["data"], "sample.exe", { type: "application/octet-stream" }))).rejects.toMatchObject({ code: "unsupported" });
    const oversized = new File(["data"], "sample.csv", { type: "text/csv" });
    Object.defineProperty(oversized, "size", { value: 10 * 1024 * 1024 + 1 });
    await expect(readAcademicWorkbook(oversized)).rejects.toMatchObject({ code: "tooLarge" });
    await expect(readAcademicWorkbook(new File([], "sample.csv", { type: "text/csv" }))).rejects.toBeInstanceOf(AcademicImportFileError);
  });
});
