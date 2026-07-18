"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import { HEALTH_PRESETS } from "@/lib/work-items/health-presets";
import type { HealthPresetDefinition } from "@/lib/work-items/health-presets";

export const RECENT_HEALTH_PRESETS_KEY = "bogunon.recent-health-presets";
const RECENT_LIMIT = 4;
const RECENT_PRESETS_EVENT = "bogunon:recent-health-presets-change";
const presetByKey = new Map<string, HealthPresetDefinition>(HEALTH_PRESETS.map((preset) => [preset.key, preset]));

function parseRecentKeys(value: string): readonly string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((key): key is string => typeof key === "string" && presetByKey.has(key)).filter((key, index, keys) => keys.indexOf(key) === index).slice(0, RECENT_LIMIT);
  } catch (error) {
    if (error instanceof DOMException || error instanceof SyntaxError) return [];
    throw error;
  }
}

function getRecentSnapshot(): string {
  try {
    return window.localStorage.getItem(RECENT_HEALTH_PRESETS_KEY) ?? "[]";
  } catch (error) {
    if (error instanceof DOMException) return "[]";
    throw error;
  }
}

function subscribeToRecentPresets(onStoreChange: () => void): () => void {
  function handleStorage(event: StorageEvent) {
    if (event.key === RECENT_HEALTH_PRESETS_KEY) onStoreChange();
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(RECENT_PRESETS_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(RECENT_PRESETS_EVENT, onStoreChange);
  };
}

export function useRecentHealthPresets() {
  const snapshot = useSyncExternalStore(subscribeToRecentPresets, getRecentSnapshot, () => "[]");
  const recentKeys = useMemo(() => parseRecentKeys(snapshot), [snapshot]);

  const remember = useCallback((key: string) => {
    const next = [key, ...parseRecentKeys(getRecentSnapshot()).filter((item) => item !== key)].slice(0, RECENT_LIMIT);
    try {
      window.localStorage.setItem(RECENT_HEALTH_PRESETS_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(RECENT_PRESETS_EVENT));
    } catch (error) {
      if (!(error instanceof DOMException)) throw error;
    }
  }, []);

  const presets = recentKeys.map((key) => presetByKey.get(key)).filter((preset): preset is HealthPresetDefinition => preset !== undefined);
  return { presets, remember } as const;
}
