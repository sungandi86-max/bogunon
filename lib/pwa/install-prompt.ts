export const INSTALL_PROMPT_READY_EVENT = "bogunon-install-prompt-ready";

export function isBeforeInstallPromptEvent(event: Event): event is BeforeInstallPromptEvent {
  return "prompt" in event && typeof event.prompt === "function" && "userChoice" in event;
}

export function captureInstallPrompt(event: Event) {
  if (!isBeforeInstallPromptEvent(event)) return;
  event.preventDefault();
  window.bogunonInstallPrompt = event;
  window.dispatchEvent(new Event(INSTALL_PROMPT_READY_EVENT));
}
