import { Dumbbell } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function TodayExerciseSection() {
  return (
    <section className="section-block" aria-labelledby="exercise-title">
      <div className="section-heading">
        <h2 id="exercise-title">오늘 운동</h2>
        <button type="button">운동 보기</button>
      </div>
      <div className="split-list">
        <div className="waiting-row">
          <div><strong><Dumbbell aria-hidden="true" size={15} /> 배드민턴 레슨</strong><small>오후 7시 · 60분</small></div>
          <div className="waiting-row__meta"><Badge tone="exercise">예정</Badge></div>
        </div>
      </div>
    </section>
  );
}
