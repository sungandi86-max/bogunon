"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useId, useState } from "react";

import { useCalendarPreferences } from "@/components/calendar/calendar-preferences-provider";
import { calendarMonthCells, weekdayLabels } from "@/lib/calendar/preferences";
import { shiftCalendarMonth, todayInSeoul } from "@/lib/work-items/date";

type CalendarDateInputProps = {
  readonly ariaLabel?: string;
  readonly defaultValue?: string;
  readonly id?: string;
  readonly max?: string;
  readonly min?: string;
  readonly name: string;
  readonly onValueChange?: (value: string) => void;
  readonly required?: boolean;
  readonly value?: string;
};

export function CalendarDateInput({ ariaLabel, defaultValue = "", id, max, min, name, onValueChange, required = false, value }: CalendarDateInputProps) {
  const generatedId = useId();
  const { weekStart } = useCalendarPreferences();
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selected = value ?? internalValue;
  const [month, setMonth] = useState((selected || todayInSeoul()).slice(0, 7));
  const [open, setOpen] = useState(false);
  const labels = weekdayLabels(weekStart);
  const cells = calendarMonthCells(month, weekStart);
  const dialogId = `${id ?? generatedId}-calendar-dialog`;

  const openCalendar = () => {
    setMonth((selected || todayInSeoul()).slice(0, 7));
    setOpen(true);
  };

  const selectDate = (date: string) => {
    if (value === undefined) setInternalValue(date);
    onValueChange?.(date);
    setOpen(false);
  };

  return <div className="calendar-date-input">
    <div className="calendar-date-input__control"><input aria-controls={dialogId} aria-expanded={open} aria-haspopup="dialog" aria-label={ariaLabel} id={id} name={name} onClick={openCalendar} onKeyDown={(event) => { if (["Enter", " ", "ArrowDown"].includes(event.key)) { event.preventDefault(); openCalendar(); } }} placeholder="날짜 선택" readOnly required={required} role="combobox" value={selected} /><button aria-label={selected ? `${selected} 날짜 선택 열기` : "날짜 선택 열기"} onClick={() => open ? setOpen(false) : openCalendar()} type="button"><CalendarDays aria-hidden="true" size={17} /></button></div>
    {open && <div aria-label="날짜 선택" className="calendar-date-input__popover" id={dialogId} role="dialog">
      <div className="calendar-date-input__toolbar"><button aria-label="이전 달" onClick={() => setMonth(shiftCalendarMonth(`${month}-01`, -1).slice(0, 7))} type="button"><ChevronLeft aria-hidden="true" /></button><strong>{month.slice(0, 4)}년 {Number(month.slice(5))}월</strong><button aria-label="다음 달" onClick={() => setMonth(shiftCalendarMonth(`${month}-01`, 1).slice(0, 7))} type="button"><ChevronRight aria-hidden="true" /></button></div>
      <div className="calendar-date-input__weekdays" aria-hidden="true">{labels.map((label) => <span key={label}>{label}</span>)}</div>
      <div className="calendar-date-input__grid">{cells.map((date, index) => date ? <button aria-pressed={selected === date} disabled={Boolean((min && date < min) || (max && date > max))} key={date} onClick={() => selectDate(date)} type="button">{Number(date.slice(-2))}</button> : <span aria-hidden="true" key={`empty-${index}`} />)}</div>
      <button className="calendar-date-input__close" onClick={() => setOpen(false)} type="button">닫기</button>
    </div>}
  </div>;
}
