import Link from "next/link";

import { ExerciseSticker } from "@/components/exercise/exercise-sticker";
import { groupExerciseLogsByDate } from "@/lib/exercise/stickers";
import type { ExerciseLogRow, ExerciseStickerRow } from "@/types/database";

export function TodayExerciseSection({ logs, stickers, today }: { readonly logs: readonly ExerciseLogRow[]; readonly stickers: readonly ExerciseStickerRow[]; readonly today: string }) {
  const todayLogs = groupExerciseLogsByDate(logs)[today] ?? [];
  const stickerById = new Map(stickers.map((sticker) => [sticker.id, sticker]));
  return <section className="today-exercise-card" aria-labelledby="exercise-title">
    <div className="mobile-card-heading"><div><span>가벼운 성취 기록</span><h2 id="exercise-title">오늘의 운동</h2></div></div>
    {todayLogs.length > 0 ? <div className="today-exercise-records">{todayLogs.map((log) => {
      const sticker = stickerById.get(log.sticker_id);
      if (!sticker) return null;
      return <article key={log.id}><ExerciseSticker completed eager sticker={sticker} size="md" /><div><strong>{sticker.label} 했다!</strong><span>운동 완료</span></div><Link href={`/exercise?date=${today}`}>수정</Link></article>;
    })}<Link className="today-exercise-more" href="/exercise">운동 기록 보기</Link></div> : <div className="today-exercise-empty"><p>오늘 운동 기록이 없습니다.</p><Link className="button button--secondary" href={`/exercise?create=sticker&date=${today}`}>운동 기록하기</Link></div>}
  </section>;
}
