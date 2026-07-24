"use client";

import { Monitor } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { AiDocumentWriterDesktop } from "@/components/ai/ai-document-writer-desktop";

const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";

function subscribeToDesktopViewport(onChange: () => void): () => void {
  const query = window.matchMedia(DESKTOP_MEDIA_QUERY);
  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", onChange);
  } else {
    query.addListener(onChange);
  }
  window.addEventListener("resize", onChange);
  return () => {
    if (typeof query.removeEventListener === "function") {
      query.removeEventListener("change", onChange);
    } else {
      query.removeListener(onChange);
    }
    window.removeEventListener("resize", onChange);
  };
}

function isDesktopViewport(): boolean {
  return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

export function AiDocumentWriter() {
  const isDesktop = useSyncExternalStore(
    subscribeToDesktopViewport,
    isDesktopViewport,
    () => false,
  );

  if (!isDesktop) {
    return (
      <section className="ai-writer-desktop-only" aria-labelledby="ai-writer-desktop-only-title">
        <Monitor aria-hidden="true" size={34} />
        <div>
          <h1 id="ai-writer-desktop-only-title">
          <span>생기부 도우미는 PC에서</span>{" "}
          <span>이용해 주세요</span>
          </h1>
          <p>활동보고서와 초안을 함께 검토하는 기능으로, PC 화면에 맞게 제공됩니다.</p>
        </div>
        <Link className="button button--primary" href="/briefing">오늘 화면으로 돌아가기</Link>
      </section>
    );
  }

  return <AiDocumentWriterDesktop />;
}
