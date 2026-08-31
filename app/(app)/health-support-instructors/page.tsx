import { HealthSupportInstructorWorkspace } from "@/components/health-support-instructors/health-support-instructor-workspace";
import { PageHeader } from "@/components/layout/page-header";
import { saveHealthSupportAttendanceConfirmerNameAction, saveHealthSupportInstructorAction, saveHealthSupportWorkLogAction } from "@/app/(app)/health-support-instructors/actions";
import { listHealthSupportInstructors, listHealthSupportWorkLogs } from "@/lib/health-support-instructors/repository";
import { listAllEvents } from "@/lib/work-items/repository";
import { getHealthSupportAttendanceConfirmerName } from "@/lib/settings/repository";

export default async function HealthSupportInstructorsPage() {
  const [calendarEvents, instructors, workLogs, confirmerName] = await Promise.all([listAllEvents(), listHealthSupportInstructors(), listHealthSupportWorkLogs(), getHealthSupportAttendanceConfirmerName().catch(() => "")]);
  return <main className="health-support-instructors-page"><div className="page-canvas"><PageHeader description="근무기록과 월 정산, 제출 서류를 한 곳에서 관리합니다." title="보건지원강사 관리" /><HealthSupportInstructorWorkspace calendarEvents={calendarEvents} confirmerName={confirmerName} instructors={instructors} saveConfirmerName={saveHealthSupportAttendanceConfirmerNameAction} saveInstructor={saveHealthSupportInstructorAction} saveWorkLog={saveHealthSupportWorkLogAction} workLogs={workLogs} /></div></main>;
}
