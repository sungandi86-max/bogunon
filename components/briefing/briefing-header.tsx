import { Clock3, ShieldCheck } from "lucide-react";

export function BriefingHeader() {
  return (
    <header className="briefing-header">
      <div>
        <p className="briefing-header__date">7월 17일 금요일</p>
        <p className="briefing-header__summary">오늘 꼭 끝낼 일이 3개 있습니다. 다음 일정은 오후 3시 교직원 회의입니다.</p>
      </div>
      <div className="work-status" aria-label="현재 근무 상태">
        <span><ShieldCheck aria-hidden="true" size={17} />근무 중</span>
        <strong><Clock3 aria-hidden="true" size={15} /> 퇴근까지 2시간 40분</strong>
      </div>
    </header>
  );
}
