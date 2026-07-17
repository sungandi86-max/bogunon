import { z } from "zod";

import { RECURRENCE_FREQUENCIES, TASK_CATEGORIES } from "@/types/database";

export const AI_ACTION_TYPES = [
  "create_task",
  "create_event",
  "create_workflow",
  "create_checklist",
  "create_workflow_template",
  "summarize_today",
  "summarize_period",
  "recommend_priority",
  "find_similar_work",
  "duplicate_previous_work",
] as const;

const DateSchema = z.iso.date();
const TimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const TitleSchema = z.string().trim().min(1).max(160);
const DescriptionSchema = z.string().trim().min(1).max(2_000).nullable();
const PrioritySchema = z.enum(["low", "normal", "high"]);
const CategorySchema = z.enum(TASK_CATEGORIES);
const RecurrenceSchema = z.enum(RECURRENCE_FREQUENCIES).nullable();

const LinkSchema = z.object({
  title: z.string().trim().min(1).max(120),
  url: z.string().url().refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }),
}).strict();

const ReminderSchema = z.object({
  reference_type: z.enum(["scheduled", "due"]),
  offset_minutes: z.number().int().min(0).max(525_600),
}).strict();

const WorkflowStepSchema = z.object({
  name: TitleSchema,
  description: DescriptionSchema,
  checklist: z.array(TitleSchema).max(30),
}).strict();

const CreateTaskActionSchema = z.object({
  action: z.literal("create_task"),
  title: TitleSchema,
  description: DescriptionSchema,
  category: CategorySchema,
  priority: PrioritySchema,
  scheduled_date: DateSchema.nullable(),
  due_date: DateSchema.nullable(),
  recurrence: RecurrenceSchema,
  checklist: z.array(TitleSchema).max(30),
  links: z.array(LinkSchema).max(10),
  reminder: ReminderSchema.nullable(),
}).strict();

const CreateEventActionSchema = z.object({
  action: z.literal("create_event"),
  title: TitleSchema,
  description: DescriptionSchema,
  start_date: DateSchema,
  end_date: DateSchema,
  start_time: TimeSchema.nullable(),
  end_time: TimeSchema.nullable(),
  is_all_day: z.boolean(),
  checklist: z.array(TitleSchema).max(30),
  links: z.array(LinkSchema).max(10),
  reminder: ReminderSchema.nullable(),
}).strict().refine((value) => value.end_date >= value.start_date, {
  path: ["end_date"],
  message: "end_date must not precede start_date",
});

const CreateWorkflowActionSchema = z.object({
  action: z.literal("create_workflow"),
  task_id: z.string().trim().min(1).max(128).nullable(),
  template_id: z.string().trim().min(1).max(128).nullable(),
  name: TitleSchema,
  description: DescriptionSchema,
  category: CategorySchema,
  priority: PrioritySchema,
  steps: z.array(WorkflowStepSchema).min(1).max(30),
}).strict();

const CreateChecklistActionSchema = z.object({
  action: z.literal("create_checklist"),
  target_id: z.string().trim().min(1).max(128).nullable(),
  title: TitleSchema,
  items: z.array(z.object({
    title: TitleSchema,
    is_completed: z.boolean(),
  }).strict()).min(1).max(50),
}).strict();

const CreateWorkflowTemplateActionSchema = z.object({
  action: z.literal("create_workflow_template"),
  name: TitleSchema,
  description: DescriptionSchema,
  category: CategorySchema,
  default_priority: PrioritySchema,
  recommended_timing: z.string().trim().min(1).max(160),
  steps: z.array(WorkflowStepSchema).min(1).max(30),
}).strict();

const SummaryFields = {
  summary: z.string().trim().min(1).max(1_200),
  highlights: z.array(z.string().trim().min(1).max(240)).max(8),
  item_count: z.number().int().min(0).max(1_000),
} as const;

const SummarizeTodayActionSchema = z.object({
  action: z.literal("summarize_today"),
  ...SummaryFields,
}).strict();

const SummarizePeriodActionSchema = z.object({
  action: z.literal("summarize_period"),
  start_date: DateSchema,
  end_date: DateSchema,
  ...SummaryFields,
}).strict().refine((value) => value.end_date >= value.start_date, {
  path: ["end_date"],
  message: "end_date must not precede start_date",
});

const RecommendPriorityActionSchema = z.object({
  action: z.literal("recommend_priority"),
  target_id: z.string().trim().min(1).max(128).nullable(),
  priority: PrioritySchema,
  reason: z.string().trim().min(1).max(500),
}).strict();

const FindSimilarWorkActionSchema = z.object({
  action: z.literal("find_similar_work"),
  query: z.string().trim().min(1).max(300),
  matches: z.array(z.object({
    id: z.string().trim().min(1).max(128),
    kind: z.enum(["task", "event", "workflow", "workflow_template"]),
    title: TitleSchema,
    reason: z.string().trim().min(1).max(300),
  }).strict()).max(10),
}).strict();

const DuplicatePreviousWorkActionSchema = z.object({
  action: z.literal("duplicate_previous_work"),
  source_id: z.string().trim().min(1).max(128),
  source_type: z.enum(["task", "event"]),
  title: TitleSchema,
  target_date: DateSchema.nullable(),
  include_description: z.boolean(),
  include_memo: z.boolean(),
}).strict();

export const AiActionSchema = z.discriminatedUnion("action", [
  CreateTaskActionSchema,
  CreateEventActionSchema,
  CreateWorkflowActionSchema,
  CreateChecklistActionSchema,
  CreateWorkflowTemplateActionSchema,
  SummarizeTodayActionSchema,
  SummarizePeriodActionSchema,
  RecommendPriorityActionSchema,
  FindSimilarWorkActionSchema,
  DuplicatePreviousWorkActionSchema,
]);

export const AiAssistantResponseSchema = z.object({
  action: AiActionSchema,
  warnings: z.array(z.string().trim().min(1).max(240)).max(8),
}).strict();

export type AiAction = z.infer<typeof AiActionSchema>;
export type AiActionType = (typeof AI_ACTION_TYPES)[number];
export type AiAssistantResponse = z.infer<typeof AiAssistantResponseSchema>;
