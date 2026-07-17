"use client";

import { Dumbbell, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useRef, useState } from "react";

import { ExerciseCard } from "@/components/exercise/exercise-card";
import { ExerciseForm } from "@/components/exercise/exercise-form";
import { PageHeader } from "@/components/layout/page-header";
import { ResponsiveDetailPanel } from "@/components/layout/responsive-detail-panel";
import { Button } from "@/components/ui/button";
import { exerciseRecordFromEvent } from "@/lib/exercise/domain";
import type { EventRow } from "@/types/database";

interface ExerciseWorkspaceProps {
  readonly events: readonly EventRow[];
  readonly initialOpen?: boolean;
  readonly today: string;
}

export function ExerciseWorkspace({ events, initialOpen = false, today }: ExerciseWorkspaceProps) {
  const [open, setOpen] = useState(initialOpen);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);
  const router = useRouter();
  const records = events.map(exerciseRecordFromEvent).sort((left, right) => `${left.date}${left.startTime}`.localeCompare(`${right.date}${right.startTime}`));
  const planned = records.filter((record) => record.status === "planned");
  const history = records.filter((record) => record.status !== "planned");

  function openPanel(button: HTMLButtonElement): void {
    triggerRef.current = button;
    setOpen(true);
  }

  function createButton(): ReactNode {
    return <Button onClick={(event) => openPanel(event.currentTarget)}><Plus aria-hidden="true" size={17} />운동 기록 추가</Button>;
  }

  function closeAfterSave(): void {
    setOpen(false);
    router.refresh();
  }

  return <main className="page-canvas exercise-page">
    <PageHeader action={records.length ? createButton() : undefined} description="예정된 운동과 최근 기록을 한곳에서 관리합니다." title="운동" />
    {records.length === 0 ? <section className="empty-state empty-state--featured exercise-empty">
      <span className="empty-state__icon"><Dumbbell aria-hidden="true" size={24} /></span>
      <div className="empty-state__content"><h3>첫 운동 기록을 남겨보세요.</h3><p>운동 일정과 최근 기록을 한곳에서 관리할 수 있습니다.</p>{createButton()}</div>
    </section> : <div className="exercise-sections">
      <section aria-labelledby="planned-exercise-title"><div className="section-title-row"><div><h2 id="planned-exercise-title">예정된 운동</h2><p>앞으로 진행할 운동 일정입니다.</p></div><span>{planned.length}개</span></div>{planned.length ? <div className="exercise-grid">{planned.map((record) => <ExerciseCard key={record.id} record={record} />)}</div> : <div className="empty-state"><div><h3>예정된 운동이 없습니다.</h3><p>새 운동 일정을 추가해 보세요.</p></div></div>}</section>
      <section aria-labelledby="exercise-history-title"><div className="section-title-row"><div><h2 id="exercise-history-title">완료·취소 기록</h2><p>완료했거나 취소한 운동 기록입니다.</p></div><span>{history.length}개</span></div>{history.length ? <div className="exercise-grid">{history.map((record) => <ExerciseCard key={record.id} record={record} />)}</div> : <div className="empty-state"><div><h3>아직 지난 기록이 없습니다.</h3><p>운동을 완료하면 이곳에 모아 보여드립니다.</p></div></div>}</section>
    </div>}
    <ResponsiveDetailPanel footer={<><Button onClick={() => setOpen(false)} variant="secondary">취소</Button><Button form="exercise-create-form" type="submit">저장</Button></>} initialFocusRef={typeRef} onClose={() => setOpen(false)} open={open} returnFocusRef={triggerRef} title="운동 기록 추가">
      <ExerciseForm onSaved={closeAfterSave} today={today} typeRef={typeRef} />
    </ResponsiveDetailPanel>
  </main>;
}
