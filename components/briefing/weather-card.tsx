import { CloudSun } from "lucide-react";
import Link from "next/link";

import type { UserSchoolSettings } from "@/lib/neis/types";

export function WeatherCard({ school }: { readonly school: UserSchoolSettings | null }) {
  return <section className="rail-module school-daily-card weather-card" aria-labelledby="weather-title">
    <div className="rail-heading"><div>{school && <span className="rail-kicker">{school.name}{school.region ? ` · ${school.region}` : ""}</span>}<h2 id="weather-title">오늘의 날씨</h2></div><CloudSun aria-hidden="true" size={18} /></div>
    <p className="rail-empty">{!school ? "학교를 등록하면 학교 지역의 날씨를 확인할 수 있습니다." : school.weatherEnabled ? "학교 지역 날씨 연동을 준비하고 있습니다." : "오늘의 날씨 사용이 꺼져 있습니다."}</p>
    {(!school || !school.weatherEnabled) && <Link className="rail-card-link" href="/settings#school-information">{school ? "설정에서 다시 켜기" : "학교 설정"}</Link>}
  </section>;
}
