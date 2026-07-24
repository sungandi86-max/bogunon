import { AiConnectionSettings } from "@/components/settings/ai-connection-settings";
import { PageHeader } from "@/components/layout/page-header";

export default function AiConnectionPage() {
  return (
    <main className="page-canvas settings-page ai-connection-page">
      <PageHeader
        description="BOGUNON은 사용자가 직접 연결한 OpenAI 또는 Gemini API를 사용합니다."
        title="AI 연결"
      />
      <div className="settings-layout">
        <AiConnectionSettings />
      </div>
    </main>
  );
}
