"use client";

import {
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  PlugZap,
  ShieldCheck,
  Unplug,
} from "lucide-react";
import { useState } from "react";

import { useAiConnection } from "@/components/ai/ai-connection-context";
import { Button } from "@/components/ui/button";
import {
  AI_PROVIDER_CONFIG,
  getDefaultAiModel,
  getSupportedAiModels,
} from "@/lib/ai/config";
import type { AiProviderId } from "@/lib/ai/types";

export function AiConnectionSettings() {
  const ai = useAiConnection();
  const [provider, setProvider] = useState<AiProviderId>("openai");
  const [model, setModel] = useState(getDefaultAiModel("openai"));
  const [apiKey, setApiKey] = useState("");
  const connected = ai.connection !== null;
  const checking = ai.status.kind === "checking";

  function selectProvider(nextProvider: AiProviderId): void {
    setProvider(nextProvider);
    setModel(getDefaultAiModel(nextProvider));
  }

  async function connect(): Promise<void> {
    const success = await ai.connect({ provider, apiKey, model });
    if (success) setApiKey("");
  }

  function disconnect(): void {
    ai.disconnect();
    setApiKey("");
  }

  const connectedLabel = ai.connection
    ? `${AI_PROVIDER_CONFIG[ai.connection.provider].label} 연결됨`
    : "연결 안 됨";

  return (
    <section className="settings-card ai-connection-settings" aria-labelledby="ai-connection-title">
      <div className="settings-card__heading">
        <PlugZap aria-hidden="true" size={20} />
        <div>
          <h2 id="ai-connection-title">AI 연결</h2>
          <p>BOGUNON은 사용자가 직접 연결한 OpenAI 또는 Gemini API를 사용합니다.</p>
        </div>
      </div>

      <div className={`ai-connection-status is-${ai.status.kind}`} aria-live="polite">
        {connected
          ? <CheckCircle2 aria-hidden="true" size={20} />
          : checking
            ? <LoaderCircle aria-hidden="true" className="ai-writer-spinner" size={20} />
            : <Unplug aria-hidden="true" size={20} />}
        <div>
          <strong>{checking ? "연결 확인 중" : connectedLabel}</strong>
          <span>{connected ? "현재 브라우저 탭에서만 유지" : "API Key를 확인한 뒤 연결할 수 있습니다."}</span>
        </div>
      </div>

      <fieldset className="ai-provider-options" disabled={connected || checking}>
        <legend>Provider</legend>
        {(["openai", "gemini"] as const).map((providerId) => (
          <label key={providerId}>
            <input
              checked={provider === providerId}
              name="ai-provider"
              onChange={() => selectProvider(providerId)}
              type="radio"
            />
            <span>{AI_PROVIDER_CONFIG[providerId].label}</span>
          </label>
        ))}
      </fieldset>

      <div className="ai-connection-fields">
        <label htmlFor="ai-connection-key">
          <span>API Key</span>
          <span className="ai-connection-password">
            <KeyRound aria-hidden="true" size={17} />
            <input
              autoComplete="off"
              disabled={connected || checking}
              id="ai-connection-key"
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={connected ? "연결됨" : "API Key 입력"}
              spellCheck={false}
              type="password"
              value={apiKey}
            />
          </span>
        </label>
        <label htmlFor="ai-connection-model">
          <span>모델</span>
          <select
            disabled={connected || checking}
            id="ai-connection-model"
            onChange={(event) => setModel(event.target.value)}
            value={connected ? ai.connection.model : model}
          >
            {getSupportedAiModels(connected ? ai.connection.provider : provider).map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}{option.recommended ? " · 권장" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {ai.status.kind === "failed" && (
        <p className="form-message form-message--error" role="alert">{ai.status.message}</p>
      )}

      <aside className="ai-connection-privacy">
        <ShieldCheck aria-hidden="true" size={20} />
        <p>
          학생 자료와 API 키는 BOGUNON에 저장되지 않습니다.
          초안 생성을 위해 입력 내용은 선택한 AI 서비스로 전송됩니다.
          연결 정보는 현재 브라우저 탭에서만 유지되며 새로고침하면 해제됩니다.
        </p>
      </aside>

      <div className="ai-connection-actions">
        {connected ? (
          <Button onClick={disconnect} variant="secondary">
            <Unplug aria-hidden="true" size={17} />
            연결 해제
          </Button>
        ) : (
          <Button
            disabled={checking || apiKey.trim().length < 8}
            onClick={() => void connect()}
          >
            {checking
              ? <LoaderCircle aria-hidden="true" className="ai-writer-spinner" size={17} />
              : <PlugZap aria-hidden="true" size={17} />}
            연결 확인
          </Button>
        )}
      </div>
    </section>
  );
}
