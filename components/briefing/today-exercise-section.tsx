import { Dumbbell, Trophy } from "lucide-react";
import Link from "next/link";

import { ExerciseSticker } from "@/components/exercise/exercise-sticker";
import { groupExerciseLogsByDate } from "@/lib/exercise/stickers";
import { resolveEventType } from "@/lib/work-items/event-types";
import type { EventRow, ExerciseLogRow, ExerciseStickerRow } from "@/types/database";

export function TodayExerciseSection({ events, logs, stickers, today }: { readonly events: readonly EventRow[]; readonly logs: readonly ExerciseLogRow[]; readonly stickers: readonly ExerciseStickerRow[]; readonly today: string }) {
  const todayLogs = groupExerciseLogsByDate(logs)[today] ?? [];
  const todaySchedules = events
    .filter((event) => event.start_date <= today && event.end_date >= today && ["workout", "tournament"].includes(resolveEventType(event)))
    .sort((left, right) => (left.start_time ?? "23:59").localeCompare(right.start_time ?? "23:59"));
  const visibleSchedules = todaySchedules.slice(0, 2);
  const stickerById = new Map(stickers.map((sticker) => [sticker.id, sticker]));
  return <section className="today-exercise-card" aria-labelledby="exercise-title">
    <div className="mobile-card-heading"><h2 id="exercise-title">오늘의 운동</h2></div>
    {visibleSchedules.length > 0 && <div className="today-exercise-schedules">{visibleSchedules.map((event) => {
      const type = resolveEventType(event);
      const Icon = type === "tournament" ? Trophy : Dumbbell;
      const params = new URLSearchParams({ create: "sticker", date: today, eventId: event.id });
      if (type === "tournament") params.set("recordType", "competition");
      return <article key={event.id}>
        <Icon aria-hidden="true" size={18} />
        <div><span>{event.is_all_day ? "종일" : event.start_time?.slice(0, 5) ?? "시간 미정"}</span><strong>{event.title}</strong></div>
        <Link href={`/exercise?${params.toString()}`}>기록하기</Link>
      </article>;
    })}{todaySchedules.length > visibleSchedules.length && <p className="today-exercise-schedules__more">+{todaySchedules.length - visibleSchedules.length}개 일정</p>}</div>}
    {todayLogs.length > 0 ? <div className="today-exercise-records">{todayLogs.slice(0, 2).map((log) => {
      const sticker = stickerById.get(log.sticker_id);
      if (!sticker) return null;
      return <article key={log.id}><ExerciseSticker completed eager sticker={sticker} size="md" /><div><strong>{sticker.label} 했다!</strong><span>운동 완료</span></div><Link href={`/exercise?date=${today}`}>수정</Link></article>;
    })}<Link className="today-exercise-more" href="/exercise">운동 기록 보기</Link></div> : visibleSchedules.length === 0 && <div className="today-exercise-empty"><p>아직 오늘 운동 기록이 없어요.</p><Link className="button button--secondary" href={`/exercise?create=sticker&date=${today}`}>운동 기록하기</Link></div>}
  </section>;
}
