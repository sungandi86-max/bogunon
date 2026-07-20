import type { WorkflowDatabaseTables } from "@/types/workflows";
import type { CalendarStickerKey } from "@/lib/calendar-stickers/catalog";
import type { NoticeCategory, UserRole } from "@/lib/notices/model";

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
export type ProfileRow = { id: string; email: string | null; display_name: string | null; avatar_url: string | null; role: UserRole; created_at: string; updated_at: string };
export type NoticeRow = { id: string; title: string; summary: string | null; content: string; category: NoticeCategory; is_published: boolean; is_important: boolean; publish_start_at: string | null; publish_end_at: string | null; created_by: string; created_at: string; updated_at: string };
export type NoticeReadRow = { notice_id: string; user_id: string; read_at: string };

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
  location?: string | null;
  color_key?: "mint" | "blue" | "yellow" | "coral" | "lavender" | "pink" | null;
  recurrence_frequency?: RecurrenceFrequency | null;
  recurrence_source_id?: string | null;
  recurrence_date?: string | null;
  recurrence_generated_through?: string | null;
  memo: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type ExerciseStickerIconKey =
  | "badminton"
  | "badminton_lesson"
  | "walking"
  | "running"
  | "strength"
  | "stretching"
  | "cycling"
  | "swimming"
  | "other";

export type ExerciseStickerColorKey = "mint" | "pink" | "yellow" | "coral" | "blue" | "lavender" | "sky" | "aqua" | "cream";

export type ExerciseStickerRow = {
  id: string;
  user_id: string | null;
  label: string;
  icon_key: ExerciseStickerIconKey;
  color_key: ExerciseStickerColorKey;
  display_order: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type ExerciseLogRow = {
  id: string;
  user_id: string;
  sticker_id: string;
  exercise_date: string;
  duration_minutes: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type CalendarStickerRow = {
  id: string;
  user_id: string;
  sticker_key: CalendarStickerKey;
  sticker_date: string;
  end_date: string | null;
  label: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type AnnualPlannerCustomItemRow = {
  id: string;
  user_id: string;
  month: number;
  title: string;
  item_kind: WorkItemKind;
  description: string | null;
  estimated_minutes: number | null;
  checklist_json: Json;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type UserSettingsRow = {
  id: string;
  user_id: string;
  week_starts_on: "monday";
  default_event_minutes: number;
  event_reminders_enabled: boolean;
  task_due_reminders_enabled: boolean;
  exercise_enabled: boolean;
  writing_assistance_enabled: boolean;
  display_density: "default" | "comfortable" | "compact";
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

export type HealthPresetPreferenceRow = {
  id: string;
  user_id: string;
  preset_id: string;
  favorite: boolean;
  hidden: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AiPreferencesRow = {
  id: string;
  user_id: string;
  history_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type AiRequestRow = {
  id: string;
  user_id: string;
  request_type: string;
  prompt: string;
  status: "pending" | "completed" | "failed";
  error_message: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AiActionDraftRow = {
  id: string;
  user_id: string;
  request_id: string;
  action_type: string;
  payload: Json;
  status: "pending" | "applied" | "dismissed";
  applied_at: string | null;
  created_at: string;
  updated_at: string;
};

type Insert<T, Optional extends keyof T> = Omit<T, Optional> & Partial<Pick<T, Optional>>;

export type Database = {
  public: {
    Tables: WorkflowDatabaseTables & {
      profiles: { Row: ProfileRow; Insert: Insert<ProfileRow, "email" | "display_name" | "avatar_url" | "role" | "created_at" | "updated_at">; Update: Partial<Omit<ProfileRow, "role">>; Relationships: [] };
      notices: { Row: NoticeRow; Insert: Insert<NoticeRow, "id" | "summary" | "category" | "is_published" | "is_important" | "publish_start_at" | "publish_end_at" | "created_at" | "updated_at">; Update: Partial<NoticeRow>; Relationships: [] };
      notice_reads: { Row: NoticeReadRow; Insert: Insert<NoticeReadRow, "read_at">; Update: Pick<NoticeReadRow, "read_at">; Relationships: [] };
      ai_preferences: {
        Row: AiPreferencesRow;
        Insert: Insert<AiPreferencesRow, "id" | "history_enabled" | "created_at" | "updated_at">;
        Update: Partial<AiPreferencesRow>;
        Relationships: [];
      };
      ai_requests: {
        Row: AiRequestRow;
        Insert: Insert<AiRequestRow, "id" | "status" | "error_message" | "completed_at" | "created_at" | "updated_at">;
        Update: Partial<AiRequestRow>;
        Relationships: [];
      };
      ai_action_drafts: {
        Row: AiActionDraftRow;
        Insert: Insert<AiActionDraftRow, "id" | "status" | "applied_at" | "created_at" | "updated_at">;
        Update: Partial<AiActionDraftRow>;
        Relationships: [];
      };
      tasks: {
        Row: TaskRow;
        Insert: Insert<TaskRow, "id" | "status" | "priority" | "category" | "scheduled_date" | "due_date" | "follow_up_date" | "memo" | "description" | "estimated_minutes" | "completed_at" | "recurrence_frequency" | "recurrence_source_id" | "recurrence_date" | "recurrence_generated_through" | "created_at" | "updated_at">;
        Update: Partial<TaskRow>;
        Relationships: [];
      };
      events: {
        Row: EventRow;
        Insert: Insert<EventRow, "id" | "is_all_day" | "start_time" | "end_time" | "location" | "color_key" | "recurrence_frequency" | "recurrence_source_id" | "recurrence_date" | "recurrence_generated_through" | "memo" | "description" | "created_at" | "updated_at">;
        Update: Partial<EventRow>;
        Relationships: [];
      };
      exercise_stickers: {
        Row: ExerciseStickerRow;
        Insert: Insert<ExerciseStickerRow, "id" | "user_id" | "display_order" | "is_default" | "created_at" | "updated_at">;
        Update: Partial<ExerciseStickerRow>;
        Relationships: [];
      };
      exercise_logs: {
        Row: ExerciseLogRow;
        Insert: Insert<ExerciseLogRow, "id" | "duration_minutes" | "note" | "created_at" | "updated_at">;
        Update: Partial<ExerciseLogRow>;
        Relationships: [];
      };
      calendar_stickers: {
        Row: CalendarStickerRow;
        Insert: Insert<CalendarStickerRow, "id" | "end_date" | "note" | "created_at" | "updated_at">;
        Update: Partial<CalendarStickerRow>;
        Relationships: [];
      };
      annual_planner_custom_items: {
        Row: AnnualPlannerCustomItemRow;
        Insert: Insert<AnnualPlannerCustomItemRow, "id" | "description" | "estimated_minutes" | "checklist_json" | "sort_order" | "created_at" | "updated_at">;
        Update: Partial<AnnualPlannerCustomItemRow>;
        Relationships: [];
      };
      user_settings: {
        Row: UserSettingsRow;
        Insert: Insert<UserSettingsRow, "id" | "week_starts_on" | "default_event_minutes" | "event_reminders_enabled" | "task_due_reminders_enabled" | "exercise_enabled" | "writing_assistance_enabled" | "display_density" | "created_at" | "updated_at">;
        Update: Partial<UserSettingsRow>;
        Relationships: [];
      };
      health_preset_preferences: {
        Row: HealthPresetPreferenceRow;
        Insert: Insert<HealthPresetPreferenceRow, "id" | "favorite" | "hidden" | "created_at" | "updated_at">;
        Update: Partial<HealthPresetPreferenceRow>;
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
      move_calendar_item: {
        Args: { p_kind: string; p_item_id: string; p_new_date: string; p_scope?: string };
        Returns: string;
      };
      save_event_bundle_v2: {
        Args: { p_item_id: string | null; p_values: Json; p_links?: Json; p_reminders?: Json };
        Returns: string;
      };
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
      save_workflow_template_bundle: { Args: { p_template_id?: string | null; p_values: Json; p_steps: Json; p_followups: Json }; Returns: string };
      create_workflow_instance_bundle: { Args: { p_task_id: string; p_template_id?: string | null; p_values: Json; p_steps: Json; p_followups: Json }; Returns: string };
      update_workflow_step_bundle: { Args: { p_step_id: string; p_values: Json; p_checklist: Json; p_links: Json }; Returns: string };
      transition_workflow_step: { Args: { p_step_id: string; p_target_status: string; p_force?: boolean }; Returns: string };
      transition_workflow_instance: { Args: { p_instance_id: string; p_target_status: string }; Returns: string };
      complete_workflow_instance: { Args: { p_instance_id: string }; Returns: string };
      save_ai_history_bundle: {
        Args: { p_user_id: string; p_request_type: string; p_prompt: string; p_payload: Json };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
