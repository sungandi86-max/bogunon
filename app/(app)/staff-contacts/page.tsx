import { PageHeader } from "@/components/layout/page-header";
import { StaffContactsManager } from "@/components/staff-contacts/staff-contacts-manager";
import { currentTerm } from "@/lib/staff-contacts/domain";
import { listStaffContacts, listStaffGroups } from "@/lib/staff-contacts/repository";

function parseYear(value: string | undefined, fallback: number): number { const parsed = Number(value); return Number.isInteger(parsed) && parsed >= 2000 && parsed <= 2100 ? parsed : fallback; }
function parseSemester(value: string | undefined, fallback: 1 | 2): 1 | 2 { return value === "1" || value === "2" ? Number(value) as 1 | 2 : fallback; }

export default async function StaffContactsPage({ searchParams }: { readonly searchParams: Promise<{ schoolYear?: string; semester?: string }> }) {
  const fallback = currentTerm();
  const params = await searchParams;
  const schoolYear = parseYear(params.schoolYear, fallback.schoolYear);
  const semester = parseSemester(params.semester, fallback.semester);
  const [contacts, groups] = await Promise.all([listStaffContacts({ schoolYear, semester }), listStaffGroups({ schoolYear, semester })]);
  return <main className="page-canvas staff-contacts-page"><PageHeader description="학교 업무 연락처와 학기별 비상연락망을 한 곳에서 찾습니다." title="교직원 연락처" /><StaffContactsManager contacts={contacts} groups={groups} schoolYear={schoolYear} semester={semester} /></main>;
}
