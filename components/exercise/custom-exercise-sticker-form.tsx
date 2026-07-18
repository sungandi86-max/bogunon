"use client";

import { useActionState } from "react";

import { removeCustomExerciseStickerAction, saveCustomExerciseStickerAction, type StickerActionState } from "@/app/(app)/exercise-sticker-actions";
import { ExerciseSticker } from "@/components/exercise/exercise-sticker";
import { DEFAULT_EXERCISE_STICKERS } from "@/lib/exercise/stickers";
import type { ExerciseStickerColorKey, ExerciseStickerRow } from "@/types/database";

const initialState: StickerActionState = { status: "idle" };
const colors: readonly { value: ExerciseStickerColorKey; label: string }[] = [
  { value: "mint", label: "민트" }, { value: "pink", label: "핑크" }, { value: "yellow", label: "옐로" }, { value: "coral", label: "코랄" }, { value: "blue", label: "블루" }, { value: "lavender", label: "라벤더" }, { value: "sky", label: "스카이" }, { value: "aqua", label: "아쿠아" }, { value: "cream", label: "크림" },
];

export function CustomExerciseStickerForm({ stickers = [] }: { readonly stickers?: readonly ExerciseStickerRow[] }) {
  const [state, action, pending] = useActionState(saveCustomExerciseStickerAction, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(removeCustomExerciseStickerAction, initialState);
  const custom = stickers.filter((sticker) => !sticker.is_default);
  return <details className="custom-sticker-builder"><summary>내 운동 스티커 만들기</summary><form action={action}><label>스티커 이름<input maxLength={30} name="label" placeholder="예: 요가" required /></label><fieldset><legend>모양</legend><div className="custom-sticker-icons">{DEFAULT_EXERCISE_STICKERS.map((item, index) => <label key={item.iconKey}><input defaultChecked={index === 0} name="iconKey" type="radio" value={item.iconKey} /><ExerciseSticker sticker={{ icon_key: item.iconKey, label: item.label }} size="sm" /><span>{item.label}</span></label>)}</div></fieldset><label>파스텔 배경색<select defaultValue="mint" name="colorKey">{colors.map((color) => <option key={color.value} value={color.value}>{color.label}</option>)}</select></label><button className="button" disabled={pending} type="submit">내 스티커 저장</button>{state.message && <p aria-live="polite" className="form-message">{state.message}</p>}</form>{custom.length > 0 && <div className="custom-sticker-list"><h3>내 스티커</h3>{custom.map((sticker) => <details key={sticker.id}><summary><ExerciseSticker sticker={sticker} size="sm" /><strong>{sticker.label}</strong><span>수정</span></summary><form action={action}><input name="id" type="hidden" value={sticker.id} /><label>이름<input defaultValue={sticker.label} maxLength={30} name="label" required /></label><label>모양<select defaultValue={sticker.icon_key} name="iconKey">{DEFAULT_EXERCISE_STICKERS.map((item) => <option key={item.iconKey} value={item.iconKey}>{item.label}</option>)}</select></label><label>색상<select defaultValue={sticker.color_key} name="colorKey">{colors.map((color) => <option key={color.value} value={color.value}>{color.label}</option>)}</select></label><button className="button button--secondary" disabled={pending} type="submit">수정 저장</button></form><form action={deleteAction} onSubmit={(event) => { if (!window.confirm(`${sticker.label} 스티커를 삭제할까요?`)) event.preventDefault(); }}><input name="id" type="hidden" value={sticker.id} /><button className="text-action text-action--danger" disabled={deletePending} type="submit">스티커 삭제</button></form></details>)}{deleteState.message && <p aria-live="polite" className="form-message">{deleteState.message}</p>}</div>}</details>;
}
