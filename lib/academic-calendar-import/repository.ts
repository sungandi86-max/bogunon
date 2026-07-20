import { createClient } from "@/lib/supabase/server";
import type { Database, EventRow } from "@/types/database";

type DatabaseEventInsert = Database["public"]["Tables"]["events"]["Insert"];
export type AcademicEventInsert = Omit<DatabaseEventInsert, "user_id">;

export class AcademicImportUnauthorizedError extends Error {
  constructor() {
    super("로그인이 필요합니다.");
    this.name = "AcademicImportUnauthorizedError";
  }
}

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new AcademicImportUnauthorizedError();
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

export async function updateAcademicEventDescriptions(
  values: readonly { readonly id: string; readonly description: string | null }[],
): Promise<{ readonly updated: number; readonly failed: number }> {
  const { supabase, userId } = await ownedClient();
  let updated = 0;
  for (const value of values) {
    const { error } = await supabase
      .from("events")
      .update({ description: value.description })
      .eq("id", value.id)
      .eq("user_id", userId)
      .eq("area", "schoolSchedule");
    if (error) throw new Error("학사일정 변경 내용을 반영하지 못했습니다.");
    updated += 1;
  }
  return { updated, failed: 0 };
}
