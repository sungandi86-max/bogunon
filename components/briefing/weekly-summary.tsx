import { CalendarCheck, CircleAlert, ListChecks, MessageSquareMore } from "lucide-react";

export function WeeklySummary({ dueToday, eventsToday, priorityToday, waiting }: { readonly dueToday: number; readonly eventsToday: number; readonly priorityToday: number; readonly waiting: number }) {
  const summaries = [
    { label: "오늘 마감 업무", value: dueToday, icon: ListChecks },
    { label: "오늘 우선 업무", value: priorityToday, icon: CircleAlert },
    { label: "회신 대기", value: waiting, icon: MessageSquareMore },
    { label: "오늘 일정", value: eventsToday, icon: CalendarCheck },
  ];
  return <section className="weekly-summary" aria-labelledby="weekly-summary-title"><div className="section-heading"><h2 id="weekly-summary-title">오늘 요약</h2><span>실시간 데이터</span></div><div className="weekly-summary__grid">{summaries.map(({ label, value, icon: Icon }) => <div className="summary-metric" key={label}><Icon aria-hidden="true" size={17} /><span>{label}</span><strong>{value}</strong><small>{value ? "확인 필요" : "등록 없음"}</small></div>)}</div></section>;
}
