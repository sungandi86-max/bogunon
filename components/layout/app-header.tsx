import { BogunonBrand } from "@/components/brand/bogunon-brand";
import type { AuthProfile } from "@/lib/auth/profile";
import { UserMenu } from "@/components/layout/user-menu";
import type { Notice } from "@/lib/notices/model";

export function AppHeader({ notices = [], profile }: { readonly notices?: readonly Notice[]; readonly profile: AuthProfile }) {
  return <header aria-label="사용자 헤더" className="app-header">
    <div className="app-header__mobile-brand"><BogunonBrand size="compact" /></div>
    <UserMenu notices={notices} profile={profile} />
  </header>;
}
