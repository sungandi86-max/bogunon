"use client";

import type { ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AiAssistantPanel } from "@/components/ai/ai-assistant-panel";
import type { AssistantDraft } from "@/components/ai/ai-assistant-panel";
import { AssistantContext } from "@/components/ai/assistant-context";
import { HealthPresetPreferencesProvider } from "@/components/health-presets/health-preset-preferences-context";
import type { AssistantSurface } from "@/components/ai/assistant-context";
import { AppShellCreateContext } from "@/components/layout/app-shell-create-context";
import { CalendarPreferencesProvider } from "@/components/calendar/calendar-preferences-provider";
import { AcademicCalendarImportMethods } from "@/components/calendar/academic-calendar-import-methods";
import { CreateItemForm } from "@/components/layout/create-item-form";
import { AppHeader } from "@/components/layout/app-header";
import { GlobalNavigation } from "@/components/layout/global-navigation";
import { MobileBottomNavigation } from "@/components/layout/mobile-bottom-navigation";
import { ResponsiveDetailPanel } from "@/components/layout/responsive-detail-panel";
import { Button } from "@/components/ui/button";
import { FirstRunWelcome } from "@/components/pwa/first-run-welcome";
import type { AuthProfile } from "@/lib/auth/profile";
import type { Notice } from "@/lib/notices/model";
import type { TemplateDefinition } from "@/lib/work-items/workflow";
import { defaultHealthPresetPreferences } from "@/lib/work-items/health-preset-personalization";
import type { HealthPresetPreference } from "@/lib/work-items/health-preset-personalization";
import type { RecurrenceFrequency, TaskCategory, TaskPriority } from "@/types/database";

interface AppShellProps {
  readonly children: ReactNode;
  readonly notices?: readonly Notice[];
  readonly profile?: AuthProfile;
  readonly presetPreferences?: readonly HealthPresetPreference[];
}

const fallbackProfile: AuthProfile = { email: "Google 계정", initial: "보", displayName: "Google 계정", avatarUrl: null, role: "user" };
const categories = new Set<TaskCategory>(["studentHealthScreening", "additionalScreening", "infectiousDisease", "firstAid", "medication", "officialDocument", "training", "event", "counseling", "other"]);
const priorities = new Set<TaskPriority>(["high", "normal", "low"]);
const recurrences = new Set<RecurrenceFrequency>(["daily", "weekly", "monthly", "yearly"]);

function textValue(value: unknown, fallback = "") { return typeof value === "string" ? value : fallback; }
function numberValue(value: unknown, fallback: number) { return typeof value === "number" && Number.isFinite(value) ? value : fallback; }
function taskCategory(value: unknown): TaskCategory { return typeof value === "string" && categories.has(value as TaskCategory) ? value as TaskCategory : "other"; }
function taskPriority(value: unknown): TaskPriority { return typeof value === "string" && priorities.has(value as TaskPriority) ? value as TaskPriority : "normal"; }
function recurrence(value: unknown): RecurrenceFrequency | null { return typeof value === "string" && recurrences.has(value as RecurrenceFrequency) ? value as RecurrenceFrequency : null; }

function templateFromAssistantDraft(draft: AssistantDraft, aiDraftId?: string): TemplateDefinition {
  const kind = draft.action === "create_event" ? "event" : "task";
  const checklist = Array.isArray(draft["checklist"]) ? draft["checklist"].filter((item): item is string => typeof item === "string") : [];
  return {
    key: `ai-${Date.now()}`,
    name: "작성 도움 미리보기",
    kind,
    category: taskCategory(draft["category"]),
    title: textValue(draft["title"], kind === "task" ? "새 업무" : "새 일정"),
    description: textValue(draft["description"]),
    priority: taskPriority(draft["priority"]),
    estimatedMinutes: numberValue(draft["estimated_minutes"], 30),
    recommendedTiming: "작성 도움에서 가져옴",
    recurrenceFrequency: recurrence(draft["recurrence"]),
    checklist,
    memo: textValue(draft["memo"]),
    scheduledDate: textValue(draft["scheduled_date"]),
    dueDate: textValue(draft["due_date"]),
    startDate: textValue(draft["start_date"]),
    endDate: textValue(draft["end_date"], textValue(draft["start_date"])),
    startTime: textValue(draft["start_time"]),
    endTime: textValue(draft["end_time"]),
    isAllDay: typeof draft["is_all_day"] === "boolean" ? draft["is_all_day"] : !textValue(draft["start_time"]),
    ...(aiDraftId ? { aiDraftId } : {}),
  };
}

export function AppShell({ children, notices = [], presetPreferences = defaultHealthPresetPreferences(), profile = fallbackProfile }: AppShellProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [createKind, setCreateKind] = useState<"task" | "event">("task");
  const [createTemplate, setCreateTemplate] = useState<TemplateDefinition>();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [academicImportOpen, setAcademicImportOpen] = useState(false);
  const [assistantSurface, setAssistantSurface] = useState<AssistantSurface>("global");
  const [assistantEntityId, setAssistantEntityId] = useState<string>();
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const assistantButtonRef = useRef<HTMLButtonElement>(null);
  const academicImportButtonRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const openCreate = useCallback((trigger: HTMLButtonElement, kind: "task" | "event" = "task", template?: TemplateDefinition) => {
    createButtonRef.current = trigger;
    setCreateKind(kind);
    setCreateTemplate(template);
    setCreateOpen(true);
  }, []);
  const closeCreate = useCallback(() => setCreateOpen(false), []);
  const openAssistant = useCallback((trigger: HTMLButtonElement, surface: AssistantSurface = "global", entityId?: string) => {
    assistantButtonRef.current = trigger;
    setAssistantSurface(surface);
    setAssistantEntityId(entityId);
    setAssistantOpen(true);
  }, []);
  const closeAssistant = useCallback(() => setAssistantOpen(false), []);
  const openAcademicImport = useCallback((trigger: HTMLButtonElement) => {
    academicImportButtonRef.current = trigger;
    setAcademicImportOpen(true);
  }, []);
  const moveAssistantDraftToForm = useCallback((draft: AssistantDraft, draftId?: string) => {
    const trigger = assistantButtonRef.current;
    if (!trigger) return;
    setAssistantOpen(false);
    const template = templateFromAssistantDraft(draft, draftId);
    openCreate(trigger, template.kind, template);
  }, [openCreate]);

  return (
    <CalendarPreferencesProvider>
    <HealthPresetPreferencesProvider initialPreferences={presetPreferences}>
    <AssistantContext value={{ openAssistant }}>
      <AppShellCreateContext value={{ openCreate }}>
        <div className="app-shell">
        <GlobalNavigation notices={notices} onAcademicImport={openAcademicImport} onAssistant={openAssistant} onCreate={openCreate} />
        <AppHeader notices={notices} profile={profile} />
        {children}
        <MobileBottomNavigation onAcademicImport={openAcademicImport} onAssistant={(trigger) => openAssistant(trigger, "global")} onCreate={openCreate} />
        <ResponsiveDetailPanel
          footer={
            <>
              <Button onClick={closeCreate} variant="secondary">취소</Button>
              <Button form="create-work-item-form" type="submit">저장</Button>
            </>
          }
          initialFocusRef={titleRef}
          onClose={closeCreate}
          open={createOpen}
          returnFocusRef={createButtonRef}
          title="새로 만들기"
        >
          <CreateItemForm defaultKind={createKind} {...(createTemplate ? { initialTemplate: createTemplate } : {})} key={`${createKind}-${createTemplate?.key ?? "blank"}-${createOpen}`} onSaved={closeCreate} titleRef={titleRef} />
        </ResponsiveDetailPanel>
        <ResponsiveDetailPanel
          onClose={() => setAcademicImportOpen(false)}
          open={academicImportOpen}
          panelClassName="detail-panel--academic-import"
          returnFocusRef={academicImportButtonRef}
          title="학사일정 가져오기"
        >
          <AcademicCalendarImportMethods onClose={() => setAcademicImportOpen(false)} onComplete={() => router.refresh()} />
        </ResponsiveDetailPanel>
        <AiAssistantPanel {...(assistantEntityId ? { entityId: assistantEntityId } : {})} onApplied={() => router.refresh()} onClose={closeAssistant} onCreateDraft={moveAssistantDraftToForm} open={assistantOpen} returnFocusRef={assistantButtonRef} surface={assistantSurface} />
        <FirstRunWelcome />
        </div>
      </AppShellCreateContext>
    </AssistantContext>
    </HealthPresetPreferencesProvider>
    </CalendarPreferencesProvider>
  );
}
