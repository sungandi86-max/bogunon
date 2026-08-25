import { describe, expect, it } from "vitest";
import { buildMedicationImportPreview, parseMedicationWorksheet } from "@/lib/medications/import-parser";

const item = { id: "11111111-1111-4111-8111-111111111111", userId: "user", category: "internal", name: "아세트아미노펜", specification: "10정", unit: "BOX", recommendedStock: 5, managementTip: null, note: null, active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" } as const;

describe("medication Excel import preview", () => {
  it("detects a header below title and instruction rows and ignores blank rows", () => {
    const worksheet = [
      ["세화여고 2026 보건실 의약품 행정 통합 시스템"],
      ["재고대장 안내: 잔여일수와 상태는 자동 계산됩니다."],
      [],
      ["분류", "품명", "규격 / 단위", "현재고", "권장재고", "유통기한", "비고"],
      ["내복약", "아세트아미노펜(1)", "10정/BOX", 4, 5, "2026.12.31", ""],
      ["", "", "", "", "", "", ""],
      ["외용약", "소독약", "500ml", 2, 2, "2027-01-31", "준비실"],
    ];

    const parsed = parseMedicationWorksheet(worksheet);

    expect(parsed.headerRowNumber).toBe(4);
    expect(parsed.dataRowCount).toBe(2);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.headers).toContain("규격 / 단위");

    const preview = buildMedicationImportPreview(parsed.rows, [], [], "2026-08-25", parsed.headers, (parsed.headerRowNumber ?? 1) + 1);
    expect(preview.errorCount).toBe(0);
    expect(preview.rows[0]?.rowNumber).toBe(5);
  });

  it("normalizes numbered names and splits specification/unit", () => {
    const preview = buildMedicationImportPreview([{ 분류: "내복약", 품명: "아세트아미노펜(1)", "규격/단위": "10정/BOX", 현재고: 4, 권장재고: 5, 유통기한: "2026.12.31" }], [], [], "2026-08-25", ["분류", "품명", "규격/단위", "현재고", "권장재고", "유통기한"]);
    expect(preview.rows[0]).toMatchObject({ originalName: "아세트아미노펜(1)", name: "아세트아미노펜", specification: "10정", unit: "BOX", category: "internal", status: "newItem", expirationDate: "2026-12-31" });
    expect(preview.newItemCount).toBe(1);
    expect(preview.newLotCount).toBe(1);
  });

  it("matches an existing item and flags repeated rows", () => {
    const raw = { 분류: "내복약", 품명: "아세트아미노펜", "규격/단위": "10정/BOX", 현재고: 4, 권장재고: 5, 유통기한: "2026-12-31" };
    const preview = buildMedicationImportPreview([raw, raw], [item], [{ id: "lot", itemId: item.id, receiptId: null, quantity: 4, expirationDate: "2026-10-01", receivedAt: "2026-08-01", unitPrice: 0 }], "2026-08-25", Object.keys(raw));
    expect(preview.rows.map((row) => row.status)).toEqual(["existingItem", "duplicate"]);
    expect(preview.existingItemCount).toBe(1);
    expect(preview.duplicateCount).toBe(1);
  });

  it("accepts zero recommended and current stock values", () => {
    const preview = buildMedicationImportPreview([
      { 품명: "숫자 0 약", 현재고: 0, 권장재고: 0, 유통기한: "2026-12-31" },
      { 품명: "문자 0 약", 현재고: "0", 권장재고: "0", 유통기한: "2026-12-31" },
    ], [], [], "2026-08-25", ["품명", "현재고", "권장재고", "유통기한"]);
    expect(preview.errorCount).toBe(0);
    expect(preview.rows.every((row) => row.status !== "error")).toBe(true);
    expect(preview.rows.every((row) => row.error === undefined)).toBe(true);
    expect(preview.rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ quantity: 0, recommendedStock: 0, itemRecommendedStock: 0, status: "newItem" }),
    ]));
  });

  it("does not count implicit zero recommendations on a later lot as errors", () => {
    const worksheet = [
      ["세화여고 보건실 의약품 대장"],
      ["권장재고를 생략한 후속 lot는 같은 품목의 기준재고를 따릅니다."],
      [],
      ["품명", "현재고", "권장재고", "유통기한"],
      ["지르세틴(1)", 30, 30, "2028-02-17"],
      ["지르세틴(2)", 24, "", "2028-06-16"],
      ["임팩타민(1)", 216, 400, "2026-05-14"],
      ["임팩타민(2)", 36, "", "2027-01-31"],
    ];
    const parsed = parseMedicationWorksheet(worksheet);
    const preview = buildMedicationImportPreview(parsed.rows, [], [], "2026-08-25", parsed.headers, (parsed.headerRowNumber ?? 1) + 1);

    expect(preview.errorCount).toBe(0);
    expect(preview.rows.map((row) => row.status)).toEqual(["newItem", "newItem", "newItem", "newItem"]);
    expect(preview.rows.map((row) => row.itemRecommendedStock)).toEqual([30, 30, 400, 400]);
    expect(preview.rows.every((row) => !row.error?.includes("권장재고는 0 이상의 정수"))).toBe(true);
  });

  it("keeps a standalone blank recommendation as an input error", () => {
    const preview = buildMedicationImportPreview([{ 품명: "권장재고 누락 약", 현재고: 1, 권장재고: "", 유통기한: "2026-12-31" }], [], [], "2026-08-25", ["품명", "현재고", "권장재고", "유통기한"]);
    expect(preview.errorCount).toBe(1);
    expect(preview.rows[0]?.status).toBe("error");
    expect(preview.rows[0]?.error).toContain("권장재고 값을 입력해 주세요.");
  });

  it("rejects negative recommended stock values", () => {
    const preview = buildMedicationImportPreview([{ 품명: "음수 재고 약", 현재고: 0, 권장재고: -1, 유통기한: "2026-12-31" }], [], [], "2026-08-25", ["품명", "현재고", "권장재고", "유통기한"]);
    expect(preview.errorCount).toBe(1);
    expect(preview.rows[0]?.status).toBe("error");
  });

  it("uses the positive recommendation for an item split across lots", () => {
    const preview = buildMedicationImportPreview([
      { 품명: "지르세틴(1)", 현재고: 4, 권장재고: 30, 유통기한: "2026-12-31" },
      { 품명: "지르세틴(2)", 현재고: 2, 권장재고: 0, 유통기한: "2027-01-31" },
    ], [], [], "2026-08-25", ["품명", "현재고", "권장재고", "유통기한"]);
    expect(preview.errorCount).toBe(0);
    expect(preview.newItemCount).toBe(1);
    expect(preview.rows.map((row) => row.status)).toEqual(["newItem", "newItem"]);
    expect(preview.rows.map((row) => row.itemRecommendedStock)).toEqual([30, 30]);
    expect(preview.rows[1]?.recommendedStock).toBe(0);
  });

  it("flags conflicting positive recommendations for the same item", () => {
    const preview = buildMedicationImportPreview([
      { 품명: "권장재고 충돌 약(1)", 현재고: 1, 권장재고: 10, 유통기한: "2026-12-31" },
      { 품명: "권장재고 충돌 약(2)", 현재고: 1, 권장재고: 20, 유통기한: "2027-01-31" },
    ], [], [], "2026-08-25", ["품명", "현재고", "권장재고", "유통기한"]);
    expect(preview.errorCount).toBe(0);
    expect(preview.duplicateCount).toBe(2);
    expect(preview.rows.every((row) => row.status === "duplicate")).toBe(true);
    expect(preview.rows.every((row) => row.itemRecommendedStock === 20)).toBe(true);
  });

  it("reports missing columns and invalid values without making valid rows look safe", () => {
    const preview = buildMedicationImportPreview([{ 품명: "누락 품목", 현재고: "많음" }], [], [], "2026-08-25", ["품명", "현재고"]);
    expect(preview.errorCount).toBe(1);
    expect(preview.rows[0]?.status).toBe("error");
    expect(preview.rows[0]?.error).toContain("권장재고 열이 없습니다.");
  });
});
