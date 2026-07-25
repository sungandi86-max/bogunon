import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, GET, PUT } from "@/app/api/record-guidelines/route";
import { RecordGuidelineAccessError } from "@/lib/ai/record-guideline-repository";

const { deleteGuideline, listGuidelines, upsertGuideline } = vi.hoisted(() => ({
  deleteGuideline: vi.fn(),
  listGuidelines: vi.fn(),
  upsertGuideline: vi.fn(),
}));

vi.mock("@/lib/ai/record-guideline-repository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/record-guideline-repository")>();
  return {
    ...actual,
    deleteRecordGuideline: deleteGuideline,
    listRecordGuidelines: listGuidelines,
    upsertRecordGuideline: upsertGuideline,
  };
});

const validInput = {
  schoolYear: 2026,
  sourceType: "guide",
  originalFilename: "2026-guide.txt",
  mimeType: "text/plain",
  extractedText: "공식 기준",
  fileSize: 100,
} as const;

describe("/api/record-guidelines", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listGuidelines.mockResolvedValue([]);
    upsertGuideline.mockResolvedValue({ id: crypto.randomUUID(), ...validInput });
    deleteGuideline.mockResolvedValue(undefined);
  });

  it("lists the authenticated user's guidelines", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ guidelines: [] });
  });

  it("upserts only guideline fields and rejects student data", async () => {
    const invalid = new Request("https://bogunon.example/api/record-guidelines", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...validInput, activityReport: "학생 원문" }),
    });
    const response = await PUT(invalid);
    expect(response.status).toBe(400);
    expect(upsertGuideline).not.toHaveBeenCalled();

    const valid = new Request("https://bogunon.example/api/record-guidelines", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validInput),
    });
    expect((await PUT(valid)).status).toBe(200);
    expect(upsertGuideline).toHaveBeenCalledWith(validInput);
  });

  it("deletes by opaque id", async () => {
    const id = crypto.randomUUID();
    const response = await DELETE(new Request("https://bogunon.example/api/record-guidelines", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    }));
    expect(response.status).toBe(200);
    expect(deleteGuideline).toHaveBeenCalledWith(id);
  });

  it("normalizes authentication failures without exposing request data", async () => {
    listGuidelines.mockRejectedValue(new RecordGuidelineAccessError());
    const response = await GET();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "로그인이 필요합니다.",
      code: "UNAUTHORIZED",
    });
  });

  it("rejects oversized bodies before persistence", async () => {
    const response = await PUT(new Request("https://bogunon.example/api/record-guidelines", {
      method: "PUT",
      headers: {
        "content-length": "500000",
        "content-type": "application/json",
      },
      body: "{}",
    }));
    expect(response.status).toBe(413);
    expect(upsertGuideline).not.toHaveBeenCalled();
  });
});
