import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { TaskCategoryBadge } from "@/components/tasks/task-category-badge";
import { todayInSeoul } from "@/lib/work-items/date";
import { listEvents, listTasks } from "@/lib/work-items/repository";
import { groupAnnualItems } from "@/lib/work-items/workflow";

export default async function AnnualPage({ searchParams }: { readonly searchParams: Promise<{ year?: string }> }) {
  const currentYear = Number(todayInSeoul().slice(0, 4));
  const rawYear = Number((await searchParams).year);
  const year = Number.isInteger(rawYear) && rawYear >= 2000 && rawYear <= 2100 ? rawYear : currentYear;
  const [tasks, events] = await Promise.all([listTasks(), listEvents(`${year}-01-01`, `${year}-12-31`)]);
  const months = groupAnnualItems(tasks, events, year);
  const currentMonth = Number(todayInSeoul().slice(5, 7));
  return <main className="page-canvas annual-page"><PageHeader description="마감, 반복 업무와 일정을 1월부터 12월까지 한눈에 확인합니다." title="연간 업무" />
    <nav aria-label="연도 이동" className="year-navigation"><Link aria-label="이전 연도" href={`/annual?year=${year - 1}`}><ChevronLeft size={17} />{year - 1}</Link><strong>{year}년</strong><Link href={`/annual?year=${currentYear}`}><RotateCcw size={15} />현재 연도</Link><Link aria-label="다음 연도" href={`/annual?year=${year + 1}`}>{year + 1}<ChevronRight size={17} /></Link></nav>
    <section aria-label={`${year}년 월별 업무`} className="annual-grid">{months.map((month) => <details className="annual-month" key={month.month} open={year === currentYear && month.month === currentMonth}><summary><span><strong>{month.month}월</strong><small>{month.items.length}건</small></span></summary><div className="annual-month__items">{month.items.length ? month.items.map(({ kind, item, date }) => <article className={`annual-item annual-item--${kind}`} key={`${kind}-${item.id}`}><time>{Number(date.slice(8, 10))}일</time><div><strong>{item.title}</strong><span>{kind === "task" && "category" in item ? <TaskCategoryBadge category={item.category} /> : "일정"}{kind === "task" && "recurrence_frequency" in item && item.recurrence_frequency && <small>반복</small>}{kind === "task" && "status" in item && item.status === "completed" && <small>완료</small>}</span></div></article>) : <p>등록된 업무가 없습니다.</p>}</div></details>)}</section>
  </main>;
}
