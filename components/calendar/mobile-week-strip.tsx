"use client";

import { useState } from "react";

const week = [
  ["월", 13], ["화", 14], ["수", 15], ["목", 16], ["금", 17], ["토", 18], ["일", 19],
] as const;

export function MobileWeekStrip() {
  const [selected, setSelected] = useState(17);
  return (
    <div className="mobile-week-strip" aria-label="주간 날짜 선택">
      {week.map(([weekday, day]) => (
        <button
          aria-pressed={selected === day}
          className={`week-strip-day${selected === day ? " is-selected" : ""}${day === 17 ? " is-today" : ""}`}
          key={day}
          onClick={() => setSelected(day)}
          type="button"
        >
          <small>{weekday}</small>
          <strong>{day}</strong>
          <span className="week-strip-markers" aria-hidden="true">
            {[14, 17, 19].includes(day) && <span className="marker" />}
            {[17, 18].includes(day) && <span className="marker marker--deadline" />}
          </span>
        </button>
      ))}
    </div>
  );
}
