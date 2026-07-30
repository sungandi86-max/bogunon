import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ProjectFileRow, ProjectReservationRow } from "@/types/database";

const mocks = vi.hoisted(() => ({
  accessFile: vi.fn(),
  cancelUpload: vi.fn(),
  deleteFile: vi.fn(),
  finalizeUpload: vi.fn(),
  loadFiles: vi.fn(),
  prepareUpload: vi.fn(),
  previewFile: vi.fn(),
  uploadFile: vi.fn(),
}));

vi.mock("@/app/(app)/projects/file-actions", () => ({
  cancelProjectFileUploadAction: mocks.cancelUpload,
  createProjectFileAccessAction: mocks.accessFile,
  deleteProjectFileAction: mocks.deleteFile,
  finalizeProjectFileUploadAction: mocks.finalizeUpload,
  loadProjectFilesAction: mocks.loadFiles,
  prepareProjectFileUploadAction: mocks.prepareUpload,
}));

vi.mock("@/lib/projects/file-upload-client", () => ({
  loadSignedFilePreview: mocks.previewFile,
  uploadProjectFileToSignedUrl: mocks.uploadFile,
}));

import { ProjectFiles } from "@/components/projects/project-files";

const projectId = "22222222-2222-4222-8222-222222222222";
const reservation: ProjectReservationRow = {
  company: "제주항공",
  confirmation_number: "ABC123",
  created_at: "",
  end_time: "08:20:00",
  id: "55555555-5555-4555-8555-555555555555",
  linked_event_id: null,
  location: "김포공항",
  memo: null,
  phone: null,
  project_id: projectId,
  reservation_date: "2026-08-04",
  end_date: null,
  start_time: "07:10:00",
  title: "김포 → 제주",
  type: "flight",
  updated_at: "",
  user_id: "user-1",
  website: null,
};
const pdfFile: ProjectFileRow = {
  id: "33333333-3333-4333-8333-333333333333",
  user_id: "user-1",
  project_id: projectId,
  reservation_id: null,
  filename: "ticket.pdf",
  original_filename: "항공권.pdf",
  mime_type: "application/pdf",
  size_bytes: 2_048,
  storage_path: "user-1/project-1/ticket.pdf",
  uploaded_at: "2026-07-27T10:00:00Z",
  updated_at: "2026-07-27T10:00:00Z",
};
const imageFile: ProjectFileRow = {
  ...pdfFile,
  id: "44444444-4444-4444-8444-444444444444",
  filename: "hotel.png",
  original_filename: "호텔.png",
  mime_type: "image/png",
  size_bytes: 8_192,
  storage_path: "user-1/project-1/hotel.png",
  uploaded_at: "2026-07-28T10:00:00Z",
  updated_at: "2026-07-28T10:00:00Z",
};

describe("ProjectFiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadFiles.mockResolvedValue({
      files: [pdfFile, imageFile],
      message: "",
      status: "success",
    });
    mocks.accessFile.mockResolvedValue({
      message: "",
      signedUrl: "https://signed.example/file",
      status: "success",
    });
    mocks.deleteFile.mockResolvedValue({ message: "파일을 삭제했습니다.", status: "success" });
    mocks.previewFile.mockResolvedValue({ objectUrl: "blob:preview" });
  });

  it("loads once, searches filenames, and changes sort order", async () => {
    render(<ProjectFiles projectId={projectId} />);

    const list = await screen.findByLabelText("프로젝트 파일 목록");
    expect(within(list).getAllByRole("button").map((button) => button.textContent)).toEqual([
      expect.stringContaining("호텔.png"),
      expect.stringContaining("항공권.pdf"),
    ]);
    expect(mocks.loadFiles).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByRole("searchbox", { name: "파일 검색" }), {
      target: { value: "항공권" },
    });
    expect(screen.queryByRole("button", { name: /호텔.png/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /항공권.pdf/ })).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: "파일 정렬" }), {
      target: { value: "size" },
    });
    expect(screen.getByRole("combobox", { name: "파일 정렬" })).toHaveValue("size");
  });

  it("uploads multiple supported files and links them to the selected reservation", async () => {
    mocks.prepareUpload
      .mockResolvedValueOnce({
        message: "",
        status: "success",
        upload: {
          fileId: pdfFile.id,
          filename: pdfFile.filename,
          path: pdfFile.storage_path,
          token: "token-pdf",
        },
      })
      .mockResolvedValueOnce({
        message: "",
        status: "success",
        upload: {
          fileId: imageFile.id,
          filename: imageFile.filename,
          path: imageFile.storage_path,
          token: "token-image",
        },
      });
    mocks.uploadFile.mockResolvedValue(undefined);
    mocks.finalizeUpload
      .mockResolvedValueOnce({ file: pdfFile, message: "파일을 업로드했습니다.", status: "success" })
      .mockResolvedValueOnce({ file: imageFile, message: "파일을 업로드했습니다.", status: "success" });
    render(<ProjectFiles projectId={projectId} reservations={[reservation]} />);
    await screen.findByLabelText("프로젝트 파일 목록");

    fireEvent.change(screen.getByRole("combobox", { name: "업로드 파일 예약 연결" }), {
      target: { value: reservation.id },
    });
    const input = screen.getByLabelText("프로젝트 파일 선택");
    fireEvent.change(input, {
      target: {
        files: [
          new File(["pdf"], "항공권.pdf", { type: "application/pdf" }),
          new File(["png"], "호텔.png", { type: "image/png" }),
        ],
      },
    });

    await waitFor(() => expect(mocks.finalizeUpload).toHaveBeenCalledTimes(2));
    expect(mocks.finalizeUpload).toHaveBeenCalledWith(expect.objectContaining({
      reservationId: reservation.id,
    }));
    expect(mocks.uploadFile).toHaveBeenCalledTimes(2);
    expect(mocks.cancelUpload).not.toHaveBeenCalled();
  });

  it("opens a signed preview, downloads through a signed URL, and deletes the file", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<ProjectFiles projectId={projectId} />);

    fireEvent.click(await screen.findByRole("button", { name: /항공권.pdf/ }));
    await waitFor(() => expect(mocks.accessFile).toHaveBeenCalledWith({
      fileId: pdfFile.id,
      mode: "preview",
      projectId,
    }));
    expect((await screen.findAllByText("PDF 문서")).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "파일 다운로드" }));
    await waitFor(() => expect(mocks.accessFile).toHaveBeenCalledWith({
      fileId: pdfFile.id,
      mode: "download",
      projectId,
    }));
    expect(open).toHaveBeenCalledWith("https://signed.example/file", "_blank", "noopener,noreferrer");

    fireEvent.click(screen.getByRole("button", { name: "파일 삭제" }));
    await waitFor(() => expect(mocks.deleteFile).toHaveBeenCalledWith({
      fileId: pdfFile.id,
      projectId,
    }));
    expect(await screen.findByText("파일을 삭제했습니다.")).toBeInTheDocument();
  });

  it("keeps the desktop list and uses list to preview navigation on mobile", async () => {
    render(<ProjectFiles projectId={projectId} />);

    const fileButton = await screen.findByRole("button", { name: /호텔.png/ });
    fireEvent.click(fileButton);
    expect(screen.getByLabelText("프로젝트 파일")).toHaveClass("is-mobile-previewing");
    fireEvent.click(screen.getByRole("button", { name: "파일 목록으로" }));
    expect(screen.getByLabelText("프로젝트 파일")).not.toHaveClass("is-mobile-previewing");
  });
});
