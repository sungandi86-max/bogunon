"use client";

import { useActionState, useEffect, useRef } from "react";

import { createAnnualPlannerCustomItemAction } from "@/app/(app)/annual/actions";
import type { AnnualPlannerActionState } from "@/app/(app)/annual/actions";

const initialState: AnnualPlannerActionState = { status: "idle" };

export function AnnualCustomItemForm() {
  const [state, action, pending] = useActionState(createAnnualPlannerCustomItemAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  return (
    <details className="annual-custom-item-form">
      <summary>내 업무 추가</summary>
      <form action={action} ref={formRef}>
        <div className="form-grid">
          <div className="field">
            <label className="field-label" htmlFor="annual-custom-title">제목</label>
            <input id="annual-custom-title" maxLength={120} name="title" required />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="annual-custom-month">추천 월</label>
            <select defaultValue="1" id="annual-custom-month" name="month">
              {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => <option key={month} value={month}>{month}월</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="annual-custom-kind">구분</label>
            <select defaultValue="task" id="annual-custom-kind" name="itemKind"><option value="task">업무</option><option value="event">일정</option></select>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="annual-custom-minutes">예상 소요 시간(분)</label>
            <input id="annual-custom-minutes" max={1440} min={1} name="estimatedMinutes" type="number" />
          </div>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="annual-custom-description">설명</label>
          <textarea id="annual-custom-description" maxLength={2000} name="description" />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="annual-custom-checklist">체크리스트</label>
          <textarea id="annual-custom-checklist" name="checklist" placeholder={'한 줄에 한 항목씩 입력하세요.\n예: 일정 확인'} />
        </div>
        <div className="annual-custom-item-form__footer">
          <span>개인정보 없이 업무 절차만 기록하세요.</span>
          <button className="button button--primary" disabled={pending} type="submit">{pending ? "추가 중" : "내 업무 추가"}</button>
        </div>
        {state.message && <p aria-live="polite" className={state.status === "error" ? "form-message form-message--error" : "form-message"}>{state.message}</p>}
      </form>
    </details>
  );
}
