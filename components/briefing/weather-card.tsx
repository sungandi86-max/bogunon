import { CloudSun } from "lucide-react";
import Link from "next/link";

import type { NeisDefaultSchool } from "@/lib/neis/types";

export function WeatherCard({ school }: { readonly school: NeisDefaultSchool | null }) {
  return <section className="rail-module school-daily-card weather-card" aria-labelledby="weather-title">
    <div className="rail-heading"><h2 id="weather-title">오늘의 날씨</h2><CloudSun aria-hidden="true" size={18} /></div>
    <p className="rail-empty">{school ? "날씨 API가 아직 연결되지 않았습니다." : "학교 위치를 설정하면 날씨를 확인할 수 있습니다."}</p>
    {!school && <Link className="rail-card-link" href="/settings">학교 설정</Link>}
  </section>;
}
