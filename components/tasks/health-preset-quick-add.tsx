"use client";

import { ChevronDown, ClipboardPlus } from "lucide-react";
import { useState } from "react";

import { useAppShellCreate } from "@/components/layout/app-shell-create-context";
import { HEALTH_PRESETS } from "@/lib/work-items/health-presets";

const INITIAL_PRESET_COUNT = 6;

export function HealthPresetQuickAdd() {
  const { openCreate } = useAppShellCreate();
  const [expanded, setExpanded] = useState(false);
  const visiblePresets = expanded ? HEALTH_PRESETS : HEALTH_PRESETS.slice(0, INITIAL_PRESET_COUNT);

  return (
    <section aria-labelledby="health-preset-title" className="health-preset-quick-add">
      <div className="health-preset-quick-add__heading">
        <div>
          <h2 id="health-preset-title">자주 하는 보건업무</h2>
          <p>자주 쓰는 업무를 선택해 내용을 확인한 뒤 등록하세요.</p>
        </div>
        {!expanded && (
          <button aria-expanded={false} className="health-preset-quick-add__expand" onClick={() => setExpanded(true)} type="button">
            전체 보기
            <ChevronDown aria-hidden="true" size={16} />
          </button>
        )}
      </div>
      <div className="health-preset-quick-add__grid">
        {visiblePresets.map((preset) => (
          <button
            aria-label={`${preset.name} 프리셋 적용`}
            className="health-preset-quick-add__item"
            key={preset.key}
            onClick={(event) => openCreate(event.currentTarget, preset.kind, preset)}
            type="button"
          >
            <span className={`category-dot category-dot--${preset.category}`} />
            <span>{preset.name}</span>
            <ClipboardPlus aria-hidden="true" size={16} />
          </button>
        ))}
      </div>
    </section>
  );
}
