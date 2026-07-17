import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadAiContextCandidates } from "@/lib/ai/context-repository";

const from = vi.fn();

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from }) }));

function queryResult(data: readonly Record<string, unknown>[]) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    then: (resolve: (value: { data: readonly Record<string, unknown>[]; error: null }) => unknown) =>
      Promise.resolve({ data, error: null }).then(resolve),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  return query;
}

describe("AI context repository", () => {
  beforeEach(() => {
    from.mockReset();
    from.mockImplementation((table: string) => table === "tasks"
      ? queryResult([{ id: "task-1", title: "공문 확인", description: "provider에 보내면 안 되는 설명", scheduled_date: "2026-07-18", due_date: null, updated_at: "2026-07-18T00:00:00Z" }])
      : queryResult([]));
  });

  it("loads only minimal user-scoped fields from supported work tables", async () => {
    // Given authenticated user-owned work records
    const userId = "user-1";

    // When provider context candidates are loaded
    const result = await loadAiContextCandidates(userId);

    // Then the mapped context excludes ownership and unsupported fields
    expect(result.candidates).toContainEqual({
      id: "task-1",
      kind: "task",
      title: "공문 확인",
      detail: null,
      date: "2026-07-18",
      surface: "task",
    });
    expect(JSON.stringify(result)).not.toContain("user_id");
    expect(JSON.stringify(result)).not.toContain("provider에 보내면 안 되는 설명");
    const taskQuery = from.mock.results[0]?.value as { select: ReturnType<typeof vi.fn> };
    expect(taskQuery.select).toHaveBeenCalledWith("id,title,scheduled_date,due_date,updated_at");
    expect(from).toHaveBeenCalledWith("tasks");
    expect(from).toHaveBeenCalledWith("events");
    expect(from).toHaveBeenCalledWith("task_workflow_instances");
    expect(from).toHaveBeenCalledWith("workflow_templates");
  });
});
