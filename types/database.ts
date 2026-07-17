export type Area = "healthWork" | "schoolSchedule" | "exercise" | "personal" | "project";
export type TaskStatus = "planned" | "inProgress" | "waitingForReply" | "needsCheck" | "completed" | "onHold";
export type TaskPriority = "low" | "normal" | "high";
export const TASK_CATEGORIES = [
  "studentHealthScreening",
  "additionalScreening",
  "infectiousDisease",
  "firstAid",
  "medication",
  "officialDocument",
  "training",
  "event",
  "counseling",
  "other",
] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];
export const RECURRENCE_FREQUENCIES = ["daily", "weekly", "monthly", "yearly"] as const;
export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];
export type WorkItemKind = "task" | "event";
export type ReminderReference = "scheduled" | "due";
export type Json = string | number | boolean | null | { readonly [key: string]: Json | undefined } | readonly Json[];

export type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  area: Area;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  scheduled_date: string | null;
  due_date: string | null;
  follow_up_date: string | null;
  memo: string | null;
  description: string | null;
  estimated_minutes: number | null;
  completed_at: string | null;
  recurrence_frequency: RecurrenceFrequency | null;
  recurrence_source_id: string | null;
  recurrence_date: string | null;
  recurrence_generated_through: string | null;
  created_at: string;
  updated_at: string;
};

export type EventRow = {
  id: string;
  user_id: string;
  title: string;
  area: Area;
  start_date: string;
  end_date: string;
  is_all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  memo: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskTemplateRow = {
  id: string;
  user_id: string;
  name: string;
  item_kind: WorkItemKind;
  category: TaskCategory;
  title: string;
  description: string | null;
  priority: TaskPriority;
  estimated_minutes: number | null;
  recommended_timing: string | null;
  recurrence_frequency: RecurrenceFrequency | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskTemplateChecklistItemRow = {
  id: string;
  user_id: string;
  template_id: string;
  title: string;
  position: number;
  created_at: string;
  updated_at: string;
};

export type TaskChecklistItemRow = {
  id: string;
  user_id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

export type WorkItemLinkRow = {
  id: string;
  user_id: string;
  title: string;
  url: string;
  created_at: string;
  updated_at: string;
};

export type TaskLinkRow = WorkItemLinkRow & { task_id: string };
export type EventLinkRow = WorkItemLinkRow & { event_id: string };

export type TaskReminderRow = {
  id: string;
  user_id: string;
  task_id: string;
  reference_type: ReminderReference;
  offset_minutes: number;
  created_at: string;
  updated_at: string;
};

export type EventReminderRow = {
  id: string;
  user_id: string;
  event_id: string;
  offset_minutes: number;
  created_at: string;
  updated_at: string;
};

type Insert<T, Optional extends keyof T> = Omit<T, Optional> & Partial<Pick<T, Optional>>;

export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: TaskRow;
        Insert: Insert<TaskRow, "id" | "status" | "priority" | "category" | "scheduled_date" | "due_date" | "follow_up_date" | "memo" | "description" | "estimated_minutes" | "completed_at" | "recurrence_frequency" | "recurrence_source_id" | "recurrence_date" | "recurrence_generated_through" | "created_at" | "updated_at">;
        Update: Partial<TaskRow>;
        Relationships: [];
      };
      events: {
        Row: EventRow;
        Insert: Insert<EventRow, "id" | "is_all_day" | "start_time" | "end_time" | "memo" | "description" | "created_at" | "updated_at">;
        Update: Partial<EventRow>;
        Relationships: [];
      };
      task_templates: {
        Row: TaskTemplateRow;
        Insert: Insert<TaskTemplateRow, "id" | "item_kind" | "category" | "description" | "priority" | "estimated_minutes" | "recommended_timing" | "recurrence_frequency" | "memo" | "created_at" | "updated_at">;
        Update: Partial<TaskTemplateRow>;
        Relationships: [];
      };
      task_template_checklist_items: {
        Row: TaskTemplateChecklistItemRow;
        Insert: Insert<TaskTemplateChecklistItemRow, "id" | "created_at" | "updated_at">;
        Update: Partial<TaskTemplateChecklistItemRow>;
        Relationships: [];
      };
      task_checklist_items: {
        Row: TaskChecklistItemRow;
        Insert: Insert<TaskChecklistItemRow, "id" | "is_completed" | "created_at" | "updated_at">;
        Update: Partial<TaskChecklistItemRow>;
        Relationships: [];
      };
      task_links: {
        Row: TaskLinkRow;
        Insert: Insert<TaskLinkRow, "id" | "created_at" | "updated_at">;
        Update: Partial<TaskLinkRow>;
        Relationships: [];
      };
      event_links: {
        Row: EventLinkRow;
        Insert: Insert<EventLinkRow, "id" | "created_at" | "updated_at">;
        Update: Partial<EventLinkRow>;
        Relationships: [];
      };
      task_reminders: {
        Row: TaskReminderRow;
        Insert: Insert<TaskReminderRow, "id" | "reference_type" | "created_at" | "updated_at">;
        Update: Partial<TaskReminderRow>;
        Relationships: [];
      };
      event_reminders: {
        Row: EventReminderRow;
        Insert: Insert<EventReminderRow, "id" | "created_at" | "updated_at">;
        Update: Partial<EventReminderRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      save_work_item_bundle: {
        Args: { p_kind: string; p_item_id: string | null; p_values: Json; p_checklist?: Json; p_links?: Json; p_reminders?: Json };
        Returns: string;
      };
      save_task_template_bundle: {
        Args: { p_values: Json; p_checklist?: Json };
        Returns: string;
      };
      duplicate_task_bundle: {
        Args: { p_source_id: string; p_date: string | null; p_include_checklist: boolean; p_include_description: boolean; p_include_memo: boolean; p_include_recurrence: boolean };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
