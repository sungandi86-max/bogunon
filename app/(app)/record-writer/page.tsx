import { PageHeader } from "@/components/layout/page-header";
import { RecordWriterWorkspace } from "@/components/record-writer/record-writer-workspace";

export default function RecordWriterPage() {
  return (
    <main className="page-canvas record-writer-page">
      <PageHeader
        description="익명 코드와 활동 자료를 바탕으로 나이스에 붙여넣을 기록 초안을 준비합니다."
        eyebrow="로컬 작업 도구"
        title="AI 기록 작성"
      />
      <RecordWriterWorkspace />
    </main>
  );
}
