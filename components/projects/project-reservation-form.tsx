"use client";

import { CalendarPlus } from "lucide-react";
import { useActionState, useEffect } from "react";

import {
  saveReservationAction,
  type ReservationActionResult,
} from "@/app/(app)/projects/reservation-actions";
import { RESERVATION_TYPES } from "@/lib/projects/reservations";
import type { ProjectReservationRow } from "@/types/database";

const initialState: ReservationActionResult = { status: "success", message: "" };

export function ProjectReservationForm({
  formId,
  onPendingChange,
  onSaved,
  projectId,
  reservation,
}: {
  readonly formId: string;
  readonly onPendingChange: (pending: boolean) => void;
  readonly onSaved: () => void;
  readonly projectId: string;
  readonly reservation?: ProjectReservationRow;
}) {
  const [state, action, pending] = useActionState(saveReservationAction, initialState);
  const key = reservation?.id ?? "new";

  useEffect(() => {
    if (state.status === "success" && state.reservationId) onSaved();
  }, [onSaved, state]);

  useEffect(() => {
    onPendingChange(pending);
  }, [onPendingChange, pending]);

  return (
    <form action={action} className="project-reservation-form" id={formId}>
      <input name="projectId" type="hidden" value={projectId} />
      <input name="reservationId" type="hidden" value={reservation?.id ?? ""} />
      <div className="form-grid">
        <div className="field">
          <label className="field-label" htmlFor={`${key}-reservation-type`}>예약 유형</label>
          <select defaultValue={reservation?.type ?? "flight"} id={`${key}-reservation-type`} name="type">
            {RESERVATION_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <div className="field project-reservation-form__title">
          <label className="field-label" htmlFor={`${key}-reservation-title`}>예약 이름</label>
          <input defaultValue={reservation?.title ?? ""} id={`${key}-reservation-title`} maxLength={160} name="title" placeholder="예: 김포 → 제주" required />
        </div>
      </div>
      <div className="form-grid project-reservation-form__schedule">
        <div className="field">
          <label className="field-label" htmlFor={`${key}-reservation-date`}>예약일</label>
          <input defaultValue={reservation?.reservation_date ?? ""} id={`${key}-reservation-date`} name="reservationDate" required type="date" />
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`${key}-reservation-start`}>시작 시간</label>
          <input defaultValue={reservation?.start_time?.slice(0, 5) ?? ""} id={`${key}-reservation-start`} name="startTime" type="time" />
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`${key}-reservation-end`}>종료 시간</label>
          <input defaultValue={reservation?.end_time?.slice(0, 5) ?? ""} id={`${key}-reservation-end`} name="endTime" type="time" />
        </div>
      </div>
      <div className="form-grid">
        <div className="field">
          <label className="field-label" htmlFor={`${key}-reservation-company`}>업체 또는 기관</label>
          <input defaultValue={reservation?.company ?? ""} id={`${key}-reservation-company`} maxLength={160} name="company" placeholder="예: 제주항공" />
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`${key}-reservation-confirmation`}>예약번호</label>
          <input defaultValue={reservation?.confirmation_number ?? ""} id={`${key}-reservation-confirmation`} maxLength={120} name="confirmationNumber" />
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`${key}-reservation-location`}>장소</label>
          <input defaultValue={reservation?.location ?? ""} id={`${key}-reservation-location`} maxLength={300} name="location" />
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`${key}-reservation-phone`}>연락처</label>
          <input defaultValue={reservation?.phone ?? ""} id={`${key}-reservation-phone`} maxLength={60} name="phone" type="tel" />
        </div>
      </div>
      <div className="field">
        <label className="field-label" htmlFor={`${key}-reservation-website`}>웹사이트</label>
        <input defaultValue={reservation?.website ?? ""} id={`${key}-reservation-website`} maxLength={500} name="website" placeholder="https://" type="url" />
      </div>
      <div className="field">
        <label className="field-label" htmlFor={`${key}-reservation-memo`}>메모</label>
        <textarea defaultValue={reservation?.memo ?? ""} id={`${key}-reservation-memo`} maxLength={2000} name="memo" />
      </div>
      <label className="project-reservation-form__sync">
        <input defaultChecked={reservation ? Boolean(reservation.linked_event_id) : true} name="syncCalendar" type="checkbox" />
        <span><CalendarPlus aria-hidden="true" size={17} /><strong>캘린더 일정 생성</strong><small>예약 날짜와 시간이 프로젝트 일정에 함께 반영됩니다.</small></span>
      </label>
      {reservation?.linked_event_id && <p className="project-reservation-form__sync-note">이 옵션을 끄고 저장하면 연결된 캘린더 일정은 삭제됩니다.</p>}
      {state.message && <p className={state.status === "error" ? "form-message form-message--error" : "form-message"} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}
    </form>
  );
}
