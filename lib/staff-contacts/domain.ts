import { z } from "zod";

import type { StaffContactRow, StaffAssignmentRow } from "@/types/database";

export const CONTACT_GROUP_DEFAULTS = ["응급환자", "학교폭력", "감염병", "시설 사고"] as const;
export const staffContactSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "이름 또는 장소명을 입력해 주세요.").max(120),
  mobilePhone: z.string().trim().max(40).nullable(),
  memo: z.string().trim().max(1000).nullable(),
  schoolYear: z.number().int().min(2000).max(2100),
  semester: z.union([z.literal(1), z.literal(2)]),
  department: z.string().trim().max(120).nullable(),
  gradeTeam: z.string().trim().max(120).nullable(),
  subject: z.string().trim().max(120).nullable(),
  role: z.string().trim().max(120).nullable(),
  duties: z.string().trim().max(500).nullable(),
  officeLocation: z.string().trim().max(180).nullable(),
  seat: z.string().trim().max(120).nullable(),
  extension: z.string().trim().max(30).nullable(),
  isFavorite: z.boolean(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0),
});
export type StaffContactInput = z.infer<typeof staffContactSchema>;

export const staffContactGroupSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "연락망 이름을 입력해 주세요.").max(120),
  memo: z.string().trim().max(500).nullable(),
  sortOrder: z.number().int().min(0),
});
export type StaffContactGroupInput = z.infer<typeof staffContactGroupSchema>;

export function nullableText(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  return normalized || null;
}

export function searchText(contact: StaffContactRow & Partial<Pick<StaffAssignmentRow, "department" | "grade_team" | "subject" | "role" | "duties" | "office_location" | "extension">>): string {
  return [contact.name, contact.department, contact.grade_team, contact.subject, contact.role, contact.duties, contact.office_location, contact.extension, contact.mobile_phone, contact.memo].filter(Boolean).join(" ").toLocaleLowerCase("ko-KR");
}

export function phoneHref(phone: string | null): string | null {
  if (!phone) return null;
  const normalized = phone.replace(/[^\d+]/g, "");
  return normalized.length >= 7 ? `tel:${normalized}` : null;
}

export function schoolKey(officeCode: string | null | undefined, schoolCode: string | null | undefined, schoolName: string | null | undefined): string {
  const code = [officeCode, schoolCode].filter(Boolean).join(":");
  return code || schoolName?.trim() || "default-school";
}

export type StaffContactRecord = StaffContactRow & Partial<Pick<StaffAssignmentRow, "id" | "school_year" | "semester" | "department" | "grade_team" | "subject" | "role" | "duties" | "office_location" | "seat" | "extension" | "is_favorite" | "sort_order" | "is_active">> & { assignment_id: string | null };

export function currentTerm(today = new Date()): { schoolYear: number; semester: 1 | 2 } {
  const month = today.getMonth() + 1;
  return { schoolYear: today.getFullYear(), semester: month <= 7 ? 1 : 2 };
}
