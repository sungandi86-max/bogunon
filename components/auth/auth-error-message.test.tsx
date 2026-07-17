import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthErrorMessage } from "@/components/auth/auth-error-message";

describe("AuthErrorMessage", () => {
  it("shows a Korean session-expired message", () => {
    render(<AuthErrorMessage code="session_expired" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "로그인이 만료되었습니다. 다시 로그인해 주세요.",
    );
  });

  it("does not render an error region without a supported code", () => {
    render(<AuthErrorMessage code={null} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
