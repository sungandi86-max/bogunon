"use client";

import { CalendarRange, Sparkles } from "lucide-react";
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
  { value: "academic", label: "학사일정" },
  { value: "health", label: "보건업무" },
  { value: "holiday", label: "공휴일" },
] as const satisfies readonly { readonly value: CalendarTemplatePack; readonly label: string }[];

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
      <header><span><Sparkles aria-hidden="true" size={18} />생성 기준</span><h2 id="smart-calendar-criteria-title">학교 일정 초안 만들기</h2><p>제안된 날짜를 미리 확인하고 필요한 항목만 일정으로 생성합니다.</p></header>
      <dl className="smart-calendar-school"><div><dt>학교명</dt><dd>{school.name}</dd></div><div><dt>학교급</dt><dd>{school.schoolLevel ?? "정보 없음"}</dd></div><div><dt>지역</dt><dd>{school.region ?? "정보 없음"}</dd></div></dl>
      <div className="smart-calendar-criteria__controls">
        <label>대상 연도<input max="2100" min="2000" onChange={(event) => setYear(Number(event.target.value))} type="number" value={year} /></label>
        <fieldset><legend>학기</legend><div className="smart-calendar-segments">{([["all", "전체"], ["first", "1학기"], ["second", "2학기"]] as const).map(([value, label]) => <label key={value}><input checked={semester === value} name="semester" onChange={() => setSemester(value)} type="radio" />{label}</label>)}</div></fieldset>
        <fieldset><legend>프리셋 묶음</legend><div className="smart-calendar-packs">{packOptions.map((option) => <label key={option.value}><input checked={selectedPacks.includes(option.value)} onChange={(event) => togglePack(option.value, event.target.checked)} type="checkbox" />{option.label}</label>)}</div></fieldset>
      </div>
      <button className="button button--primary" disabled={isPending || selectedPacks.length === 0} onClick={generatePreview} type="button"><CalendarRange aria-hidden="true" size={17} />{isPending ? "후보 생성 중…" : "일정 후보 미리보기"}</button>
    </section>
    {preview && <section className="smart-calendar-preview-section" aria-labelledby="smart-calendar-preview-title">
      <header><div><span>미리보기</span><h2 id="smart-calendar-preview-title">생성 예정 일정</h2></div><p>모든 일정은 저장 전에 수정하거나 제외할 수 있습니다.</p></header>
      <div className="smart-calendar-preview-summary" role="status"><span>전체 <strong>{items.length}</strong></span><span>생성 선택 <strong>{selectedCount}</strong></span><span>중복 후보 <strong>{items.filter((item) => item.warning === "duplicate").length}</strong></span><span>날짜 오류 <strong>{items.filter((item) => item.warning === "date-error").length}</strong></span></div>
      <SmartCalendarPreviewList items={items} onChange={updateItem} onExclude={(clientId) => updateItem(clientId, { selected: false })} />
      <button className="button button--primary smart-calendar-create" disabled={isPending || items.length === 0} onClick={save} type="button">{isPending ? "일정 생성 중…" : `선택한 일정 생성 (${selectedCount}개)`}</button>
    </section>}
    {message && <p className="form-message form-message--error" role="alert">{message}</p>}
  </div>;
}
