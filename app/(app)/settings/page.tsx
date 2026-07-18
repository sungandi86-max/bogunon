import { SettingsError } from "@/components/settings/settings-error";
import { SettingsForm } from "@/components/settings/settings-form";
import { PageHeader } from "@/components/layout/page-header";
import { DEFAULT_USER_SETTINGS } from "@/lib/settings/domain";
import { getUserSettings } from "@/lib/settings/repository";

export default async function SettingsPage() {
  const result = await getUserSettings().then((value) => ({ ok: true, value } as const)).catch(() => ({ ok: false } as const));
  if (!result.ok) {
    return <main className="page-canvas settings-page"><PageHeader description="알림과 화면, 자주 쓰는 기능을 내 방식에 맞춥니다." title="설정" /><SettingsError /></main>;
  }
  const { email, row } = result.value;
  const initialValues = row ? {
    weekStartsOn: row.week_starts_on,
    defaultEventMinutes: row.default_event_minutes,
    eventRemindersEnabled: row.event_reminders_enabled,
    taskDueRemindersEnabled: row.task_due_reminders_enabled,
    exerciseEnabled: row.exercise_enabled,
    writingAssistanceEnabled: row.writing_assistance_enabled,
    displayDensity: row.display_density,
  } as const : DEFAULT_USER_SETTINGS;
  return <main className="page-canvas settings-page"><PageHeader description="알림과 화면, 자주 쓰는 기능을 내 방식에 맞춥니다." title="설정" /><SettingsForm email={email} initialValues={initialValues} /><form action="/auth/logout" id="settings-logout-form" method="post" /></main>;
}
