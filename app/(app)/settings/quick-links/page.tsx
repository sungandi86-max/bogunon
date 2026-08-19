import { listQuickLinks } from "@/lib/quick-links/repository";
import { QuickLinksManager } from "@/components/quick-links/quick-links-manager";

export default async function QuickLinksPage() {
  const links = await listQuickLinks().catch(() => []);
  return <main className="page-canvas quick-links-page"><header className="page-header"><div><p>자주 쓰는 링크</p><h1>업무 시작 링크를 관리하세요.</h1></div></header><QuickLinksManager links={links} /></main>;
}
