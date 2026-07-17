import type { Json, TaskCategory, TaskPriority } from "@/types/database";
import type { WorkflowStatus, WorkflowStepStatus } from "@/lib/workflows/domain";

type OwnedRow = { id: string; user_id: string; created_at: string; updated_at: string };

export type WorkflowTemplateRow = OwnedRow & {
  name: string; description: string | null; category: TaskCategory; default_priority: TaskPriority;
  recommended_timing: string | null;
};
export type WorkflowTemplateStepRow = OwnedRow & {
  template_id: string; name: string; description: string | null; position: number;
  estimated_minutes: number | null; default_memo: string | null; assignee_label: string | null;
  completion_condition: string | null;
};
export type WorkflowTemplateStepChecklistItemRow = OwnedRow & {
  template_step_id: string; title: string; position: number;
};
export type WorkflowTemplateStepLinkRow = OwnedRow & {
  template_step_id: string; title: string; url: string;
};
export type TaskWorkflowInstanceRow = OwnedRow & {
  task_id: string; source_template_id: string | null; name: string; description: string | null;
  category: TaskCategory; priority: TaskPriority; status: WorkflowStatus; current_step_id: string | null;
  started_at: string | null; paused_at: string | null; completed_at: string | null; cancelled_at: string | null;
};
export type TaskWorkflowStepRow = OwnedRow & {
  instance_id: string; template_step_id: string | null; name: string; description: string | null;
  position: number; status: WorkflowStepStatus; estimated_minutes: number | null; memo: string | null;
  internal_notes: string | null; assignee_label: string | null; completion_condition: string | null;
  started_at: string | null; completed_at: string | null;
};
export type TaskWorkflowStepChecklistItemRow = OwnedRow & {
  workflow_step_id: string; title: string; is_completed: boolean; position: number;
};
export type WorkflowStepLinkRow = OwnedRow & {
  workflow_step_id: string; title: string; url: string;
};
export type WorkflowTimelineEventRow = OwnedRow & {
  instance_id: string; workflow_step_id: string | null; event_type: string; message: string; metadata: Json;
};
export type WorkflowFollowupRuleRow = OwnedRow & {
  template_id: string | null; instance_id: string | null; trigger_type: "step_completed" | "workflow_completed";
  trigger_step_position: number | null; title: string; description: string | null; category: TaskCategory;
  priority: TaskPriority; delay_days: number; include_checklist: boolean; generated_task_id: string | null;
};

type Table<Row extends OwnedRow, Optional extends keyof Row = never> = {
  Row: Row;
  Insert: Omit<Row, Optional | "id" | "created_at" | "updated_at"> & Partial<Pick<Row, Optional | "id" | "created_at" | "updated_at">>;
  Update: Partial<Row>;
  Relationships: [];
};

export type WorkflowDatabaseTables = {
  workflow_templates: Table<WorkflowTemplateRow>;
  workflow_template_steps: Table<WorkflowTemplateStepRow>;
  workflow_template_step_checklist_items: Table<WorkflowTemplateStepChecklistItemRow>;
  workflow_template_step_links: Table<WorkflowTemplateStepLinkRow>;
  task_workflow_instances: Table<TaskWorkflowInstanceRow, "source_template_id" | "description" | "current_step_id" | "started_at" | "paused_at" | "completed_at" | "cancelled_at">;
  task_workflow_steps: Table<TaskWorkflowStepRow, "template_step_id" | "description" | "estimated_minutes" | "memo" | "internal_notes" | "assignee_label" | "completion_condition" | "started_at" | "completed_at">;
  task_workflow_step_checklist_items: Table<TaskWorkflowStepChecklistItemRow, "is_completed">;
  workflow_step_links: Table<WorkflowStepLinkRow>;
  workflow_timeline_events: Table<WorkflowTimelineEventRow, "workflow_step_id" | "metadata">;
  workflow_followup_rules: Table<WorkflowFollowupRuleRow, "template_id" | "instance_id" | "trigger_step_position" | "description" | "delay_days" | "include_checklist" | "generated_task_id">;
};

export type HealthWorkflowData = {
  readonly templates: readonly WorkflowTemplateRow[];
  readonly templateSteps: readonly WorkflowTemplateStepRow[];
  readonly templateChecklistItems: readonly WorkflowTemplateStepChecklistItemRow[];
  readonly templateLinks: readonly WorkflowTemplateStepLinkRow[];
  readonly instances: readonly TaskWorkflowInstanceRow[];
  readonly steps: readonly TaskWorkflowStepRow[];
  readonly checklistItems: readonly TaskWorkflowStepChecklistItemRow[];
  readonly links: readonly WorkflowStepLinkRow[];
  readonly timeline: readonly WorkflowTimelineEventRow[];
  readonly followups: readonly WorkflowFollowupRuleRow[];
};
