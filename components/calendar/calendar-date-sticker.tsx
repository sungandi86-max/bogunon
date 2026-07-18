import Image from "next/image";

import { calendarStickerByKey, calendarStickerCategory } from "@/lib/calendar-stickers/catalog";

export function CalendarDateSticker({ stickerKey, compact = false, highlighted = false }: { readonly stickerKey: string; readonly compact?: boolean; readonly highlighted?: boolean }) {
  const definition = calendarStickerByKey(stickerKey);
  const category = calendarStickerCategory(stickerKey);
  if (!definition) return <span className="school-sticker-fallback" aria-label="날짜 스티커">날짜</span>;
  const size = compact ? 24 : 34;
  return <span className={`school-calendar-sticker is-${category}${compact ? " is-compact" : ""}${highlighted ? " is-highlighted" : ""}`} title={definition.label}><Image alt="" aria-hidden="true" height={size} src={definition.assetPath} width={size} /><span>{definition.label}</span></span>;
}
