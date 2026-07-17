import Link from "next/link";
import { ArrowRight, GitBranch } from "lucide-react";
import { calculateWorkflowProgress, deriveNextWorkflowAction } from "@/lib/workflows/domain";
import type { HealthWorkflowData } from "@/types/workflows";

export function WorkflowBriefing({ data }: { readonly data: HealthWorkflowData }) {
  const active = data.instances.filter((item) => item.status === "active").slice(0, 3);
  return <section className="workflow-briefing" aria-labelledby="workflow-briefing-title"><div className="section-heading"><div><p>업무 절차</p><h2 id="workflow-briefing-title">진행 중인 Workflow</h2></div><Link href="/workflows">전체 보기 <ArrowRight size={14} /></Link></div>{active.length ? <div className="workflow-briefing__list">{active.map((instance) => {
    const steps = data.steps.filter((item) => item.instance_id === instance.id).map((step) => ({ id: step.id, name: step.name, position: step.position, status: step.status, incompleteChecklist: data.checklistItems.filter((item) => item.workflow_step_id === step.id && !item.is_completed).length }));
    const progress = calculateWorkflowProgress(steps); const next = deriveNextWorkflowAction(steps);
    return <Link href={`/workflows#workflow-${instance.id}`} key={instance.id}><GitBranch size={17} /><span><strong>{instance.name}</strong><small>{progress.completed}/{progress.total} 완료 · 현재 {next.stepName ?? "완료 확인"}</small></span><b>{progress.percentage}%</b></Link>;
  })}</div> : <p className="workflow-briefing__empty">진행 중인 Workflow가 없습니다. 업무에 절차를 적용해 보세요.</p>}</section>;
}
