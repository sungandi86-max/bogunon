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
import type { EventDetails } from "@/lib/work-items/event-types";
import type { EventRow, ExerciseRecordType, ExerciseStickerRow } from "@/types/database";

interface ExerciseWorkspaceProps {
  readonly dataAvailable?: boolean;
  readonly events: readonly EventRow[];
  readonly initialDate?: string;
  readonly initialEvent?: EventRow;
  readonly initialEventDetails?: EventDetails | null;
  readonly initialLogId?: string;
  readonly initialOpen?: boolean;
  readonly initialRecordType?: ExerciseRecordType;
  readonly logs?: readonly ExerciseLogWithReview[];
  readonly month?: string;
  readonly recordEntryError?: string;
  readonly recentLogs?: readonly ExerciseLogWithReview[];
  readonly returnTo?: string;
  readonly stickers?: readonly ExerciseStickerRow[];
  readonly today: string;
}

type CreatedLog = { readonly logId: string; readonly recordType: ExerciseRecordType };

export function ExerciseWorkspace({ dataAvailable = true, events, initialDate, initialEvent, initialEventDetails, initialLogId, initialOpen = false, initialRecordType = "exercise", logs = [], month, recordEntryError, recentLogs = logs, returnTo, stickers = [], today }: ExerciseWorkspaceProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(initialOpen);
  const [activeReview, setActiveReview] = useState<ActiveExerciseReview | null>(null);
  const linkedLog = [...logs, ...recentLogs].find((log) => log.id === initialLogId);
  const eventLinkedLog = initialEvent
    ? [...logs, ...recentLogs].find((log) => log.event_id === initialEvent.id)
    : undefined;
  const [linkedLogOpen, setLinkedLogOpen] = useState(Boolean(linkedLog));
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

  function closeCreate(): void {
    if (initialOpen) router.replace(`/exercise?month=${activeMonth}`, { scroll: false });
    setCreateOpen(false);
  }

  function handleCreated(log: CreatedLog): void {
    closeCreate();
    if (log.recordType !== "exercise") {
      reviewTriggerRef.current = createTriggerRef.current;
      const competitionDefaults = initialEventDetails?.kind === "tournament" ? {
          competitionName: initialEventDetails.tournamentName || initialEvent?.title || "",
          eventCategory: initialEventDetails.discipline,
          grade: initialEventDetails.level,
          location: initialEvent?.location ?? "",
          partner: initialEventDetails.partner,
        } : null;
      setActiveReview({
        logId: log.logId,
        recordType: log.recordType,
        ...(competitionDefaults ? { competitionDefaults } : {}),
      });
    }
  }

  function createButton(): ReactNode {
    return <Button onClick={(event) => openCreate(event.currentTarget)}><Plus aria-hidden="true" size={17} />운동 기록</Button>;
  }

  const visibleSelectedDate = selectedDate.startsWith(activeMonth) ? selectedDate : `${activeMonth}-01`;
  return <main className="page-canvas exercise-page">
    <PageHeader action={dataAvailable ? createButton() : undefined} description="운동한 날에 가볍게 성취 스티커를 남겨보세요." title="운동" />
    {dataAvailable ? <>
      {recordEntryError && <section className="settings-error" role="alert"><p>{recordEntryError}</p></section>}
      <ExerciseStickerCalendar initialDate={activeDate} key={activeMonth} logs={logs} month={activeMonth} onOpenReview={openReview} onSelectDate={setSelectedDate} selectedDate={visibleSelectedDate} stickers={stickers} />
      {latestLogs.length > 0 && <section className="recent-exercise-section" aria-labelledby="recent-exercise-title"><div className="section-title-row"><div><h2 id="recent-exercise-title">최근 운동 기록</h2><p>최근 기록을 열어 메모를 수정하거나 삭제할 수 있습니다.</p></div></div><ExerciseLogDetails logs={latestLogs} onOpenReview={openReview} stickers={stickers} /></section>}
      <CustomExerciseStickerForm stickers={stickers} />
    </> : <section className="settings-error" role="alert"><h2>운동 스티커를 불러오지 못했습니다.</h2><p>데이터 연결을 확인한 뒤 다시 시도해 주세요. 기존 운동 일정은 아래에서 계속 확인할 수 있습니다.</p><button className="button button--secondary" onClick={() => router.refresh()} type="button">다시 시도</button></section>}
    {records.length > 0 && <section className="legacy-exercise-section" aria-labelledby="legacy-exercise-title"><div className="section-title-row"><div><h2 id="legacy-exercise-title">기존 운동 일정</h2><p>이전에 일정으로 등록한 운동 기록은 그대로 보존합니다.</p></div><span>{records.length}개</span></div><div className="exercise-grid">{records.map((record) => <ExerciseCard key={record.id} record={record} />)}</div></section>}
    <ResponsiveDetailPanel onClose={closeCreate} open={dataAvailable && createOpen} returnFocusRef={createTriggerRef} title={initialEvent ? "운동 기록" : "오늘 운동 기록"}>
      {!initialEvent && <p className="exercise-sheet-intro">운동 종류와 날짜를 확인한 뒤 저장하세요.</p>}
      <ExerciseStickerPicker
        date={selectedDate}
        initialRecordType={initialRecordType}
        key={`${selectedDate}:${initialEvent?.id ?? "manual"}`}
        logs={logs}
        onCreated={handleCreated}
        stickers={stickers}
        {...(initialEvent ? { event: initialEvent } : {})}
        {...(initialEvent ? { eventId: initialEvent.id } : {})}
        {...(eventLinkedLog ? { existingLog: eventLinkedLog } : {})}
        {...(returnTo ? { returnTo } : {})}
        {...(initialEventDetails?.kind === "workout" ? { initialWorkoutType: initialEventDetails.workoutType } : {})}
      />
    </ResponsiveDetailPanel>
    {activeReview && <ResponsiveDetailPanel onClose={() => setActiveReview(null)} open panelClassName="detail-panel--exercise-review" returnFocusRef={reviewTriggerRef} title={activeReview.recordType === "lesson" ? "레슨 리뷰" : "대회 리뷰"}>
      <ExerciseReviewPanel active={activeReview} logs={[...logs, ...recentLogs]} />
    </ResponsiveDetailPanel>}
    {linkedLog && <ResponsiveDetailPanel onClose={() => setLinkedLogOpen(false)} open={linkedLogOpen} returnFocusRef={createTriggerRef} title="운동 기록 보기">
      <ExerciseLogDetails logs={[linkedLog]} onOpenReview={openReview} stickers={stickers} />
    </ResponsiveDetailPanel>}
  </main>;
}
