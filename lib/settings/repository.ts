import { createClient } from "@/lib/supabase/server";
import type { UserSettingsInput } from "@/lib/settings/domain";
import type { UserSettingsRow } from "@/types/database";

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("로그인이 필요합니다.");
  return { supabase, user };
}

export async function getUserSettings(): Promise<{ readonly row: UserSettingsRow | null; readonly email: string }> {
  const { supabase, user } = await ownedClient();
  const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle();
  if (error) throw new Error("설정을 불러오지 못했습니다.");
  return { row: data, email: user.email ?? "Google 계정" };
}

export async function upsertUserSettings(values: UserSettingsInput): Promise<void> {
  const { supabase, user } = await ownedClient();
  const { error } = await supabase.from("user_settings").upsert({
    user_id: user.id,
    week_starts_on: values.weekStartsOn,
    default_event_minutes: values.defaultEventMinutes,
    event_reminders_enabled: values.eventRemindersEnabled,
    task_due_reminders_enabled: values.taskDueRemindersEnabled,
    exercise_enabled: values.exerciseEnabled,
    writing_assistance_enabled: values.writingAssistanceEnabled,
    display_density: values.displayDensity,
  }, { onConflict: "user_id" });
  if (error) throw new Error("설정을 저장하지 못했습니다.");
}
