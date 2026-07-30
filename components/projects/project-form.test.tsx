import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProjectForm } from "@/components/projects/project-form";

vi.mock("@/app/(app)/projects/actions", () => ({
  saveProjectAction: vi.fn(async () => ({
    status: "success",
    message: "프로젝트를 만들었습니다.",
    projectId: "created-project",
  })),
}));

describe("ProjectForm", () => {
  it("turns off project-name autocomplete and exposes every project type", () => {
    render(<ProjectForm onSaved={vi.fn()} />);

    expect(screen.getByRole("textbox", { name: "프로젝트 이름" })).toHaveAttribute("autocomplete", "off");
    for (const label of ["여행", "학교", "업무", "출판", "개발", "운동", "개인", "기타"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("keeps optional details collapsed and labels representative icons clearly", () => {
    render(<ProjectForm onSaved={vi.fn()} />);

    expect(screen.getByText("대표 아이콘")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "폴더 아이콘" })).toHaveTextContent("폴더");
    expect(screen.getByRole("button", { name: "여행 아이콘" })).toHaveTextContent("여행");

    const summary = screen.getByText("상세 설정");
    const details = summary.closest("details");
    expect(details).not.toHaveAttribute("open");
    fireEvent.click(summary);
    expect(screen.getByRole("textbox", { name: /설명/ })).toHaveAttribute("rows", "2");
  });

  it("applies a quick template and keeps icon and color independently editable", () => {
    const { container } = render(<ProjectForm onSaved={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "여행 프로젝트" }));

    expect(screen.getByRole("textbox", { name: "프로젝트 이름" })).toHaveValue("새 여행");
    expect(screen.getByRole("button", { name: "여행" })).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector<HTMLInputElement>('input[name="icon"]')).toHaveValue("travel");
    expect(container.querySelector<HTMLInputElement>('input[name="color"]')).toHaveValue("mint");

    fireEvent.click(screen.getByRole("button", { name: "중요 아이콘" }));
    fireEvent.click(screen.getByRole("button", { name: "코랄 색상" }));

    expect(container.querySelector<HTMLInputElement>('input[name="icon"]')).toHaveValue("star");
    expect(container.querySelector<HTMLInputElement>('input[name="color"]')).toHaveValue("coral");
  });

  it("clears defaults when the blank project template is selected", () => {
    render(<ProjectForm onSaved={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "학교 프로젝트" }));
    fireEvent.click(screen.getByRole("button", { name: "빈 프로젝트" }));

    expect(screen.getByRole("textbox", { name: "프로젝트 이름" })).toHaveValue("");
    expect(screen.getByRole("button", { name: "기타" })).toHaveAttribute("aria-pressed", "true");
  });

  it("returns the created project id so the workspace can open immediately", async () => {
    const onSaved = vi.fn();
    render(<ProjectForm onSaved={onSaved} />);

    fireEvent.change(screen.getByRole("textbox", { name: "프로젝트 이름" }), {
      target: { value: "제주 여행" },
    });
    const form = screen.getByRole("button", { name: "프로젝트 생성" }).closest("form");
    if (!form) throw new Error("프로젝트 생성 폼이 필요합니다.");
    fireEvent.submit(form);

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith("created-project"));
  });
});
