import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE } from "@/app/api/ai/history/route";

const getUser = vi.fn();
const from = vi.fn();
let missingHistoryTables = false;

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser }, from }),
}));

function deleteQuery(table: string) {
  const result = missingHistoryTables && table === "ai_action_drafts"
    ? { error: { code: "PGRST205" } }
    : { error: null };
  const query = {
    delete: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  query.delete.mockReturnValue(query);
  query.update.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  return query;
}

describe("DELETE /api/ai/history", () => {
  beforeEach(() => {
    getUser.mockReset();
    from.mockReset();
    missingHistoryTables = false;
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    from.mockImplementation((table: string) => deleteQuery(table));
  });

  it("deletes only the authenticated user's drafts and requests", async () => {
    // Given an authenticated user with AI history
    const request = new Request("https://bogunon.example/api/ai/history", { method: "DELETE" });

    // When history deletion is requested
    const response = await DELETE(request);

    // Then drafts and requests are deleted without touching preferences
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ deleted: true });
    expect(from.mock.calls).toEqual([["ai_action_drafts"], ["ai_requests"], ["ai_preferences"]]);
    const preferenceQuery = from.mock.results[2]?.value;
    expect(preferenceQuery.update).toHaveBeenCalledWith({ history_enabled: false });
  });

  it("rejects an unauthenticated deletion request", async () => {
    // Given an expired session
    getUser.mockResolvedValue({ data: { user: null }, error: new Error("expired") });

    // When history deletion is requested
    const response = await DELETE(new Request("https://bogunon.example/api/ai/history", { method: "DELETE" }));

    // Then no history table is touched
    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it("clears the preference and warns when history tables are unavailable", async () => {
    // Given history tables have not been migrated but preferences are available
    missingHistoryTables = true;

    // When the authenticated user requests deletion
    const response = await DELETE(new Request("https://bogunon.example/api/ai/history", { method: "DELETE" }));

    // Then the request succeeds safely and history preference is disabled
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      deleted: false,
      warnings: ["AI 기록 테이블이 준비되지 않아 삭제할 기록이 없습니다."],
    });
    expect(from).toHaveBeenCalledWith("ai_preferences");
  });
});
