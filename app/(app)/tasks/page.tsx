import { MobileCreateButton } from "@/components/layout/mobile-create-button";
import { PageHeader } from "@/components/layout/page-header";
import { TaskWorkspace } from "@/components/tasks/task-workspace";
import { todayInSeoul } from "@/lib/work-items/date";
import { ensureRecurringTasks, listAllEvents, listTasks } from "@/lib/work-items/repository";

export default async function TasksPage() {
  const today = todayInSeoul();
  await ensureRecurringTasks(today);
  const [tasks, events] = await Promise.all([listTasks(), listAllEvents()]);
  return <main className="page-canvas"><PageHeader action={<MobileCreateButton />} description="업무를 검색하고 카테고리, 반복 주기와 상태를 관리합니다." title="업무" /><TaskWorkspace events={events} tasks={tasks} today={today} /></main>;
}
