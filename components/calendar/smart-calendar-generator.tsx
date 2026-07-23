"use client";

import { BookOpen, CalendarDays, CalendarRange, HeartPulse, PartyPopper, Sparkles } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import {
  generateSmartCalendarPreviewAction,
  saveSmartCalendarAction,
} from "@/app/(app)/calendar/generator/actions";
import { SmartCalendarPreviewList } from "@/components/calendar/smart-calendar-preview-list";
import { SmartCalendarResult } from "@/components/calendar/smart-calendar-result";
import { refreshPreviewItemValidity } from "@/lib/calendar-generator/generation-planner";
import type {
  SmartCalendarPreview,
  SmartCalendarPreviewItem,
  SmartCalendarSemester,
} from "@/lib/calendar-generator/generation-types";
import type { SmartCalendarSaveResult } from "@/lib/calendar-generator/persistence";
import type { CalendarTemplatePack } from "@/lib/calendar-generator/types";

const packOptions = [
  { value: "academic", label: "학사일정", description: "시험, 방학, 학사 운영", icon: BookOpen },
  { value: "health", label: "보건업무", description: "검진, 교육, 점검", icon: HeartPulse },
  { value: "holiday", label: "공휴일", description: "국가 공휴일", icon: PartyPopper },
] as const satisfies readonly {
  readonly value: CalendarTemplatePack;
  readonly label: string;
  readonly description: string;
  readonly icon: typeof BookOpen;
}[];

export function SmartCalendarGenerator({
  currentYear,
  school,
}: {
  readonly currentYear: number;
  readonly school: { readonly name: string; readonly schoolLevel: string | null; readonly region: string | null };
}) {
  const [year, setYear] = useState(currentYear);
  const [semester, setSemester] = useState<SmartCalendarSemester>("all");
  const [selectedPacks, setSelectedPacks] = useState<readonly CalendarTemplatePack[]>(["academic", "health", "holiday"]);
  const [preview, setPreview] = useState<SmartCalendarPreview>();
  const [items, setItems] = useState<readonly SmartCalendarPreviewItem[]>([]);
  const [result, setResult] = useState<SmartCalendarSaveResult>();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const selectedCount = items.filter((item) => item.selected && item.warning !== "date-error").length;
  const duplicateCount = items.filter((item) => item.warning === "duplicate").length;
  const excludedCount = items.filter((item) => !item.selected && item.warning !== "duplicate").length;
  const attentionCount = items.filter((item) => item.warning === "needs-confirmation" || item.warning === "date-error").length;
  const yearOptions = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
  const calendarDate = useMemo(() => {
    const createdIds = new Set(result?.results.filter((item) => item.status === "created").map((item) => item.clientId));
    return items.filter((item) => createdIds.has(item.clientId)).map((item) => item.startDate).sort()[0] ?? `${year}-01-01`;
  }, [items, result, year]);

  function togglePack(pack: CalendarTemplatePack, checked: boolean): void {
    setSelectedPacks((current) => checked ? [...current, pack] : current.filter((item) => item !== pack));
  }

  function generatePreview(): void {
    setMessage("");
    startTransition(async () => {
      try {
        const next = await generateSmartCalendarPreviewAction({ year, semester, selectedPacks });
        setPreview(next);
        setItems(next.items);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "일정 후보를 만들지 못했습니다.");
      }
    });
  }

  function updateItem(clientId: string, patch: Partial<SmartCalendarPreviewItem>): void {
    setItems((current) => current.map((item) => {
      if (item.clientId !== clientId) return item;
      const next = { ...item, ...patch };
      const onlySelectionChanged = Object.keys(patch).every((key) => key === "selected" || key === "duplicateDecision");
      return onlySelectionChanged ? next : refreshPreviewItemValidity(next);
    }));
  }

  function save(): void {
    setMessage("");
    startTransition(async () => {
      try {
        const response = await saveSmartCalendarAction(items.map((item) => ({
          clientId: item.clientId,
          title: item.title,
          startDate: item.startDate,
          endDate: item.endDate,
          area: item.area,
          description: item.description,
          selected: item.selected,
          duplicateDecision: item.duplicateDecision,
        })));
        if (response.status === "error") {
          setMessage(response.message);
          return;
        }
        setResult(response.result);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "일정을 생성하지 못했습니다.");
      }
    });
  }

  if (result) {
    return <SmartCalendarResult calendarDate={calendarDate} onReset={() => { setResult(undefined); setPreview(undefined); setItems([]); }} result={result} year={year} />;
  }

  return <div className="smart-calendar-generator">
    <section className="smart-calendar-criteria" aria-labelledby="smart-calendar-criteria-title">
      <header><span><Sparkles aria-hidden="true" size={18} />생성 기준</span><h2 id="smart-calendar-criteria-title">Smart Calendar 생성</h2><p>학교 정보와 선택한 프리셋을 바탕으로<br className="smart-calendar-description-break" /> 생성할 일정을 미리 검토한 후 캘린더에 추가합니다.</p></header>
      <dl className="smart-calendar-school"><div><dt>학교명</dt><dd>{school.name}</dd></div><div><dt>학교급</dt><dd>{school.schoolLevel ?? "정보 없음"}</dd></div><div><dt>지역</dt><dd>{school.region ?? "정보 없음"}</dd></div></dl>
      <div className="smart-calendar-criteria__controls">
        <label>대상 연도<select aria-label="대상 연도" onChange={(event) => setYear(Number(event.target.value))} value={year}>{yearOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
        <fieldset><legend>학기</legend><div className="smart-calendar-segments">{([["all", "전체"], ["first", "1학기"], ["second", "2학기"]] as const).map(([value, label]) => <label key={value}><input checked={semester === value} name="semester" onChange={() => setSemester(value)} type="radio" />{label}</label>)}</div></fieldset>
        <fieldset><legend>프리셋 묶음</legend><div className="smart-calendar-packs">{packOptions.map((option) => {
          const Icon = option.icon;
          const checked = selectedPacks.includes(option.value);
          return <label className={checked ? "is-selected" : undefined} key={option.value}>
            <input checked={checked} onChange={(event) => togglePack(option.value, event.target.checked)} type="checkbox" />
            <Icon aria-hidden="true" size={20} />
            <span><strong>{option.label}</strong><small>{option.description}</small></span>
          </label>;
        })}</div></fieldset>
      </div>
      <button className="button button--primary smart-calendar-preview-cta" disabled={isPending || selectedPacks.length === 0} onClick={generatePreview} type="button"><CalendarRange aria-hidden="true" size={19} />{isPending ? "후보 생성 중…" : "일정 후보 생성하기"}</button>
    </section>
    {!preview && <section className="smart-calendar-empty-state" aria-live="polite">
      <span className="smart-calendar-empty-state__icon"><CalendarDays aria-hidden="true" size={24} /></span>
      <h2>아직 생성된 일정 후보가 없습니다.</h2>
      <p>생성 기준을 선택한 뒤 <strong>일정 후보 생성하기</strong> 버튼을 누르면<br className="smart-calendar-description-break" /> 생성 예정인 일정을 먼저 확인할 수 있습니다.</p>
    </section>}
    {preview && <section className="smart-calendar-preview-section" aria-labelledby="smart-calendar-preview-title">
      <header><div><span>미리보기</span><h2 id="smart-calendar-preview-title">생성 예정 일정</h2></div><p>모든 일정은 저장 전에 수정하거나 제외할 수 있습니다.</p></header>
      <div className="smart-calendar-preview-summary" role="status">
        <span><small>생성 예정</small><strong>{selectedCount}개</strong></span>
        <span><small>중복</small><strong>{duplicateCount}개</strong></span>
        <span><small>제외</small><strong>{excludedCount}개</strong></span>
        <span><small>확인 필요</small><strong>{attentionCount}개</strong></span>
      </div>
      <SmartCalendarPreviewList items={items} onChange={updateItem} onExclude={(clientId) => updateItem(clientId, { selected: false })} />
      <button className="button button--primary smart-calendar-create" disabled={isPending || items.length === 0} onClick={save} type="button">{isPending ? "일정 생성 중…" : `선택한 일정 생성 (${selectedCount}개)`}</button>
    </section>}
    {message && <p className="form-message form-message--error" role="alert">{message}</p>}
  </div>;
}
