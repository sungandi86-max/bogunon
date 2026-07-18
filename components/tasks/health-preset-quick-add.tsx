"use client";

import { ChevronDown, ChevronUp, ClipboardPlus, Eye, EyeOff, GripVertical, RotateCcw, Star } from "lucide-react";
import { useState } from "react";

import { useHealthPresetPreferences } from "@/components/health-presets/health-preset-preferences-context";
import { useAppShellCreate } from "@/components/layout/app-shell-create-context";
import { useRecentHealthPresets } from "@/components/health-presets/use-recent-health-presets";
import { HEALTH_PRESET_GROUPS } from "@/lib/work-items/health-presets";
import type { HealthPresetDefinition } from "@/lib/work-items/health-presets";

const INITIAL_PRESET_COUNT = 6;

export function HealthPresetQuickAdd() {
  const { openCreate } = useAppShellCreate();
  const { presets: recentPresets, remember } = useRecentHealthPresets();
  const { hiddenPresets, isPending, message, movePreset, preferenceFor, reorderPreset, resetPreferences, setHidden, toggleFavorite, visiblePresets } = useHealthPresetPreferences();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [draggedPresetId, setDraggedPresetId] = useState<string>();
  const quickPresets = visiblePresets.slice(0, INITIAL_PRESET_COUNT);
  const visibleRecentPresets = recentPresets.filter((preset) => !preferenceFor(preset.key)?.hidden);

  function applyPreset(trigger: HTMLButtonElement, preset: HealthPresetDefinition): void {
    remember(preset.key);
    openCreate(trigger, preset.kind, preset);
  }

  function presetButton(preset: HealthPresetDefinition, recent = false) {
    const preference = preferenceFor(preset.key);
    return (
      <div
        className={`health-preset-quick-add__item${editing ? " health-preset-quick-add__item--editing" : ""}`}
        draggable={editing && !isPending}
        key={preset.key}
        onDragEnd={() => setDraggedPresetId(undefined)}
        onDragOver={(event) => { if (editing) event.preventDefault(); }}
        onDragStart={() => setDraggedPresetId(preset.key)}
        onDrop={() => { if (draggedPresetId) reorderPreset(draggedPresetId, preset.key); setDraggedPresetId(undefined); }}
      >
        {editing && <GripVertical aria-hidden="true" className="health-preset-drag-handle" size={16} />}
        <button aria-label={recent ? `${preset.name} 최근 사용` : `${preset.name} 프리셋 적용`} className="health-preset-quick-add__apply" onClick={(event) => applyPreset(event.currentTarget, preset)} type="button">
          <span className={`category-dot category-dot--${preset.category}`} />
          <span>{preset.name}</span>
          <ClipboardPlus aria-hidden="true" size={16} />
        </button>
        <button aria-label={`${preset.name} ${preference?.favorite ? "즐겨찾기 해제" : "즐겨찾기"}`} aria-pressed={preference?.favorite ?? false} className="health-preset-favorite" disabled={isPending} onClick={() => toggleFavorite(preset.key)} type="button"><Star aria-hidden="true" fill={preference?.favorite ? "currentColor" : "none"} size={16} /></button>
        {editing && <div className="health-preset-edit-actions">
          <button aria-label={`${preset.name} 위로 이동`} disabled={isPending} onClick={() => movePreset(preset.key, -1)} type="button"><ChevronUp aria-hidden="true" size={15} /></button>
          <button aria-label={`${preset.name} 아래로 이동`} disabled={isPending} onClick={() => movePreset(preset.key, 1)} type="button"><ChevronDown aria-hidden="true" size={15} /></button>
          <button aria-label={`${preset.name} 숨기기`} disabled={isPending} onClick={() => setHidden(preset.key, true)} type="button"><EyeOff aria-hidden="true" size={15} /></button>
        </div>}
      </div>
    );
  }

  return (
    <section aria-labelledby="health-preset-title" className="health-preset-quick-add">
      <div className="health-preset-quick-add__heading">
        <div>
          <h2 id="health-preset-title">자주 하는 보건업무</h2>
          <p>반복 업무를 빠르게 추가하세요.</p>
        </div>
        <div className="health-preset-quick-add__tools">
          <button aria-pressed={editing} className="health-preset-quick-add__expand" onClick={() => { setEditing((value) => !value); setExpanded(true); }} type="button">{editing ? "편집 완료" : "편집"}</button>
          <button aria-expanded={showHidden} className="health-preset-quick-add__expand" onClick={() => setShowHidden((value) => !value)} type="button">숨긴 프리셋 관리</button>
          {!expanded && <button aria-expanded={false} className="health-preset-quick-add__expand" onClick={() => setExpanded(true)} type="button">전체 보기<ChevronDown aria-hidden="true" size={16} /></button>}
        </div>
      </div>
      {visibleRecentPresets.length > 0 && <section className="health-preset-recent" aria-labelledby="health-preset-recent-title"><h3 id="health-preset-recent-title">최근 사용 <span>자동</span></h3><div className="health-preset-quick-add__grid">{visibleRecentPresets.map((preset) => presetButton(preset, true))}</div></section>}
      {message && <p className="health-preset-preference-message" role="status">{message}</p>}
      {editing ? <div className="health-preset-quick-add__grid health-preset-quick-add__grid--editing">{visiblePresets.map((preset) => presetButton(preset))}</div> : !expanded ? <div className="health-preset-quick-add__grid">{quickPresets.map((preset) => presetButton(preset))}</div> : (
        <div className="health-preset-groups">
          {HEALTH_PRESET_GROUPS.map((group) => {
            const groupPresets = visiblePresets.filter((preset) => preset.group === group);
            return groupPresets.length > 0 ? <section aria-labelledby={`health-preset-group-${group}`} key={group}><h3 id={`health-preset-group-${group}`}>{group}</h3><div className="health-preset-quick-add__grid">{groupPresets.map((preset) => presetButton(preset))}</div></section> : null;
          })}
        </div>
      )}
      {showHidden && <section aria-labelledby="hidden-health-presets-title" className="health-preset-hidden"><h3 id="hidden-health-presets-title">숨긴 프리셋</h3>{hiddenPresets.length > 0 ? <div>{hiddenPresets.map((preset) => <button disabled={isPending} key={preset.key} onClick={() => setHidden(preset.key, false)} type="button"><Eye aria-hidden="true" size={15} />{preset.name} 복원</button>)}</div> : <p>숨긴 프리셋이 없습니다.</p>}</section>}
      {editing && <button className="health-preset-reset" disabled={isPending} onClick={resetPreferences} type="button"><RotateCcw aria-hidden="true" size={15} />기본 순서로 복원</button>}
    </section>
  );
}
