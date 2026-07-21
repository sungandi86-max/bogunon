import { ClubRecordWorkspace } from "@/archive/club-records/club-record-workspace";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";

export default function ClubRecordsPage() {
  return (
    <main className="page-canvas club-records-page">
      <PageHeader
        action={<Badge tone="success">초안 작성 준비</Badge>}
        description="학생 활동보고서와 교사 추가 사실을 바탕으로 생활기록부 동아리 활동 문장을 작성합니다."
        title="동아리 학생기록 AI 작성"
      />
      <ClubRecordWorkspace />
    </main>
  );
}
