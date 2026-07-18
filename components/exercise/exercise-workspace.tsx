"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useRef, useState } from "react";

import { CustomExerciseStickerForm } from "@/components/exercise/custom-exercise-sticker-form";
import { ExerciseCard } from "@/components/exercise/exercise-card";
import { ExerciseStickerCalendar } from "@/components/exercise/exercise-sticker-calendar";
import { ExerciseStickerPicker } from "@/components/exercise/exercise-sticker-picker";
import { PageHeader } from "@/components/layout/page-header";
import { ResponsiveDetailPanel } from "@/components/layout/responsive-detail-panel";
import { Button } from "@/components/ui/button";
import { exerciseRecordFromEvent } from "@/lib/exercise/domain";
import type { EventRow, ExerciseLogRow, ExerciseStickerRow } from "@/types/database";

interface ExerciseWorkspaceProps {
  readonly dataAvailable?: boolean;
  readonly events: readonly EventRow[];
  readonly initialOpen?: boolean;
  readonly logs?: readonly ExerciseLogRow[];
  readonly month?: string;
  readonly stickers?: readonly ExerciseStickerRow[];
  readonly today: string;
}

export function ExerciseWorkspace({ dataAvailable = true, events, initialOpen = false, logs = [], month, stickers = [], today }: ExerciseWorkspaceProps) {
  const router = useRouter();
  const [open, setOpen] = useState(initialOpen);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const records = events.map(exerciseRecordFromEvent).sort((left, right) => `${left.date}${left.startTime}`.localeCompare(`${right.date}${right.startTime}`));

  function openPanel(button: HTMLButtonElement): void {
    triggerRef.current = button;
    setOpen(true);
  }

  function createButton(): ReactNode {
    return <Button onClick={(event) => openPanel(event.currentTarget)}><Plus aria-hidden="true" size={17} />운동 스티커 붙이기</Button>;
  }

  return <main className="page-canvas exercise-page">
    <PageHeader action={dataAvailable ? createButton() : undefined} description="운동한 날에 가볍게 성취 스티커를 남겨보세요." title="운동" />
    {dataAvailable ? <><ExerciseStickerCalendar initialDate={today} key={month ?? today.slice(0, 7)} logs={logs} month={month ?? today.slice(0, 7)} stickers={stickers} /><CustomExerciseStickerForm stickers={stickers} /></> : <section className="settings-error" role="alert"><h2>운동 스티커를 불러오지 못했습니다.</h2><p>데이터 연결을 확인한 뒤 다시 시도해 주세요. 기존 운동 일정은 아래에서 계속 확인할 수 있습니다.</p><button className="button button--secondary" onClick={() => router.refresh()} type="button">다시 시도</button></section>}
    {records.length > 0 && <section className="legacy-exercise-section" aria-labelledby="legacy-exercise-title"><div className="section-title-row"><div><h2 id="legacy-exercise-title">기존 운동 일정</h2><p>이전에 일정으로 등록한 운동 기록은 그대로 보존합니다.</p></div><span>{records.length}개</span></div><div className="exercise-grid">{records.map((record) => <ExerciseCard key={record.id} record={record} />)}</div></section>}
    <ResponsiveDetailPanel onClose={() => setOpen(false)} open={dataAvailable && open} returnFocusRef={triggerRef} title="오늘 운동했나요?">
      <p className="exercise-sheet-intro">스티커를 탭하면 오늘 날짜에 바로 기록됩니다.</p>
      <ExerciseStickerPicker date={today} logs={logs} stickers={stickers} />
    </ResponsiveDetailPanel>
  </main>;
}
