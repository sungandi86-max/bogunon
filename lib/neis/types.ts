export type NeisSchool = {
  readonly officeCode: string;
  readonly schoolCode: string;
  readonly name: string;
  readonly type: string;
  readonly region: string;
  readonly officeName: string;
  readonly address: string;
};

export type NeisDefaultSchool = Pick<
  NeisSchool,
  "officeCode" | "schoolCode" | "name" | "officeName"
>;

export type UserSchoolSettings = NeisDefaultSchool & {
  readonly schoolLevel: string | null;
  readonly region: string | null;
  readonly address: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly mealEnabled: boolean;
  readonly weatherEnabled: boolean;
};

export type NeisSchedule = {
  readonly id: string;
  readonly date: string;
  readonly title: string;
  readonly content: string;
  readonly grades: readonly string[];
};

export type NeisPreviewItem = NeisSchedule & {
  readonly status: "ready" | "duplicate" | "changed";
  readonly selected: boolean;
};

export type NeisScheduleCategory = "schoolEvent" | "exam" | "holiday" | "vacation";

export type NeisPreviewCategoryFilter = "all" | NeisScheduleCategory;

export type NeisPreviewFilters = {
  readonly includeSaturdayClosures: boolean;
  readonly includeHolidays: boolean;
  readonly includeVacations: boolean;
  readonly category: NeisPreviewCategoryFilter;
  readonly query: string;
};

export type NeisSchoolSearchInput = {
  readonly query: string;
  readonly officeCode?: string;
};

export type NeisScheduleInput = {
  readonly officeCode: string;
  readonly schoolCode: string;
  readonly schoolName: string;
  readonly fromDate: string;
  readonly toDate: string;
};
