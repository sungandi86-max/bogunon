import { CalendarView } from "@/components/calendar/calendar-view";
import { MobileCreateButton } from "@/components/layout/mobile-create-button";
import { PageHeader } from "@/components/layout/page-header";

export default function CalendarPage() {
  return (
    <main className="calendar-page">
      <div className="page-canvas">
        <PageHeader
          action={<MobileCreateButton />}
          description="일정, 수행일, 마감일과 운동 일정을 함께 살펴봅니다."
          title="캘린더"
        />
        <CalendarView />
      </div>
    </main>
  );
}
