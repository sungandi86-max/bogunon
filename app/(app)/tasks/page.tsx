import { MobileCreateButton } from "@/components/layout/mobile-create-button";
import { PageHeader } from "@/components/layout/page-header";
import { HealthPresetQuickAdd } from "@/components/tasks/health-preset-quick-add";
import { TaskWorkspace } from "@/components/tasks/task-workspace";
import { todayInSeoul } from "@/lib/work-items/date";
import { ensureRecurringTasks, listAllEvents, listTasks } from "@/lib/work-items/repository";
import { listWorkflowData } from "@/lib/work-items/phase5-repository";
import { listHealthWorkflowData } from "@/lib/workflows/repository";

export default async function TasksPage() {
  const today = todayInSeoul();
  await ensureRecurringTasks(today);
  const [tasks, events, workflow, healthWorkflows] = await Promise.all([listTasks(), listAllEvents(), listWorkflowData(), listHealthWorkflowData()]);
  return <main className="page-canvas"><PageHeader action={<MobileCreateButton />} description="업무를 검색하고 카테고리, 반복 주기와 상태를 관리합니다." title="업무" /><HealthPresetQuickAdd /><TaskWorkspace events={events} healthWorkflows={healthWorkflows} tasks={tasks} today={today} workflow={workflow} /></main>;
}
