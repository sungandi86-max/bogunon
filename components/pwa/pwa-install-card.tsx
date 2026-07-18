"use client";

import { Download, Share2, Smartphone } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { captureInstallPrompt, INSTALL_PROMPT_READY_EVENT, isBeforeInstallPromptEvent } from "@/lib/pwa/install-prompt";

type InstallEnvironment = "loading" | "standalone" | "ios" | "browser";

function detectEnvironment(): InstallEnvironment {
  const standalone = (typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  if (standalone) return "standalone";
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  return ios ? "ios" : "browser";
}

export function PwaInstallCard({ version }: { readonly version: string }) {
  const [environment, setEnvironment] = useState<InstallEnvironment>("loading");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent>();
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setEnvironment(detectEnvironment());
      if (window.bogunonInstallPrompt) setInstallPrompt(window.bogunonInstallPrompt);
    });
    const capturePrompt = (event: Event) => {
      if (!isBeforeInstallPromptEvent(event)) return;
      captureInstallPrompt(event);
      setInstallPrompt(event);
    };
    const readStoredPrompt = () => setInstallPrompt(window.bogunonInstallPrompt);
    const markInstalled = () => {
      setEnvironment("standalone");
      setInstallPrompt(undefined);
      delete window.bogunonInstallPrompt;
    };
    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener(INSTALL_PROMPT_READY_EVENT, readStoredPrompt);
    window.addEventListener("appinstalled", markInstalled);
    return () => {
      active = false;
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener(INSTALL_PROMPT_READY_EVENT, readStoredPrompt);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, []);

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setMessage("설치가 시작되었습니다.");
      setInstallPrompt(undefined);
      delete window.bogunonInstallPrompt;
    }
  }

  return (
    <section aria-labelledby="pwa-install-title" className="settings-card pwa-install-card">
      <div className="pwa-install-brand">
        <Image alt="" aria-hidden="true" height={48} src="/brand/bogunon-symbol.png" width={48} />
        <div><h2 id="pwa-install-title">BOGUNON</h2><p>버전 {version}</p></div>
      </div>
      {environment === "loading" ? <p className="pwa-install-status"><Smartphone aria-hidden="true" size={18} />설치 상태 확인 중</p> : environment === "standalone" ? (
        <p className="pwa-install-status pwa-install-status--installed"><Smartphone aria-hidden="true" size={18} />설치된 앱으로 사용 중</p>
      ) : environment === "ios" ? (
        <ol className="pwa-install-steps">
          <li><Share2 aria-hidden="true" size={18} /><span><strong>공유 버튼을 누르세요.</strong><small>Safari 하단 또는 상단의 공유 메뉴를 엽니다.</small></span></li>
          <li><Download aria-hidden="true" size={18} /><span><strong>홈 화면에 추가를 선택하세요.</strong><small>설치 이름은 BOGUNON으로 표시됩니다.</small></span></li>
        </ol>
      ) : installPrompt ? (
        <div className="pwa-install-action"><p>브라우저에서 실행 중</p><button className="button button--secondary pwa-install-button" onClick={install} type="button"><Download aria-hidden="true" size={18} />BOGUNON 설치</button></div>
      ) : (
        <p className="pwa-install-note">현재 브라우저에서는 메뉴에서 홈 화면 추가를 이용해주세요.</p>
      )}
      {message && <p aria-live="polite" className="form-message">{message}</p>}
    </section>
  );
}
