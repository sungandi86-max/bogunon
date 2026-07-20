export const ACADEMIC_IMPORT_STATUS = ["ready", "needsReview", "dateError", "missingTitle", "duplicate", "excluded"] as const;

export type AcademicImportStatus = (typeof ACADEMIC_IMPORT_STATUS)[number];
export type AcademicCell = string | number | Date | null;

export type AcademicImportItem = {
  readonly id: string;
  readonly sourceRow: number;
  readonly rawDate: string;
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly status: AcademicImportStatus;
  readonly selected: boolean;
};

export type AcademicDateOptions = {
  readonly academicYear: number;
  readonly academicYearMode: boolean;
};

export type AcademicColumnMapping = {
  readonly headerRow: number;
  readonly dateColumn?: number;
  readonly startDateColumn?: number;
  readonly endDateColumn?: number;
  readonly monthColumn?: number;
  readonly dayColumn?: number;
  readonly titleColumn?: number;
};

export type AcademicSheet = {
  readonly name: string;
  readonly rows: readonly (readonly AcademicCell[])[];
  readonly likely: boolean;
};

export type AcademicWorkbook = {
  readonly fileName: string;
  readonly sheets: readonly AcademicSheet[];
};
