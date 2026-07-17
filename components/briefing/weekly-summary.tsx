import { CalendarCheck, CircleAlert, ListChecks, MessageSquareMore } from "lucide-react";

const summaries = [
  { label: "이번 주 업무", value: "18", detail: "완료 9", icon: ListChecks },
  { label: "오늘 우선", value: "3", detail: "마감 1", icon: CircleAlert },
  { label: "회신 대기", value: "2", detail: "오늘 확인 1", icon: MessageSquareMore },
  { label: "남은 일정", value: "6", detail: "회의 2", icon: CalendarCheck },
] as const;

export function WeeklySummary() {
  return (
    <section className="weekly-summary" aria-labelledby="weekly-summary-title">
      <div className="section-heading">
        <h2 id="weekly-summary-title">주간 요약</h2>
        <span>7월 13일–19일</span>
      </div>
      <div className="weekly-summary__grid">
        {summaries.map(({ label, value, detail, icon: Icon }) => (
          <div className="summary-metric" key={label}>
            <Icon aria-hidden="true" size={17} />
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{detail}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
