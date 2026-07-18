import Image from "next/image";

import { exerciseAssetPath } from "@/lib/exercise/stickers";
import type { ExerciseStickerRow } from "@/types/database";

const sizes = { xs: 24, sm: 32, md: 48, lg: 72 } as const;

interface ExerciseStickerProps {
  readonly sticker: Pick<ExerciseStickerRow, "icon_key" | "label"> & Partial<Pick<ExerciseStickerRow, "color_key">>;
  readonly size?: keyof typeof sizes;
  readonly selected?: boolean;
  readonly completed?: boolean;
  readonly disabled?: boolean;
  readonly removable?: boolean;
}

export function ExerciseSticker({ sticker, size = "md", selected = false, completed = false, disabled = false, removable = false }: ExerciseStickerProps) {
  const pixels = sizes[size];
  const showCheck = selected || completed;
  return (
    <span
      aria-label={`${sticker.label} 운동 스티커${selected ? ", 선택됨" : ""}${completed ? ", 완료" : ""}${disabled ? ", 비활성" : ""}${removable ? ", 제거 가능" : ""}`}
      className={`exercise-sticker exercise-sticker--${size} exercise-sticker--${sticker.color_key ?? "mint"}${selected ? " is-selected" : ""}${completed ? " is-completed" : ""}${disabled ? " is-disabled" : ""}${removable ? " is-removable" : ""}`}
      role="img"
    >
      <Image alt="" aria-hidden="true" height={pixels} src={exerciseAssetPath(sticker.icon_key)} width={pixels} />
      {showCheck && <span aria-hidden="true" className="exercise-sticker__check">✓</span>}
    </span>
  );
}
