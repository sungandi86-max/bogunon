import { MobileCreateButton } from "@/components/layout/mobile-create-button";
import { PageHeader } from "@/components/layout/page-header";
import { TaskList } from "@/components/tasks/task-list";
import { listTasks } from "@/lib/work-items/repository";

export default async function TasksPage() {
  const tasks = await listTasks();
  return <main className="page-canvas"><PageHeader action={<MobileCreateButton />} description="업무를 생성하고 상태, 우선순위와 날짜를 관리합니다." title="업무" /><TaskList tasks={tasks} /></main>;
}
