import { describe, expect, it, vi } from "vitest";

import {
  cloneWorkLogDraft,
  createHealthSupportRepository,
  HealthSupportInstructorRepositoryError,
  listHealthSupportInstructors,
  type HealthSupportGateway,
  type HealthSupportQuery,
  parseHealthSupportInstructorInput,
  parseHealthSupportWorkLogMutation,
  quickFillWorkLogDraft,
} from "@/lib/health-support-instructors/repository";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const instructor = {
  name: "Kim Health",
  subject: "Health support",
  weeklyHours: 15,
  hourlyRate: 25_000,
  monthlyInsurance: 120_000,
  monthlyHourLimit: 60,
  weeklyHourLimit: 15,
  totalBudget: 3_000_000,
  operationStartDate: "2026-08-01",
  operationEndDate: "2026-12-31",
};
const instructorId = "10000000-0000-4000-8000-000000000001";

function workLogGateway(): HealthSupportGateway {
  const rows: unknown[] = [];
  let id = "";
  let operation = "select";
  let write: unknown;
  const query: HealthSupportQuery = {
    select: () => query,
    insert: (values) => { operation = "insert"; write = values; return query; },
    update: (values) => { operation = "update"; write = values; return query; },
    delete: () => { operation = "delete"; return query; },
    eq: (column, value) => { if (column === "id") id = value; return query; },
    order: () => query,
    single: async () => {
      if (operation === "insert" && write && typeof write === "object" && "instructor_id" in write) {
        const row = { id: "20000000-0000-4000-8000-000000000001", user_id: "30000000-0000-4000-8000-000000000001", ...write, created_at: "2026-08-18T00:00:00Z", updated_at: "2026-08-18T00:00:00Z" };
        rows.push(row);
        return { data: row, error: null };
      }
      if (operation === "update" && write && typeof write === "object" && "instructor_id" in write) {
        const index = rows.findIndex((row) => typeof row === "object" && row !== null && "id" in row && row.id === id);
        const existing = rows[index];
        if (!existing || typeof existing !== "object") return { data: null, error: { message: "missing" } };
        const row = { ...existing, ...write, updated_at: "2026-08-18T01:00:00Z" };
        rows[index] = row;
        return { data: row, error: null };
      }
      return { data: null, error: { message: "unsupported" } };
    },
    then: async (resolve) => {
      if (operation === "delete") rows.splice(rows.findIndex((row) => typeof row === "object" && row !== null && "id" in row && row.id === id), 1);
      return resolve({ data: rows, error: null });
    },
  };
  return { userId: "30000000-0000-4000-8000-000000000001", from: () => query };
}

describe("health support instructor repository boundary", () => {
  it("loads instructor settings when Supabase from returns its narrowed initial query builder", async () => {
    // Given: Supabase's initial builder exposes table operations, while filters and awaiting exist only after select.
    const row = {
      id: instructorId,
      user_id: "30000000-0000-4000-8000-000000000001",
      name: instructor.name,
      subject: instructor.subject,
      weekly_hours: instructor.weeklyHours,
      hourly_rate: instructor.hourlyRate,
      monthly_insurance: instructor.monthlyInsurance,
      monthly_hour_limit: instructor.monthlyHourLimit,
      weekly_hour_limit: instructor.weeklyHourLimit,
      total_budget: instructor.totalBudget,
      operation_start_date: instructor.operationStartDate,
      operation_end_date: instructor.operationEndDate,
      created_at: "2026-08-18T00:00:00Z",
      updated_at: "2026-08-18T00:00:00Z",
    };
    const selectedQuery = {
      eq: () => selectedQuery,
      order: () => selectedQuery,
      then: (resolve: (result: { readonly data: readonly typeof row[]; readonly error: null }) => unknown) => Promise.resolve(resolve({ data: [row], error: null })),
    };
    const initialBuilder = {
      select: () => selectedQuery,
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: row.user_id } }, error: null }) },
      from: vi.fn(() => initialBuilder),
    } as never);

    // When: the public repository reads instructor settings through the owned Supabase gateway.
    const result = await listHealthSupportInstructors();

    // Then: the initial builder is accepted and its selected result reaches the repository mapping.
    expect(result).toEqual([{ ...instructor, id: instructorId }]);
  });

  it("maps a selected Supabase result error after accepting its narrowed initial query builder", async () => {
    // Given: a valid initial builder whose selected query resolves with a database error.
    const selectedQuery = {
      eq: () => selectedQuery,
      order: () => selectedQuery,
      then: (resolve: (result: { readonly data: null; readonly error: { readonly message: string } }) => unknown) => Promise.resolve(resolve({ data: null, error: { message: "denied" } })),
    };
    const initialBuilder = { select: () => selectedQuery, insert: vi.fn(), update: vi.fn(), delete: vi.fn() };
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "30000000-0000-4000-8000-000000000001" } }, error: null }) },
      from: vi.fn(() => initialBuilder),
    } as never);

    // When: the public repository reads the error result.
    const request = listHealthSupportInstructors();

    // Then: it preserves the repository's deliberate storage-error mapping.
    await expect(request).rejects.toThrow(new HealthSupportInstructorRepositoryError("Unable to load instructor settings"));
  });

  it("rejects an incomplete initial query builder before using instructor storage", async () => {
    // Given: an object with a read operation but without the required mutation operations.
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "30000000-0000-4000-8000-000000000001" } }, error: null }) },
      from: vi.fn(() => ({ select: vi.fn() })),
    } as never);

    // When: the public repository obtains the initial Supabase builder.
    const request = listHealthSupportInstructors();

    // Then: the boundary rejects the malformed builder without attempting a query.
    await expect(request).rejects.toThrow(new HealthSupportInstructorRepositoryError("Unable to access instructor storage"));
  });

  it("parses instructor settings without a client-supplied user id", () => {
    // Given: valid settings with an attempted ownership field.
    const values = { ...instructor, userId: "other-user" };

    // When: settings cross the repository boundary.
    const parsed = parseHealthSupportInstructorInput(values);

    // Then: only writable settings are returned.
    expect(parsed).toEqual(instructor);
  });

  it("rejects values outside the database date, scale, and numeric bounds", () => {
    // Given: settings which PostgreSQL would reject.
    const invalidValues = [
      { ...instructor, subject: "s".repeat(161) },
      { ...instructor, weeklyHours: 168.01 },
      { ...instructor, weeklyHours: 1.234 },
      { ...instructor, monthlyHourLimit: 744.01 },
      { ...instructor, weeklyHourLimit: 168.01 },
      { ...instructor, hourlyRate: 10_000_000_000 },
      { ...instructor, monthlyInsurance: 1.234 },
      { ...instructor, totalBudget: 1_000_000_000_000 },
      { ...instructor, operationStartDate: "2026-02-30" },
    ];

    // When: they cross the repository boundary.
    const outcomes = invalidValues.map((values) => () => parseHealthSupportInstructorInput(values));

    // Then: every invalid database value is rejected locally.
    for (const parse of outcomes) expect(parse).toThrow();
  });

  it("rejects a work log whose end time is not after its start time", () => {
    // Given: a reversed work period.
    const values = { instructorId, date: "2026-08-18", startTime: "12:30", endTime: "09:30", note: "" };

    // When: the mutation payload is parsed.
    const parsed = parseHealthSupportWorkLogMutation(values);

    // Then: the domain error clearly identifies the invalid end time.
    expect(parsed.success).toBe(false);
    if (parsed.success) throw new Error("Expected reversed time to be rejected");
    expect(parsed.error.issues.some((issue) => issue.path[0] === "endTime" && issue.message === "End time must be after start time")).toBe(true);
  });

  it("creates clone and quick-fill values as drafts without a persistence identity", () => {
    // Given: a saved log from which an operator wants a new draft.
    const saved = { id: "20000000-0000-4000-8000-000000000001", instructorId, date: "2026-08-17", startTime: "09:30", endTime: "12:30", note: "morning shift" };

    // When: clone-date and quick-fill controls are used.
    const clone = cloneWorkLogDraft(saved, "2026-08-18");
    const quickFill = quickFillWorkLogDraft(saved, "2026-08-18");

    // Then: neither control returns an id or performs a save; each is only a submit-ready draft.
    expect(clone).toEqual({ instructorId, date: "2026-08-18", startTime: "09:30", endTime: "12:30", note: "morning shift" });
    expect(quickFill).toEqual(clone);
    expect("id" in clone).toBe(false);
    expect("id" in quickFill).toBe(false);
  });

  it("persists create, update, delete, and fresh work-log reads through a stateful gateway", async () => {
    // Given: a repository backed by a narrow stateful storage gateway.
    const repository = createHealthSupportRepository(workLogGateway());
    const input = { instructorId, date: "2026-08-18", startTime: "09:30", endTime: "12:30", note: null };

    // When: a saved log is created, edited, read again, then deleted.
    const created = await repository.createWorkLog(input);
    const updated = await repository.updateWorkLog(created.id, { ...input, endTime: "13:30" });
    const freshLogs = await repository.listWorkLogs(instructorId);
    await repository.deleteWorkLog(created.id);
    const logsAfterDelete = await repository.listWorkLogs(instructorId);

    // Then: every fresh read reflects the explicit mutation and no derived value is stored.
    expect(updated.endTime).toBe("13:30");
    expect(freshLogs).toEqual([updated]);
    expect(logsAfterDelete).toEqual([]);
  });
});
