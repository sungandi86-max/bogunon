import type { AuthProfile } from "@/lib/auth/profile";
import { UserMenu } from "@/components/layout/user-menu";

export function AppHeader({ profile }: { readonly profile: AuthProfile }) {
  return <header aria-label="사용자 헤더" className="app-header"><UserMenu profile={profile} /></header>;
}
