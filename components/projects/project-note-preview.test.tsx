import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProjectNotePreview } from "@/components/projects/project-note-preview";

describe("ProjectNotePreview", () => {
  it("renders supported Markdown Lite blocks without interpreting HTML", () => {
    render(
      <ProjectNotePreview
        content={"# 준비\n## 예약\n- 항공권\n1. 숙소\n- [ ] 렌터카\n- [x] 라켓\n<script>alert(1)</script>"}
      />,
    );

    expect(screen.getByRole("heading", { name: "준비", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "예약", level: 4 })).toBeInTheDocument();
    expect(screen.getByText("항공권")).toBeInTheDocument();
    expect(screen.getByText("1.")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "렌터카" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "라켓" })).toBeChecked();
    expect(screen.getByText("<script>alert(1)</script>")).toBeInTheDocument();
    expect(document.querySelector("script")).toBeNull();
  });
});
