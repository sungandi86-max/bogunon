"use client";

import { RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function SettingsError() {
  const router = useRouter();
  return <section className="settings-error" role="alert"><h2>설정을 불러오지 못했습니다.</h2><p>연결 상태를 확인한 뒤 다시 시도해 주세요.</p><button className="button button--secondary" onClick={() => router.refresh()} type="button"><RotateCw aria-hidden="true" size={17} />다시 시도</button></section>;
}
