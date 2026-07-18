interface Navigator {
  readonly standalone?: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  readonly prompt: () => Promise<void>;
  readonly userChoice: Promise<{ readonly outcome: "accepted" | "dismissed"; readonly platform: string }>;
}

interface Window {
  bogunonInstallPrompt?: BeforeInstallPromptEvent;
}
