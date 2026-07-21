import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RecordWriterWorkspace } from "@/components/record-writer/record-writer-workspace";

describe("RecordWriterWorkspace", () => {
  it("creates an editable local draft using only the anonymous code and memo", () => {
    render(<RecordWriterWorkspace />);
    fireEvent.change(screen.getByLabelText("학생 코드"), { target: { value: "s001" } });
    fireEvent.change(screen.getByLabelText("교사 메모"), { target: { value: "모둠 활동에서 자료 정리를 맡아 끝까지 수행함." } });
    fireEvent.click(screen.getByRole("button", { name: "AI 초안 생성" }));
    expect(screen.getByLabelText<HTMLTextAreaElement>("편집 가능한 초안").value).toContain("S001 학생");
    expect(screen.getByText(/로컬 편집용 초안을 준비했습니다/)).toBeInTheDocument();
  });

  it("rejects identifiers that are not anonymous student codes", () => {
    render(<RecordWriterWorkspace />);
    fireEvent.change(screen.getByLabelText("학생 코드"), { target: { value: "홍길동" } });
    fireEvent.click(screen.getByRole("button", { name: "AI 초안 생성" }));
    expect(screen.getByText("S001 형식의 익명 코드를 입력해 주세요.")).toBeInTheDocument();
    expect(screen.getByLabelText("편집 가능한 초안")).toHaveValue("");
  });

  it("does not copy a selected file name into the draft", () => {
    render(<RecordWriterWorkspace />);
    fireEvent.change(screen.getByLabelText("학생 코드"), { target: { value: "S002" } });
    const report = new File(["활동"], "홍길동-활동보고서.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText(/활동보고서 파일 선택/), { target: { files: [report] } });
    fireEvent.click(screen.getByRole("button", { name: "AI 초안 생성" }));
    expect(screen.getByLabelText<HTMLTextAreaElement>("편집 가능한 초안").value).not.toContain("홍길동");
  });

  it("copies the edited result for pasting into NEIS", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<RecordWriterWorkspace />);
    fireEvent.change(screen.getByLabelText("편집 가능한 초안"), { target: { value: "확인한 기록" } });
    fireEvent.click(screen.getByRole("button", { name: "복사" }));
    expect(writeText).toHaveBeenCalledWith("확인한 기록");
    expect(await screen.findByText(/초안을 복사했습니다/)).toBeInTheDocument();
  });
});
