import { Badge } from "@/components/ui/badge";

const work = [
  { title: "외부 기관 회신 대기", detail: "후속 확인일 오늘", status: "회신 대기", tone: "waiting" },
  { title: "2학년 관련 담임 확인", detail: "후속 확인일 7월 18일", status: "확인 필요", tone: "check" },
] as const;

export function WaitingWorkSection() {
  return (
    <section className="section-block" aria-labelledby="waiting-title">
      <div className="section-heading">
        <h2 id="waiting-title">회신 대기·확인 필요</h2>
        <button type="button">전체 보기</button>
      </div>
      <div className="split-list">
        {work.map((item) => (
          <div className="waiting-row" key={item.title}>
            <div><strong>{item.title}</strong><small>{item.detail}</small></div>
            <div className="waiting-row__meta"><Badge tone={item.tone}>{item.status}</Badge><Badge tone="health">보건업무</Badge></div>
          </div>
        ))}
      </div>
    </section>
  );
}
