import type { WorkflowDatabaseTables } from "@/types/workflows";
import type { CalendarStickerKey } from "@/lib/calendar-stickers/catalog";
import type { NoticeCategory, UserRole } from "@/lib/notices/model";
import type { EventDetails, EventType } from "@/lib/work-items/event-types";
import type { GuidelineSourceType } from "@/lib/ai/record-guidelines";

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
export type AedDeviceRow = { id: string; user_id: string; name: string; location: string; battery_expiry_date: string | null; pad_expiry_date: string | null; last_inspection_date: string | null; next_inspection_date: string | null; inspection_interval_months: number; note: string | null; sort_order: number; created_at: string; updated_at: string };
export type UserQuickLinkRow = { id: string; user_id: string; name: string; url: string; icon_key: "document" | "spreadsheet" | "drive" | "school" | "admin" | "health" | "web" | "other"; sort_order: number; is_visible: boolean; created_at: string; updated_at: string };
export type NoticeRow = { id: string; title: string; summary: string | null; content: string; category: NoticeCategory; is_published: boolean; is_important: boolean; publish_start_at: string | null; publish_end_at: string | null; created_by: string; created_at: string; updated_at: string };
export type NoticeReadRow = { notice_id: string; user_id: string; read_at: string };
export type HealthSupportAttendanceConfirmationRow = { id: string; user_id: string; instructor_id: string; year: number; month: number; confirmed: boolean; confirmed_at: string | null; created_at: string; updated_at: string };

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
  project_id?: string | null;
  title: string;
  area: Area;
  event_type?: EventType;
  event_details?: EventDetails | null;
  sticker_key?: string | null;
  start_date: string;
  end_date: string;
  is_all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  location?: string | null;
  color_key?: "mint" | "blue" | "yellow" | "coral" | "lavender" | "pink" | null;
  sticker_key?: CalendarStickerKey | null;
  recurrence_frequency?: RecurrenceFrequency | null;
  recurrence_source_id?: string | null;
  recurrence_date?: string | null;
  recurrence_generated_through?: string | null;
  practical_schedule_id?: string | null;
  practical_schedule_origin?: PracticalScheduleOrigin | null;
  memo: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectRow = {
  id: string;
  user_id: string;
  name: string;
  icon: ProjectIcon;
  color: ProjectColor;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectChecklistItemRow = {
  id: string;
  user_id: string;
  project_id: string;
  title: string;
  is_completed: boolean;
  sort_order: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectNoteRow = {
  id: string;
  user_id: string;
  project_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectFileRow = {
  id: string;
  user_id: string;
  project_id: string;
  reservation_id: string | null;
  filename: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  uploaded_at: string;
  updated_at: string;
};

export type ProjectPlaceCategory =
  | "airport"
  | "accommodation"
  | "restaurant"
  | "cafe"
  | "activity"
  | "shopping"
  | "transportation"
  | "sports"
  | "sightseeing"
  | "other";

export type ProjectPlaceRow = {
  id: string;
  user_id: string;
  project_id: string;
  event_id: string | null;
  reservation_id: string | null;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  visited_date: string | null;
  visited_time: string | null;
  sort_order: number;
  category: ProjectPlaceCategory;
  memo: string | null;
  is_visited: boolean;
  qa_run_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectReservationType =
  | "flight"
  | "hotel"
  | "rental_car"
  | "restaurant"
  | "badminton"
  | "transportation"
  | "ticket"
  | "custom";

export type ProjectReservationRow = {
  id: string;
  user_id: string;
  project_id: string;
  type: ProjectReservationType;
  title: string;
  reservation_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  company: string | null;
  confirmation_number: string | null;
  location: string | null;
  phone: string | null;
  website: string | null;
  memo: string | null;
  linked_event_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectExpenseCategory =
  | "transportation"
  | "accommodation"
  | "food"
  | "activity"
  | "shopping"
  | "ticket"
  | "supplies"
  | "fee"
  | "other";

export type ProjectExpensePaymentStatus = "planned" | "paid";

export type ProjectBudgetRow = {
  id: string;
  user_id: string;
  project_id: string;
  budget_amount: number;
  currency: "KRW";
  memo: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectExpenseRow = {
  id: string;
  user_id: string;
  project_id: string;
  reservation_id: string | null;
  title: string;
  category: ProjectExpenseCategory;
  amount: number;
  expense_date: string;
  payment_status: ProjectExpensePaymentStatus;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectIcon = "folder" | "calendar" | "school" | "heart" | "flag" | "star" | "travel";
export type ProjectColor = "mint" | "blue" | "yellow" | "coral" | "lavender" | "pink";

export type ExerciseStickerIconKey =
  | "badminton"
  | "badminton_lesson"
  | "walking"
  | "running"
  | "strength"
  | "stretching"
  | "cycling"
  | "swimming"
  | "pilates"
  | "other";

export type ExerciseStickerColorKey = "mint" | "pink" | "yellow" | "coral" | "blue" | "lavender" | "sky" | "aqua" | "cream";

export const EXERCISE_RECORD_TYPES = ["exercise", "lesson", "competition"] as const;
export type ExerciseRecordType = (typeof EXERCISE_RECORD_TYPES)[number];

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
  record_type: ExerciseRecordType;
  event_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type ExerciseLessonReviewRow = {
  exercise_log_id: string;
  record_type: "lesson";
  lesson_focus: string | null;
  learned: string | null;
  mistakes: string | null;
  coach_feedback: string | null;
  next_goal: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

export type ExerciseCompetitionReviewRow = {
  exercise_log_id: string;
  record_type: "competition";
  competition_name: string | null;
  location: string | null;
  event_category: string | null;
  grade: string | null;
  partner: string | null;
  total_games: number | null;
  wins: number | null;
  losses: number | null;
  final_result: string | null;
  strengths: string | null;
  improvements: string | null;
  next_goal: string | null;
  memo: string | null;
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

export type RecordGuidelineRow = {
  id: string;
  user_id: string;
  school_year: number;
  document_type: GuidelineSourceType;
  original_filename: string;
  mime_type: "application/pdf" | "text/plain";
  extracted_text: string;
  file_size: number;
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

export type PracticalScheduleCategory = "staff" | "student" | "admin";
export type PracticalScheduleOrigin = "projected" | "linked_existing";
export type PracticalScheduleRow = {
  id: string;
  user_id: string;
  year: number;
  category: PracticalScheduleCategory;
  title: string;
  scheduled_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  method: string | null;
  notes: string | null;
  url: string | null;
  annual_preset_key: string | null;
  sticker_key: CalendarStickerKey | null;
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
  neis_office_code: string | null;
  neis_school_code: string | null;
  neis_school_name: string | null;
  neis_office_name: string | null;
  neis_school_level: string | null;
  neis_region: string | null;
  neis_address: string | null;
  school_latitude: number | null;
  school_longitude: number | null;
  meal_enabled: boolean;
  weather_enabled: boolean;
  health_support_attendance_confirmer_name: string | null;
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

export type MedicationItemRow = { id: string; user_id: string; category: "internal" | "external" | "supplies" | "other"; name: string; specification: string; unit: string; recommended_stock: number; management_tip: string | null; note: string | null; active: boolean; created_at: string; updated_at: string };
export type MedicationBudgetRow = { id: string; user_id: string; budget_year: number; name: string; amount: number; memo: string | null; created_at: string; updated_at: string };
export type MedicationPurchasePlanRow = { id: string; user_id: string; item_id: string; quantity: number; expected_unit_price: number; status: "planned" | "ordered" | "partially_received" | "received" | "cancelled"; note: string | null; created_at: string; updated_at: string };
export type MedicationReceiptRow = { id: string; user_id: string; item_id: string; purchase_plan_id: string | null; received_at: string; quantity: number; actual_unit_price: number; expiration_date: string; idempotency_key: string; inventory_applied_at: string; created_at: string };
export type MedicationLotRow = { id: string; user_id: string; item_id: string; receipt_id: string | null; quantity: number; expiration_date: string; received_at: string; unit_price: number; created_at: string };

type Insert<T, Optional extends keyof T> = Omit<T, Optional> & Partial<Pick<T, Optional>>;

export type Database = {
  public: {
    Tables: WorkflowDatabaseTables & {
      profiles: { Row: ProfileRow; Insert: Insert<ProfileRow, "email" | "display_name" | "avatar_url" | "role" | "created_at" | "updated_at">; Update: Partial<Omit<ProfileRow, "role">>; Relationships: [] };
      aed_devices: { Row: AedDeviceRow; Insert: Insert<AedDeviceRow, "id" | "created_at" | "updated_at">; Update: Partial<Omit<AedDeviceRow, "id" | "user_id" | "created_at" | "updated_at">>; Relationships: [] };
      medication_items: { Row: MedicationItemRow; Insert: Insert<MedicationItemRow, "id" | "created_at" | "updated_at">; Update: Partial<Omit<MedicationItemRow, "id" | "user_id" | "created_at" | "updated_at">>; Relationships: [] };
      medication_budgets: { Row: MedicationBudgetRow; Insert: Insert<MedicationBudgetRow, "id" | "created_at" | "updated_at">; Update: Partial<Omit<MedicationBudgetRow, "id" | "user_id" | "created_at" | "updated_at">>; Relationships: [] };
      medication_purchase_plans: { Row: MedicationPurchasePlanRow; Insert: Insert<MedicationPurchasePlanRow, "id" | "created_at" | "updated_at">; Update: Partial<Omit<MedicationPurchasePlanRow, "id" | "user_id" | "created_at" | "updated_at">>; Relationships: [] };
      medication_receipts: { Row: MedicationReceiptRow; Insert: Insert<MedicationReceiptRow, "id" | "created_at" | "inventory_applied_at">; Update: Partial<Omit<MedicationReceiptRow, "id" | "user_id" | "created_at" | "inventory_applied_at">>; Relationships: [] };
      medication_lots: { Row: MedicationLotRow; Insert: Insert<MedicationLotRow, "id" | "receipt_id" | "created_at">; Update: Partial<Omit<MedicationLotRow, "id" | "user_id" | "created_at">>; Relationships: [] };
      user_quick_links: { Row: UserQuickLinkRow; Insert: Insert<UserQuickLinkRow, "id" | "created_at" | "updated_at">; Update: Partial<Omit<UserQuickLinkRow, "id" | "user_id" | "created_at" | "updated_at">>; Relationships: [] };
      health_support_attendance_confirmations: { Row: HealthSupportAttendanceConfirmationRow; Insert: Insert<HealthSupportAttendanceConfirmationRow, "id" | "confirmed" | "confirmed_at" | "created_at" | "updated_at">; Update: Partial<Omit<HealthSupportAttendanceConfirmationRow, "id" | "user_id" | "created_at" | "updated_at">>; Relationships: [] };
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
        Insert: Insert<EventRow, "id" | "project_id" | "event_type" | "event_details" | "sticker_key" | "is_all_day" | "start_time" | "end_time" | "location" | "color_key" | "recurrence_frequency" | "recurrence_source_id" | "recurrence_date" | "recurrence_generated_through" | "practical_schedule_id" | "memo" | "description" | "created_at" | "updated_at">;
        Update: Partial<EventRow>;
        Relationships: [];
      };
      projects: {
        Row: ProjectRow;
        Insert: Insert<ProjectRow, "id" | "icon" | "color" | "description" | "start_date" | "end_date" | "created_at" | "updated_at">;
        Update: Partial<Omit<ProjectRow, "id" | "user_id">>;
        Relationships: [];
      };
      project_checklist_items: {
        Row: ProjectChecklistItemRow;
        Insert: Insert<ProjectChecklistItemRow, "id" | "is_completed" | "sort_order" | "due_date" | "created_at" | "updated_at">;
        Update: Partial<Omit<ProjectChecklistItemRow, "id" | "user_id" | "project_id">>;
        Relationships: [];
      };
      project_notes: {
        Row: ProjectNoteRow;
        Insert: Insert<ProjectNoteRow, "id" | "content" | "is_pinned" | "created_at" | "updated_at">;
        Update: Partial<Omit<ProjectNoteRow, "id" | "user_id" | "project_id">>;
        Relationships: [];
      };
      project_files: {
        Row: ProjectFileRow;
        Insert: Insert<ProjectFileRow, "id" | "reservation_id" | "uploaded_at" | "updated_at">;
        Update: Partial<Omit<ProjectFileRow, "id" | "user_id" | "project_id" | "storage_path">>;
        Relationships: [];
      };
      project_places: {
        Row: ProjectPlaceRow;
        Insert: Insert<ProjectPlaceRow, "id" | "event_id" | "reservation_id" | "address" | "latitude" | "longitude" | "visited_date" | "visited_time" | "sort_order" | "category" | "memo" | "is_visited" | "qa_run_id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ProjectPlaceRow, "id" | "user_id" | "project_id">>;
        Relationships: [];
      };
      project_reservations: {
        Row: ProjectReservationRow;
        Insert: Insert<ProjectReservationRow, "id" | "end_date" | "start_time" | "end_time" | "company" | "confirmation_number" | "location" | "phone" | "website" | "memo" | "linked_event_id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ProjectReservationRow, "id" | "user_id" | "project_id">>;
        Relationships: [];
      };
      project_budgets: {
        Row: ProjectBudgetRow;
        Insert: Insert<ProjectBudgetRow, "id" | "currency" | "memo" | "created_at" | "updated_at">;
        Update: Partial<Omit<ProjectBudgetRow, "id" | "user_id" | "project_id">>;
        Relationships: [];
      };
      project_expenses: {
        Row: ProjectExpenseRow;
        Insert: Insert<ProjectExpenseRow, "id" | "reservation_id" | "memo" | "created_at" | "updated_at">;
        Update: Partial<Omit<ProjectExpenseRow, "id" | "user_id" | "project_id">>;
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
        Insert: Insert<ExerciseLogRow, "id" | "event_id" | "duration_minutes" | "note" | "record_type" | "created_at" | "updated_at">;
        Update: Partial<ExerciseLogRow>;
        Relationships: [];
      };
      exercise_lesson_reviews: {
        Row: ExerciseLessonReviewRow;
        Insert: Insert<ExerciseLessonReviewRow, "record_type" | "lesson_focus" | "learned" | "mistakes" | "coach_feedback" | "next_goal" | "memo" | "created_at" | "updated_at">;
        Update: Partial<Omit<ExerciseLessonReviewRow, "exercise_log_id" | "record_type">>;
        Relationships: [];
      };
      exercise_competition_reviews: {
        Row: ExerciseCompetitionReviewRow;
        Insert: Insert<ExerciseCompetitionReviewRow, "record_type" | "competition_name" | "location" | "event_category" | "grade" | "partner" | "total_games" | "wins" | "losses" | "final_result" | "strengths" | "improvements" | "next_goal" | "memo" | "created_at" | "updated_at">;
        Update: Partial<Omit<ExerciseCompetitionReviewRow, "exercise_log_id" | "record_type">>;
        Relationships: [];
      };
      calendar_stickers: {
        Row: CalendarStickerRow;
        Insert: Insert<CalendarStickerRow, "id" | "end_date" | "note" | "created_at" | "updated_at">;
        Update: Partial<CalendarStickerRow>;
        Relationships: [];
      };
      record_guidelines: {
        Row: RecordGuidelineRow;
        Insert: Insert<RecordGuidelineRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<RecordGuidelineRow, "id" | "user_id">>;
        Relationships: [];
      };
      annual_planner_custom_items: {
        Row: AnnualPlannerCustomItemRow;
        Insert: Insert<AnnualPlannerCustomItemRow, "id" | "description" | "estimated_minutes" | "checklist_json" | "sort_order" | "created_at" | "updated_at">;
        Update: Partial<AnnualPlannerCustomItemRow>;
        Relationships: [];
      };
      health_practical_schedules: {
        Row: PracticalScheduleRow;
        Insert: Insert<PracticalScheduleRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<PracticalScheduleRow, "id" | "user_id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      user_settings: {
        Row: UserSettingsRow;
        Insert: Insert<UserSettingsRow, "id" | "week_starts_on" | "default_event_minutes" | "event_reminders_enabled" | "task_due_reminders_enabled" | "exercise_enabled" | "writing_assistance_enabled" | "display_density" | "neis_office_code" | "neis_school_code" | "neis_school_name" | "neis_office_name" | "neis_school_level" | "neis_region" | "neis_address" | "school_latitude" | "school_longitude" | "meal_enabled" | "weather_enabled" | "health_support_attendance_confirmer_name" | "created_at" | "updated_at">;
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
      reorder_project_checklist_items: {
        Args: { p_project_id: string; p_item_ids: string[] };
        Returns: undefined;
      };
      reorder_project_places: {
        Args: { p_project_id: string; p_place_ids: string[] };
        Returns: undefined;
      };
      save_project_reservation: {
        Args: { p_reservation_id: string | null; p_values: Json; p_sync_calendar: boolean };
        Returns: string;
      };
      delete_project_reservation: {
        Args: { p_reservation_id: string; p_delete_linked_event: boolean };
        Returns: undefined;
      };
      save_project_budget: {
        Args: { p_project_id: string; p_budget_amount: number; p_currency: string; p_memo: string | null };
        Returns: string;
      };
      delete_project_budget: {
        Args: { p_project_id: string };
        Returns: undefined;
      };
      save_project_expense: {
        Args: { p_expense_id: string | null; p_values: Json };
        Returns: string;
      };
      delete_project_expense: {
        Args: { p_expense_id: string };
        Returns: undefined;
      };
      update_project_expense_status: {
        Args: { p_expense_id: string; p_payment_status: string };
        Returns: undefined;
      };
      save_project_reservation_with_expense: {
        Args: {
          p_reservation_id: string | null;
          p_values: Json;
          p_sync_calendar: boolean;
          p_sync_expense: boolean;
          p_update_expense: boolean;
          p_expense_values: Json | null;
        };
        Returns: string;
      };
      delete_project_reservation_with_expense: {
        Args: {
          p_reservation_id: string;
          p_delete_linked_event: boolean;
          p_delete_linked_expense: boolean;
        };
        Returns: undefined;
      };
      save_event_bundle_v2: {
        Args: { p_item_id: string | null; p_values: Json; p_links?: Json; p_reminders?: Json };
        Returns: string;
      };
      save_event_bundle_v3: {
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
      receive_medication: { Args: { p_item_id: string; p_purchase_plan_id: string | null; p_received_at: string; p_quantity: number; p_actual_unit_price: number; p_expiration_date: string; p_idempotency_key: string }; Returns: string };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
