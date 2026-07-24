"use client";

import { Monitor } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { AiDocumentWriterDesktop } from "@/components/ai/ai-document-writer-desktop";
import { PageHeader } from "@/components/layout/page-header";

const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";

function subscribeToDesktopViewport(onChange: () => void): () => void {
  if (typeof window.matchMedia !== "function") return () => undefined;
  const query = window.matchMedia(DESKTOP_MEDIA_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getDesktopSnapshot(): boolean {
  if (typeof window.matchMedia !== "function") return true;
  return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

function getServerDesktopSnapshot(): boolean {
  return false;
}

export function AiDocumentWriter() {
  const isDesktop = useSyncExternalStore(
    subscribeToDesktopViewport,
    getDesktopSnapshot,
    getServerDesktopSnapshot,
  );

  if (!isDesktop) {
    return (
      <section className="ai-writer-desktop-only" aria-labelledby="ai-writer-desktop-only-title">
        <Monitor aria-hidden="true" size={34} />
        <div>
          <h1 id="ai-writer-desktop-only-title">AI 문서 작성은 PC에서 이용해주세요</h1>
          <p>여러 자료를 비교하며 작성하는 기능으로, PC 화면에 맞게 제공됩니다.</p>
        </div>
        <Link className="button button--primary" href="/briefing">오늘 화면으로 돌아가기</Link>
      </section>
    );
  }

  return (
    <>
      <PageHeader
        description="익명화된 활동 자료와 교사 메모를 바탕으로 문서 초안을 작성합니다."
        title="AI 문서 작성"
      />
      <AiDocumentWriterDesktop />
    </>
  );
}
