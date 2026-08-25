import type { MedicationCategory, MedicationItem, MedicationLot } from "@/lib/medications/domain";

export const medicationImportStatusLabels = {
  newItem: "신규 품목",
  existingItem: "기존 품목에 lot 추가",
  duplicate: "중복 확인 필요",
  error: "입력 오류",
} as const;

export type MedicationImportStatus = keyof typeof medicationImportStatusLabels;

export type MedicationImportRow = {
  readonly category: MedicationCategory;
  readonly name: string;
  readonly specification: string;
  readonly unit: string;
  readonly recommendedStock: number;
  readonly quantity: number;
  readonly expirationDate: string;
  readonly note: string | null;
  readonly managementTip: string | null;
  readonly receivedAt: string;
};

export type MedicationImportPreviewRow = MedicationImportRow & {
  readonly rowNumber: number;
  readonly originalName: string;
  readonly itemRecommendedStock: number;
  readonly status: MedicationImportStatus;
  readonly error?: string;
};

export type MedicationImportPreview = {
  readonly rows: readonly MedicationImportPreviewRow[];
  readonly missingHeaders: readonly string[];
  readonly headers: readonly string[];
  readonly newItemCount: number;
  readonly newLotCount: number;
  readonly existingItemCount: number;
  readonly duplicateCount: number;
  readonly errorCount: number;
};

export type MedicationImportRawRow = Readonly<Record<string, unknown>>;

export type MedicationWorksheetParseResult = {
  readonly headerRowNumber: number | null;
  readonly headers: readonly string[];
  readonly rows: readonly MedicationImportRawRow[];
  readonly dataRowCount: number;
};

const headerAliases = {
  category: ["분류", "구분", "category"],
  name: ["품명", "약품명", "name"],
  specification: ["규격/단위", "규격", "specification", "unit"],
  quantity: ["현재고", "재고", "수량", "quantity"],
  recommendedStock: ["권장재고", "권장수량", "권장 재고", "recommendedstock"],
  expirationDate: ["유통기한", "사용기한", "expirationdate"],
  note: ["비고", "note"],
  managementTip: ["관리tip", "관리팁", "관리 tip", "managementtip"],
} as const;

const requiredHeaders = ["name", "quantity", "recommendedStock", "expirationDate"] as const;

function canonical(value: string): string {
  return value.toLocaleLowerCase("ko-KR").replace(/[\s_\-]/g, "");
}

function findHeader(headers: readonly string[], key: keyof typeof headerAliases): string | undefined {
  const aliases = headerAliases[key].map(canonical);
  return headers.find((header) => aliases.includes(canonical(header)));
}

function text(value: unknown): string {
  return String(value ?? "").trim();
}

type NonnegativeIntegerResult =
  | { readonly ok: true; readonly value: number }
  | { readonly ok: false; readonly reason: "empty" | "invalid" | "negative" };

function parseNonnegativeInteger(value: unknown): NonnegativeIntegerResult {
  const normalized = text(value).replace(/,/g, "");
  if (!normalized) return { ok: false, reason: "empty" };
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return { ok: false, reason: "invalid" };
  if (parsed < 0) return { ok: false, reason: "negative" };
  return { ok: true, value: parsed };
}

function stockValidationError(label: string, result: NonnegativeIntegerResult): string | null {
  if (result.ok) return null;
  if (result.reason === "empty") return `${label} 값을 입력해 주세요.`;
  return `${label}는 0 이상의 정수여야 합니다.`;
}

function dateValue(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(Date.UTC(1899, 11, 30) + value * 86_400_000);
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
  }
  const raw = text(value).replace(/[./]/g, "-");
  const match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  const month = (match[2] ?? "").padStart(2, "0");
  const day = (match[3] ?? "").padStart(2, "0");
  const result = `${match[1]}-${month}-${day}`;
  const parsed = new Date(`${result}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : result;
}

function categoryValue(value: unknown): MedicationCategory {
  const valueText = text(value);
  if (/내복/.test(valueText)) return "internal";
  if (/외용/.test(valueText)) return "external";
  if (/소독|처치|소모품|의료/.test(valueText)) return "supplies";
  return "other";
}

function splitSpecificationUnit(value: unknown): { specification: string; unit: string } {
  const raw = text(value);
  const parts = raw.split("/").map((part) => part.trim()).filter(Boolean);
  if (parts.length > 1) return { specification: parts[0] ?? "", unit: parts.slice(1).join("/") };
  return { specification: raw, unit: "" };
}

function normalizeName(value: string): string {
  return value.replace(/[\s]*[(（]\d+[)）]\s*$/, "").trim();
}

function identityKey(row: Pick<MedicationImportRow, "name" | "specification" | "unit">): string {
  return [row.name, row.specification, row.unit].map(canonical).join("|");
}

function hasDuplicate(row: MedicationImportRow, existingItems: readonly MedicationItem[], existingLots: readonly MedicationLot[], itemId: string | undefined): boolean {
  if (!itemId) return false;
  return existingLots.some((lot) => lot.itemId === itemId && lot.expirationDate === row.expirationDate && lot.quantity === row.quantity && lot.unitPrice === 0);
}

export function parseMedicationWorksheet(matrix: readonly (readonly unknown[])[]): MedicationWorksheetParseResult {
  const requiredAliases = requiredHeaders.map((key) => headerAliases[key]);
  const scanLimit = Math.min(matrix.length, 30);
  for (let rowIndex = 0; rowIndex < scanLimit; rowIndex += 1) {
    const sourceRow = matrix[rowIndex] ?? [];
    const headers = sourceRow.map(text);
    const fieldIndexes = requiredAliases.map((aliases) => headers.findIndex((header) => aliases.map(canonical).includes(canonical(header))));
    if (fieldIndexes.some((index) => index < 0)) continue;
    const rows = matrix.slice(rowIndex + 1).filter((row) => !fieldIndexes.every((index) => !text(row[index]))).map((row) => Object.fromEntries(headers.flatMap((header, index) => header ? [[header, row[index] ?? ""]] : [])));
    return { headerRowNumber: rowIndex + 1, headers, rows, dataRowCount: rows.length };
  }
  return { headerRowNumber: null, headers: [], rows: [], dataRowCount: 0 };
}

export function buildMedicationImportPreview(rawRows: readonly MedicationImportRawRow[], existingItems: readonly MedicationItem[], existingLots: readonly MedicationLot[], receivedAt: string, headers: readonly string[], firstDataRowNumber = 2): MedicationImportPreview {
  const fields = Object.fromEntries((Object.keys(headerAliases) as Array<keyof typeof headerAliases>).map((key) => [key, findHeader(headers, key)])) as Record<keyof typeof headerAliases, string | undefined>;
  const missingHeaders = requiredHeaders.filter((key) => !fields[key]).map((key) => headerAliases[key][0]);
  const existingByKey = new Map(existingItems.map((item) => [identityKey(item), item]));
  const seen = new Set<string>();
  const positiveRecommendationKeys = new Set<string>();
  for (const raw of rawRows) {
    const originalName = text(fields.name ? raw[fields.name] : "");
    const name = normalizeName(originalName);
    const { specification, unit } = splitSpecificationUnit(fields.specification ? raw[fields.specification] : "");
    const recommendation = parseNonnegativeInteger(fields.recommendedStock ? raw[fields.recommendedStock] : "");
    if (name && recommendation.ok && recommendation.value > 0) {
      positiveRecommendationKeys.add(identityKey({ name, specification, unit }));
    }
  }
  const parsedRows = rawRows.map((raw, index): MedicationImportPreviewRow => {
    const originalName = text(fields.name ? raw[fields.name] : "");
    const name = normalizeName(originalName);
    const { specification, unit } = splitSpecificationUnit(fields.specification ? raw[fields.specification] : "");
    const quantityResult = parseNonnegativeInteger(fields.quantity ? raw[fields.quantity] : "");
    const rawRecommendedStock = fields.recommendedStock ? raw[fields.recommendedStock] : "";
    const identity = identityKey({ name, specification, unit });
    // Some inventory sheets leave the recommendation blank on subsequent lots.
    // When another lot of the same item has a positive recommendation, that blank
    // is the sheet's implicit zero and is normalized before the shared validator.
    const recommendedSource = text(rawRecommendedStock) === "" && positiveRecommendationKeys.has(identity) ? 0 : rawRecommendedStock;
    const recommendedResult = parseNonnegativeInteger(recommendedSource);
    const quantity = quantityResult.ok ? quantityResult.value : null;
    const recommendedStock = recommendedResult.ok ? recommendedResult.value : null;
    const expirationDate = dateValue(fields.expirationDate ? raw[fields.expirationDate] : "");
    const row = { category: categoryValue(fields.category ? raw[fields.category] : ""), name, specification, unit, recommendedStock: recommendedStock ?? 0, quantity: quantity ?? 0, expirationDate: expirationDate ?? "", note: fields.note ? text(raw[fields.note]) || null : null, managementTip: fields.managementTip ? text(raw[fields.managementTip]) || null : null, receivedAt };
    const errors = [...missingHeaders.map((header) => `${header} 열이 없습니다.`)];
    if (!name) errors.push("품명을 입력해 주세요.");
    const quantityError = stockValidationError("현재고", quantityResult);
    if (quantityError) errors.push(quantityError);
    const recommendedError = stockValidationError("권장재고", recommendedResult);
    if (recommendedError) errors.push(recommendedError);
    if (!expirationDate) errors.push("유통기한을 YYYY-MM-DD 형식으로 입력해 주세요.");
    const item = existingByKey.get(identityKey(row));
    const duplicateKey = `${identityKey(row)}|${row.expirationDate}|${row.quantity}`;
    const duplicate = hasDuplicate(row, existingItems, existingLots, item?.id) || seen.has(duplicateKey);
    if (errors.length) return { ...row, rowNumber: firstDataRowNumber + index, originalName, itemRecommendedStock: row.recommendedStock, status: "error", error: errors.join(" ") };
    seen.add(duplicateKey);
    return { ...row, rowNumber: firstDataRowNumber + index, originalName, itemRecommendedStock: row.recommendedStock, status: duplicate ? "duplicate" : item ? "existingItem" : "newItem", ...(duplicate ? { error: "동일 품목·유통기한·수량의 lot가 이미 있거나 파일 안에 중복됩니다." } : {}) };
  });
  const positiveRecommendations = new Map<string, Set<number>>();
  for (const row of parsedRows) {
    if (row.status === "error" || row.recommendedStock <= 0) continue;
    const key = identityKey(row);
    const values = positiveRecommendations.get(key) ?? new Set<number>();
    values.add(row.recommendedStock);
    positiveRecommendations.set(key, values);
  }
  const normalizedRows = parsedRows.map((row) => {
    if (row.status === "error") return row;
    const key = identityKey(row);
    const recommendations = positiveRecommendations.get(key);
    const itemRecommendedStock = recommendations ? Math.max(...recommendations) : 0;
    const conflictingRecommendations = recommendations !== undefined && recommendations.size > 1;
    if (!conflictingRecommendations) return { ...row, itemRecommendedStock };
    return { ...row, itemRecommendedStock, status: "duplicate" as const, error: row.error ? `${row.error} 동일 품목의 양수 권장재고가 여러 값입니다.` : "동일 품목의 양수 권장재고가 여러 값입니다. 확인해 주세요." };
  });
  const validRows = normalizedRows.filter((row) => row.status !== "error");
  const newKeys = new Set(validRows.filter((row) => row.status === "newItem").map(identityKey));
  return { rows: normalizedRows, missingHeaders, headers, newItemCount: newKeys.size, newLotCount: validRows.length, existingItemCount: validRows.filter((row) => row.status === "existingItem").length, duplicateCount: normalizedRows.filter((row) => row.status === "duplicate").length, errorCount: normalizedRows.filter((row) => row.status === "error").length };
}
