import {
  Activity,
  Bike,
  Dumbbell,
  Footprints,
  PersonStanding,
  Waves,
  type LucideProps,
} from "lucide-react";

import type { ExerciseStickerRow } from "@/types/database";

const iconSizes = { xs: 16, sm: 20, md: 24, lg: 32 } as const;
const iconStrokeWidth = 1.8;

interface ExerciseStickerProps {
  readonly sticker: { readonly icon_key: string; readonly label: string } & Partial<Pick<ExerciseStickerRow, "color_key">>;
  readonly size?: keyof typeof iconSizes;
  readonly selected?: boolean;
  readonly completed?: boolean;
  readonly disabled?: boolean;
  readonly eager?: boolean;
  readonly removable?: boolean;
}

function BadmintonIcon({ size = 24, ...props }: LucideProps) {
  return <svg {...props} fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" width={size}>
    <path data-shuttlecock-part="cork" d="M6.1 15.8 7 14.9 10.1 17.8 9.1 18.7 6.1 15.8" />
    <path data-shuttlecock-part="feather-face" d="M7.1 15.1 4.6 6.4a2.4 2.4 0 0 1 3.9-2.3l2.3 1.9-1.6 9.8" />
    <path data-shuttlecock-part="feather-face" d="M8.9 16.6 11.2 3.4a2.5 2.5 0 0 1 4.7-.6l1.4 2.8-5.8 11" />
    <path data-shuttlecock-part="feather-face" d="M10.4 17.6 18.1 4.2a2.4 2.4 0 0 1 4.2 1.2l-.2 2.3a2.6 2.6 0 0 1-1.5 2l-7.8 7.6" />
    <path data-shuttlecock-part="feather-separation" d="M9.1 14.4 10.6 7.1" />
    <path data-shuttlecock-part="feather-separation" d="M11.8 15.8 17.3 8.4" />
    <path data-shuttlecock-part="motion-line" d="M7.4 20.5 5.1 22" />
    <path data-shuttlecock-part="motion-line" d="M4.9 18.2 2.9 19.4" />
  </svg>;
}

function iconForKey(iconKey: string, props: LucideProps) {
  switch (iconKey) {
    case "badminton":
    case "badminton_lesson":
      return <BadmintonIcon {...props} data-exercise-icon="badminton" />;
    case "walking":
      return <Footprints {...props} data-exercise-icon="walking" />;
    case "running":
      return <Activity {...props} data-exercise-icon="running" />;
    case "strength":
      return <Dumbbell {...props} data-exercise-icon="strength" />;
    case "stretching":
      return <PersonStanding {...props} data-exercise-icon="stretching" />;
    case "cycling":
      return <Bike {...props} data-exercise-icon="cycling" />;
    case "swimming":
      return <Waves {...props} data-exercise-icon="swimming" />;
    case "other":
    default:
      return <Activity {...props} data-exercise-icon="other" />;
  }
}

export function ExerciseSticker({ sticker, size = "md", selected = false, completed = false, disabled = false, removable = false }: ExerciseStickerProps) {
  const showCheck = selected || completed;
  return (
    <span
      aria-label={`${sticker.label} 운동 스티커${selected ? ", 선택됨" : ""}${completed ? ", 완료" : ""}${disabled ? ", 비활성" : ""}${removable ? ", 제거 가능" : ""}`}
      className={`exercise-sticker exercise-sticker--${size} exercise-sticker--${sticker.color_key ?? "mint"}${selected ? " is-selected" : ""}${completed ? " is-completed" : ""}${disabled ? " is-disabled" : ""}${removable ? " is-removable" : ""}`}
      role="img"
    >
      {iconForKey(sticker.icon_key, { "aria-hidden": true, size: iconSizes[size], stroke: "currentColor", strokeWidth: iconStrokeWidth })}
      {showCheck && <span aria-hidden="true" className="exercise-sticker__check">✓</span>}
    </span>
  );
}
