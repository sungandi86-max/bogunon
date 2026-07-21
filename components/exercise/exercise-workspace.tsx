"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useRef, useState } from "react";

import { CustomExerciseStickerForm } from "@/components/exercise/custom-exercise-sticker-form";
import { ExerciseCard } from "@/components/exercise/exercise-card";
import { ExerciseLogDetails } from "@/components/exercise/exercise-log-details";
import { ExerciseReviewPanel, type ActiveExerciseReview } from "@/components/exercise/exercise-review-panel";
import { ExerciseStickerCalendar } from "@/components/exercise/exercise-sticker-calendar";
import { ExerciseStickerPicker } from "@/components/exercise/exercise-sticker-picker";
import { PageHeader } from "@/components/layout/page-header";
import { ResponsiveDetailPanel } from "@/components/layout/responsive-detail-panel";
import { Button } from "@/components/ui/button";
import { exerciseRecordFromEvent } from "@/lib/exercise/domain";
import type { ExerciseLogWithReview } from "@/lib/exercise/repository";
import type { EventRow, ExerciseRecordType, ExerciseStickerRow } from "@/types/database";

interface ExerciseWorkspaceProps {
  readonly dataAvailable?: boolean;
  readonly events: readonly EventRow[];
  readonly initialDate?: string;
  readonly initialOpen?: boolean;
  readonly logs?: readonly ExerciseLogWithReview[];
  readonly month?: string;
  readonly recentLogs?: readonly ExerciseLogWithReview[];
  readonly stickers?: readonly ExerciseStickerRow[];
  readonly today: string;
}

type CreatedLog = { readonly logId: string; readonly recordType: ExerciseRecordType };

export function ExerciseWorkspace({ dataAvailable = true, events, initialDate, initialOpen = false, logs = [], month, recentLogs = logs, stickers = [], today }: ExerciseWorkspaceProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(initialOpen);
  const [activeReview, setActiveReview] = useState<ActiveExerciseReview | null>(null);
  const [selectedDate, setSelectedDate] = useState(initialDate ?? today);
  const createTriggerRef = useRef<HTMLButtonElement>(null);
  const reviewTriggerRef = useRef<HTMLButtonElement>(null);
  const activeDate = initialDate ?? today;
  const activeMonth = month ?? activeDate.slice(0, 7);
  const records = events.map(exerciseRecordFromEvent).sort((left, right) => `${left.date}${left.startTime}`.localeCompare(`${right.date}${right.startTime}`));
  const latestLogs = [...recentLogs].sort((left, right) => right.exercise_date.localeCompare(left.exercise_date)).slice(0, 5);

  function openCreate(button: HTMLButtonElement): void {
    createTriggerRef.current = button;
    setCreateOpen(true);
  }

  function openReview(review: ActiveExerciseReview, button: HTMLButtonElement): void {
    reviewTriggerRef.current = button;
    setActiveReview(review);
  }

  function handleCreated(log: CreatedLog): void {
    setCreateOpen(false);
    if (log.recordType !== "exercise") {
      reviewTriggerRef.current = createTriggerRef.current;
      setActiveReview({ logId: log.logId, recordType: log.recordType });
    }
  }

  function createButton(): ReactNode {
    return <Button onClick={(event) => openCreate(event.currentTarget)}><Plus aria-hidden="true" size={17} />운동 기록</Button>;
  }

  const visibleSelectedDate = selectedDate.startsWith(activeMonth) ? selectedDate : `${activeMonth}-01`;
  return <main className="page-canvas exercise-page">
    <PageHeader action={dataAvailable ? createButton() : undefined} description="운동한 날에 가볍게 성취 스티커를 남겨보세요." title="운동" />
    {dataAvailable ? <>
      <ExerciseStickerCalendar initialDate={activeDate} key={activeMonth} logs={logs} month={activeMonth} onOpenReview={openReview} onSelectDate={setSelectedDate} selectedDate={visibleSelectedDate} stickers={stickers} />
      {latestLogs.length > 0 && <section className="recent-exercise-section" aria-labelledby="recent-exercise-title"><div className="section-title-row"><div><h2 id="recent-exercise-title">최근 운동 기록</h2><p>최근 기록을 열어 메모를 수정하거나 삭제할 수 있습니다.</p></div></div><ExerciseLogDetails logs={latestLogs} onOpenReview={openReview} stickers={stickers} /></section>}
      <CustomExerciseStickerForm stickers={stickers} />
    </> : <section className="settings-error" role="alert"><h2>운동 스티커를 불러오지 못했습니다.</h2><p>데이터 연결을 확인한 뒤 다시 시도해 주세요. 기존 운동 일정은 아래에서 계속 확인할 수 있습니다.</p><button className="button button--secondary" onClick={() => router.refresh()} type="button">다시 시도</button></section>}
    {records.length > 0 && <section className="legacy-exercise-section" aria-labelledby="legacy-exercise-title"><div className="section-title-row"><div><h2 id="legacy-exercise-title">기존 운동 일정</h2><p>이전에 일정으로 등록한 운동 기록은 그대로 보존합니다.</p></div><span>{records.length}개</span></div><div className="exercise-grid">{records.map((record) => <ExerciseCard key={record.id} record={record} />)}</div></section>}
    <ResponsiveDetailPanel onClose={() => setCreateOpen(false)} open={dataAvailable && createOpen} returnFocusRef={createTriggerRef} title="오늘 운동 기록">
      <p className="exercise-sheet-intro">운동 종류와 날짜를 확인한 뒤 저장하세요.</p>
      <ExerciseStickerPicker date={selectedDate} key={selectedDate} logs={logs} onCreated={handleCreated} stickers={stickers} />
    </ResponsiveDetailPanel>
    {activeReview && <ResponsiveDetailPanel onClose={() => setActiveReview(null)} open panelClassName="detail-panel--exercise-review" returnFocusRef={reviewTriggerRef} title={activeReview.recordType === "lesson" ? "레슨 리뷰" : "대회 리뷰"}>
      <ExerciseReviewPanel active={activeReview} logs={[...logs, ...recentLogs]} />
    </ResponsiveDetailPanel>}
  </main>;
}
