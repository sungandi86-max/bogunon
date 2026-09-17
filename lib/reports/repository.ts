import { createClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/notices/model";
import type { ReportStatus, ReportType, UserReport } from "@/lib/reports/model";
import { sanitizePathname } from "@/lib/reports/model";
import type { Database, UserReportRow } from "@/types/database";

export class ReportAccessError extends Error { constructor(message = "신고센터 권한을 확인하지 못했습니다.") { super(message); this.name = "ReportAccessError"; } }

async function authenticated() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new ReportAccessError("로그인이 필요합니다.");
  return { supabase, user };
}

function mapReport(row: UserReportRow): UserReport {
  return { id: row.id, userId: row.user_id, reportType: row.report_type, title: row.title, description: row.description, attemptedAction: row.attempted_action, observedResult: row.observed_result, reproducible: row.reproducible, pagePath: row.page_path, appVersion: row.app_version, userAgent: row.user_agent, viewportWidth: row.viewport_width, viewportHeight: row.viewport_height, status: row.status, adminNote: row.admin_note, createdAt: row.created_at, updatedAt: row.updated_at };
}

export async function listUserReports(): Promise<readonly UserReport[]> {
  const { supabase, user } = await authenticated();
  const { data, error } = await supabase.from("user_reports").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapReport);
}

export async function listAllReports(): Promise<readonly UserReport[]> {
  const { supabase, user } = await authenticated();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!isAdminRole(profile?.role ?? "user")) throw new ReportAccessError("신고 관리 권한이 없습니다.");
  const { data, error } = await supabase.from("user_reports").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapReport);
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
  const { error } = await supabase.from("user_reports").update({ status, admin_note: adminNote }).eq("id", id);
  if (error) throw error;
}
