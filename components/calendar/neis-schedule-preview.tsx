"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { classifyNeisSchedule, filterNeisPreviewItems, formatGradeBadge } from "@/lib/neis/preview";
import type {
  NeisPreviewCategoryFilter,
  NeisPreviewFilters,
  NeisPreviewItem,
} from "@/lib/neis/types";

const categoryOptions: readonly { readonly value: NeisPreviewCategoryFilter; readonly label: string }[] = [
  { value: "all", label: "전체" },
  { value: "schoolEvent", label: "학교행사" },
  { value: "exam", label: "시험" },
  { value: "holiday", label: "공휴일" },
  { value: "vacation", label: "방학" },
];

const categoryLabels = {
  schoolEvent: "학교행사",
  exam: "시험",
  holiday: "공휴일",
  vacation: "방학",
} as const;

const initialFilters: NeisPreviewFilters = {
  includeSaturdayClosures: false,
  includeHolidays: true,
  includeVacations: true,
  category: "all",
  query: "",
};

interface NeisSchedulePreviewProps {
  readonly items: readonly NeisPreviewItem[];
  readonly onChangeItems: (items: readonly NeisPreviewItem[]) => void;
  readonly onClose?: () => void;
  readonly onSave: (items: readonly NeisPreviewItem[]) => void;
  readonly saving: boolean;
}

function displayDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${year}.${month}.${day}`;
}

function saveLabel(selectedNew: number, selectedChanged: number): string {
  const total = selectedNew + selectedChanged;
  if (total === 0) return "선택한 일정 저장";
  if (selectedChanged === 0) return `새 일정 ${selectedNew}개 저장`;
  if (selectedNew === 0) return `변경된 일정 ${selectedChanged}개 반영`;
  return `${total}개 일정 반영`;
}

export function NeisSchedulePreview({ items, onChangeItems, onClose, onSave, saving }: NeisSchedulePreviewProps) {
  const [filters, setFilters] = useState<NeisPreviewFilters>(initialFilters);
  const filteredItems = useMemo(() => filterNeisPreviewItems(items, filters), [filters, items]);
  const visibleIds = useMemo(() => new Set(filteredItems.map(({ id }) => id)), [filteredItems]);
  const selectedItems = filteredItems.filter((item) => item.selected && item.status !== "duplicate");
  const selectedNew = selectedItems.filter((item) => item.status === "ready").length;
  const selectedChanged = selectedItems.filter((item) => item.status === "changed").length;
  const duplicateCount = filteredItems.filter((item) => item.status === "duplicate").length;
  const changedCount = filteredItems.filter((item) => item.status === "changed").length;

  function patchFilters(patch: Partial<NeisPreviewFilters>): void {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function toggleItem(id: string, selected: boolean): void {
    onChangeItems(items.map((item) => item.id === id ? { ...item, selected } : item));
  }

  function selectVisible(selected: boolean): void {
    onChangeItems(items.map((item) => visibleIds.has(item.id) && item.status !== "duplicate" ? { ...item, selected } : item));
  }

  function saveVisible(): void {
    onSave(items.map((item) => ({
      ...item,
      selected: visibleIds.has(item.id) && item.status !== "duplicate" && item.selected,
    })));
  }

  return (
    <section className="neis-import__preview">
      <div className="neis-import__preview-controls">
        <div className="neis-import__preview-header">
          <div>
            <h3>학사일정 미리보기</h3>
            <p>
              {changedCount > 0
                ? `새 일정과 변경 가능성이 있는 일정 ${changedCount}개를 확인해 주세요.`
                : filteredItems.some((item) => item.status === "ready") ? "저장할 일정을 선택해 주세요." : "최신 상태입니다."}
            </p>
          </div>
          <div>
            <button onClick={() => selectVisible(true)} type="button">전체 선택</button>
            <button onClick={() => selectVisible(false)} type="button">전체 해제</button>
          </div>
        </div>

        <div className="neis-import__filter-options">
          <label><input checked={filters.includeSaturdayClosures} onChange={(event) => patchFilters({ includeSaturdayClosures: event.target.checked })} type="checkbox" />토요휴업일 포함</label>
          <label><input checked={filters.includeHolidays} onChange={(event) => patchFilters({ includeHolidays: event.target.checked })} type="checkbox" />공휴일 포함</label>
          <label><input checked={filters.includeVacations} onChange={(event) => patchFilters({ includeVacations: event.target.checked })} type="checkbox" />방학 포함</label>
        </div>

        <div className="neis-import__preview-tools">
          <div aria-label="일정 유형" className="neis-import__type-filter" role="group">
            {categoryOptions.map((option) => (
              <button aria-pressed={filters.category === option.value} key={option.value} onClick={() => patchFilters({ category: option.value })} type="button">
                {option.label}
              </button>
            ))}
          </div>
          <label className="neis-import__preview-search">
            <Search aria-hidden="true" size={16} />
            <span className="sr-only">일정 검색</span>
            <input aria-label="일정 검색" onChange={(event) => patchFilters({ query: event.target.value })} placeholder="일정명, 내용, 학년, 날짜 검색" type="search" value={filters.query} />
          </label>
        </div>
      </div>

      <div aria-label="NEIS 학사일정 미리보기" className="neis-import__list" role="list">
        {filteredItems.length === 0 && <p className="neis-import__list-empty">조건에 맞는 일정이 없습니다.</p>}
        {filteredItems.map((item) => (
          <label className={`is-${item.status}`} key={item.id} role="listitem">
            <input checked={item.selected} disabled={item.status === "duplicate"} onChange={(event) => toggleItem(item.id, event.target.checked)} type="checkbox" />
            <time dateTime={item.date}>{displayDate(item.date)}</time>
            <span className="neis-import__row-content">
              <span className="neis-import__row-title">
                <strong>{item.title}</strong>
                <Badge tone="neutral">{formatGradeBadge(item.grades)}</Badge>
              </span>
              {item.content && <small className="neis-import__row-detail" title={item.content}>{item.content}</small>}
              <small>{categoryLabels[classifyNeisSchedule(item.title)]}</small>
            </span>
            <span className="neis-import__row-status">
              {item.status === "ready" && <Badge tone="success">새 일정</Badge>}
              {item.status === "duplicate" && <Badge tone="waiting">이미 등록됨</Badge>}
              {item.status === "changed" && <Badge tone="check">변경 가능</Badge>}
            </span>
          </label>
        ))}
      </div>

      <p className="academic-import__privacy">API 키는 서버에서만 사용하며, 현재 화면에 표시된 선택 일정만 캘린더에 반영합니다.</p>
      <div className="neis-import__action-bar">
        <p aria-live="polite">
          <span>전체 {items.length}개</span><span>표시 {filteredItems.length}개</span><span>선택 {selectedItems.length}개</span><span>중복 제외 {duplicateCount}개</span>
        </p>
        <div>
          {onClose && <Button onClick={onClose} variant="secondary">취소</Button>}
          <Button disabled={saving || selectedItems.length === 0} onClick={saveVisible}>
            {saving ? "저장 중…" : saveLabel(selectedNew, selectedChanged)}
          </Button>
        </div>
      </div>
    </section>
  );
}
