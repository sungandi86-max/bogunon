import { MapPin, School } from "lucide-react";
import Link from "next/link";

import type { NeisDefaultSchool } from "@/lib/neis/types";

export function SchoolInfoCard({ school }: { readonly school: NeisDefaultSchool | null }) {
  return <details className="rail-module school-info-card">
    <summary><span><School aria-hidden="true" size={17} /><span><strong>학교 정보</strong><small title={school?.name}>{school?.name ?? "학교 미설정"}</small></span></span></summary>
    <div className="school-info-card__body">
      {school ? <dl><div><dt>학교명</dt><dd>{school.name}</dd></div><div><dt>교육청명</dt><dd>{school.officeName}</dd></div><div><dt>교육청 코드</dt><dd>{school.officeCode}</dd></div><div><dt>표준학교 코드</dt><dd>{school.schoolCode}</dd></div></dl> : <p className="rail-empty"><MapPin aria-hidden="true" size={16} />아직 학교가 설정되지 않았습니다.</p>}
      <Link className="rail-card-link" href="/settings">{school ? "학교 정보 수정" : "학교 설정하기"}</Link>
    </div>
  </details>;
}
