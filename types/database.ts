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
  completed_at: string | null;
  recurrence_frequency: RecurrenceFrequency | null;
  recurrence_source_id: string | null;
  recurrence_date: string | null;
  recurrence_generated_through: string | null;
  created_at: string;
  updated_at: string;
}

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
  created_at: string;
  updated_at: string;
}

type Insert<T, Optional extends keyof T> = Omit<T, Optional> & Partial<Pick<T, Optional>>;

export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: TaskRow;
        Insert: Insert<TaskRow, "id" | "status" | "priority" | "category" | "scheduled_date" | "due_date" | "follow_up_date" | "memo" | "completed_at" | "recurrence_frequency" | "recurrence_source_id" | "recurrence_date" | "recurrence_generated_through" | "created_at" | "updated_at">;
        Update: Partial<TaskRow>;
        Relationships: [];
      };
      events: {
        Row: EventRow;
        Insert: Insert<EventRow, "id" | "is_all_day" | "start_time" | "end_time" | "memo" | "created_at" | "updated_at">;
        Update: Partial<EventRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
