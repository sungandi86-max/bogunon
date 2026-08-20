import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import Link from "next/link";

import { PracticalScheduleWorkspace } from "@/components/practical-schedules/practical-schedule-workspace";
import { PageHeader } from "@/components/layout/page-header";
import { listLinkableEvents, listLinkedPracticalScheduleIds, listPracticalSchedules } from "@/lib/practical-schedules/repository";
import { todayInSeoul } from "@/lib/work-items/date";

export default async function PracticalSchedulesPage({ searchParams }: { readonly searchParams: Promise<{ year?: string; new?: string; title?: string; month?: string }> }) {
  const params = await searchParams;
  const currentYear = Number(todayInSeoul().slice(0, 4));
  const parsedYear = Number(params.year);
  const year = Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100 ? parsedYear : currentYear;
  const [items, linkableEvents, linkedScheduleIds] = await Promise.all([listPracticalSchedules(year), listLinkableEvents(year), listLinkedPracticalScheduleIds()]);
  const newTitle = params.new === "1" && params.title ? params.title : undefined;
  return <main className="page-canvas practical-schedules-page">
    <PageHeader description="연간 보건업무를 실제 날짜·장소·진행방법과 함께 관리합니다." title="실무 일정" />
    <nav aria-label="실무 일정 연도 이동" className="year-navigation"><Link aria-label="이전 연도" href={`/practical-schedules?year=${year - 1}`}><ChevronLeft size={17} />{year - 1}</Link><strong>{year}년</strong><Link href={`/practical-schedules?year=${currentYear}`}><RotateCcw size={15} />현재 연도</Link><Link aria-label="다음 연도" href={`/practical-schedules?year=${year + 1}`}>{year + 1}<ChevronRight size={17} /></Link></nav>
    <PracticalScheduleWorkspace items={items} linkableEvents={linkableEvents} linkedScheduleIds={linkedScheduleIds} newMonth={params.month} newOpen={params.new === "1"} newTitle={newTitle} year={year} />
  </main>;
}
