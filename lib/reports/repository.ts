import { createClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/notices/model";
import type { AdminUserReport, ReportStatus, ReportType, UserReport } from "@/lib/reports/model";
import { sanitizePathname } from "@/lib/reports/model";
import type { Database, UserReportAdminNoteRow, UserReportRow } from "@/types/database";

export class ReportAccessError extends Error {
  constructor(message = "신고센터 권한을 확인하지 못했습니다.") {
    super(message);
    this.name = "ReportAccessError";
  }
}

const REPORT_COLUMNS = "id,user_id,report_type,title,description,attempted_action,observed_result,reproducible,page_path,app_version,user_agent,viewport_width,viewport_height,status,created_at,updated_at";

async function authenticated() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new ReportAccessError("로그인이 필요합니다.");
  return { supabase, user };
}

function mapReport(row: UserReportRow): UserReport {
  return { id: row.id, userId: row.user_id, reportType: row.report_type, title: row.title, description: row.description, attemptedAction: row.attempted_action, observedResult: row.observed_result, reproducible: row.reproducible, pagePath: row.page_path, appVersion: row.app_version, userAgent: row.user_agent, viewportWidth: row.viewport_width, viewportHeight: row.viewport_height, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at };
}

function mapAdminReport(row: UserReportRow, note: UserReportAdminNoteRow | undefined): AdminUserReport {
  return { ...mapReport(row), adminNote: note?.admin_note ?? null };
}

export async function listUserReports(): Promise<readonly UserReport[]> {
  const { supabase, user } = await authenticated();
  const { data, error } = await supabase.from("user_reports").select(REPORT_COLUMNS).eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapReport(row));
}

export type ReportFilters = { readonly reportType?: ReportType; readonly status?: ReportStatus };

export async function listAllReports(filters: ReportFilters = {}): Promise<readonly AdminUserReport[]> {
  const { supabase, user } = await authenticated();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!isAdminRole(profile?.role ?? "user")) throw new ReportAccessError("신고 관리 권한이 없습니다.");
  let query = supabase.from("user_reports").select(REPORT_COLUMNS).order("created_at", { ascending: false });
  if (filters.reportType) query = query.eq("report_type", filters.reportType);
  if (filters.status) query = query.eq("status", filters.status);
  const { data, error } = await query;
  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) return [];
  const { data: notes, error: notesError } = await supabase.from("user_report_admin_notes").select("report_id,admin_note,created_at,updated_at").in("report_id", rows.map((row) => row.id));
  if (notesError) throw notesError;
  const notesByReportId = new Map((notes ?? []).map((note) => [note.report_id, note]));
  return rows.map((row) => mapAdminReport(row, notesByReportId.get(row.id)));
}

export type CreateReportInput = {
  readonly reportType: ReportType; readonly title: string; readonly description: string; readonly attemptedAction: string | null;
  readonly observedResult: string | null; readonly reproducible: "yes" | "no" | "unknown" | null; readonly pagePath: string;
  readonly appVersion: string | null; readonly userAgent: string | null; readonly viewportWidth: number | null; readonly viewportHeight: number | null;
};

export async function createReport(input: CreateReportInput): Promise<void> {
  const { supabase, user } = await authenticated();
  const insert: Database["public"]["Tables"]["user_reports"]["Insert"] = { user_id: user.id, report_type: input.reportType, title: input.title, description: input.description, attempted_action: input.attemptedAction, observed_result: input.observedResult, reproducible: input.reproducible, page_path: sanitizePathname(input.pagePath), app_version: input.appVersion, user_agent: input.userAgent, viewport_width: input.viewportWidth, viewport_height: input.viewportHeight };
  const { error } = await supabase.from("user_reports").insert(insert);
  if (error) throw error;
}

export async function updateReport(id: string, status: ReportStatus, adminNote: string | null): Promise<void> {
  const { supabase, user } = await authenticated();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!isAdminRole(profile?.role ?? "user")) throw new ReportAccessError("신고 관리 권한이 없습니다.");
  const { error } = await supabase.from("user_reports").update({ status }).eq("id", id);
  if (error) throw error;
  const note: Database["public"]["Tables"]["user_report_admin_notes"]["Insert"] = { report_id: id, admin_note: adminNote };
  const { error: noteError } = await supabase.from("user_report_admin_notes").upsert(note, { onConflict: "report_id" });
  if (noteError) throw noteError;
}
