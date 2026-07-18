"use client";

import { ChevronDown, ClipboardPlus } from "lucide-react";
import { useState } from "react";

import { useAppShellCreate } from "@/components/layout/app-shell-create-context";
import { useRecentHealthPresets } from "@/components/health-presets/use-recent-health-presets";
import { HEALTH_PRESET_GROUPS, HEALTH_PRESETS, healthPresetsForSurface } from "@/lib/work-items/health-presets";
import type { HealthPresetDefinition } from "@/lib/work-items/health-presets";

const INITIAL_PRESET_COUNT = 6;

export function HealthPresetQuickAdd() {
  const { openCreate } = useAppShellCreate();
  const { presets: recentPresets, remember } = useRecentHealthPresets();
  const [expanded, setExpanded] = useState(false);
  const quickPresets = healthPresetsForSurface("desktop").slice(0, INITIAL_PRESET_COUNT);

  function applyPreset(trigger: HTMLButtonElement, preset: HealthPresetDefinition): void {
    remember(preset.key);
    openCreate(trigger, preset.kind, preset);
  }

  function presetButton(preset: HealthPresetDefinition, recent = false) {
    return (
      <button
        aria-label={recent ? `${preset.name} 최근 사용` : `${preset.name} 프리셋 적용`}
        className="health-preset-quick-add__item"
        key={preset.key}
        onClick={(event) => applyPreset(event.currentTarget, preset)}
        type="button"
      >
        <span className={`category-dot category-dot--${preset.category}`} />
        <span>{preset.name}</span>
        <ClipboardPlus aria-hidden="true" size={16} />
      </button>
    );
  }

  return (
    <section aria-labelledby="health-preset-title" className="health-preset-quick-add">
      <div className="health-preset-quick-add__heading">
        <div>
          <h2 id="health-preset-title">자주 하는 보건업무</h2>
          <p>반복 업무를 빠르게 추가하세요.</p>
        </div>
        {!expanded && (
          <button aria-expanded={false} className="health-preset-quick-add__expand" onClick={() => setExpanded(true)} type="button">
            전체 보기
            <ChevronDown aria-hidden="true" size={16} />
          </button>
        )}
      </div>
      {recentPresets.length > 0 && <section className="health-preset-recent" aria-labelledby="health-preset-recent-title"><h3 id="health-preset-recent-title">최근 사용</h3><div className="health-preset-quick-add__grid">{recentPresets.map((preset) => presetButton(preset, true))}</div></section>}
      {!expanded ? <div className="health-preset-quick-add__grid">{quickPresets.map((preset) => presetButton(preset))}</div> : (
        <div className="health-preset-groups">
          {HEALTH_PRESET_GROUPS.map((group) => <section aria-labelledby={`health-preset-group-${group}`} key={group}><h3 id={`health-preset-group-${group}`}>{group}</h3><div className="health-preset-quick-add__grid">{HEALTH_PRESETS.filter((preset) => preset.group === group).map((preset) => presetButton(preset))}</div></section>)}
        </div>
      )}
    </section>
  );
}
