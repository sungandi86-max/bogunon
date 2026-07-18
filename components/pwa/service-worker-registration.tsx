"use client";

import { useEffect } from "react";

import { captureInstallPrompt } from "@/lib/pwa/install-prompt";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    if (!("serviceWorker" in navigator)) return () => window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
    const register = () => navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    if (document.readyState === "complete") {
      void register();
      return () => window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
    }
    window.addEventListener("load", register, { once: true });
    return () => {
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}
