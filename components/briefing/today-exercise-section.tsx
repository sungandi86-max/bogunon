import Link from "next/link";

import { ExerciseSticker } from "@/components/exercise/exercise-sticker";
import { ExerciseStickerPicker } from "@/components/exercise/exercise-sticker-picker";
import type { ExerciseLogRow, ExerciseStickerRow } from "@/types/database";

export function TodayExerciseSection({ logs, stickers, today }: { readonly logs: readonly ExerciseLogRow[]; readonly stickers: readonly ExerciseStickerRow[]; readonly today: string }) {
  const todayLogs = logs.filter((log) => log.exercise_date === today);
  const stickerById = new Map(stickers.map((sticker) => [sticker.id, sticker]));
  const firstTodayLog = todayLogs[0];
  const firstStickerLabel = firstTodayLog ? stickerById.get(firstTodayLog.sticker_id)?.label ?? "운동" : "운동";
  return <section className="today-exercise-card" aria-labelledby="exercise-title"><div className="mobile-card-heading"><div><span>가벼운 성취 기록</span><h2 id="exercise-title">오늘의 운동</h2></div><Link href="/exercise">운동 달력</Link></div>{todayLogs.length ? <div className="today-exercise-done"><div>{todayLogs.map((log) => { const sticker = stickerById.get(log.sticker_id); return sticker ? <ExerciseSticker completed key={log.id} sticker={sticker} size="md" /> : null; })}</div><strong>{todayLogs.length === 1 ? `${firstStickerLabel} 했다!` : `오늘 운동 ${todayLogs.length}개 했다!`}</strong></div> : <><p>오늘 운동했나요? 자주 쓰는 스티커를 바로 붙여보세요.</p><ExerciseStickerPicker compact date={today} logs={logs} stickers={stickers} /><Link className="today-exercise-more" href="/exercise?create=sticker">스티커 더보기</Link></>}</section>;
}
