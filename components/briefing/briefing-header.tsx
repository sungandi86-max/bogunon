import { Check } from "lucide-react";

import type { EventRow } from "@/types/database";

const dateLabel = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", weekday: "long" });
const timeLabel = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hour12: false });

export function BriefingHeader({ eventCount, priorityCount, nextEvent, today }: { readonly eventCount: number; readonly priorityCount: number; readonly nextEvent: EventRow | undefined; readonly today: string }) {
  const date = new Date(`${today}T00:00:00+09:00`);
  const summary = nextEvent
    ? `오늘 우선 업무 ${priorityCount}개가 있습니다. 다음 일정은 ${nextEvent.is_all_day ? "종일" : nextEvent.start_time?.slice(0, 5) ?? "시간 미정"} ${nextEvent.title}입니다.`
    : `오늘 우선 업무 ${priorityCount}개가 있습니다. 등록된 오늘 일정은 없습니다.`;
  return <header className="briefing-header"><div><div className="mobile-briefing-brand"><span className="mobile-briefing-brand__mark" aria-hidden="true">온</span><strong>보건온</strong><small><i aria-hidden="true" />동기화됨</small></div><h1 className="briefing-header__date"><span>{dateLabel.format(date)}</span><time className="briefing-header__time" suppressHydrationWarning>{timeLabel.format(new Date())}</time></h1><p className="mobile-briefing-greeting">오늘 일정 {eventCount}건</p><p className="briefing-header__summary">{summary}</p></div><div className="work-status" aria-label="동기화 상태"><span><Check aria-hidden="true" size={14} />동기화됨</span></div></header>;
}
