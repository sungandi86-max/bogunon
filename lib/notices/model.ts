export const USER_ROLES = ["user", "admin", "owner"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export const NOTICE_CATEGORIES = ["notice", "update", "maintenance", "important"] as const;
export type NoticeCategory = (typeof NOTICE_CATEGORIES)[number];
export const NOTICE_CATEGORY_LABELS: Readonly<Record<NoticeCategory, string>> = { notice: "안내", update: "업데이트", maintenance: "점검", important: "중요" };

export type Notice = {
  readonly id: string; readonly title: string; readonly summary: string | null; readonly content: string;
  readonly category: NoticeCategory; readonly isPublished: boolean; readonly isImportant: boolean;
  readonly publishStartAt: string | null; readonly publishEndAt: string | null;
  readonly createdBy: string; readonly createdAt: string; readonly updatedAt: string; readonly isRead: boolean;
};

export function isAdminRole(role: UserRole): boolean { return role === "admin" || role === "owner"; }
export function roleLabel(role: UserRole): string { return role === "owner" ? "최고 관리자" : role === "admin" ? "관리자" : "사용자"; }
export function visibleNotice(value: Pick<Notice, "isPublished" | "publishStartAt" | "publishEndAt">, now = new Date()): boolean {
  const timestamp = now.getTime();
  return value.isPublished && (!value.publishStartAt || Date.parse(value.publishStartAt) <= timestamp) && (!value.publishEndAt || Date.parse(value.publishEndAt) >= timestamp);
}
export function sortNotices<T extends Pick<Notice, "id" | "isImportant" | "createdAt" | "publishStartAt">>(items: readonly T[]): readonly T[] {
  return [...items].sort((a, b) => Number(b.isImportant) - Number(a.isImportant) || Date.parse(b.publishStartAt ?? b.createdAt) - Date.parse(a.publishStartAt ?? a.createdAt));
}
export function noticeSummary(notice: Pick<Notice, "summary" | "content">): string { const value = notice.summary?.trim() || notice.content.trim(); return value.length > 90 ? `${value.slice(0, 87)}…` : value; }
export function unreadBadge(count: number): string { return count > 9 ? "9+" : String(count); }
