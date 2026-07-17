import { Clock3, ShieldCheck } from "lucide-react";

import type { EventRow } from "@/types/database";

const dateLabel = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", weekday: "long" });

export function BriefingHeader({ priorityCount, nextEvent, today }: { readonly priorityCount: number; readonly nextEvent: EventRow | undefined; readonly today: string }) {
  const date = new Date(`${today}T00:00:00+09:00`);
  const summary = nextEvent
    ? `오늘 우선 업무 ${priorityCount}개가 있습니다. 다음 일정은 ${nextEvent.is_all_day ? "종일" : nextEvent.start_time?.slice(0, 5) ?? "시간 미정"} ${nextEvent.title}입니다.`
    : `오늘 우선 업무 ${priorityCount}개가 있습니다. 등록된 오늘 일정은 없습니다.`;
  return <header className="briefing-header"><div><p className="briefing-header__date">{dateLabel.format(date)}</p><p className="briefing-header__summary">{summary}</p></div><div className="work-status" aria-label="현재 근무 상태"><span><ShieldCheck aria-hidden="true" size={17} />업무 운영 중</span><strong><Clock3 aria-hidden="true" size={15} /> Supabase 저장</strong></div></header>;
}
