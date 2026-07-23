import { createClient } from "@/lib/supabase/server";
import { AcademicImportUnauthorizedError } from "@/lib/academic-calendar-import/repository";
import type { NeisDefaultSchool, UserSchoolSettings } from "@/lib/neis/types";

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new AcademicImportUnauthorizedError();
  return { supabase, userId: user.id };
}

export async function getDefaultNeisSchool(): Promise<NeisDefaultSchool | null> {
  const school = await getUserSchoolSettings();
  if (!school) return null;
  return {
    officeCode: school.officeCode,
    schoolCode: school.schoolCode,
    name: school.name,
    officeName: school.officeName,
  };
}

export async function getUserSchoolSettings(): Promise<UserSchoolSettings | null> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase
    .from("user_settings")
    .select("neis_office_code, neis_school_code, neis_school_name, neis_office_name, neis_school_level, neis_region, neis_address, school_latitude, school_longitude, meal_enabled, weather_enabled")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("학교 정보를 불러오지 못했습니다.");
  if (!data?.neis_office_code || !data.neis_school_code || !data.neis_school_name || !data.neis_office_name) return null;
  return {
    officeCode: data.neis_office_code,
    schoolCode: data.neis_school_code,
    name: data.neis_school_name,
    officeName: data.neis_office_name,
    schoolLevel: data.neis_school_level,
    region: data.neis_region,
    address: data.neis_address,
    latitude: data.school_latitude,
    longitude: data.school_longitude,
    mealEnabled: data.meal_enabled,
    weatherEnabled: data.weather_enabled,
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

export async function upsertUserSchoolSettings(school: UserSchoolSettings): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("user_settings").upsert({
    user_id: userId,
    neis_office_code: school.officeCode,
    neis_school_code: school.schoolCode,
    neis_school_name: school.name,
    neis_office_name: school.officeName,
    neis_school_level: school.schoolLevel,
    neis_region: school.region,
    neis_address: school.address,
    school_latitude: school.latitude,
    school_longitude: school.longitude,
    meal_enabled: school.mealEnabled,
    weather_enabled: school.weatherEnabled,
  }, { onConflict: "user_id" });
  if (error) throw new Error("학교 정보를 저장하지 못했습니다.");
}

export async function clearUserSchoolSettings(): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("user_settings").update({
    neis_office_code: null,
    neis_school_code: null,
    neis_school_name: null,
    neis_office_name: null,
    neis_school_level: null,
    neis_region: null,
    neis_address: null,
    school_latitude: null,
    school_longitude: null,
    meal_enabled: true,
    weather_enabled: true,
  }).eq("user_id", userId);
  if (error) throw new Error("학교 정보를 초기화하지 못했습니다.");
}
