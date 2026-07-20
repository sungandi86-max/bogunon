export type NeisSchool = {
  readonly officeCode: string;
  readonly schoolCode: string;
  readonly name: string;
  readonly type: string;
  readonly region: string;
  readonly officeName: string;
  readonly address: string;
};

export type NeisSchedule = {
  readonly id: string;
  readonly date: string;
  readonly title: string;
  readonly content: string;
  readonly grades: readonly string[];
};

export type NeisPreviewItem = NeisSchedule & {
  readonly status: "ready" | "duplicate";
  readonly selected: boolean;
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
