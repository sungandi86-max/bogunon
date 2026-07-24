import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AiConnectionProvider } from "@/components/ai/ai-connection-context";
import { AiConnectionSettings } from "@/components/settings/ai-connection-settings";

describe("AiConnectionSettings", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "connected",
        provider: "openai",
        model: "gpt-5.6-terra",
      }),
    }));
  });

  it("masks the key, switches provider models, and explains external transmission", () => {
    render(<AiConnectionProvider><AiConnectionSettings /></AiConnectionProvider>);

    expect(screen.getByLabelText("API Key")).toHaveAttribute("type", "password");
    expect(screen.getByText(/입력 내용은 선택한 AI 서비스로 전송됩니다/)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "모델" })).toHaveValue("gpt-5.6-terra");

    fireEvent.click(screen.getByRole("radio", { name: "Gemini" }));
    expect(screen.getByRole("combobox", { name: "모델" })).toHaveValue("gemini-3.6-flash");
  });

  it("verifies and disconnects without writing browser storage", async () => {
    const storage = vi.spyOn(Storage.prototype, "setItem");
    render(<AiConnectionProvider><AiConnectionSettings /></AiConnectionProvider>);
    fireEvent.change(screen.getByLabelText("API Key"), {
      target: { value: "sk-user-secret" },
    });

    fireEvent.click(screen.getByRole("button", { name: "연결 확인" }));
    expect(await screen.findByText("OpenAI 연결됨")).toBeInTheDocument();
    expect(storage).not.toHaveBeenCalled();
    expect(screen.getByLabelText("API Key")).toHaveValue("••••••••••••••••");
    expect(screen.getByLabelText("API Key")).toHaveAttribute("readonly");
    expect(document.body).not.toHaveTextContent("sk-user-secret");

    fireEvent.click(screen.getByRole("button", { name: "연결 상태 확인" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));

    fireEvent.click(screen.getByRole("button", { name: "연결 해제" }));
    await waitFor(() => expect(screen.getByText("연결 안 됨")).toBeInTheDocument());
    expect(screen.getByLabelText("API Key")).toHaveValue("");
  });

  it("shows a safe provider failure and leaves the key editable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        code: "INVALID_API_KEY",
        error: "API Key를 확인해 주세요.",
      }),
    }));
    render(<AiConnectionProvider><AiConnectionSettings /></AiConnectionProvider>);
    fireEvent.change(screen.getByLabelText("API Key"), {
      target: { value: "sk-user-secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "연결 확인" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("API Key를 확인해 주세요.");
    expect(screen.getByLabelText("API Key")).toHaveValue("sk-user-secret");
  });

  it("prevents duplicate checks while the provider request is pending", async () => {
    let finishRequest: (() => void) | undefined;
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise((resolve) => {
      finishRequest = () => resolve({
        ok: true,
        json: async () => ({
          status: "connected",
          provider: "openai",
          model: "gpt-5.6-terra",
        }),
      });
    })));
    render(<AiConnectionProvider><AiConnectionSettings /></AiConnectionProvider>);
    fireEvent.change(screen.getByLabelText("API Key"), {
      target: { value: "sk-user-secret" },
    });

    fireEvent.click(screen.getByRole("button", { name: "연결 확인" }));

    const pendingButton = screen.getByRole("button", { name: "연결 확인 중" });
    expect(pendingButton).toBeDisabled();
    fireEvent.click(pendingButton);
    expect(fetch).toHaveBeenCalledTimes(1);

    finishRequest?.();
    expect(await screen.findByText("OpenAI 연결됨")).toBeInTheDocument();
  });
});
