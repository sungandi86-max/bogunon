import { createClient } from "@/lib/supabase/server";
import { schoolKey, type StaffContactInput, type StaffContactRecord } from "@/lib/staff-contacts/domain";
import type { Database, StaffAssignmentRow, StaffContactGroupMemberRow, StaffContactGroupRow, StaffContactRow } from "@/types/database";

export type StaffContact = StaffContactRecord;
export type StaffContactGroup = StaffContactGroupRow & { readonly members: readonly (StaffContactGroupMemberRow & { readonly contact: StaffContact | null })[] };
export type StaffContactTerm = { readonly schoolYear: number; readonly semester: 1 | 2 };

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("로그인이 필요합니다.");
  const { data: settings } = await supabase.from("user_settings").select("neis_office_code,neis_school_code,neis_school_name").eq("user_id", user.id).maybeSingle();
  return { supabase, user, schoolKey: schoolKey(settings?.neis_office_code, settings?.neis_school_code, settings?.neis_school_name) };
}

const CONTACT_COLUMNS = "id,user_id,school_key,name,mobile_phone,memo,is_active,created_at,updated_at";
const ASSIGNMENT_COLUMNS = "id,user_id,school_key,staff_id,school_year,semester,department,grade_team,subject,role,duties,office_location,seat,extension,is_favorite,sort_order,is_active,created_at,updated_at";

function mergeContact(contact: StaffContactRow, assignment: StaffAssignmentRow | null): StaffContact {
  return assignment ? { ...contact, assignment_id: assignment.id, school_year: assignment.school_year, semester: assignment.semester, department: assignment.department, grade_team: assignment.grade_team, subject: assignment.subject, role: assignment.role, duties: assignment.duties, office_location: assignment.office_location, seat: assignment.seat, extension: assignment.extension, is_favorite: assignment.is_favorite, sort_order: assignment.sort_order, is_active: assignment.is_active } : { ...contact, assignment_id: null };
}

export async function listStaffContacts(term: StaffContactTerm): Promise<StaffContact[]> {
  const { supabase, user, schoolKey: currentSchoolKey } = await ownedClient();
  const [{ data: contacts, error: contactsError }, { data: assignments, error: assignmentsError }] = await Promise.all([
    supabase.from("staff_contacts").select(CONTACT_COLUMNS).eq("user_id", user.id).eq("school_key", currentSchoolKey).eq("is_active", true).order("name"),
    supabase.from("staff_assignments").select(ASSIGNMENT_COLUMNS).eq("user_id", user.id).eq("school_key", currentSchoolKey).eq("school_year", term.schoolYear).eq("semester", term.semester).eq("is_active", true).order("is_favorite", { ascending: false }).order("sort_order").order("created_at"),
  ]);
  if (contactsError || assignmentsError) throw new Error("교직원 연락처를 불러오지 못했습니다.");
  const byId = new Map((contacts ?? []).map((contact) => [contact.id, contact]));
  return (assignments ?? []).flatMap((assignment) => { const contact = byId.get(assignment.staff_id); return contact ? [mergeContact(contact, assignment)] : []; });
}

export async function listStaffGroups(term: StaffContactTerm): Promise<StaffContactGroup[]> {
  const { supabase, user, schoolKey: currentSchoolKey } = await ownedClient();
  const [{ data: groups, error: groupsError }, { data: members, error: membersError }, contacts] = await Promise.all([
    supabase.from("staff_contact_groups").select("*").eq("user_id", user.id).eq("school_key", currentSchoolKey).eq("school_year", term.schoolYear).eq("semester", term.semester).order("sort_order").order("name"),
    supabase.from("staff_contact_group_members").select("*").eq("user_id", user.id).order("sort_order"),
    listStaffContacts(term),
  ]);
  if (groupsError || membersError) throw new Error("비상연락망을 불러오지 못했습니다.");
  const contactsByAssignmentId = new Map(contacts.map((contact) => [contact.assignment_id, contact]));
  return (groups ?? []).map((group) => ({ ...group, members: (members ?? []).filter((member) => member.group_id === group.id).map((member) => ({ ...member, contact: contactsByAssignmentId.get(member.assignment_id) ?? null })) }));
}

export async function saveStaffContact(input: StaffContactInput, term: StaffContactTerm): Promise<void> {
  const { supabase, user, schoolKey: currentSchoolKey } = await ownedClient();
  const contactValues: Database["public"]["Tables"]["staff_contacts"]["Insert"] = { user_id: user.id, school_key: currentSchoolKey, name: input.name, mobile_phone: input.mobilePhone, memo: input.memo, is_active: input.isActive };
  let contactId = input.id;
  if (contactId) {
    const { error } = await supabase.from("staff_contacts").update({ name: input.name, mobile_phone: input.mobilePhone, memo: input.memo, is_active: input.isActive }).eq("id", contactId).eq("user_id", user.id);
    if (error) throw new Error("교직원 연락처를 수정하지 못했습니다.");
  } else {
    const { data, error } = await supabase.from("staff_contacts").insert(contactValues).select("id").single();
    if (error || !data) throw new Error("교직원 연락처를 저장하지 못했습니다.");
    contactId = data.id;
  }
  const assignment = { user_id: user.id, school_key: currentSchoolKey, staff_id: contactId, school_year: term.schoolYear, semester: term.semester, department: input.department, grade_team: input.gradeTeam, subject: input.subject, role: input.role, duties: input.duties, office_location: input.officeLocation, seat: input.seat, extension: input.extension, is_favorite: input.isFavorite, sort_order: input.sortOrder, is_active: input.isActive } satisfies Database["public"]["Tables"]["staff_assignments"]["Insert"];
  const { error: assignmentError } = await supabase.from("staff_assignments").upsert(assignment, { onConflict: "staff_id,school_year,semester" });
  if (assignmentError) {
    if (!input.id) await supabase.from("staff_contacts").delete().eq("id", contactId).eq("user_id", user.id);
    throw new Error("학기별 배치 정보를 저장하지 못했습니다.");
  }
}

export async function deleteStaffContact(id: string): Promise<void> {
  const { supabase, user } = await ownedClient();
  const { error } = await supabase.from("staff_contacts").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error("교직원 연락처를 삭제하지 못했습니다.");
}

export async function setStaffFavorite(assignmentId: string, favorite: boolean): Promise<void> {
  const { supabase, user } = await ownedClient();
  const { error } = await supabase.from("staff_assignments").update({ is_favorite: favorite }).eq("id", assignmentId).eq("user_id", user.id);
  if (error) throw new Error("즐겨찾기를 저장하지 못했습니다.");
}

export async function saveStaffGroup(name: string, memo: string | null, term: StaffContactTerm): Promise<void> {
  const { supabase, user, schoolKey: currentSchoolKey } = await ownedClient();
  const { error } = await supabase.from("staff_contact_groups").insert({ user_id: user.id, school_key: currentSchoolKey, school_year: term.schoolYear, semester: term.semester, name, memo, sort_order: 0 });
  if (error) throw new Error("비상연락망을 저장하지 못했습니다.");
}

export async function deleteStaffGroup(id: string): Promise<void> {
  const { supabase, user } = await ownedClient();
  const { error } = await supabase.from("staff_contact_groups").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error("비상연락망을 삭제하지 못했습니다.");
}

export async function setStaffGroupMember(groupId: string, assignmentId: string, enabled: boolean): Promise<void> {
  const { supabase, user } = await ownedClient();
  if (enabled) {
    const { error } = await supabase.from("staff_contact_group_members").upsert({ user_id: user.id, group_id: groupId, assignment_id: assignmentId, sort_order: 0, memo: null }, { onConflict: "group_id,assignment_id", ignoreDuplicates: true });
    if (error) throw new Error("비상연락망에 추가하지 못했습니다.");
  } else {
    const { error } = await supabase.from("staff_contact_group_members").delete().eq("user_id", user.id).eq("group_id", groupId).eq("assignment_id", assignmentId);
    if (error) throw new Error("비상연락망에서 제외하지 못했습니다.");
  }
}

export async function copyStaffTerm(from: StaffContactTerm, to: StaffContactTerm): Promise<void> {
  const { supabase, user, schoolKey: currentSchoolKey } = await ownedClient();
  const { data: assignments, error } = await supabase.from("staff_assignments").select(ASSIGNMENT_COLUMNS).eq("user_id", user.id).eq("school_key", currentSchoolKey).eq("school_year", from.schoolYear).eq("semester", from.semester);
  if (error) throw new Error("이전 학기 정보를 불러오지 못했습니다.");
  for (const assignment of assignments ?? []) {
    const { error: insertError } = await supabase.from("staff_assignments").upsert({ user_id: user.id, school_key: currentSchoolKey, staff_id: assignment.staff_id, school_year: to.schoolYear, semester: to.semester, department: assignment.department, grade_team: assignment.grade_team, subject: assignment.subject, role: assignment.role, duties: assignment.duties, office_location: assignment.office_location, seat: assignment.seat, extension: assignment.extension, is_favorite: assignment.is_favorite, sort_order: assignment.sort_order, is_active: assignment.is_active }, { onConflict: "staff_id,school_year,semester" });
    if (insertError) throw new Error("이전 학기 정보를 복사하지 못했습니다.");
  }
}

export async function importStaffContacts(rows: readonly { readonly existingContactId: string | null; readonly value: StaffContactInput }[], term: StaffContactTerm): Promise<number> {
  let imported = 0;
  for (const row of rows) {
    await saveStaffContact({ ...row.value, ...(row.existingContactId ? { id: row.existingContactId } : {}) }, term);
    imported += 1;
  }
  return imported;
}
