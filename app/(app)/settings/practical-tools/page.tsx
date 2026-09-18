import { PageHeader } from "@/components/layout/page-header";
import { PracticalToolsManager } from "@/components/practical-tools/practical-tools-manager";
import { listPracticalTools } from "@/lib/practical-tools/repository";
import { getCurrentProfile } from "@/lib/notices/repository";
import { isAdminRole } from "@/lib/notices/model";

export default async function PracticalToolsSettingsPage() {
  const [tools, profile] = await Promise.all([listPracticalTools(), getCurrentProfile()]);
  return <main className="page-canvas settings-page"><PageHeader description="실무 일정에서 사용할 공용 도구와 개인 업무 링크를 관리합니다." title="실무 도구 관리" /><PracticalToolsManager isAdmin={isAdminRole(profile.role)} tools={tools} /></main>;
}
