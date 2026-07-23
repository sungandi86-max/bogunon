import { RefreshCw, Utensils } from "lucide-react";
import Link from "next/link";

import { fetchTodayMeal } from "@/lib/neis/meals";
import type { UserSchoolSettings } from "@/lib/neis/types";

export function MealCardSkeleton() {
  return <section aria-label="오늘의 급식 불러오는 중" className="rail-module school-daily-card"><div className="rail-heading"><h2>오늘의 급식</h2><Utensils aria-hidden="true" size={17} /></div><div className="rail-skeleton"><span /><span /><span /></div></section>;
}

export async function MealCard({ date, school }: { readonly date: string; readonly school: UserSchoolSettings | null }) {
  if (!school) return <section className="rail-module school-daily-card" aria-labelledby="meal-title"><div className="rail-heading"><h2 id="meal-title">오늘의 급식</h2><Utensils aria-hidden="true" size={17} /></div><p className="rail-empty">학교를 등록하면 오늘의 급식을 확인할 수 있습니다.</p><Link className="rail-card-link" href="/settings#school-information">학교 설정</Link></section>;
  if (!school.mealEnabled) return <section className="rail-module school-daily-card" aria-labelledby="meal-title"><div className="rail-heading"><div><span className="rail-kicker">{school.name}</span><h2 id="meal-title">오늘의 급식</h2></div><Utensils aria-hidden="true" size={17} /></div><p className="rail-empty">오늘의 급식 사용이 꺼져 있습니다.</p><Link className="rail-card-link" href="/settings#school-information">설정에서 다시 켜기</Link></section>;
  const meal = await fetchTodayMeal(school, date);
  return <section className="rail-module school-daily-card" aria-labelledby="meal-title">
    <div className="rail-heading"><div><span className="rail-kicker">{school.name} · {date.replaceAll("-", ". ")}</span><h2 id="meal-title">오늘의 급식</h2></div><Utensils aria-hidden="true" size={17} /></div>
    {meal.status === "ready" && <><ul className="meal-menu">{meal.menu.map((item) => <li key={item}>{item}</li>)}</ul>{meal.calories && <p className="meal-calories">{meal.calories}</p>}</>}
    {meal.status === "empty" && <p className="rail-empty">오늘은 급식 정보가 없습니다.</p>}
    {meal.status === "error" && <><p className="rail-empty">급식 정보를 불러오지 못했습니다.</p><Link className="rail-card-link" href="/briefing"><RefreshCw aria-hidden="true" size={14} />재시도</Link></>}
  </section>;
}
