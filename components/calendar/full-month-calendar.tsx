import { Flag, Dumbbell } from "lucide-react";

const weekdays = ["월", "화", "수", "목", "금", "토", "일"];
const cells = Array.from({ length: 35 }, (_, index) => index - 1);
const weeks = Array.from({ length: 5 }, (_, index) => cells.slice(index * 7, index * 7 + 7));

function CalendarCell({ day }: { readonly day: number }) {
  const displayDay = day < 1 ? day + 30 : day > 31 ? day - 31 : day;
  const month = day < 1 ? "06" : day > 31 ? "08" : "07";
  const hasHealth = [3, 9, 17, 23].includes(day);
  const hasExercise = [7, 17, 28].includes(day);
  const hasDeadline = [11, 22].includes(day);
  const hasProject = [14, 25].includes(day);
  const hasPersonal = [5, 26].includes(day);
  const hasItem = hasHealth || hasExercise || hasDeadline || hasProject || hasPersonal;
  const labels = [
    hasHealth && "보건업무",
    hasExercise && "운동",
    hasDeadline && "제출·마감",
    hasProject && "프로젝트",
    hasPersonal && "개인일정",
  ].filter(Boolean);
  return (
    <div
      aria-label={`2026년 ${Number(month)}월 ${displayDay}일${labels.length ? `, ${labels.join(", ")} 있음` : ", 등록 항목 없음"}`}
      className={`full-calendar__cell${hasItem ? " has-item" : ""}`}
      role="gridcell"
    >
      <time dateTime={`2026-${month}-${String(displayDay).padStart(2, "0")}`}>{displayDay}</time>
      {hasHealth && <div className="calendar-item">보건업무 확인</div>}
      {hasExercise && <div className="calendar-item calendar-item--exercise"><Dumbbell size={11} />운동 일정</div>}
      {hasDeadline && <div className="calendar-item calendar-item--deadline"><Flag size={11} />오늘 마감</div>}
      {hasProject && <div className="calendar-item calendar-item--project">프로젝트 점검</div>}
      {hasPersonal && <div className="calendar-item calendar-item--personal">개인 일정</div>}
    </div>
  );
}

export function FullMonthCalendar() {
  return (
    <section className="full-calendar" aria-label="2026년 7월 월간 캘린더" role="grid">
      <div className="full-calendar__weekdays" role="row">
        {weekdays.map((weekday) => <span key={weekday} role="columnheader">{weekday}</span>)}
      </div>
      <div className="full-calendar__grid" role="rowgroup">
        {weeks.map((week, weekIndex) => (
          <div className="full-calendar__row" key={weekIndex} role="row">
            {week.map((day, dayIndex) => <CalendarCell day={day} key={`${day}-${dayIndex}`} />)}
          </div>
        ))}
      </div>
    </section>
  );
}
