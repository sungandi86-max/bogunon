import { Badge } from "@/components/ui/badge";

const timeline = [
  ["종일", "교직원 제출 현황 확인", "학교일정", "school"],
  ["10:30", "보건교육 자료 점검", "보건업무", "health"],
  ["15:00", "교직원 회의", "학교일정", "school"],
  ["19:00", "배드민턴 레슨", "운동", "exercise"],
] as const;

export function TodayTimeline() {
  return (
    <section className="section-block" aria-labelledby="timeline-title">
      <div className="section-heading"><h2 id="timeline-title">오늘 시간순 일정</h2><button type="button">전체 보기</button></div>
      <ol className="timeline">
        {timeline.map(([time, title, area, tone]) => (
          <li key={`${time}-${title}`}>
            <time>{time}</time>
            <div><strong>{title}</strong><small><Badge tone={tone}>{area}</Badge></small></div>
          </li>
        ))}
      </ol>
    </section>
  );
}
