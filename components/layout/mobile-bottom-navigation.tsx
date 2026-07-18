"use client";

import { CalendarDays, CalendarPlus, ChevronDown, ChevronUp, ClipboardList, Dumbbell, Eye, EyeOff, FilePenLine, GitBranch, Home, Plus, RotateCcw, Settings, Star, Sticker, StickyNote, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { ResponsiveDetailPanel } from "@/components/layout/responsive-detail-panel";
import { useHealthPresetPreferences } from "@/components/health-presets/health-preset-preferences-context";
import { useRecentHealthPresets } from "@/components/health-presets/use-recent-health-presets";
import { HEALTH_PRESET_GROUPS } from "@/lib/work-items/health-presets";
import type { HealthPresetDefinition } from "@/lib/work-items/health-presets";
import type { TemplateDefinition } from "@/lib/work-items/workflow";

const links = [
  ["오늘", "/briefing", Home],
  ["업무", "/tasks", ClipboardList],
  ["일정", "/calendar", CalendarDays],
  ["업무 절차", "/workflows", GitBranch],
  ["설정", "/settings", Settings],
] as const;

interface MobileBottomNavigationProps {
  readonly onAssistant: (trigger: HTMLButtonElement) => void;
  readonly onCreate: (trigger: HTMLButtonElement, kind: "task" | "event", template?: TemplateDefinition) => void;
}

export function MobileBottomNavigation({ onAssistant, onCreate }: MobileBottomNavigationProps) {
  const pathname = usePathname();
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [showAllHealthPresets, setShowAllHealthPresets] = useState(false);
  const [editingHealthPresets, setEditingHealthPresets] = useState(false);
  const [showHiddenHealthPresets, setShowHiddenHealthPresets] = useState(false);
  const { presets: recentHealthPresets, remember: rememberHealthPreset } = useRecentHealthPresets();
  const { hiddenPresets, isPending, message, movePreset, preferenceFor, resetPreferences, setHidden, toggleFavorite, visiblePresets } = useHealthPresetPreferences();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const quickHealthPresets = visiblePresets.slice(0, 6);
  const visibleRecentHealthPresets = recentHealthPresets.filter((preset) => !preferenceFor(preset.key)?.hidden);

  function chooseCreate(trigger: HTMLButtonElement, kind: "task" | "event", template?: TemplateDefinition): void {
    setCreateMenuOpen(false);
    onCreate(launcherRef.current ?? trigger, kind, template);
  }

  function chooseAssistant(trigger: HTMLButtonElement): void {
    setCreateMenuOpen(false);
    onAssistant(launcherRef.current ?? trigger);
  }

  function chooseHealthPreset(trigger: HTMLButtonElement, preset: HealthPresetDefinition): void {
    rememberHealthPreset(preset.key);
    chooseCreate(trigger, preset.kind, preset);
  }

  function healthPresetButton(preset: HealthPresetDefinition, recent = false) {
    const preference = preferenceFor(preset.key);
    return <div className="mobile-health-preset-item" key={preset.key}>
      <button aria-label={recent ? `${preset.name} 최근 사용` : `${preset.name} 보건업무 프리셋 적용`} onClick={(event) => chooseHealthPreset(event.currentTarget, preset)} type="button">{preset.name}</button>
      <button aria-label={`${preset.name} ${preference?.favorite ? "즐겨찾기 해제" : "즐겨찾기"}`} aria-pressed={preference?.favorite ?? false} className="mobile-health-preset-item__favorite" disabled={isPending} onClick={() => toggleFavorite(preset.key)} type="button"><Star aria-hidden="true" fill={preference?.favorite ? "currentColor" : "none"} size={15} /></button>
      {editingHealthPresets && <div className="mobile-health-preset-item__edit">
        <button aria-label={`${preset.name} 위로 이동`} disabled={isPending} onClick={() => movePreset(preset.key, -1)} type="button"><ChevronUp aria-hidden="true" size={14} /></button>
        <button aria-label={`${preset.name} 아래로 이동`} disabled={isPending} onClick={() => movePreset(preset.key, 1)} type="button"><ChevronDown aria-hidden="true" size={14} /></button>
        <button aria-label={`${preset.name} 숨기기`} disabled={isPending} onClick={() => setHidden(preset.key, true)} type="button"><EyeOff aria-hidden="true" size={14} /></button>
      </div>}
    </div>;
  }

  return (
    <>
      <nav className="mobile-navigation" aria-label="모바일 주요 메뉴">
        <div className="mobile-navigation__links">
          {links.map(([label, href, Icon]) => (
            <Link aria-current={pathname.startsWith(href) ? "page" : undefined} href={href} key={href}>
              <Icon aria-hidden="true" size={22} strokeWidth={1.9} />
              <span>{label}</span>
            </Link>
          ))}
        </div>
        <button
          aria-expanded={createMenuOpen}
          aria-haspopup="dialog"
          aria-label="빠른 새로 만들기"
          className="mobile-create-fab"
          onClick={() => { setShowAllHealthPresets(false); setEditingHealthPresets(false); setShowHiddenHealthPresets(false); setCreateMenuOpen(true); }}
          ref={launcherRef}
          type="button"
        >
          <Plus aria-hidden="true" size={25} strokeWidth={2.1} />
        </button>
      </nav>
      <ResponsiveDetailPanel
        onClose={() => setCreateMenuOpen(false)}
        open={createMenuOpen}
        returnFocusRef={launcherRef}
        title="새로 만들기"
      >
        <div className="mobile-create-menu">
          <section className="mobile-health-presets" aria-labelledby="mobile-health-presets-title">
            <div><h2 id="mobile-health-presets-title">빠른 보건업무</h2><div className="mobile-health-presets__tools"><button aria-pressed={editingHealthPresets} onClick={() => { setEditingHealthPresets((value) => !value); setShowAllHealthPresets(true); }} type="button">{editingHealthPresets ? "완료" : "편집"}</button><button aria-expanded={showAllHealthPresets} aria-label={showAllHealthPresets ? "보건업무 간단히 보기" : "보건업무 전체 보기"} onClick={() => setShowAllHealthPresets((value) => !value)} type="button">{showAllHealthPresets ? "간단히 보기" : "전체 보기"}</button></div></div>
            {visibleRecentHealthPresets.length > 0 && <div className="mobile-health-presets__recent"><strong>최근 사용 <span>자동</span></strong><div>{visibleRecentHealthPresets.map((preset) => healthPresetButton(preset, true))}</div></div>}
            {message && <p className="mobile-health-presets__message" role="status">{message}</p>}
            {editingHealthPresets ? <div className="mobile-health-presets__grid mobile-health-presets__grid--editing">{visiblePresets.map((preset) => healthPresetButton(preset))}</div> : !showAllHealthPresets ? <div className="mobile-health-presets__grid">{quickHealthPresets.map((preset) => healthPresetButton(preset))}</div> : (
              <div className="mobile-health-presets__groups">
                {HEALTH_PRESET_GROUPS.map((group) => {
                  const groupPresets = visiblePresets.filter((preset) => preset.group === group);
                  return groupPresets.length > 0 ? <section aria-labelledby={`mobile-health-preset-group-${group}`} key={group}><h3 id={`mobile-health-preset-group-${group}`}>{group}</h3><div className="mobile-health-presets__grid">{groupPresets.map((preset) => healthPresetButton(preset))}</div></section> : null;
                })}
              </div>
            )}
            <div className="mobile-health-presets__management"><button aria-expanded={showHiddenHealthPresets} onClick={() => setShowHiddenHealthPresets((value) => !value)} type="button">숨긴 프리셋 관리</button>{editingHealthPresets && <button disabled={isPending} onClick={resetPreferences} type="button"><RotateCcw aria-hidden="true" size={14} />기본 순서로 복원</button>}</div>
            {showHiddenHealthPresets && <div className="mobile-health-presets__hidden">{hiddenPresets.length > 0 ? hiddenPresets.map((preset) => <button disabled={isPending} key={preset.key} onClick={() => setHidden(preset.key, false)} type="button"><Eye aria-hidden="true" size={14} />{preset.name} 복원</button>) : <p>숨긴 프리셋이 없습니다.</p>}</div>}
          </section>
          <button onClick={(event) => chooseCreate(event.currentTarget, "task")} type="button"><ClipboardList aria-hidden="true" size={20} /><span><strong>업무 추가</strong><small>할 일과 마감일을 정리합니다.</small></span></button>
          <button onClick={(event) => chooseCreate(event.currentTarget, "event")} type="button"><CalendarPlus aria-hidden="true" size={20} /><span><strong>일정 추가</strong><small>날짜와 시간이 있는 일정을 등록합니다.</small></span></button>
          <button onClick={(event) => chooseCreate(event.currentTarget, "event", { key: "personal-event", name: "개인 일정", kind: "event", area: "personal", category: "event", title: "", description: "", priority: "normal", estimatedMinutes: 30, recommendedTiming: "선택한 날짜", recurrenceFrequency: null, checklist: [], memo: "", isAllDay: false })} type="button"><UserRound aria-hidden="true" size={20} /><span><strong>개인 일정 추가</strong><small>병원, 약속, 여행 등 개인 일정을 등록합니다.</small></span></button>
          <Link href="/exercise?create=sticker" onClick={() => setCreateMenuOpen(false)}><Dumbbell aria-hidden="true" size={20} /><span><strong>운동 스티커 붙이기</strong><small>오늘 한 운동을 한 번의 탭으로 남깁니다.</small></span></Link>
          <Link href="/calendar?create=sticker" onClick={() => setCreateMenuOpen(false)}><Sticker aria-hidden="true" size={20} /><span><strong>날짜 스티커 붙이기</strong><small>학교 일정과 개인 약속을 날짜에 표시합니다.</small></span></Link>
          <Link href="/workflows" onClick={() => setCreateMenuOpen(false)}><GitBranch aria-hidden="true" size={20} /><span><strong>업무 절차 시작</strong><small>단계가 있는 보건업무를 시작합니다.</small></span></Link>
          <Link href="/briefing#quick-note" onClick={() => setCreateMenuOpen(false)}><StickyNote aria-hidden="true" size={20} /><span><strong>빠른 메모</strong><small>떠오른 내용을 바로 정리합니다.</small></span></Link>
          <button onClick={(event) => chooseAssistant(event.currentTarget)} type="button"><FilePenLine aria-hidden="true" size={20} /><span><strong>작성 도움</strong><small>내용과 체크리스트 제안을 확인합니다.</small></span></button>
        </div>
      </ResponsiveDetailPanel>
    </>
  );
}
