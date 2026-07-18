import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  healthPresetPreferencesSchema,
  mergeHealthPresetPreferences,
} from "@/lib/work-items/health-preset-personalization";
import type { HealthPresetPreference } from "@/lib/work-items/health-preset-personalization";
import type { Database } from "@/types/database";

const preferenceRowSchema = z.object({
  preset_id: z.string(),
  favorite: z.boolean(),
  hidden: z.boolean(),
  sort_order: z.number().int(),
});

type PreferenceInsert = Database["public"]["Tables"]["health_preset_preferences"]["Insert"];

class HealthPresetPreferenceRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HealthPresetPreferenceRepositoryError";
  }
}

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new HealthPresetPreferenceRepositoryError("로그인이 필요합니다.");
  return { supabase, userId: user.id };
}

export async function listHealthPresetPreferences(): Promise<readonly HealthPresetPreference[]> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase
    .from("health_preset_preferences")
    .select("preset_id,favorite,hidden,sort_order")
    .eq("user_id", userId)
    .order("sort_order");
  if (error?.code === "PGRST205" || error?.code === "42P01") return mergeHealthPresetPreferences([]);
  if (error) throw new HealthPresetPreferenceRepositoryError("보건업무 프리셋 설정을 불러오지 못했습니다.");
  const parsedRows = data.flatMap((row) => {
    const parsed = preferenceRowSchema.safeParse(row);
    return parsed.success ? [{
      presetId: parsed.data.preset_id,
      favorite: parsed.data.favorite,
      hidden: parsed.data.hidden,
      sortOrder: parsed.data.sort_order,
    }] : [];
  });
  return mergeHealthPresetPreferences(parsedRows);
}

export async function saveHealthPresetPreferences(preferences: readonly HealthPresetPreference[]): Promise<void> {
  const values = healthPresetPreferencesSchema.parse(preferences);
  const { supabase, userId } = await ownedClient();
  const rows: PreferenceInsert[] = values.map((item) => ({
    user_id: userId,
    preset_id: item.presetId,
    favorite: item.favorite,
    hidden: item.hidden,
    sort_order: item.sortOrder,
  }));
  const { error } = await supabase.from("health_preset_preferences").upsert(rows, { onConflict: "user_id,preset_id" });
  if (error) throw new HealthPresetPreferenceRepositoryError("보건업무 프리셋 설정을 저장하지 못했습니다.");
}

export async function resetHealthPresetPreferences(): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("health_preset_preferences").delete().eq("user_id", userId);
  if (error) throw new HealthPresetPreferenceRepositoryError("보건업무 프리셋 설정을 초기화하지 못했습니다.");
}
