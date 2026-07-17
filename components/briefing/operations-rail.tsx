"use client";

import { CalendarPlus, CheckSquare2, Dumbbell, FolderKanban, MessageSquareMore, Plus } from "lucide-react";

import { useAppShellCreate } from "@/components/layout/app-shell-create-context";
import { Badge } from "@/components/ui/badge";

const priorityTasks = [
  ["의약품 재고 확인", "보건업무", "health"],
  ["교육 결과 보고 초안", "제출·마감", "deadline"],
] as const;

export function OperationsRail() {
  const { openCreate } = useAppShellCreate();

  return (
    <aside className="operations-rail" aria-label="오늘의 운영 항목">
      <section className="quick-add" aria-labelledby="quick-add-title">
        <div className="rail-heading"><h2 id="quick-add-title">빠른 추가</h2><Plus aria-hidden="true" size={17} /></div>
        <div className="quick-add__actions">
          <button onClick={(event) => openCreate(event.currentTarget)} type="button"><CheckSquare2 aria-hidden="true" size={17} />업무</button>
          <button onClick={(event) => openCreate(event.currentTarget)} type="button"><CalendarPlus aria-hidden="true" size={17} />일정</button>
          <button onClick={(event) => openCreate(event.currentTarget)} type="button"><Dumbbell aria-hidden="true" size={17} />운동</button>
          <button onClick={(event) => openCreate(event.currentTarget)} type="button"><FolderKanban aria-hidden="true" size={17} />프로젝트</button>
        </div>
      </section>

      <section className="rail-module" aria-labelledby="today-work-title">
        <div className="rail-heading"><h2 id="today-work-title">오늘의 업무</h2><strong>2/3</strong></div>
        {priorityTasks.map(([title, area, tone]) => (
          <label className="rail-task" key={title}>
            <input type="checkbox" aria-label={`${title} 완료`} />
            <span><strong>{title}</strong><Badge tone={tone}>{area}</Badge></span>
          </label>
        ))}
      </section>

      <section className="rail-module" aria-labelledby="reply-title">
        <div className="rail-heading"><h2 id="reply-title">회신 대기</h2><MessageSquareMore aria-hidden="true" size={17} /></div>
        <div className="rail-row"><div><strong>외부 기관 회신</strong><small>오늘 다시 확인</small></div><Badge tone="waiting">대기</Badge></div>
        <div className="rail-row"><div><strong>교직원 제출 현황</strong><small>내일 오전 확인</small></div><Badge tone="check">확인</Badge></div>
      </section>

      <section className="rail-module" aria-labelledby="schedule-title">
        <div className="rail-heading"><h2 id="schedule-title">회의·일정</h2><span>오늘 2</span></div>
        <div className="rail-row rail-row--time"><time>15:00</time><div><strong>교직원 회의</strong><small>회의실</small></div></div>
        <div className="rail-row rail-row--time"><time>19:00</time><div><strong>배드민턴 레슨</strong><small>60분</small></div></div>
      </section>

      <section className="rail-module rail-module--split" aria-label="운동과 프로젝트 다음 행동">
        <div><span className="rail-kicker">운동</span><strong>배드민턴 레슨</strong><small>오늘 19:00 · 60분</small></div>
        <div><span className="rail-kicker">프로젝트 다음 행동</span><strong>자료 목차 확정</strong><small>교내 건강주간 준비</small></div>
      </section>
    </aside>
  );
}
