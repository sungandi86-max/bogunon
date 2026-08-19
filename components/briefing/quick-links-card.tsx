import { ExternalLink, FileText, FolderOpen, GraduationCap, HeartPulse, Landmark, Link2, Sheet } from "lucide-react";
import Link from "next/link";

import type { QuickLink } from "@/lib/quick-links/repository";

const icons = { document: FileText, spreadsheet: Sheet, drive: FolderOpen, school: GraduationCap, admin: Landmark, health: HeartPulse, web: Link2, other: Link2 } as const;

export function QuickLinksCard({ links }: { readonly links: readonly QuickLink[] }) {
  const visible = links.filter((link) => link.isVisible).slice(0, 8);
  return <section className="school-daily-card quick-links-card" aria-labelledby="quick-links-title"><div className="rail-heading"><div><span className="rail-kicker">업무 바로가기</span><h2 id="quick-links-title">자주 쓰는 링크</h2></div><Link aria-label="링크 관리" href="/settings/quick-links"><Link2 aria-hidden="true" size={17} /></Link></div>{visible.length === 0 ? <div className="quick-links-card__empty"><p>자주 쓰는 사이트를 등록해보세요.</p><Link href="/settings/quick-links"><span>첫 링크 추가</span><ExternalLink aria-hidden="true" size={14} /></Link></div> : <div className="quick-links-card__grid">{visible.map((link) => { const Icon = icons[link.iconKey]; return <a className="quick-links-card__item" href={link.url} key={link.id} rel="noopener noreferrer" target="_blank" title={link.name}><Icon aria-hidden="true" size={16} /><span>{link.name}</span></a>; })}</div>}<Link className="quick-links-card__manage" href="/settings/quick-links">링크 관리 <ExternalLink aria-hidden="true" size={13} /></Link></section>;
}
