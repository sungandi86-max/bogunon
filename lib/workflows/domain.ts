import type { TaskCategory, TaskPriority } from "@/types/database";

export const WORKFLOW_STATUSES = ["active", "paused", "completed", "cancelled"] as const;
export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

export const WORKFLOW_STEP_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "skipped",
  "blocked",
] as const;
export type WorkflowStepStatus = (typeof WORKFLOW_STEP_STATUSES)[number];

export interface WorkflowLinkDefinition {
  readonly title: string;
  readonly url: string;
}

export interface WorkflowStepDefinition {
  readonly name: string;
  readonly description: string;
  readonly estimatedMinutes: number | null;
  readonly checklist: readonly string[];
  readonly defaultMemo: string | null;
  readonly links: readonly WorkflowLinkDefinition[];
  readonly assigneeLabel: string | null;
  readonly completionCondition: string | null;
}

export interface WorkflowFollowupDefinition {
  readonly triggerType: "step_completed" | "workflow_completed";
  readonly triggerStepPosition: number | null;
  readonly title: string;
  readonly description: string | null;
  readonly category: TaskCategory;
  readonly priority: TaskPriority;
  readonly delayDays: number;
  readonly includeChecklist: boolean;
}

export interface WorkflowTemplateDefinition {
  readonly key: string;
  readonly name: string;
  readonly description: string;
  readonly category: TaskCategory;
  readonly defaultPriority: TaskPriority;
  readonly recommendedTiming: string;
  readonly steps: readonly WorkflowStepDefinition[];
  readonly followups: readonly WorkflowFollowupDefinition[];
}

const stepDefinition = (
  name: string,
  description: string,
  checklist: readonly string[],
  estimatedMinutes: number,
): WorkflowStepDefinition => ({
  name,
  description,
  estimatedMinutes,
  checklist,
  defaultMemo: null,
  links: [],
  assigneeLabel: null,
  completionCondition: `${name}에 필요한 확인을 마침`,
});

export const BUILT_IN_WORKFLOW_TEMPLATES = [
  {
    key: "tuberculosis-screening",
    name: "결핵검진",
    description: "결핵검진 공문 확인부터 완료 보고까지 순서대로 운영합니다.",
    category: "additionalScreening",
    defaultPriority: "high",
    recommendedTiming: "검진 공문 접수 후",
    steps: [
      stepDefinition("공문 확인", "시행 일정과 요청사항을 확인합니다.", ["시행 일정 확인", "제출 항목 확인"], 20),
      stepDefinition("대상자 범위 확인", "업무 대상 범주와 예상 수량을 확인합니다.", ["대상 범주 확인", "비식별 수량 확인"], 30),
      stepDefinition("안내문 작성", "개인정보 없이 안내 내용을 준비합니다.", ["일정 표기", "제출 방법 표기"], 40),
      stepDefinition("안내 발송", "정해진 전달 경로로 안내를 발송합니다.", ["발송 전 최종 확인", "발송 완료 표시"], 20),
      stepDefinition("제출 현황 확인", "제출 현황을 비식별 수량으로 확인합니다.", ["제출 수량 확인", "미제출 수량 확인"], 30),
      stepDefinition("미제출자 재안내", "미제출 범주에 재안내를 진행합니다.", ["재안내 문구 확인", "재안내 완료"], 20),
      stepDefinition("결과 정리", "업무 결과를 비식별 단위로 정리합니다.", ["처리 수량 정리", "후속 필요 수량 정리"], 40),
      stepDefinition("완료 보고", "요청된 방식으로 업무 완료를 보고합니다.", ["보고 항목 확인", "완료 보고"], 20),
    ],
    followups: [{
      triggerType: "workflow_completed",
      triggerStepPosition: null,
      title: "결핵검진 운영 정리 확인",
      description: "완료 후 정리 자료와 후속 업무를 확인합니다.",
      category: "additionalScreening",
      priority: "normal",
      delayDays: 1,
      includeChecklist: false,
    }],
  },
  {
    key: "student-health-screening",
    name: "학생건강검진",
    description: "검진 일정 확인부터 결과 정리까지 업무 절차를 운영합니다.",
    category: "studentHealthScreening",
    defaultPriority: "high",
    recommendedTiming: "학기 초 검진 계획 확정 후",
    steps: [
      stepDefinition("일정 확인", "검진 일정과 주요 마감일을 확인합니다.", ["검진일 확인", "마감일 확인"], 20),
      stepDefinition("대상 학년 확인", "대상 학년과 예상 규모를 확인합니다.", ["대상 범주 확인", "예상 수량 확인"], 20),
      stepDefinition("담임 안내", "담임 전달용 업무 안내를 준비하고 발송합니다.", ["안내 내용 확인", "전달 완료"], 30),
      stepDefinition("보호자 안내", "보호자 안내 절차와 전달 여부를 확인합니다.", ["안내문 확인", "발송 완료"], 40),
      stepDefinition("검진 진행", "검진 당일 운영 항목을 확인합니다.", ["운영 준비 확인", "진행 완료"], 120),
      stepDefinition("미검자 확인", "미검 수량과 후속 대상 범주를 확인합니다.", ["비식별 수량 확인", "후속 일정 확인"], 30),
      stepDefinition("재검 안내", "필요한 범주에 재검 일정을 안내합니다.", ["재검 일정 확인", "안내 완료"], 30),
      stepDefinition("결과 정리", "검진 운영 결과를 업무 단위로 정리합니다.", ["운영 결과 정리", "후속 업무 확인"], 60),
    ],
    followups: [{
      triggerType: "workflow_completed",
      triggerStepPosition: null,
      title: "미검자 재안내 업무 확인",
      description: "검진 완료 후 추가 안내가 필요한지 확인합니다.",
      category: "studentHealthScreening",
      priority: "normal",
      delayDays: 1,
      includeChecklist: true,
    }],
  },
] as const satisfies readonly WorkflowTemplateDefinition[];

export interface WorkflowStepSnapshot {
  readonly id: string;
  readonly name: string;
  readonly position: number;
  readonly status: WorkflowStepStatus;
  readonly incompleteChecklist: number;
}

export interface WorkflowProgress {
  readonly completed: number;
  readonly total: number;
  readonly remaining: number;
  readonly percentage: number;
}

export function calculateWorkflowProgress(steps: readonly WorkflowStepSnapshot[]): WorkflowProgress {
  const completed = steps.filter((item) => item.status === "completed").length;
  const remaining = steps.filter((item) => item.status !== "completed" && item.status !== "skipped").length;
  return {
    completed,
    total: steps.length,
    remaining,
    percentage: steps.length === 0 ? 0 : Math.round((completed / steps.length) * 100),
  };
}

export interface NextWorkflowAction {
  readonly stepId: string | null;
  readonly stepName: string | null;
  readonly message: string;
}

export function deriveNextWorkflowAction(
  steps: readonly WorkflowStepSnapshot[],
  options: { readonly includeBlocked: boolean } = { includeBlocked: true },
): NextWorkflowAction {
  const ordered = [...steps].sort((left, right) => left.position - right.position);
  const current = ordered.find((item) => item.status === "in_progress")
    ?? (options.includeBlocked ? ordered.find((item) => item.status === "blocked") : undefined)
    ?? ordered.find((item) => item.status === "pending");
  if (!current) {
    return { stepId: null, stepName: null, message: "모든 단계를 처리했습니다. Workflow를 완료하세요." };
  }
  if (current.status === "blocked") {
    return { stepId: current.id, stepName: current.name, message: "보류된 단계를 재개하거나 건너뛸지 확인하세요." };
  }
  if (current.incompleteChecklist > 0) {
    return {
      stepId: current.id,
      stepName: current.name,
      message: `체크리스트 ${current.incompleteChecklist}개를 완료한 뒤 단계를 완료하세요.`,
    };
  }
  return {
    stepId: current.id,
    stepName: current.name,
    message: current.status === "pending"
      ? `${current.name} 단계를 시작하세요.`
      : `${current.name} 단계를 완료하고 다음 단계로 이동하세요.`,
  };
}

const workflowTransitions: Record<WorkflowStatus, readonly WorkflowStatus[]> = {
  active: ["paused", "completed", "cancelled"],
  paused: ["active", "cancelled"],
  completed: [],
  cancelled: [],
};

const stepTransitions: Record<WorkflowStepStatus, readonly WorkflowStepStatus[]> = {
  pending: ["in_progress", "skipped", "blocked"],
  in_progress: ["completed", "skipped", "blocked", "pending"],
  completed: ["in_progress"],
  skipped: ["in_progress"],
  blocked: ["in_progress", "skipped", "pending"],
};

export function isWorkflowTransitionAllowed(from: WorkflowStatus, to: WorkflowStatus): boolean {
  return workflowTransitions[from].includes(to);
}

export function canTransitionWorkflowSteps(status: WorkflowStatus): boolean {
  return status === "active";
}

export function isStepTransitionAllowed(from: WorkflowStepStatus, to: WorkflowStepStatus): boolean {
  return stepTransitions[from].includes(to);
}
