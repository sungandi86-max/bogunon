import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { createLoginPath } from "@/lib/auth/redirects";
import { createAuthProfile } from "@/lib/auth/profile";
import { getCurrentProfile, listNotices } from "@/lib/notices/repository";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { listHealthPresetPreferences } from "@/lib/work-items/health-preset-preferences-repository";

interface ProtectedLayoutProps {
  readonly children: ReactNode;
}

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  if (!hasSupabaseConfig()) redirect(createLoginPath("configuration"));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect(createLoginPath("sessionExpired"));
  const [presetPreferences, currentProfile, notices] = await Promise.all([listHealthPresetPreferences(), getCurrentProfile(), listNotices()]);

  return <AppShell notices={notices} presetPreferences={presetPreferences} profile={createAuthProfile(currentProfile.email, { displayName: currentProfile.displayName, avatarUrl: currentProfile.avatarUrl, role: currentProfile.role })}>{children}</AppShell>;
}
