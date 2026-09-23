"use server";

import { revalidatePath } from "next/cache";

import { staffContactGroupSchema, staffContactSchema } from "@/lib/staff-contacts/domain";
import { copyStaffTerm, deleteStaffContact, deleteStaffGroup, importStaffContacts, saveStaffContact, saveStaffGroup, setStaffFavorite, setStaffGroupMember } from "@/lib/staff-contacts/repository";

export type StaffContactActionState = { readonly status: "idle" | "success" | "error"; readonly message?: string };
function text(formData: FormData, key: string): string { return String(formData.get(key) ?? "").trim(); }
function nullable(formData: FormData, key: string): string | null { return text(formData, key) || null; }
function term(formData: FormData): { schoolYear: number; semester: 1 | 2 } { return { schoolYear: Number(text(formData, "schoolYear")), semester: Number(text(formData, "semester")) as 1 | 2 }; }

function parseContact(formData: FormData) {
  return staffContactSchema.safeParse({ id: text(formData, "id") || undefined, name: text(formData, "name"), mobilePhone: nullable(formData, "mobilePhone"), memo: nullable(formData, "memo"), schoolYear: term(formData).schoolYear, semester: term(formData).semester, department: nullable(formData, "department"), gradeTeam: nullable(formData, "gradeTeam"), subject: nullable(formData, "subject"), role: nullable(formData, "role"), duties: nullable(formData, "duties"), officeLocation: nullable(formData, "officeLocation"), seat: nullable(formData, "seat"), extension: nullable(formData, "extension"), isFavorite: formData.get("isFavorite") === "on", isActive: formData.get("isActive") !== "off", sortOrder: Number(text(formData, "sortOrder") || 0) });
}
function refresh() { revalidatePath("/staff-contacts"); }

export async function saveStaffContactAction(_state: StaffContactActionState, formData: FormData): Promise<StaffContactActionState> {
  const parsed = parseContact(formData);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "연락처 정보를 확인해 주세요." };
  try { await saveStaffContact(parsed.data, term(formData)); refresh(); return { status: "success", message: "연락처를 저장했습니다." }; } catch (error) { return { status: "error", message: error instanceof Error ? error.message : "연락처를 저장하지 못했습니다." }; }
}

export async function deleteStaffContactAction(formData: FormData): Promise<void> { const id = text(formData, "id"); if (id) { await deleteStaffContact(id); refresh(); } }
export async function toggleStaffFavoriteAction(formData: FormData): Promise<void> { const id = text(formData, "assignmentId"); if (id) { await setStaffFavorite(id, formData.get("favorite") === "true"); refresh(); } }

export async function createStaffGroupAction(_state: StaffContactActionState, formData: FormData): Promise<StaffContactActionState> {
  const parsed = staffContactGroupSchema.safeParse({ name: text(formData, "name"), memo: nullable(formData, "memo"), sortOrder: 0, schoolYear: term(formData).schoolYear, semester: term(formData).semester });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "연락망 이름을 확인해 주세요." };
  try { await saveStaffGroup(parsed.data.name, parsed.data.memo, term(formData)); refresh(); return { status: "success", message: "비상연락망을 만들었습니다." }; } catch (error) { return { status: "error", message: error instanceof Error ? error.message : "비상연락망을 만들지 못했습니다." }; }
}
export async function deleteStaffGroupAction(formData: FormData): Promise<void> { const id = text(formData, "id"); if (id) { await deleteStaffGroup(id); refresh(); } }
export async function toggleStaffGroupMemberAction(formData: FormData): Promise<void> { await setStaffGroupMember(text(formData, "groupId"), text(formData, "assignmentId"), formData.get("enabled") === "true"); refresh(); }
export async function copyStaffTermAction(_state: StaffContactActionState, formData: FormData): Promise<StaffContactActionState> {
  try { await copyStaffTerm({ schoolYear: Number(text(formData, "fromYear")), semester: Number(text(formData, "fromSemester")) as 1 | 2 }, { schoolYear: Number(text(formData, "toYear")), semester: Number(text(formData, "toSemester")) as 1 | 2 }); refresh(); return { status: "success", message: "이전 학기 연락처를 복사했습니다." }; } catch (error) { return { status: "error", message: error instanceof Error ? error.message : "이전 학기를 복사하지 못했습니다." }; }
}

export async function importStaffContactsAction(_state: StaffContactActionState, formData: FormData): Promise<StaffContactActionState> {
  try {
    const rows = JSON.parse(text(formData, "rows")) as Array<{ existingContactId: string | null; value: Parameters<typeof saveStaffContact>[0] }>;
    if (!Array.isArray(rows) || rows.length > 500) return { status: "error", message: "가져올 행 수를 확인해 주세요." };
    const imported = await importStaffContacts(rows, term(formData));
    refresh();
    return { status: "success", message: `${imported}건을 ${term(formData).schoolYear}학년도 ${term(formData).semester}학기로 가져왔습니다.` };
  } catch (error) { return { status: "error", message: error instanceof Error ? error.message : "연락처를 가져오지 못했습니다." }; }
}
