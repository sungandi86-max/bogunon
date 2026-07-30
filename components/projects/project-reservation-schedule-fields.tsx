"use client";

import { useState } from "react";

import type { ReservationType } from "@/lib/projects/reservations";
import type { ProjectReservationRow } from "@/types/database";

export const RESERVATION_FIELD_COPY = {
  badminton: {
    dateLabel: "시작일",
    endDateLabel: "종료일",
    endTimeLabel: "종료 시간",
    startTimeLabel: "시작 시간",
    titlePlaceholder: "예: Victor 배드민턴",
  },
  custom: {
    dateLabel: "시작일",
    endDateLabel: "종료일",
    endTimeLabel: "종료 시간",
    startTimeLabel: "시작 시간",
    titlePlaceholder: "예: 프로젝트 예약",
  },
  flight: {
    dateLabel: "출발일",
    endDateLabel: "도착일",
    endTimeLabel: "도착 시간",
    startTimeLabel: "출발 시간",
    titlePlaceholder: "예: 김포 → 제주",
  },
  hotel: {
    dateLabel: "체크인 날짜",
    endDateLabel: "체크아웃 날짜",
    endTimeLabel: "체크아웃 시간",
    startTimeLabel: "체크인 시간",
    titlePlaceholder: "예: MJ Resort",
  },
  rental_car: {
    dateLabel: "대여일",
    endDateLabel: "반납일",
    endTimeLabel: "반납 시간",
    startTimeLabel: "대여 시간",
    titlePlaceholder: "예: 제주 렌터카",
  },
  restaurant: {
    dateLabel: "예약일",
    endDateLabel: null,
    endTimeLabel: null,
    startTimeLabel: "예약 시간",
    titlePlaceholder: "예: 제주 저녁 식사",
  },
  ticket: {
    dateLabel: "관람일",
    endDateLabel: "종료일",
    endTimeLabel: "종료 시간",
    startTimeLabel: "시작 시간",
    titlePlaceholder: "예: 전시 입장권",
  },
  transportation: {
    dateLabel: "출발일",
    endDateLabel: "도착일",
    endTimeLabel: "도착 시간",
    startTimeLabel: "출발 시간",
    titlePlaceholder: "예: 제주 시외버스",
  },
} satisfies Record<ReservationType, {
  readonly dateLabel: string;
  readonly endDateLabel: string | null;
  readonly endTimeLabel: string | null;
  readonly startTimeLabel: string;
  readonly titlePlaceholder: string;
}>;

export function ProjectReservationScheduleFields({
  fieldKey,
  reservation,
  reservationType,
}: {
  readonly fieldKey: string;
  readonly reservation?: ProjectReservationRow;
  readonly reservationType: ReservationType;
}) {
  const [startDate, setStartDate] = useState(reservation?.reservation_date ?? "");
  const [endDate, setEndDate] = useState(
    reservation?.end_date ?? reservation?.reservation_date ?? "",
  );
  const [startTime, setStartTime] = useState(reservation?.start_time?.slice(0, 5) ?? "");
  const [endTime, setEndTime] = useState(reservation?.end_time?.slice(0, 5) ?? "");
  const fieldCopy = RESERVATION_FIELD_COPY[reservationType];

  return (
    <div className="form-grid project-reservation-form__schedule">
      <div className="field">
        <label className="field-label" htmlFor={`${fieldKey}-reservation-date`}>
          {fieldCopy.dateLabel}
        </label>
        <input
          id={`${fieldKey}-reservation-date`}
          name="reservationDate"
          onChange={(event) => {
            const nextStartDate = event.currentTarget.value;
            setStartDate(nextStartDate);
            if (!endDate || endDate < nextStartDate) setEndDate(nextStartDate);
          }}
          required
          type="date"
          value={startDate}
        />
      </div>
      <div className="field">
        <label className="field-label" htmlFor={`${fieldKey}-reservation-start`}>
          {fieldCopy.startTimeLabel}
        </label>
        <input
          id={`${fieldKey}-reservation-start`}
          name="startTime"
          onChange={(event) => setStartTime(event.currentTarget.value)}
          type="time"
          value={startTime}
        />
      </div>
      {fieldCopy.endDateLabel ? (
        <div className="field">
          <label className="field-label" htmlFor={`${fieldKey}-reservation-end-date`}>
            {fieldCopy.endDateLabel}
          </label>
          <input
            id={`${fieldKey}-reservation-end-date`}
            min={startDate || undefined}
            name="endDate"
            onChange={(event) => setEndDate(event.currentTarget.value)}
            required
            type="date"
            value={endDate}
          />
        </div>
      ) : <input name="endDate" type="hidden" value={startDate} />}
      {fieldCopy.endTimeLabel ? (
        <div className="field">
          <label className="field-label" htmlFor={`${fieldKey}-reservation-end`}>
            {fieldCopy.endTimeLabel}
          </label>
          <input
            id={`${fieldKey}-reservation-end`}
            min={startDate === endDate && startTime ? startTime : undefined}
            name="endTime"
            onChange={(event) => setEndTime(event.currentTarget.value)}
            type="time"
            value={endTime}
          />
        </div>
      ) : <input name="endTime" type="hidden" value="" />}
    </div>
  );
}
