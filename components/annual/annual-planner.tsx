"use client";

import { CalendarPlus, Check, ChevronDown, Clock3, GripVertical, ListTodo, Star } from "lucide-react";
import { useMemo, useState } from "react";

import { AnnualCustomItemForm } from "@/components/annual/annual-custom-item-form";
import { useHealthPresetPreferences } from "@/components/health-presets/health-preset-preferences-context";
import { useAppShellCreate } from "@/components/layout/app-shell-create-context";
import {
  HEALTH_YEARLY_PRESETS,
  yearlyPresetTemplate,
} from "@/lib/annual-planner/health-yearly-presets";
import type { AnnualPlannerPreset } from "@/lib/annual-planner/health-yearly-presets";
import { annualPresetStatus } from "@/lib/annual-planner/status";
import type { AnnualExistingItem, AnnualPresetStatus } from "@/lib/annual-planner/status";
import type { WorkItemKind } from "@/types/database";

interface AnnualPlannerProps {
  readonly year: number;
  readonly currentYear: number;
  readonly currentMonth: number;
  readonly customItems: readonly AnnualPlannerPreset[];
  readonly existingItems: readonly AnnualExistingItem[];
}

const statusLabels = new Map<AnnualPresetStatus, string>([
  ["added", "추가됨"], ["scheduled", "예정됨"], ["completed", "완료됨"],
]);

export function AnnualPlanner({ year, currentYear, currentMonth, customItems, existingItems }: AnnualPlannerProps) {
  const { openCreate } = useAppShellCreate();
  const { isPending, preferenceFor, toggleFavorite, visiblePresets } = useHealthPresetPreferences();
  const [expandedMonths, setExpandedMonths] = useState<ReadonlySet<number>>(
    year === currentYear ? new Set([currentMonth]) : new Set(),
  );
  const [draggedPresetId, setDraggedPresetId] = useState<string>();
  const [dropDate, setDropDate] = useState("");
  const months = useMemo(() => {
    const visiblePresetKeys = new Set(visiblePresets.map((preset) => preset.key));
    const presetRanks = new Map(visiblePresets.map((preset, index) => [preset.key, index]));
    return HEALTH_YEARLY_PRESETS.map((month) => ({
      month: month.month,
      items: [...month.items, ...customItems.filter((item) => item.month === month.month)]
        .filter((item) => !item.presetKey || visiblePresetKeys.has(item.presetKey))
        .sort((left, right) => {
          if (!left.presetKey && !right.presetKey) return 0;
          if (!left.presetKey) return 1;
          if (!right.presetKey) return -1;
          return (presetRanks.get(left.presetKey) ?? 0) - (presetRanks.get(right.presetKey) ?? 0);
        }),
    }));
  }, [customItems, visiblePresets]);

  function openPreset(trigger: HTMLButtonElement, preset: AnnualPlannerPreset, kind: WorkItemKind, date?: string) {
    openCreate(trigger, kind, yearlyPresetTemplate(preset, { year, kind, ...(date ? { date } : {}) }));
  }

  function toggleMonth(month: number) {
    setExpandedMonths((current) => {
      const next = new Set(current);
      if (next.has(month)) next.delete(month); else next.add(month);
      return next;
    });
  }

  function toggleAnnualFavorite(presetKey: string | undefined): void {
    if (presetKey) toggleFavorite(presetKey);
  }

  const draggedPreset = months.flatMap((month) => month.items).find((item) => item.id === draggedPresetId);

  return (
    <>
      <section aria-label="연간 플래너 도구" className="annual-planner-tools">
        <div><strong>월별 추천 업무</strong><span>학교 일정에 맞게 날짜와 내용을 확인한 뒤 저장하세요.</span></div>
        <AnnualCustomItemForm />
        <div className="annual-drag-copy">
          <label htmlFor="annual-drop-date">빠른 복사 날짜</label>
          <input id="annual-drop-date" max={`${year}-12-31`} min={`${year}-01-01`} onChange={(event) => setDropDate(event.target.value)} type="date" value={dropDate} />
          <button
            aria-label="선택한 날짜로 제안 업무 복사"
            className="annual-drop-target"
            disabled={!dropDate || !draggedPreset}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (draggedPreset && dropDate) openPreset(event.currentTarget, draggedPreset, draggedPreset.kind, dropDate);
              setDraggedPresetId(undefined);
            }}
            type="button"
          >
            <GripVertical aria-hidden="true" size={17} />날짜를 선택하고 항목을 여기로 끌어 놓으세요.
          </button>
        </div>
      </section>

      <section aria-label={`${year}년 월별 추천 업무`} className="annual-grid annual-grid--planner">
        {months.map(({ month, items }) => {
          const expanded = expandedMonths.has(month);
          const visibleItems = expanded ? items : items.slice(0, 3);
          const isCurrent = year === currentYear && month === currentMonth;
          return (
            <section aria-label={`${month}월`} aria-labelledby={`annual-month-${month}`} className={`annual-month annual-month--planner${isCurrent ? " annual-month--current" : ""}`} key={month}>
              <header className="annual-month__header">
                <div><h2 id={`annual-month-${month}`}>{month}월</h2>{isCurrent && <span className="annual-current-badge">이번 달</span>}</div>
                <small>{items.length}개 제안</small>
              </header>
              <div className="annual-month__items annual-month__items--planner">
                {visibleItems.length ? visibleItems.map((preset) => {
                  const status = annualPresetStatus({ title: preset.title, templateTitle: preset.baseTemplate?.title ?? preset.title }, existingItems, year);
                  return (
                    <article
                      className="annual-preset-item"
                      draggable
                      key={preset.id}
                      onDragEnd={() => setDraggedPresetId(undefined)}
                      onDragStart={() => setDraggedPresetId(preset.id)}
                    >
                      <div className="annual-preset-item__title">
                        <span className={preset.source === "custom" ? "annual-preset-dot annual-preset-dot--custom" : "annual-preset-dot"} />
                        <strong>{preset.title}</strong>
                        {status !== "none" && <small className={`annual-status annual-status--${status}`}><Check aria-hidden="true" size={12} />{statusLabels.get(status)}</small>}
                        {preset.presetKey && <button aria-label={`${preset.title} ${preferenceFor(preset.presetKey)?.favorite ? "즐겨찾기 해제" : "즐겨찾기"}`} aria-pressed={preferenceFor(preset.presetKey)?.favorite ?? false} className="annual-preset-favorite" disabled={isPending} onClick={() => toggleAnnualFavorite(preset.presetKey)} type="button"><Star aria-hidden="true" fill={preferenceFor(preset.presetKey)?.favorite ? "currentColor" : "none"} size={15} /></button>}
                      </div>
                      <p>{preset.description}</p>
                      <div className="annual-preset-item__meta"><span><Clock3 aria-hidden="true" size={13} />{preset.estimatedMinutes}분</span><span>{preset.recommendedPeriod}</span>{preset.checklist.length > 0 && <span><ListTodo aria-hidden="true" size={13} />{preset.checklist.length}개</span>}</div>
                      <div className="annual-preset-item__actions">
                        <button aria-label={`${preset.title} 업무로 추가`} className={preset.kind === "task" ? "button button--primary" : "button button--secondary"} onClick={(event) => openPreset(event.currentTarget, preset, "task")} type="button">업무로 추가</button>
                        <button aria-label={`${preset.title} 일정으로 추가`} className={preset.kind === "event" ? "button button--primary" : "button button--secondary"} onClick={(event) => openPreset(event.currentTarget, preset, "event")} type="button"><CalendarPlus aria-hidden="true" size={14} />일정으로 추가</button>
                      </div>
                    </article>
                  );
                }) : <div className="annual-month-empty"><p>이 달에 등록된 추천 업무가 없습니다.</p><span>내 업무 추가에서 학교 일정에 맞는 항목을 등록할 수 있습니다.</span></div>}
              </div>
              {items.length > 3 && <button aria-expanded={expanded} aria-label={`${month}월 추천 업무 ${expanded ? "접기" : "더 보기"}`} className="annual-month__more" onClick={() => toggleMonth(month)} type="button">{expanded ? "접기" : `${items.length - 3}개 더 보기`}<ChevronDown aria-hidden="true" size={15} /></button>}
            </section>
          );
        })}
      </section>
    </>
  );
}
