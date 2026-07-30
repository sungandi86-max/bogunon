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
  it("puts the project name before quick start and exposes every project type", () => {
    render(<ProjectForm onSaved={vi.fn()} />);

    const nameInput = screen.getByRole("textbox", { name: "프로젝트 이름" });
    const quickStart = screen.getByText("빠른 시작");
    expect(nameInput).toHaveAttribute("autocomplete", "off");
    expect(nameInput.compareDocumentPosition(quickStart) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    for (const label of ["여행", "학교", "업무", "출판", "개발", "운동", "개인", "기타"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("keeps optional details and less common icons collapsed", () => {
    render(<ProjectForm onSaved={vi.fn()} />);

    expect(screen.getByText("대표 아이콘")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "폴더 아이콘" })).toHaveTextContent("폴더");
    expect(screen.getByRole("button", { name: "여행 아이콘" })).toHaveTextContent("여행");
    expect(screen.queryByRole("button", { name: "중요 아이콘" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "대표 아이콘 더보기" }));
    expect(screen.getByRole("button", { name: "중요 아이콘" })).toBeInTheDocument();

    const summary = screen.getByText("상세 설정");
    const details = summary.closest("details");
    expect(details).not.toHaveAttribute("open");
    fireEvent.click(summary);
    expect(screen.getByRole("textbox", { name: /설명/ })).toHaveAttribute("rows", "2");
  });

  it("applies a quick-start card without replacing the typed name", () => {
    const { container } = render(<ProjectForm onSaved={vi.fn()} />);

    fireEvent.change(screen.getByRole("textbox", { name: "프로젝트 이름" }), {
      target: { value: "제주 여행" },
    });
    const travelTemplate = screen.getByRole("button", { name: /여행 프로젝트/ });
    fireEvent.click(travelTemplate);

    expect(screen.getByRole("textbox", { name: "프로젝트 이름" })).toHaveValue("제주 여행");
    expect(travelTemplate).toHaveAttribute("aria-pressed", "true");
    expect(travelTemplate).toHaveTextContent("일정 · 예약 · 예산");
    expect(screen.getByRole("button", { name: "여행" })).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector<HTMLInputElement>('input[name="icon"]')).toHaveValue("travel");
    expect(container.querySelector<HTMLInputElement>('input[name="color"]')).toHaveValue("mint");

    fireEvent.click(screen.getByRole("button", { name: "대표 아이콘 더보기" }));
    fireEvent.click(screen.getByRole("button", { name: "중요 아이콘" }));
    fireEvent.click(screen.getByRole("button", { name: "코랄 색상" }));

    expect(container.querySelector<HTMLInputElement>('input[name="icon"]')).toHaveValue("star");
    expect(container.querySelector<HTMLInputElement>('input[name="color"]')).toHaveValue("coral");
    expect(screen.getByLabelText("프로젝트 미리보기")).toHaveTextContent("제주 여행");
    expect(screen.getByLabelText("프로젝트 미리보기")).toHaveTextContent("여행");
    expect(screen.getByLabelText("프로젝트 미리보기")).toHaveTextContent("코랄");
  });

  it("clears quick-start selection when the project type is changed manually", () => {
    render(<ProjectForm onSaved={vi.fn()} />);

    const schoolTemplate = screen.getByRole("button", { name: /학교 프로젝트/ });
    fireEvent.click(schoolTemplate);
    expect(schoolTemplate).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "개인" }));

    expect(schoolTemplate).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "개인" })).toHaveAttribute("aria-pressed", "true");
  });

  it("returns the created project id so the workspace can open immediately", async () => {
    const onSaved = vi.fn();
    render(<ProjectForm onSaved={onSaved} />);

    fireEvent.change(screen.getByRole("textbox", { name: "프로젝트 이름" }), {
      target: { value: "제주 여행" },
    });
    const form = screen.getByRole("button", { name: "새 프로젝트 시작" }).closest("form");
    if (!form) throw new Error("프로젝트 생성 폼이 필요합니다.");
    fireEvent.submit(form);

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith("created-project"));
  });
});
