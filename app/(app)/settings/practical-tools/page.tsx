import { PageHeader } from "@/components/layout/page-header";
import { PracticalToolsManager } from "@/components/practical-tools/practical-tools-manager";
import { listPracticalTools } from "@/lib/practical-tools/repository";

export default async function PracticalToolsSettingsPage() {
  const tools = await listPracticalTools().catch(() => []);
  return <main className="page-canvas settings-page"><PageHeader description="실무 일정에서 함께 사용할 공용·개인 도구를 관리합니다." title="내 도구" /><PracticalToolsManager tools={tools} /></main>;
}
