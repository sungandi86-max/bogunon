import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { aedStatusLabels, aedStatusPriority, getAedStatus } from "@/lib/aed/domain";
import type { AedDevice } from "@/lib/aed/repository";

export function AedSummaryCard({ devices, today }: { readonly devices: readonly AedDevice[]; readonly today: string }) {
  const prioritized = [...devices].sort((left, right) => aedStatusPriority.indexOf(getAedStatus(left, today)) - aedStatusPriority.indexOf(getAedStatus(right, today)) || left.sortOrder - right.sortOrder).slice(0, 2);
  const counts = devices.reduce((result, device) => {
    const status = getAedStatus(device, today);
    result[status] += 1;
    return result;
  }, { expired: 0, inspectionNeeded: 0, replacementSoon: 0, inspectionSoon: 0, normal: 0 });
  const urgentCount = devices.length - counts.normal;
  return <section aria-labelledby="aed-summary-title" className={`rail-module school-daily-card aed-summary-card${urgentCount > 0 ? " aed-summary-card--urgent" : ""}`}><div className="rail-heading"><div><span className="rail-kicker">보건실 안전 점검</span><h2 id="aed-summary-title">AED 점검</h2></div><ShieldCheck aria-hidden="true" size={18} /></div>{devices.length === 0 ? <><p className="rail-empty">등록된 AED가 없습니다.</p><Link className="rail-card-link" href="/aed"><ArrowRight aria-hidden="true" size={14} />AED 등록</Link></> : <>{urgentCount > 0 && <p className="aed-summary-card__mobile-alert"><strong>AED {urgentCount}대 점검이 필요합니다.</strong><Link href="/aed">점검하기 <ArrowRight aria-hidden="true" size={14} /></Link></p>}<p className="aed-summary-card__count">{devices.length}대 등록 <span>정상 {counts.normal} · 관리 필요 {urgentCount}</span></p><ul className="aed-summary-card__list">{prioritized.map((device) => { const status = getAedStatus(device, today); return <li key={device.id}><span><strong>{device.name}</strong><small>{device.location}</small></span><em className={`aed-summary-card__status aed-summary-card__status--${status}`}>{aedStatusLabels[status]}</em></li>; })}</ul><Link className="rail-card-link" href="/aed">전체 AED 관리 <ArrowRight aria-hidden="true" size={14} /></Link></>}</section>;
}
