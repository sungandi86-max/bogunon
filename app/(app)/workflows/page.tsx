import { MobileCreateButton } from "@/components/layout/mobile-create-button";
import { PageHeader } from "@/components/layout/page-header";
import { WorkflowWorkspace } from "@/components/workflows/workflow-workspace";
import { listTasks } from "@/lib/work-items/repository";
import { listHealthWorkflowData } from "@/lib/workflows/repository";
import { AssistantTrigger } from "@/components/ai/assistant-trigger";

export default async function WorkflowsPage() {
  const [tasks, data] = await Promise.all([listTasks(), listHealthWorkflowData()]);
  return <main className="page-canvas workflow-page"><PageHeader action={<div className="page-header__actions"><AssistantTrigger surface="workflow" /><MobileCreateButton /></div>} description="보건업무 절차의 현재 단계와 다음 행동을 관리합니다." title="Workflow" /><WorkflowWorkspace data={data} tasks={tasks} /></main>;
}
