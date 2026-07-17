import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

describe("Home", () => {
  it("renders the Phase 0 foundation status", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "보건온" }),
    ).toBeInTheDocument();
    expect(screen.getByText("개발 기반이 준비되었습니다.")).toBeInTheDocument();
  });
});
