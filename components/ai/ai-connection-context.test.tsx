import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  AiConnectionProvider,
  useAiConnection,
} from "@/components/ai/ai-connection-context";

function Harness() {
  const ai = useAiConnection();
  return (
    <div>
      <span>{ai.status.kind}</span>
      <span>{ai.connection?.provider ?? "none"}</span>
      <button
        onClick={() => void ai.connect({
          provider: "openai",
          apiKey: "sk-user-secret",
          model: "gpt-5.5",
        })}
        type="button"
      >
        connect
      </button>
      <button onClick={ai.disconnect} type="button">disconnect</button>
    </div>
  );
}

describe("AiConnectionProvider", () => {
  it("keeps a verified key in React memory and disconnects explicitly", async () => {
    const storage = vi.spyOn(Storage.prototype, "setItem");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "connected",
        provider: "openai",
        model: "gpt-5.5",
      }),
    }));
    render(<AiConnectionProvider><Harness /></AiConnectionProvider>);

    fireEvent.click(screen.getByRole("button", { name: "connect" }));
    await waitFor(() => expect(screen.getByText("connected")).toBeInTheDocument());
    expect(screen.getByText("openai")).toBeInTheDocument();
    expect(storage).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "disconnect" }));
    expect(screen.getByText("disconnected")).toBeInTheDocument();
    expect(screen.getByText("none")).toBeInTheDocument();
  });

  it("does not retain the key after the provider unmounts", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "connected",
        provider: "openai",
        model: "gpt-5.5",
      }),
    }));
    const view = render(<AiConnectionProvider><Harness /></AiConnectionProvider>);
    fireEvent.click(screen.getByRole("button", { name: "connect" }));
    await waitFor(() => expect(screen.getByText("connected")).toBeInTheDocument());

    view.unmount();
    render(<AiConnectionProvider><Harness /></AiConnectionProvider>);

    expect(screen.getByText("disconnected")).toBeInTheDocument();
    expect(screen.getByText("none")).toBeInTheDocument();
  });

  it("shows a safe failure state without keeping a failed key", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        code: "INVALID_API_KEY",
        error: "API Key를 확인해 주세요.",
      }),
    }));
    render(<AiConnectionProvider><Harness /></AiConnectionProvider>);

    fireEvent.click(screen.getByRole("button", { name: "connect" }));

    await waitFor(() => expect(screen.getByText("failed")).toBeInTheDocument());
    expect(screen.getByText("none")).toBeInTheDocument();
  });
});
