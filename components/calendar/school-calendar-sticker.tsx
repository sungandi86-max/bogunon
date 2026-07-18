import Image from "next/image";

import { calendarStickerByKey } from "@/lib/calendar-stickers/catalog";

export function SchoolCalendarSticker({ stickerKey, compact = false }: { readonly stickerKey: string; readonly compact?: boolean }) {
  const definition = calendarStickerByKey(stickerKey);
  if (!definition) return <span className="school-sticker-fallback" aria-label="학교 날짜 스티커">학교</span>;
  const size = compact ? 24 : 34;
  return <span className={`school-calendar-sticker${compact ? " is-compact" : ""}`} title={definition.label}><Image alt="" aria-hidden="true" height={size} src={definition.assetPath} width={size} /><span>{definition.label}</span></span>;
}
