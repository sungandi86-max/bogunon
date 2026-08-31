import { createClient } from "@/lib/supabase/server";
import type { HealthSupportAttendanceConfirmationRow } from "@/types/database";

export type HealthSupportAttendanceConfirmation = Pick<HealthSupportAttendanceConfirmationRow, "instructor_id" | "year" | "month" | "confirmed" | "confirmed_at">;

function validMonth(month: string): { year: number; month: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  const year = Number(match?.[1]);
  const monthNumber = Number(match?.[2]);
  if (!match || year < 2000 || year > 2100 || monthNumber < 1 || monthNumber > 12) throw new Error("유효한 정산 월이 필요합니다.");
  return { year, month: monthNumber };
}

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("로그인이 필요합니다.");
  return { supabase, user };
}

export async function getHealthSupportAttendanceConfirmation(instructorId: string, monthValue: string): Promise<HealthSupportAttendanceConfirmation | null> {
  const { year, month } = validMonth(monthValue);
  const { supabase, user } = await ownedClient();
  const { data, error } = await supabase.from("health_support_attendance_confirmations").select("instructor_id, year, month, confirmed, confirmed_at").eq("user_id", user.id).eq("instructor_id", instructorId).eq("year", year).eq("month", month).maybeSingle();
  if (error) throw new Error("강사 확인 상태를 불러오지 못했습니다.");
  return data;
}

export async function setHealthSupportAttendanceConfirmation(instructorId: string, monthValue: string, confirmed: boolean): Promise<void> {
  const { year, month } = validMonth(monthValue);
  const { supabase, user } = await ownedClient();
  const { error } = await supabase.from("health_support_attendance_confirmations").upsert({ user_id: user.id, instructor_id: instructorId, year, month, confirmed, confirmed_at: confirmed ? new Date().toISOString() : null }, { onConflict: "user_id,instructor_id,year,month" });
  if (error) throw new Error("강사 확인 상태를 저장하지 못했습니다.");
}

export async function listHealthSupportAttendanceConfirmations(): Promise<readonly HealthSupportAttendanceConfirmation[]> {
  const { supabase, user } = await ownedClient();
  const { data, error } = await supabase.from("health_support_attendance_confirmations").select("instructor_id, year, month, confirmed, confirmed_at").eq("user_id", user.id);
  if (error) throw new Error("강사 확인 상태를 불러오지 못했습니다.");
  return data;
}
