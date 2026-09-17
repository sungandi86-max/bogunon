export const REPORT_TYPES = ["bug", "question", "feature", "other"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];
export const REPORT_TYPE_LABELS: Readonly<Record<ReportType, string>> = { bug: "오류/버그", question: "사용 방법 문의", feature: "기능 제안", other: "기타" };

export const REPORT_STATUSES = ["received", "reviewing", "resolved", "closed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export const REPORT_STATUS_LABELS: Readonly<Record<ReportStatus, string>> = { received: "접수됨", reviewing: "확인 중", resolved: "해결됨", closed: "종료" };

export type UserReport = {
  readonly id: string; readonly userId: string; readonly reportType: ReportType; readonly title: string; readonly description: string;
  readonly attemptedAction: string | null; readonly observedResult: string | null; readonly reproducible: "yes" | "no" | "unknown" | null;
  readonly pagePath: string; readonly appVersion: string | null; readonly userAgent: string | null;
  readonly viewportWidth: number | null; readonly viewportHeight: number | null; readonly status: ReportStatus; readonly adminNote: string | null;
  readonly createdAt: string; readonly updatedAt: string;
};

export function sanitizePathname(value: string): string {
  const path = value.trim().split(/[?#]/u, 1)[0] ?? "/";
  return path.startsWith("/") && path.length <= 200 ? path : "/";
}

export function isReportType(value: string): value is ReportType { return (REPORT_TYPES as readonly string[]).includes(value); }
export function isReportStatus(value: string): value is ReportStatus { return (REPORT_STATUSES as readonly string[]).includes(value); }
