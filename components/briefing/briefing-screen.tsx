import { FullMonthCalendar } from "@/components/calendar/full-month-calendar";
import { MobileWeekStrip } from "@/components/calendar/mobile-week-strip";
import { BriefingHeader } from "@/components/briefing/briefing-header";
import { OperationsRail } from "@/components/briefing/operations-rail";
import { WeeklySummary } from "@/components/briefing/weekly-summary";
import { MobileCreateButton } from "@/components/layout/mobile-create-button";
import { PageHeader } from "@/components/layout/page-header";

export function BriefingScreen() {
  return (
    <main className="page-canvas briefing-page">
      <PageHeader action={<MobileCreateButton />} eyebrow="오늘" title="오늘의 브리핑" description="오늘 행동과 기다리는 업무를 먼저 확인하세요." />
      <MobileWeekStrip />
      <div className="operations-dashboard">
        <div className="operations-main">
          <BriefingHeader />
          <WeeklySummary />
          <section className="month-overview" aria-labelledby="month-overview-title">
            <div className="section-heading month-overview__heading">
              <div>
                <p>월간 통합 캘린더</p>
                <h2 id="month-overview-title">2026년 7월</h2>
              </div>
              <div className="calendar-legend" aria-label="업무 범주 범례">
                <span className="legend-health">보건업무</span><span className="legend-school">학교일정</span>
                <span className="legend-deadline">제출·마감</span><span className="legend-exercise">운동</span>
                <span className="legend-project">프로젝트</span>
              </div>
            </div>
            <FullMonthCalendar />
          </section>
        </div>
        <OperationsRail />
      </div>
    </main>
  );
}
