import { Flag, Dumbbell } from "lucide-react";

const weekdays = ["월", "화", "수", "목", "금", "토", "일"];
const cells = Array.from({ length: 35 }, (_, index) => index - 1);

function CalendarCell({ day }: { readonly day: number }) {
  const displayDay = day < 1 ? day + 30 : day > 31 ? day - 31 : day;
  const month = day < 1 ? "06" : day > 31 ? "08" : "07";
  const hasHealth = [3, 9, 17, 23].includes(day);
  const hasExercise = [7, 17, 28].includes(day);
  const hasDeadline = [11, 22].includes(day);
  const hasItem = hasHealth || hasExercise || hasDeadline;
  return (
    <div className={`full-calendar__cell${hasItem ? " has-item" : ""}`}>
      <time dateTime={`2026-${month}-${String(displayDay).padStart(2, "0")}`}>{displayDay}</time>
      {hasHealth && <div className="calendar-item">보건업무 확인</div>}
      {hasExercise && <div className="calendar-item calendar-item--exercise"><Dumbbell size={11} />운동 일정</div>}
      {hasDeadline && <div className="calendar-item calendar-item--deadline"><Flag size={11} />오늘 마감</div>}
    </div>
  );
}

export function FullMonthCalendar() {
  return (
    <section className="full-calendar" aria-label="2026년 7월 월간 캘린더">
      <div className="full-calendar__weekdays" aria-hidden="true">
        {weekdays.map((weekday) => <span key={weekday}>{weekday}</span>)}
      </div>
      <div className="full-calendar__grid">
        {cells.map((day, index) => <CalendarCell day={day} key={`${day}-${index}`} />)}
      </div>
    </section>
  );
}
