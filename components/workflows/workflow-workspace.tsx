"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { WorkflowInstanceCard } from "@/components/workflows/workflow-instance-card";
import { WorkflowTemplatePanel } from "@/components/workflows/workflow-template-panel";
import { TASK_CATEGORY_OPTIONS } from "@/lib/work-items/categories";
import type { TaskRow } from "@/types/database";
import type { HealthWorkflowData } from "@/types/workflows";

export function WorkflowWorkspace({ data, tasks }: { readonly data: HealthWorkflowData; readonly tasks: readonly TaskRow[] }) {
  const [query, setQuery] = useState(""); const [status, setStatus] = useState("all"); const [category, setCategory] = useState("all"); const [progress, setProgress] = useState("all"); const [blocked, setBlocked] = useState(false);
  const visible = useMemo(() => data.instances.filter((instance) => {
    const steps = data.steps.filter((step) => step.instance_id === instance.id);
    const task = tasks.find((item) => item.id === instance.task_id);
    const haystack = [instance.name, task?.title, ...steps.flatMap((step) => [step.name, step.memo, step.internal_notes])].filter(Boolean).join(" ").toLocaleLowerCase("ko-KR");
    const percent = steps.length ? Math.round(steps.filter((step) => step.status === "completed").length / steps.length * 100) : 0;
    return (!query.trim() || haystack.includes(query.trim().toLocaleLowerCase("ko-KR")))
      && (status === "all" || instance.status === status) && (category === "all" || instance.category === category)
      && (progress === "all" || (progress === "low" && percent < 50) || (progress === "high" && percent >= 50))
      && (!blocked || steps.some((step) => step.status === "blocked"));
  }), [blocked, category, data.instances, data.steps, progress, query, status, tasks]);
  return <div className="workflow-layout"><section className="workflow-main"><div className="workflow-tools"><label className="task-search"><span className="sr-only">업무 절차 검색</span><Search size={18} /><input onChange={(event) => setQuery(event.target.value)} placeholder="업무 절차, 업무, 단계, 메모 검색" type="search" value={query} /></label><div className="workflow-filters"><select aria-label="상태" onChange={(event) => setStatus(event.target.value)} value={status}><option value="all">모든 상태</option><option value="active">진행 중</option><option value="paused">일시 중지</option><option value="completed">완료</option><option value="cancelled">취소</option></select><select aria-label="카테고리" onChange={(event) => setCategory(event.target.value)} value={category}><option value="all">모든 카테고리</option>{TASK_CATEGORY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><select aria-label="진행률" onChange={(event) => setProgress(event.target.value)} value={progress}><option value="all">모든 진행률</option><option value="low">50% 미만</option><option value="high">50% 이상</option></select><label className="workflow-blocked-filter"><input checked={blocked} onChange={(event) => setBlocked(event.target.checked)} type="checkbox" />보류 단계만</label>{(query || status !== "all" || category !== "all" || progress !== "all" || blocked) && <button className="filter-reset" onClick={() => { setQuery(""); setStatus("all"); setCategory("all"); setProgress("all"); setBlocked(false); }} type="button"><X size={14} />초기화</button>}</div></div><p className="task-results-summary">업무 절차 {visible.length}건</p>{visible.length ? <div className="workflow-instance-list">{visible.map((instance) => <WorkflowInstanceCard data={data} instance={instance} key={instance.id} task={tasks.find((task) => task.id === instance.task_id)} />)}</div> : <section className="empty-state"><div><h2>조건에 맞는 업무 절차가 없습니다.</h2><p>업무에 기본 또는 내 템플릿을 적용해 시작하세요.</p></div></section>}</section><WorkflowTemplatePanel data={data} tasks={tasks} /></div>;
}
