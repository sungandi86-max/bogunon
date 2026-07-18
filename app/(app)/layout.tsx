import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { createLoginPath } from "@/lib/auth/redirects";
import { createAuthProfile } from "@/lib/auth/profile";
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
  const presetPreferences = await listHealthPresetPreferences();

  return <AppShell presetPreferences={presetPreferences} profile={createAuthProfile(data.user.email)}>{children}</AppShell>;
}
