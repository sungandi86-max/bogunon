import Link from "next/link";
import { ArrowRight, GitBranch } from "lucide-react";
import { calculateWorkflowProgress, deriveNextWorkflowAction } from "@/lib/workflows/domain";
import type { HealthWorkflowData } from "@/types/workflows";

export type WorkflowBriefingItem = { readonly completed: number; readonly currentStep: string; readonly id: string; readonly name: string; readonly percentage: number; readonly total: number };

export function buildWorkflowBriefingItems(data: HealthWorkflowData): WorkflowBriefingItem[] {
  return data.instances.filter((item) => item.status === "active").slice(0, 3).map((instance) => {
    const steps = data.steps.filter((item) => item.instance_id === instance.id).map((step) => ({ id: step.id, name: step.name, position: step.position, status: step.status, incompleteChecklist: data.checklistItems.filter((item) => item.workflow_step_id === step.id && !item.is_completed).length }));
    const progress = calculateWorkflowProgress(steps); const next = deriveNextWorkflowAction(steps);
    return { completed: progress.completed, currentStep: next.stepName ?? "완료 확인", id: instance.id, name: instance.name, percentage: progress.percentage, total: progress.total };
  });
}

export function WorkflowBriefing({ compact = false, items }: { readonly compact?: boolean; readonly items: readonly WorkflowBriefingItem[] }) {
  return <section className={`workflow-briefing${compact ? " workflow-briefing--compact" : ""}`} aria-labelledby="workflow-briefing-title"><div className="section-heading"><div><p>업무 절차</p><h2 id="workflow-briefing-title">진행 중인 업무 절차</h2></div><Link href="/workflows">전체 보기 <ArrowRight size={14} /></Link></div>{items.length ? <div className="workflow-briefing__list">{items.map((item) => <Link href={`/workflows#workflow-${item.id}`} key={item.id}><GitBranch size={17} /><span><strong>{item.name}</strong><small>{item.completed}/{item.total} 완료 · 현재 {item.currentStep}</small></span><b>{item.percentage}%</b></Link>)}</div> : <p className="workflow-briefing__empty">진행 중인 업무 절차가 없습니다.</p>}</section>;
}
