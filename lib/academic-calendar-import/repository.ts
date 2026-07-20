import { createClient } from "@/lib/supabase/server";
import type { Database, EventRow } from "@/types/database";

type DatabaseEventInsert = Database["public"]["Tables"]["events"]["Insert"];
export type AcademicEventInsert = Omit<DatabaseEventInsert, "user_id">;

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("로그인이 필요합니다.");
  return { supabase, userId: user.id };
}

export async function requireAcademicImportUser(): Promise<string> {
  return (await ownedClient()).userId;
}

export async function listAcademicSchoolEvents(): Promise<readonly EventRow[]> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase.from("events").select("*").eq("user_id", userId).eq("area", "schoolSchedule");
  if (error) throw new Error("기존 학교 일정을 확인하지 못했습니다.");
  return data;
}

export async function insertAcademicEvents(values: readonly AcademicEventInsert[]): Promise<{ readonly inserted: number; readonly failed: number }> {
  const { supabase, userId } = await ownedClient();
  const rows = values.map((value) => ({ ...value, user_id: userId }));
  const { error } = await supabase.from("events").insert(rows);
  if (error) throw new Error("학사일정을 등록하지 못했습니다.");
  return { inserted: rows.length, failed: 0 };
}
