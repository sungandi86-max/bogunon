import { z } from "zod";

import { HEALTH_PRESETS, healthPresetsForSurface } from "@/lib/work-items/health-presets";
import type { HealthPresetDefinition } from "@/lib/work-items/health-presets";

const presetIds = new Set<string>(HEALTH_PRESETS.map((preset) => preset.key));
const defaultPresetOrder = healthPresetsForSurface("desktop");
const defaultOrderById = new Map(defaultPresetOrder.map((preset, index) => [preset.key, index]));

export const healthPresetPreferenceSchema = z.object({
  presetId: z.string().refine((value) => presetIds.has(value), "알 수 없는 프리셋입니다."),
  favorite: z.boolean(),
  hidden: z.boolean(),
  sortOrder: z.number().int().min(0).max(HEALTH_PRESETS.length - 1),
});

export const healthPresetPreferencesSchema = z.array(healthPresetPreferenceSchema)
  .length(HEALTH_PRESETS.length)
  .refine((items) => new Set(items.map((item) => item.presetId)).size === HEALTH_PRESETS.length, "프리셋 설정이 중복되었습니다.");

export type HealthPresetPreference = z.infer<typeof healthPresetPreferenceSchema>;

export function defaultHealthPresetPreferences(): readonly HealthPresetPreference[] {
  return defaultPresetOrder.map((preset, index) => ({
    presetId: preset.key,
    favorite: false,
    hidden: false,
    sortOrder: index,
  }));
}

export function mergeHealthPresetPreferences(
  stored: readonly Partial<HealthPresetPreference>[],
): readonly HealthPresetPreference[] {
  const storedById = new Map(stored.map((item) => [item.presetId, item]));
  return defaultHealthPresetPreferences()
    .map((fallback) => {
      const item = storedById.get(fallback.presetId);
      return healthPresetPreferenceSchema.parse({
        presetId: fallback.presetId,
        favorite: item?.favorite ?? false,
        hidden: item?.hidden ?? false,
        sortOrder: item?.sortOrder ?? fallback.sortOrder,
      });
    })
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((item, sortOrder) => ({ ...item, sortOrder }));
}

export function personalizedHealthPresets(
  preferences: readonly HealthPresetPreference[],
  options: { readonly includeHidden?: boolean } = {},
): readonly HealthPresetDefinition[] {
  const preferenceById = new Map(preferences.map((item) => [item.presetId, item]));
  return [...HEALTH_PRESETS]
    .filter((preset) => options.includeHidden || !preferenceById.get(preset.key)?.hidden)
    .sort((left, right) => {
      const leftPreference = preferenceById.get(left.key);
      const rightPreference = preferenceById.get(right.key);
      const favoriteDifference = Number(rightPreference?.favorite ?? false) - Number(leftPreference?.favorite ?? false);
      if (favoriteDifference !== 0) return favoriteDifference;
      return (leftPreference?.sortOrder ?? defaultOrderById.get(left.key) ?? 0) - (rightPreference?.sortOrder ?? defaultOrderById.get(right.key) ?? 0);
    });
}

export function moveHealthPresetPreference(
  preferences: readonly HealthPresetPreference[],
  presetId: string,
  direction: -1 | 1,
): readonly HealthPresetPreference[] {
  const ordered = [...preferences].sort((left, right) => left.sortOrder - right.sortOrder);
  const currentIndex = ordered.findIndex((item) => item.presetId === presetId);
  const targetIndex = currentIndex + direction;
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= ordered.length) return preferences;
  const current = ordered[currentIndex];
  const target = ordered[targetIndex];
  if (!current || !target) return preferences;
  ordered[currentIndex] = target;
  ordered[targetIndex] = current;
  return ordered.map((item, sortOrder) => ({ ...item, sortOrder }));
}
