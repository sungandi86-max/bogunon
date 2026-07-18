import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PwaInstallCard } from "@/components/pwa/pwa-install-card";

function setUserAgent(value: string) {
  Object.defineProperty(navigator, "userAgent", { configurable: true, value });
}

describe("PwaInstallCard", () => {
  beforeEach(() => {
    setUserAgent("Mozilla/5.0 Chrome/126.0.0.0 Mobile Safari/537.36");
    Object.defineProperty(navigator, "standalone", { configurable: true, value: false });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    });
  });

  it("offers the captured Android install prompt", async () => {
    const prompt = vi.fn(async () => undefined);
    const userChoice = Promise.resolve({ outcome: "accepted" as const, platform: "web" });
    const event = new Event("beforeinstallprompt");
    Object.assign(event, { prompt, userChoice });

    render(<PwaInstallCard version="0.1.0" />);
    act(() => window.dispatchEvent(event));
    fireEvent.click(await screen.findByRole("button", { name: "BOGUNON 설치" }));

    expect(prompt).toHaveBeenCalledOnce();
    expect(await screen.findByText("설치가 시작되었습니다.")).toBeInTheDocument();
  });

  it("shows iOS home-screen instructions without an install button", async () => {
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1");
    render(<PwaInstallCard version="0.1.0" />);

    expect(await screen.findByText("공유 버튼을 누르세요.")).toBeInTheDocument();
    expect(screen.getByText("홈 화면에 추가를 선택하세요.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "BOGUNON 설치" })).not.toBeInTheDocument();
  });

  it("shows installed status without an install button in standalone mode", async () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    });
    render(<PwaInstallCard version="0.1.0" />);
    expect(await screen.findByText("설치된 앱으로 사용 중")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "BOGUNON 설치" })).not.toBeInTheDocument();
    expect(screen.getByText("버전 0.1.0")).toBeInTheDocument();
  });
});
