import { ChevronLeft, ChevronRight, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";

import { AssistantTrigger } from "@/components/ai/assistant-trigger";
import { AnnualPlanner } from "@/components/annual/annual-planner";
import { PageHeader } from "@/components/layout/page-header";
import { listAnnualPlannerCustomItems } from "@/lib/annual-planner/repository";
import type { AnnualExistingItem } from "@/lib/annual-planner/status";
import { todayInSeoul } from "@/lib/work-items/date";
import { listEvents, listTasks } from "@/lib/work-items/repository";

export default async function AnnualPage({ searchParams }: { readonly searchParams: Promise<{ year?: string }> }) {
  const today = todayInSeoul();
  const currentYear = Number(today.slice(0, 4));
  const currentMonth = Number(today.slice(5, 7));
  const rawYear = Number((await searchParams).year);
  const year = Number.isInteger(rawYear) && rawYear >= 2000 && rawYear <= 2100 ? rawYear : currentYear;
  const [tasks, events, customItems] = await Promise.all([
    listTasks(),
    listEvents(`${year}-01-01`, `${year}-12-31`),
    listAnnualPlannerCustomItems(),
  ]);
  const existingItems: AnnualExistingItem[] = [
    ...tasks.map((task) => ({
      kind: "task" as const,
      title: task.title,
      date: task.scheduled_date ?? task.due_date,
      completed: task.status === "completed",
    })),
    ...events.map((event) => ({
      kind: "event" as const,
      title: event.title,
      date: event.start_date,
      completed: false,
    })),
  ];

  return (
    <main className="page-canvas annual-page">
      <PageHeader action={<div className="page-header__actions"><Link className="button button--secondary" href="/calendar/generator"><Sparkles aria-hidden="true" size={16} />Smart Calendar 만들기</Link><span className="annual-desktop-assistant"><AssistantTrigger label="연간 초안" surface="annual" /></span></div>} description="월별 보건업무 제안을 확인하고 기존 업무나 일정으로 복사합니다." title="연간 플래너" />
      <nav aria-label="연도 이동" className="year-navigation">
        <Link aria-label="이전 연도" href={`/annual?year=${year - 1}`}><ChevronLeft size={17} />{year - 1}</Link>
        <strong>{year}년</strong>
        <Link href={`/annual?year=${currentYear}`}><RotateCcw size={15} />현재 연도</Link>
        <Link aria-label="다음 연도" href={`/annual?year=${year + 1}`}>{year + 1}<ChevronRight size={17} /></Link>
      </nav>
      <AnnualPlanner
        currentMonth={currentMonth}
        currentYear={currentYear}
        customItems={customItems}
        existingItems={existingItems}
        year={year}
      />
    </main>
  );
}
