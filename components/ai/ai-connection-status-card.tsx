"use client";

import { Bot, CheckCircle2, PlugZap, Settings, Sparkles, Unplug } from "lucide-react";
import Link from "next/link";

import { useAiConnection } from "@/components/ai/ai-connection-context";
import { Button } from "@/components/ui/button";
import { AI_PROVIDER_CONFIG, getAiModelLabel } from "@/lib/ai/config";

export function AiConnectionStatusCard() {
  const ai = useAiConnection();
  const connected = ai.connection !== null;

  return (
    <aside className={`ai-writer-connection is-${connected ? "connected" : "disconnected"}`}>
      {connected
        ? ai.connection.provider === "openai"
          ? <Bot aria-hidden="true" size={20} />
          : <Sparkles aria-hidden="true" size={20} />
        : <PlugZap aria-hidden="true" size={20} />}
      <div>
        {connected ? (
          <>
            <span className="ai-writer-connection__identity">
              <strong>{AI_PROVIDER_CONFIG[ai.connection.provider].label}</strong>
              <span className="ai-writer-connection__state">
                <CheckCircle2 aria-hidden="true" size={14} />
                연결됨
              </span>
            </span>
            <span>{getAiModelLabel(ai.connection.provider, ai.connection.model)}</span>
          </>
        ) : (
          <>
            <strong>AI가 아직 연결되지 않았습니다.</strong>
            <span>
              {ai.status.kind === "failed"
                ? ai.status.message
                : "개인 API를 연결해야 실제 초안을 만들 수 있습니다."}
            </span>
          </>
        )}
      </div>
      <div className="ai-writer-connection__actions">
        <Link className="button button--secondary" href="/settings/ai">
          <Settings aria-hidden="true" size={16} />
          {connected ? "설정" : "AI 연결하기"}
        </Link>
        {connected && (
          <Button onClick={ai.disconnect} variant="ghost">
            <Unplug aria-hidden="true" size={16} />
            연결 해제
          </Button>
        )}
      </div>
    </aside>
  );
}
