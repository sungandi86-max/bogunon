import { HealthSupportInstructorWorkspace } from "@/components/health-support-instructors/health-support-instructor-workspace";
import { PageHeader } from "@/components/layout/page-header";
import { saveHealthSupportInstructorAction, saveHealthSupportWorkLogAction } from "@/app/(app)/health-support-instructors/actions";
import { listHealthSupportInstructors, listHealthSupportWorkLogs } from "@/lib/health-support-instructors/repository";
import { listAllEvents } from "@/lib/work-items/repository";

export default async function HealthSupportInstructorsPage() {
  const [calendarEvents, instructors, workLogs] = await Promise.all([listAllEvents(), listHealthSupportInstructors(), listHealthSupportWorkLogs()]);
  return <main className="health-support-instructors-page"><div className="page-canvas"><PageHeader description="보건지원강사별 근무기록과 월 누계를 확인하고, 필요한 기록만 직접 저장합니다." title="보건지원강사 관리" /><HealthSupportInstructorWorkspace calendarEvents={calendarEvents} instructors={instructors} saveInstructor={saveHealthSupportInstructorAction} saveWorkLog={saveHealthSupportWorkLogAction} workLogs={workLogs} /></div></main>;
}
