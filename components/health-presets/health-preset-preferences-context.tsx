"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  resetHealthPresetPreferencesAction,
  saveHealthPresetPreferencesAction,
} from "@/app/(app)/health-preset-preference-actions";
import {
  defaultHealthPresetPreferences,
  mergeHealthPresetPreferences,
  moveHealthPresetPreference,
  personalizedHealthPresets,
} from "@/lib/work-items/health-preset-personalization";
import type { HealthPresetPreference } from "@/lib/work-items/health-preset-personalization";
import type { HealthPresetDefinition } from "@/lib/work-items/health-presets";

type HealthPresetPreferencesContextValue = {
  readonly preferences: readonly HealthPresetPreference[];
  readonly visiblePresets: readonly HealthPresetDefinition[];
  readonly hiddenPresets: readonly HealthPresetDefinition[];
  readonly isPending: boolean;
  readonly message: string;
  readonly preferenceFor: (presetId: string) => HealthPresetPreference | undefined;
  readonly toggleFavorite: (presetId: string) => void;
  readonly setHidden: (presetId: string, hidden: boolean) => void;
  readonly movePreset: (presetId: string, direction: -1 | 1) => void;
  readonly reorderPreset: (presetId: string, targetPresetId: string) => void;
  readonly resetPreferences: () => void;
};

const HealthPresetPreferencesContext = createContext<HealthPresetPreferencesContextValue | undefined>(undefined);

export function HealthPresetPreferencesProvider({
  children,
  initialPreferences,
}: {
  readonly children: ReactNode;
  readonly initialPreferences: readonly HealthPresetPreference[];
}) {
  const router = useRouter();
  const [preferences, setPreferences] = useState(() => mergeHealthPresetPreferences(initialPreferences));
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const preferenceById = useMemo(() => new Map(preferences.map((item) => [item.presetId, item])), [preferences]);
  const visiblePresets = useMemo(() => personalizedHealthPresets(preferences), [preferences]);
  const hiddenPresets = useMemo(
    () => personalizedHealthPresets(preferences, { includeHidden: true }).filter((preset) => preferenceById.get(preset.key)?.hidden),
    [preferenceById, preferences],
  );

  function persist(next: readonly HealthPresetPreference[], previous: readonly HealthPresetPreference[]): void {
    setPreferences(next);
    setMessage("");
    startTransition(async () => {
      const result = await saveHealthPresetPreferencesAction(next);
      if (result.status === "error") {
        setPreferences(previous);
        setMessage(result.message);
        return;
      }
      setMessage(result.message);
      router.refresh();
    });
  }

  function updatePreference(presetId: string, update: (current: HealthPresetPreference) => HealthPresetPreference): void {
    if (isPending) return;
    const previous = preferences;
    const next = preferences.map((item) => item.presetId === presetId ? update(item) : item);
    persist(next, previous);
  }

  function toggleFavorite(presetId: string): void {
    updatePreference(presetId, (current) => ({ ...current, favorite: !current.favorite }));
  }

  function setHidden(presetId: string, hidden: boolean): void {
    updatePreference(presetId, (current) => ({ ...current, hidden }));
  }

  function movePreset(presetId: string, direction: -1 | 1): void {
    if (isPending) return;
    const previous = preferences;
    persist(moveHealthPresetPreference(preferences, presetId, direction), previous);
  }

  function reorderPreset(presetId: string, targetPresetId: string): void {
    if (isPending || presetId === targetPresetId) return;
    const previous = preferences;
    const ordered = [...preferences].sort((left, right) => left.sortOrder - right.sortOrder);
    const sourceIndex = ordered.findIndex((item) => item.presetId === presetId);
    const targetIndex = ordered.findIndex((item) => item.presetId === targetPresetId);
    const source = ordered[sourceIndex];
    if (sourceIndex < 0 || targetIndex < 0 || !source) return;
    ordered.splice(sourceIndex, 1);
    ordered.splice(targetIndex, 0, source);
    persist(ordered.map((item, sortOrder) => ({ ...item, sortOrder })), previous);
  }

  function resetPreferences(): void {
    if (isPending) return;
    const previous = preferences;
    const defaults = defaultHealthPresetPreferences();
    setPreferences(defaults);
    setMessage("");
    startTransition(async () => {
      const result = await resetHealthPresetPreferencesAction();
      if (result.status === "error") {
        setPreferences(previous);
        setMessage(result.message);
        return;
      }
      setMessage(result.message);
      router.refresh();
    });
  }

  return (
    <HealthPresetPreferencesContext value={{
      preferences,
      visiblePresets,
      hiddenPresets,
      isPending,
      message,
      preferenceFor: (presetId) => preferenceById.get(presetId),
      toggleFavorite,
      setHidden,
      movePreset,
      reorderPreset,
      resetPreferences,
    }}>
      {children}
    </HealthPresetPreferencesContext>
  );
}

export function useHealthPresetPreferences(): HealthPresetPreferencesContextValue {
  const value = useContext(HealthPresetPreferencesContext);
  if (!value) throw new Error("HealthPresetPreferencesProvider가 필요합니다.");
  return value;
}
