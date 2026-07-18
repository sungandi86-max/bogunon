"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const acknowledgementKey = "bogunon:pwa-welcome-seen";

function isStandalone() {
  return (typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
}

export function FirstRunWelcome() {
  const [open, setOpen] = useState(false);
  const startButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active && isStandalone() && localStorage.getItem(acknowledgementKey) !== "true") setOpen(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    startButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") complete();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  function complete() {
    localStorage.setItem(acknowledgementKey, "true");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="welcome-dialog-backdrop" role="presentation">
      <section aria-labelledby="welcome-title" aria-modal="true" className="welcome-dialog" role="dialog">
        <Image alt="" aria-hidden="true" height={72} priority src="/brand/bogunon-symbol.png" width={72} />
        <h2 id="welcome-title">BOGUNON에 오신 것을 환영합니다.</h2>
        <p>업무와 일정, 개인 기록을 한곳에서 관리할 수 있어요.</p>
        <button className="button button--primary" onClick={complete} ref={startButtonRef} type="button">시작하기</button>
      </section>
    </div>
  );
}
