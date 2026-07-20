import { createClient } from "@/lib/supabase/server";
import { AcademicImportUnauthorizedError } from "@/lib/academic-calendar-import/repository";
import type { NeisDefaultSchool } from "@/lib/neis/types";

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new AcademicImportUnauthorizedError();
  return { supabase, userId: user.id };
}

export async function getDefaultNeisSchool(): Promise<NeisDefaultSchool | null> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase
    .from("user_settings")
    .select("neis_office_code, neis_school_code, neis_school_name, neis_office_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("기본 학교를 불러오지 못했습니다.");
  if (!data?.neis_office_code || !data.neis_school_code || !data.neis_school_name || !data.neis_office_name) return null;
  return {
    officeCode: data.neis_office_code,
    schoolCode: data.neis_school_code,
    name: data.neis_school_name,
    officeName: data.neis_office_name,
  };
}

export async function upsertDefaultNeisSchool(school: NeisDefaultSchool): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("user_settings").upsert({
    user_id: userId,
    neis_office_code: school.officeCode,
    neis_school_code: school.schoolCode,
    neis_school_name: school.name,
    neis_office_name: school.officeName,
  }, { onConflict: "user_id" });
  if (error) throw new Error("기본 학교를 저장하지 못했습니다.");
}
