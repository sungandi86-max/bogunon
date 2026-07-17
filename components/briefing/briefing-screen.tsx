import { CompactMonthCalendar } from "@/components/calendar/compact-month-calendar";
import { MobileWeekStrip } from "@/components/calendar/mobile-week-strip";
import { BriefingHeader } from "@/components/briefing/briefing-header";
import { DailyFocusSection } from "@/components/briefing/daily-focus-section";
import { DeadlineSection } from "@/components/briefing/deadline-section";
import { TodayExerciseSection } from "@/components/briefing/today-exercise-section";
import { TodayTimeline } from "@/components/briefing/today-timeline";
import { WaitingWorkSection } from "@/components/briefing/waiting-work-section";
import { MobileCreateButton } from "@/components/layout/mobile-create-button";
import { PageHeader } from "@/components/layout/page-header";

export function BriefingScreen() {
  return (
    <main className="page-canvas">
      <PageHeader action={<MobileCreateButton />} eyebrow="오늘" title="오늘의 브리핑" description="오늘 행동과 기다리는 업무를 먼저 확인하세요." />
      <BriefingHeader />
      <MobileWeekStrip />
      <div className="briefing-grid">
        <div className="briefing-main">
          <DailyFocusSection />
          <WaitingWorkSection />
          <TodayTimeline />
          <DeadlineSection />
          <TodayExerciseSection />
        </div>
        <CompactMonthCalendar />
      </div>
    </main>
  );
}
