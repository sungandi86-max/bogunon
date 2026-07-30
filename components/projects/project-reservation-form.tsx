"use client";

import { CalendarPlus, WalletCards } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

import {
  saveReservationAction,
  type ReservationActionResult,
} from "@/app/(app)/projects/reservation-actions";
import { ProjectMoneyInput } from "@/components/projects/project-money-input";
import {
  ProjectReservationScheduleFields,
  RESERVATION_FIELD_COPY,
} from "@/components/projects/project-reservation-schedule-fields";
import {
  EXPENSE_CATEGORIES,
  PAYMENT_STATUSES,
  expenseCategorySchema,
  reservationExpenseDefaults,
} from "@/lib/projects/budget";
import {
  RESERVATION_TYPES,
  type ReservationType,
  reservationTypeSchema,
} from "@/lib/projects/reservations";
import type {
  ProjectExpenseRow,
  ProjectReservationRow,
} from "@/types/database";

const initialState: ReservationActionResult = { status: "success", message: "" };

export function ProjectReservationForm({
  formId,
  onPendingChange,
  onSaved,
  projectId,
  projectName,
  reservation,
  linkedExpense,
  initialType,
}: {
  readonly formId: string;
  readonly onPendingChange: (pending: boolean) => void;
  readonly onSaved: () => void;
  readonly projectId: string;
  readonly projectName?: string;
  readonly reservation?: ProjectReservationRow;
  readonly linkedExpense?: ProjectExpenseRow | undefined;
  readonly initialType?: ReservationType;
}) {
  const [state, action, pending] = useActionState(saveReservationAction, initialState);
  const key = reservation?.id ?? "new";
  const defaultType = reservation?.type ?? initialType ?? "flight";
  const defaults = reservationExpenseDefaults(defaultType);
  const [reservationType, setReservationType] = useState<ReservationType>(defaultType);
  const [syncExpense, setSyncExpense] = useState(Boolean(linkedExpense));
  const [expenseCategory, setExpenseCategory] = useState(
    linkedExpense?.category ?? defaults.category,
  );
  const fieldCopy = RESERVATION_FIELD_COPY[reservationType];

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
      {projectName && (
        <div className="workspace-project-context">
          <span>현재 프로젝트</span>
          <strong>{projectName}</strong>
          <small>이 예약은 현재 Workspace에 연결됩니다.</small>
        </div>
      )}
      <div className="form-grid">
        <div className="field">
          <label className="field-label" htmlFor={`${key}-reservation-type`}>예약 유형</label>
          <select
            id={`${key}-reservation-type`}
            name="type"
            onChange={(event) => {
              const parsed = reservationTypeSchema.safeParse(event.currentTarget.value);
              if (parsed.success) {
                setReservationType(parsed.data);
                if (!linkedExpense) {
                  setExpenseCategory(reservationExpenseDefaults(parsed.data).category);
                }
              }
            }}
            value={reservationType}
          >
            {RESERVATION_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <div className="field project-reservation-form__title">
          <label className="field-label" htmlFor={`${key}-reservation-title`}>예약 이름</label>
          <input defaultValue={reservation?.title ?? ""} id={`${key}-reservation-title`} maxLength={160} name="title" placeholder={fieldCopy.titlePlaceholder} required />
        </div>
      </div>
      <ProjectReservationScheduleFields
        fieldKey={key}
        {...(reservation ? { reservation } : {})}
        reservationType={reservationType}
      />
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
      <label className="project-reservation-form__sync">
        <input
          checked={syncExpense}
          name="syncExpense"
          onChange={(event) => setSyncExpense(event.currentTarget.checked)}
          type="checkbox"
        />
        <span><WalletCards aria-hidden="true" size={17} /><strong>예산에 추가</strong><small>예약 비용을 같은 프로젝트의 지출로 연결합니다.</small></span>
      </label>
      {syncExpense && (
        <div className="project-reservation-form__expense">
          <div className="form-grid">
            <div className="field">
              <label className="field-label" htmlFor={`${key}-reservation-expense-amount`}>비용</label>
              <ProjectMoneyInput
                {...(linkedExpense ? { defaultValue: linkedExpense.amount } : {})}
                id={`${key}-reservation-expense-amount`}
                name="expenseAmount"
                required
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor={`${key}-reservation-expense-category`}>지출 카테고리</label>
              <select
                id={`${key}-reservation-expense-category`}
                name="expenseCategory"
                onChange={(event) => {
                  const parsed = expenseCategorySchema.safeParse(event.currentTarget.value);
                  if (parsed.success) setExpenseCategory(parsed.data);
                }}
                value={expenseCategory}
              >
                {EXPENSE_CATEGORIES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label" htmlFor={`${key}-reservation-expense-status`}>결제 상태</label>
              <select
                defaultValue={linkedExpense?.payment_status ?? defaults.paymentStatus}
                id={`${key}-reservation-expense-status`}
                name="expensePaymentStatus"
              >
                {PAYMENT_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>
          {linkedExpense && (
            <label className="project-reservation-form__expense-update">
              <input defaultChecked name="updateLinkedExpense" type="checkbox" />
              <span>예약 이름·비용·날짜 변경을 연결 지출에도 반영</span>
            </label>
          )}
        </div>
      )}
      {linkedExpense && !syncExpense && <p className="project-reservation-form__sync-note">저장하면 지출은 유지되고 예약 연결만 해제됩니다.</p>}
      {state.message && <p className={state.status === "error" ? "form-message form-message--error" : "form-message"} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}
    </form>
  );
}
