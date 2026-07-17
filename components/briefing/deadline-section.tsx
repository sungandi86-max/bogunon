import { Badge } from "@/components/ui/badge";

export function DeadlineSection() {
  return (
    <section className="section-block" aria-labelledby="deadline-title">
      <div className="section-heading">
        <h2 id="deadline-title">마감 임박</h2>
        <button type="button">전체 보기</button>
      </div>
      <div className="split-list">
        <div className="waiting-row">
          <div><strong>감염병 예방교육 결과 제출</strong><small>내일 오후 5시 마감</small></div>
          <div className="waiting-row__meta"><Badge tone="deadline">D-1</Badge><Badge tone="health">보건업무</Badge></div>
        </div>
      </div>
    </section>
  );
}
