import { AlertTriangle, CircleCheck, Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";

const tasks = [
  { title: "보건실 의약품 재고 확인", area: "보건업무", areaTone: "health", status: "진행 중", statusTone: "check", due: "오늘 마감" },
  { title: "교직원 제출 현황 확인", area: "학교일정", areaTone: "school", status: "회신 대기", statusTone: "waiting", due: "오후 2시 확인" },
  { title: "안전교육 결과 보고 초안", area: "보건업무", areaTone: "health", status: "예정", statusTone: "neutral", due: "내일 마감" },
] as const;

export function DailyFocusSection() {
  return (
    <section className="section-block" aria-labelledby="daily-focus-title">
      <div className="section-heading">
        <h2 id="daily-focus-title">오늘 꼭 끝낼 일 <span aria-label="3개 중 3개 지정">3/3</span></h2>
        <button type="button">전체 업무에서 선택</button>
      </div>
      <div className="focus-card">
        {tasks.map((task, index) => (
          <label className="task-row" key={task.title}>
            <input className="task-checkbox" type="checkbox" aria-label={`${task.title} 완료`} />
            <span className="task-row__content">
              <span className="task-row__title">{task.title}</span>
              <span className="task-row__meta">
                {index === 0 ? <AlertTriangle aria-hidden="true" size={12} /> : index === 1 ? <Clock3 aria-hidden="true" size={12} /> : <CircleCheck aria-hidden="true" size={12} />}
                {task.due}
              </span>
            </span>
            <span className="task-row__badges">
              <Badge tone={task.areaTone}>{task.area}</Badge>
              <Badge tone={task.statusTone}>{task.status}</Badge>
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
