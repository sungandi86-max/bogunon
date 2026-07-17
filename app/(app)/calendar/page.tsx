import { CalendarCreateButton } from "@/components/calendar/calendar-create-button";
import { EventList } from "@/components/calendar/event-list";
import { FullMonthCalendar } from "@/components/calendar/full-month-calendar";
import { MobileCreateButton } from "@/components/layout/mobile-create-button";
import { PageHeader } from "@/components/layout/page-header";
import { monthRange, todayInSeoul } from "@/lib/work-items/date";
import { listEvents } from "@/lib/work-items/repository";
import { listWorkflowData } from "@/lib/work-items/phase5-repository";

export default async function CalendarPage() {
  const today = todayInSeoul();
  const month = today.slice(0, 7);
  const { first, last } = monthRange(today);
  const [events, workflow] = await Promise.all([listEvents(first, last), listWorkflowData()]);
  return <main className="calendar-page"><div className="page-canvas"><PageHeader action={<MobileCreateButton kind="event" />} description="등록한 일정을 월간 달력에서 확인하고 관리합니다." title="캘린더" /><div className="calendar-toolbar calendar-page-toolbar"><strong>{month.replace("-", "년 ")}월</strong><CalendarCreateButton /></div><FullMonthCalendar events={events} month={month} /><EventList events={events} workflow={workflow} /></div></main>;
}
