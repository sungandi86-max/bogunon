import Link from "next/link";

import { SmartCalendarGenerator } from "@/components/calendar/smart-calendar-generator";
import { PageHeader } from "@/components/layout/page-header";
import { getUserSchoolSettings } from "@/lib/neis/school-settings";
import { todayInSeoul } from "@/lib/work-items/date";

export default async function GeneratorPage() {
  const school = await getUserSchoolSettings();
  const currentYear = Number(todayInSeoul().slice(0, 4));

  return <main className="page-canvas smart-calendar-page">
    <PageHeader
      action={<Link className="button button--secondary" href="/calendar">캘린더로 돌아가기</Link>}
      description="학교 정보와 프리셋을 바탕으로 일정을 검토한 뒤 한 번에 생성합니다."
      title="Smart Calendar Generator"
    />
    {school
      ? <SmartCalendarGenerator currentYear={currentYear} school={{ name: school.name, schoolLevel: school.schoolLevel, region: school.region }} />
      : <section className="smart-calendar-empty">
          <h2>학교 정보가 필요합니다</h2>
          <p>Smart Calendar를 만들려면 학교 정보를 먼저 등록해주세요.</p>
          <Link className="button button--primary" href="/settings">학교 설정으로 이동</Link>
        </section>}
  </main>;
}
