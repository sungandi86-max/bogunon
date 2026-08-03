"use client";

import { Check, Search, SearchX, X } from "lucide-react";
import { useActionState, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { removeCalendarStickerAction } from "@/app/(app)/calendar-sticker-actions";
import { CalendarDateInput } from "@/components/calendar/calendar-date-input";
import { CalendarDateSticker } from "@/components/calendar/calendar-date-sticker";
import { CalendarEventStickerPicker } from "@/components/calendar/calendar-event-sticker-picker";
import { DATE_STICKER_PACKS as packs, catalogForPack, groupsForPack, isCalendarEventStickerPack, type DateStickerPack } from "@/components/calendar/sticker-picker-config";
import { useAppShellCreate } from "@/components/layout/app-shell-create-context";
import { dateStickerEventTemplate } from "@/lib/calendar-stickers/event-catalog";
import { calendarStickerByKey, filterCalendarStickers, type CalendarStickerGroup } from "@/lib/calendar-stickers/catalog";
import type { CalendarStickerRow } from "@/types/database";

const idle = { status: "idle" as const };

function dateLabel(date: string): string {
  return `${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일`;
}

export function SchoolStickerPicker({ stickers, today }: { readonly stickers: readonly CalendarStickerRow[]; readonly today: string }) {
  const [pack, setPack] = useState<DateStickerPack>("school");
  const [group, setGroup] = useState<CalendarStickerGroup | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(today);
  const [endDate, setEndDate] = useState("");
  const [removeState, removeAction, removePending] = useActionState(removeCalendarStickerAction, idle);
  const { openCreate } = useAppShellCreate();
  const eventButtonRef = useRef<HTMLButtonElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const eventPack = isCalendarEventStickerPack(pack);
  const catalog = useMemo(() => (isCalendarEventStickerPack(pack) ? [] : catalogForPack(pack)), [pack]);
  const groups = useMemo(() => (isCalendarEventStickerPack(pack) ? [] : groupsForPack(pack)), [pack]);
  const visibleCatalog = useMemo(() => filterCalendarStickers(catalog, query, groups.length > 0 ? group : "all"), [catalog, group, groups.length, query]);
  const selected = stickers.filter((item) => {
    const definition = calendarStickerByKey(item.sticker_key);
    const matchesPack = pack === "school" ? definition?.pack === "school" || definition?.pack === "academic" : definition?.pack === pack;
    return !eventPack && item.sticker_date <= today && (item.end_date ?? item.sticker_date) >= today && matchesPack;
  });
  const selectedLabel = selectedKey ? calendarStickerByKey(selectedKey)?.label : null;
  const saveLabel = !selectedKey ? "스티커를 선택하세요" : `${selectedLabel ?? "선택한 스티커"} 일정 설정`;

  useEffect(() => {
    if (typeof activeTabRef.current?.scrollIntoView === "function") {
      activeTabRef.current.scrollIntoView({
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [pack]);

  function selectPack(nextPack: DateStickerPack): void {
    if (nextPack === pack) return;
    setPack(nextPack);
    setGroup("all");
    setQuery("");
    setSelectedKey(null);
  }

  function updateQuery(nextQuery: string): void {
    setQuery(nextQuery);
    if (selectedKey && !filterCalendarStickers(catalog, nextQuery, groups.length > 0 ? group : "all").some((item) => item.key === selectedKey)) {
      setSelectedKey(null);
    }
  }

  function selectGroup(nextGroup: CalendarStickerGroup | "all"): void {
    setGroup(nextGroup);
    if (selectedKey && !filterCalendarStickers(catalog, query, nextGroup).some((item) => item.key === selectedKey)) {
      setSelectedKey(null);
    }
  }

  function handlePackKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number): void {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const offset = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + offset + packs.length) % packs.length;
    const nextPack = packs[nextIndex]?.[0];
    if (!nextPack) return;
    selectPack(nextPack);
    requestAnimationFrame(() => document.getElementById(`calendar-sticker-${nextPack}-tab`)?.focus());
  }

  function openSelectedEvent(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!selectedKey || !eventButtonRef.current) return;
    const definition = calendarStickerByKey(selectedKey);
    if (!definition) return;
    openCreate(eventButtonRef.current, "event", dateStickerEventTemplate(definition, selectedDate, endDate || selectedDate));
  }

  return (
    <section className="school-sticker-picker" aria-label="날짜 스티커 추가">
      <div className="school-sticker-picker__heading">
        <p>날짜 스티커를 추가하거나 운동·대회 일정을 만들 수 있습니다.</p>
      </div>
      <div aria-label="날짜 스티커 팩" className="calendar-sticker-tabs" role="tablist">
        {packs.map(([value, label], index) => (
          <button aria-controls="calendar-sticker-panel" aria-selected={pack === value} id={`calendar-sticker-${value}-tab`} key={value} onClick={() => selectPack(value)} onKeyDown={(event) => handlePackKeyDown(event, index)} ref={pack === value ? activeTabRef : undefined} role="tab" tabIndex={pack === value ? 0 : -1} type="button">
            {label}
          </button>
        ))}
      </div>
      {eventPack ? (
        <CalendarEventStickerPicker date={selectedDate} pack={pack} />
      ) : (
        <form aria-labelledby={`calendar-sticker-${pack}-tab`} className="school-sticker-picker__form" id="calendar-sticker-panel" onSubmit={openSelectedEvent} role="tabpanel">
          <div className="school-sticker-picker__dates">
            <div className="form-grid">
              <label className="field">
                <span className="field-label">시작일</span>
                <CalendarDateInput
                  name="stickerDate"
                  onValueChange={(value) => {
                    setSelectedDate(value);
                    if (endDate && endDate < value) setEndDate("");
                  }}
                  required
                  value={selectedDate}
                />
              </label>
              <label className="field">
                <span className="field-label">종료일</span>
                <CalendarDateInput min={selectedDate} name="endDate" onValueChange={setEndDate} value={endDate} />
              </label>
            </div>
            <p>스티커를 선택한 뒤 종일 여부와 시간을 설정합니다.</p>
          </div>
          <label className="calendar-sticker-search">
            <span className="sr-only">스티커 검색</span>
            <Search aria-hidden="true" size={17} />
            <input onChange={(event) => updateQuery(event.target.value)} placeholder="이름, 키워드, 카테고리 검색" type="search" value={query} />
            {query && (
              <button aria-label="스티커 검색어 지우기" onClick={() => updateQuery("")} type="button">
                <X aria-hidden="true" size={16} />
              </button>
            )}
          </label>
          {groups.length > 0 && (
            <div aria-label={`${packs.find(([value]) => value === pack)?.[1] ?? "스티커"} 카테고리`} className="calendar-sticker-groups" role="group">
              {groups.map(([value, label]) => (
                <button aria-pressed={group === value} key={value} onClick={() => selectGroup(value)} type="button">
                  {label}
                </button>
              ))}
            </div>
          )}
          <p aria-live="polite" className="sr-only">
            {visibleCatalog.length}개의 스티커가 표시됩니다.
          </p>
          {visibleCatalog.length > 0 ? (
            <div className="school-sticker-grid">
              {visibleCatalog.map((item) => (
                <button aria-label={`${dateLabel(selectedDate)} ${item.label} 스티커 선택`} aria-pressed={selectedKey === item.key} className={selectedKey === item.key ? "is-selected" : undefined} key={item.key} onClick={() => setSelectedKey(item.key)} type="button">
                  <CalendarDateSticker stickerKey={item.key} />
                  {selectedKey === item.key && <Check aria-hidden="true" className="school-sticker-grid__check" size={16} />}
                </button>
              ))}
            </div>
          ) : (
            <div className="calendar-sticker-empty">
              <SearchX aria-hidden="true" size={22} />
              <strong>검색 결과가 없습니다.</strong>
              <span>검색어를 지우고 다시 찾아보세요.</span>
              <button
                onClick={() => {
                  updateQuery("");
                  selectGroup("all");
                }}
                type="button"
              >
                검색 초기화
              </button>
            </div>
          )}
        </form>
      )}
      {!eventPack && selected.length > 0 && (
        <div className="school-sticker-picker__selected-list">
          {selected.map((item) => (
            <div className="school-sticker-picker__selected" key={item.id}>
              <CalendarDateSticker stickerKey={item.sticker_key} />
              <div>
                <strong>{item.label}</strong>
                <small>
                  {item.sticker_date}
                  {item.end_date ? ` ~ ${item.end_date}` : ""}
                </small>
              </div>
              <form action={removeAction}>
                <input name="stickerId" type="hidden" value={item.id} />
                <button className="text-action" disabled={removePending} type="submit">
                  제거
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
      {removeState.message && (
        <p aria-live="polite" className={removeState.status === "error" ? "form-message form-message--error" : "form-message"}>
          {removeState.message}
        </p>
      )}
      {!eventPack && (
        <div className="school-sticker-picker__footer">
          <button className="button school-sticker-picker__save" disabled={!selectedKey} form="calendar-sticker-panel" ref={eventButtonRef} type="submit">
            {saveLabel}
          </button>
        </div>
      )}
    </section>
  );
}
