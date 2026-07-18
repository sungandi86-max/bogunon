import { CalendarCheck, GitBranch, ListChecks } from "lucide-react";

export function WeeklySummary({ eventsToday, todayTasks, workflows }: { readonly eventsToday: number; readonly todayTasks: number; readonly workflows: number }) {
  const summaries = [
    { label: "오늘 할 일", value: todayTasks, icon: ListChecks },
    { label: "오늘 일정", value: eventsToday, icon: CalendarCheck },
    { label: "진행 중 업무 절차", value: workflows, icon: GitBranch },
  ];
  return <section className="weekly-summary" aria-labelledby="weekly-summary-title"><div className="section-heading"><h2 id="weekly-summary-title">오늘 요약</h2><span>지금 기준</span></div><div className="weekly-summary__grid">{summaries.map(({ label, value, icon: Icon }) => <div className="summary-metric" key={label}><Icon aria-hidden="true" size={17} /><span>{label}</span><strong>{value}</strong><small>{value ? "확인해 주세요" : "등록 없음"}</small></div>)}</div></section>;
}
