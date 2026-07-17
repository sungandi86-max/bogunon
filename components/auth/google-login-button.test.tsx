import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GoogleLoginButton } from "@/components/auth/google-login-button";

const signInWithOAuth = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithOAuth } }),
}));

describe("GoogleLoginButton", () => {
  beforeEach(() => {
    signInWithOAuth.mockReset();
    signInWithOAuth.mockResolvedValue({ error: null });
  });

  it("starts Google OAuth with a safe callback destination", async () => {
    render(<GoogleLoginButton nextPath="/calendar?view=week" />);

    fireEvent.click(screen.getByRole("button", { name: "Google로 로그인" }));

    await waitFor(() => {
      expect(signInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: "http://localhost:3000/auth/callback?next=%2Fcalendar%3Fview%3Dweek",
        },
      });
    });
  });

  it("keeps the login screen usable when OAuth cannot start", async () => {
    signInWithOAuth.mockResolvedValue({ error: new Error("provider unavailable") });
    render(<GoogleLoginButton nextPath="/briefing" />);

    fireEvent.click(screen.getByRole("button", { name: "Google로 로그인" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Google 로그인을 완료하지 못했습니다. 다시 시도해 주세요.",
    );
    expect(screen.getByRole("button", { name: "Google로 로그인" })).toBeEnabled();
  });
});
