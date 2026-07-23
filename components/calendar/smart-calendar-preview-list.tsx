"use client";

import { AlertTriangle, CheckCircle2, ExternalLink, Pencil, X } from "lucide-react";
import Link from "next/link";

import type { SmartCalendarPreviewItem } from "@/lib/calendar-generator/generation-types";

const warningLabel = {
  ready: "정상",
  "needs-confirmation": "확인 필요",
  "date-error": "날짜 오류",
  duplicate: "중복 후보",
} as const;

export function SmartCalendarPreviewList({
  items,
  onChange,
  onExclude,
}: {
  readonly items: readonly SmartCalendarPreviewItem[];
  readonly onChange: (clientId: string, patch: Partial<SmartCalendarPreviewItem>) => void;
  readonly onExclude: (clientId: string) => void;
}) {
  return <div aria-label="Smart Calendar 일정 미리보기" className="smart-calendar-preview" role="list">
    {items.map((item) => {
      const titleInputId = `smart-calendar-title-${item.clientId}`;
      return <article className={`smart-calendar-preview__item is-${item.warning}`} key={item.clientId} role="listitem">
        <div className="smart-calendar-preview__select">
          <input
            aria-label={`${item.title} 생성 선택`}
            checked={item.selected}
            disabled={item.warning === "date-error"}
            onChange={(event) => onChange(item.clientId, { selected: event.target.checked })}
            type="checkbox"
          />
        </div>
        <div className="smart-calendar-preview__body">
          <header>
            <span className={`smart-calendar-preview__status is-${item.warning}`}>
              {item.warning === "ready" ? <CheckCircle2 aria-hidden="true" size={14} /> : <AlertTriangle aria-hidden="true" size={14} />}
              {warningLabel[item.warning]}
            </span>
            <span>{item.categoryLabel} · 종일</span>
          </header>
          <label>
            <span>일정명</span>
            <input
              aria-label={`${item.title} 일정명`}
              id={titleInputId}
              maxLength={200}
              onChange={(event) => onChange(item.clientId, { title: event.target.value })}
              value={item.title}
            />
          </label>
          <div className="smart-calendar-preview__dates">
            <label><span>시작일</span><input aria-label={`${item.title} 시작일`} onChange={(event) => onChange(item.clientId, { startDate: event.target.value })} type="date" value={item.startDate} /></label>
            <span>~</span>
            <label><span>종료일</span><input aria-label={`${item.title} 종료일`} onChange={(event) => onChange(item.clientId, { endDate: event.target.value })} type="date" value={item.endDate} /></label>
          </div>
          {item.duplicate && <fieldset className="smart-calendar-preview__duplicate">
            <legend>같은 일정이 이미 있습니다.</legend>
            <label><input aria-label={`${item.title} 생성하지 않기`} checked={item.duplicateDecision === "skip"} name={`duplicate-${item.clientId}`} onChange={() => onChange(item.clientId, { duplicateDecision: "skip", selected: false })} type="radio" />생성하지 않기</label>
            <label><input aria-label={`${item.title} 그래도 생성`} checked={item.duplicateDecision === "force"} name={`duplicate-${item.clientId}`} onChange={() => onChange(item.clientId, { duplicateDecision: "force", selected: true })} type="radio" />그래도 생성</label>
            <Link href={`/calendar?date=${item.duplicate.startDate}&highlight=${item.duplicate.eventId}`}><ExternalLink aria-hidden="true" size={14} />기존 일정 보기</Link>
          </fieldset>}
        </div>
        <div className="smart-calendar-preview__actions">
          <button aria-label={`${item.title} 수정`} className="text-action" onClick={() => document.getElementById(titleInputId)?.focus()} type="button"><Pencil aria-hidden="true" size={14} />수정</button>
          <button aria-label={`${item.title} 제외`} className="text-action text-action--danger" onClick={() => onExclude(item.clientId)} type="button"><X aria-hidden="true" size={14} />제외</button>
        </div>
      </article>;
    })}
  </div>;
}
