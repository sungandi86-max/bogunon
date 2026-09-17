import { PageHeader } from "@/components/layout/page-header";
import { ReportCenter } from "@/components/reports/report-center";
import { listUserReports } from "@/lib/reports/repository";
import packageMetadata from "@/package.json";

export default async function SupportReportsPage() {
  const reports = await listUserReports();
  return <main className="page-canvas support-reports-page"><PageHeader description="BOGUNON 사용 중 불편한 점이나 오류가 있다면 알려주세요." title="오류·문의 신고" /><ReportCenter appVersion={packageMetadata.version} reports={reports} /></main>;
}
