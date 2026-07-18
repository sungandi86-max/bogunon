import { CalendarDateSticker } from "@/components/calendar/calendar-date-sticker";

export function SchoolCalendarSticker({ stickerKey, compact = false, highlighted = false }: { readonly stickerKey: string; readonly compact?: boolean; readonly highlighted?: boolean }) {
  return <CalendarDateSticker compact={compact} highlighted={highlighted} stickerKey={stickerKey} />;
}
