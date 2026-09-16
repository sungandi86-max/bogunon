import type { NoticeInput, UserRole } from "@/lib/notices/model";
import type { NoticeRow as DatabaseNoticeRow } from "@/types/database";
import { beforeEach, describe, expect, it, vi } from "vitest";

type NoticeRow = Pick<DatabaseNoticeRow, "id" | "title" | "summary" | "content" | "category" | "is_published" | "is_important" | "publish_start_at" | "publish_end_at" | "created_by">;
type ProfileRow = { readonly id: string; readonly role: UserRole };
type DbError = { readonly message: string; readonly code?: string };
type InsertRow = NoticeRow;
type Operation = `select:${"profiles" | "notices"}` | `limit:notices:${number}` | `insert:${"notices"}`;
type QueryResult = { readonly data: readonly NoticeRow[] | null; readonly error: DbError | null };
type AdminConfigurationErrorCode = "missing-url";
type AuthorValidationFailureCase = Readonly<{ code: string; authorId?: string; profiles: readonly ProfileRow[]; profileError: DbError | null; operations: readonly Operation[] }>;
type NoticeSelectGate = { count: number; readonly target: number; readonly ready: Promise<void>; readonly wait: Promise<void>; readonly release: () => void; readonly markReady: () => void };

const adminClientState = vi.hoisted(() => ({
  createError: null as Error | null,
  operations: [] as Operation[],
  profiles: [] as readonly ProfileRow[],
  notices: [] as NoticeRow[],
  profileError: null as DbError | null,
  noticeError: null as DbError | null,
  insertError: null as DbError | null,
  insertedIds: [] as string[],
  noticeSelectGate: null as NoticeSelectGate | null,
}));

class QueryBuilder {
  private idFilter: string | null = null;
  private titleFilter: string | null = null;

  constructor(private readonly table: "profiles" | "notices", private readonly insertRow: InsertRow | null) {}

  select(): QueryBuilder { adminClientState.operations.push(`select:${this.table}`); return this; }

  eq(column: "id" | "title", value: string): QueryBuilder { if (column === "id") this.idFilter = value; if (column === "title") this.titleFilter = value; return this; }

  limit(count: number): QueryBuilder { adminClientState.operations.push(`limit:notices:${count}`); return this; }

  async maybeSingle(): Promise<{ readonly data: ProfileRow | null; readonly error: DbError | null }> {
    return { data: adminClientState.profiles.find((profile) => profile.id === this.idFilter) ?? null, error: adminClientState.profileError };
  }

  async then<TResult1 = QueryResult, TResult2 = never>(onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null): Promise<TResult1 | TResult2> { return this.execute().then(onfulfilled, onrejected); }

  private async execute(): Promise<QueryResult> {
    if (this.insertRow) {
      adminClientState.operations.push("insert:notices");
      adminClientState.insertedIds.push(this.insertRow.id);
      if (!adminClientState.insertError) {
        if (adminClientState.notices.some((notice) => notice.id === this.insertRow?.id)) return { data: null, error: { message: "duplicate key value violates unique constraint", code: "23505" } };
        adminClientState.notices.push(this.insertRow);
      }
      return { data: null, error: adminClientState.insertError };
    }
    const data = adminClientState.notices.filter((notice) => notice.title === this.titleFilter).slice(0, 2);
    const gate = adminClientState.noticeSelectGate;
    if (gate) { gate.count += 1; if (gate.count === gate.target) gate.markReady(); await gate.wait; }
    return { data, error: adminClientState.noticeError };
  }
}

const adminClient = vi.hoisted(() => ({
  auth: { getUser: vi.fn(() => { throw new Error("session auth must not be used"); }) },
  from: (table: "profiles" | "notices" | "notice_reads") => {
    if (table === "notice_reads") throw new Error("notice_reads must not be touched");
    return { insert: (row: InsertRow): QueryBuilder => new QueryBuilder(table, row), select: (): QueryBuilder => new QueryBuilder(table, null).select() };
  },
}));

vi.mock("server-only", () => ({}));
const adminModule = vi.hoisted(() => {
  class SupabaseAdminConfigurationError extends Error {
    readonly code: AdminConfigurationErrorCode = "missing-url";
    readonly envVar = "SUPABASE_URL";
    readonly name = "SupabaseAdminConfigurationError";

    constructor(message = "SUPABASE_URL is required") { super(message); }
  }
  return { SupabaseAdminConfigurationError };
});

vi.mock("@/lib/supabase/admin", () => ({
  SupabaseAdminConfigurationError: adminModule.SupabaseAdminConfigurationError,
  createAdminClient: () => { if (adminClientState.createError) throw adminClientState.createError; return adminClient; },
}));

const adminId = "11111111-1111-4111-8111-111111111111";
const normalId = "22222222-2222-4222-8222-222222222222";
const noticeInput = { version: "0.21.0", title: "BOGUNON 0.21.0 업데이트", summary: "요약", content: "본문", category: "update", isPublished: true, isImportant: true, publishStartAt: "2026-09-08T00:00:00.000Z", publishEndAt: null } satisfies NoticeInput & { readonly version: string };

function existingNotice(overrides: Partial<NoticeRow> = {}): NoticeRow {
  return {
    id: "33333333-3333-4333-8333-333333333333", title: noticeInput.title, summary: noticeInput.summary, content: noticeInput.content,
    category: noticeInput.category, is_published: noticeInput.isPublished, is_important: noticeInput.isImportant,
    publish_start_at: noticeInput.publishStartAt, publish_end_at: noticeInput.publishEndAt, created_by: adminId,
    ...overrides,
  };
}

async function loadRepository(): Promise<typeof import("@/lib/notices/system-repository")> { return import("@/lib/notices/system-repository"); }

function createNoticeSelectGate(target: number): NoticeSelectGate {
  let release = (): void => {};
  let markReady = (): void => {};
  const ready = new Promise<void>((resolve) => { markReady = resolve; });
  const wait = new Promise<void>((resolve) => { release = resolve; });
  return { count: 0, target, ready, wait, release, markReady };
}

const authorFailureCases = [
  ["author-not-found", []],
  ["author-not-authorized", [{ id: normalId, role: "user" }]],
] satisfies readonly (readonly [string, readonly ProfileRow[]])[];

const validAuthorValidationCases = ["admin", "owner"] satisfies readonly UserRole[];

const authorValidationFailureCases = [
  { code: "missing-author-id", profiles: [{ id: adminId, role: "admin" }], profileError: null, operations: [] },
  { code: "invalid-author-id", authorId: "not-a-uuid", profiles: [{ id: adminId, role: "admin" }], profileError: null, operations: [] },
  { code: "admin-client-unavailable", authorId: adminId, profiles: [{ id: adminId, role: "admin" }], profileError: null, operations: [] },
  { code: "author-not-found", authorId: adminId, profiles: [], profileError: null, operations: ["select:profiles"] },
  { code: "author-not-authorized", authorId: normalId, profiles: [{ id: normalId, role: "user" }], profileError: null, operations: ["select:profiles"] },
  { code: "author-lookup-failed", authorId: adminId, profiles: [{ id: adminId, role: "admin" }], profileError: { message: "profile db unavailable" }, operations: ["select:profiles"] },
] satisfies readonly AuthorValidationFailureCase[];

describe("system notice repository", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    adminClientState.createError = null;
    adminClientState.operations.length = 0;
    adminClientState.profiles = [{ id: adminId, role: "admin" }];
    adminClientState.notices = [];
    adminClientState.profileError = null;
    adminClientState.noticeError = null;
    adminClientState.insertError = null;
    adminClientState.insertedIds = [];
    adminClientState.noticeSelectGate = null;
    adminClient.auth.getUser.mockClear();
  });

  it.each([
    ["missing-author-id", undefined, noticeInput],
    ["invalid-author-id", "not-a-uuid", noticeInput],
    ["invalid-version", adminId, { ...noticeInput, version: " 0.21.0" }],
    ["invalid-title", adminId, { ...noticeInput, title: "BOGUNON 0.21.1 업데이트" }],
  ])("returns %s before database work", async (code, authorId, input) => {
    // Given: invalid system notice boundary input or configuration.
    if (authorId) vi.stubEnv("SYSTEM_NOTICE_AUTHOR_ID", authorId);
    const { ensureSystemNotice } = await loadRepository();

    // When: the system notice is ensured.
    const result = await ensureSystemNotice(input);

    // Then: validation fails without creating a Supabase client query.
    expect(result).toMatchObject({ ok: false, error: { code } });
    expect(adminClientState.operations).toStrictEqual([]);
  });

  it.each(authorFailureCases)("returns %s before notice lookup", async (code, profiles) => {
    // Given: the configured author is present but cannot authorize system notices.
    vi.stubEnv("SYSTEM_NOTICE_AUTHOR_ID", profiles[0]?.id ?? adminId);
    adminClientState.profiles = profiles;
    const { ensureSystemNotice } = await loadRepository();

    // When: the system notice is ensured.
    const result = await ensureSystemNotice(noticeInput);

    // Then: only the author profile is checked.
    expect(result).toMatchObject({ ok: false, error: { code } });
    expect(adminClientState.operations).toStrictEqual(["select:profiles"]);
  });

  it.each(validAuthorValidationCases)("validates a configured %s system notice author", async (role) => {
    // Given: SYSTEM_NOTICE_AUTHOR_ID points at a privileged profile.
    vi.stubEnv("SYSTEM_NOTICE_AUTHOR_ID", adminId);
    adminClientState.profiles = [{ id: adminId, role }];
    const { validateSystemNoticeAuthor } = await loadRepository();

    // When: the read-only author preflight runs.
    const result = await validateSystemNoticeAuthor();

    // Then: the author is accepted without touching notices.
    expect(result).toStrictEqual({ ok: true, authorId: adminId, role });
    expect(adminClientState.operations).toStrictEqual(["select:profiles"]);
  });

  it.each(authorValidationFailureCases)("returns $code from author preflight before notices access", async ({ code, authorId, profiles, profileError, operations }) => {
    // Given: the system notice author configuration or profile lookup is invalid.
    if (authorId) vi.stubEnv("SYSTEM_NOTICE_AUTHOR_ID", authorId);
    adminClientState.profiles = profiles;
    adminClientState.profileError = profileError;
    if (code === "admin-client-unavailable") {
      adminClientState.createError = new adminModule.SupabaseAdminConfigurationError("secret config detail");
    }
    const { validateSystemNoticeAuthor } = await loadRepository();

    // When: the read-only author preflight runs.
    const result = await validateSystemNoticeAuthor();

    // Then: it fails with a typed result before any notice lookup or write.
    expect(result).toMatchObject({ ok: false, error: { code } });
    expect(adminClientState.operations).toStrictEqual(operations);
    expect(adminClient.auth.getUser).not.toHaveBeenCalled();
  });

  it("rethrows an unexpected admin client failure from author preflight", async () => {
    // Given: the admin client raises an unexpected programming/runtime failure.
    vi.stubEnv("SYSTEM_NOTICE_AUTHOR_ID", adminId);
    adminClientState.createError = new Error("unexpected admin client failure");
    const { validateSystemNoticeAuthor } = await loadRepository();

    // When: the read-only author preflight runs.
    const result = validateSystemNoticeAuthor();

    // Then: the unexpected failure is not converted into a safe configuration result.
    await expect(result).rejects.toThrow("unexpected admin client failure");
    expect(adminClientState.operations).toStrictEqual([]);
  });

  it.each([
    ["admin-client-unavailable", "sb_secret_create_leak", () => { adminClientState.createError = new adminModule.SupabaseAdminConfigurationError("sb_secret_create_leak"); }],
    ["author-lookup-failed", "sb_secret_profile_leak", () => { adminClientState.profileError = { message: "sb_secret_profile_leak" }; }],
    ["notice-lookup-failed", "sb_secret_notice_leak", () => { adminClientState.noticeError = { message: "sb_secret_notice_leak" }; }],
    ["notice-insert-failed", "sb_secret_insert_leak", () => { adminClientState.insertError = { message: "sb_secret_insert_leak" }; }],
  ])("returns secret-safe %s for backend failures", async (code, secret, arrange) => {
    // Given: the backend dependency fails with a sensitive raw message.
    vi.stubEnv("SYSTEM_NOTICE_AUTHOR_ID", adminId);
    arrange();
    const { ensureSystemNotice } = await loadRepository();

    // When: the system notice is ensured.
    const result = await ensureSystemNotice(noticeInput);

    // Then: the typed failure does not expose the raw secret-bearing error.
    expect(result).toMatchObject({ ok: false, error: { code } });
    expect(JSON.stringify(result)).not.toContain(secret);
  });

  it("rethrows an unexpected admin client failure", async () => {
    // Given: the admin client raises an unexpected programming/runtime failure.
    vi.stubEnv("SYSTEM_NOTICE_AUTHOR_ID", adminId);
    adminClientState.createError = new Error("unexpected admin client failure");
    const { ensureSystemNotice } = await loadRepository();

    // When: the system notice is ensured.
    const result = ensureSystemNotice(noticeInput);

    // Then: the unexpected failure is not converted into a safe configuration result.
    await expect(result).rejects.toThrow("unexpected admin client failure");
    expect(adminClientState.operations).toStrictEqual([]);
  });

  it("inserts the first matching system notice with the explicit author", async () => {
    // Given: an admin author exists and no notice has the exact release title.
    vi.stubEnv("SYSTEM_NOTICE_AUTHOR_ID", adminId);
    const { ensureSystemNotice } = await loadRepository();

    // When: the system notice is ensured.
    const result = await ensureSystemNotice(noticeInput);

    // Then: one notice is inserted using canonical NoticeInput fields.
    expect(result).toStrictEqual({ ok: true, action: "inserted" });
    expect(adminClientState.operations).toStrictEqual(["select:profiles", "select:notices", "limit:notices:2", "insert:notices"]);
    expect(adminClientState.notices).toHaveLength(1);
    expect(adminClientState.notices[0]?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(adminClientState.notices[0]).toStrictEqual(existingNotice({ id: adminClientState.notices[0]?.id ?? "" }));
    expect(adminClient.auth.getUser).not.toHaveBeenCalled();
  });

  it("inserts once and noops on a second identical ensure call", async () => {
    // Given: an admin author exists and no notice has the exact release title.
    vi.stubEnv("SYSTEM_NOTICE_AUTHOR_ID", adminId);
    const { ensureSystemNotice } = await loadRepository();

    // When: the same system notice is ensured twice against the same fake store.
    const firstResult = await ensureSystemNotice(noticeInput);
    const secondResult = await ensureSystemNotice(noticeInput);

    // Then: the second call sees the first inserted row as matching content and does not duplicate it.
    const noticeId = adminClientState.notices[0]?.id ?? "";
    expect(firstResult).toStrictEqual({ ok: true, action: "inserted" });
    expect(secondResult).toStrictEqual({ ok: true, action: "noop", noticeId });
    expect(adminClientState.notices).toHaveLength(1);
    expect(adminClientState.notices[0]).toStrictEqual(existingNotice({ id: noticeId }));
  });

  it("resolves a concurrent deterministic-id insert race to one stored notice", async () => {
    // Given: two callers both reach notice lookup before either insert commits.
    vi.stubEnv("SYSTEM_NOTICE_AUTHOR_ID", adminId);
    adminClientState.noticeSelectGate = createNoticeSelectGate(2);
    const { ensureSystemNotice } = await loadRepository();

    // When: both callers ensure the same version while the fake primary key rejects the loser.
    const firstCall = ensureSystemNotice(noticeInput);
    const secondCall = ensureSystemNotice(noticeInput);
    await adminClientState.noticeSelectGate.ready;
    adminClientState.noticeSelectGate.release();
    const results = await Promise.all([firstCall, secondCall]);
    const noticeId = adminClientState.notices[0]?.id ?? "";
    const nextInput = { ...noticeInput, version: "0.22.0", title: "BOGUNON 0.22.0 업데이트" } satisfies NoticeInput & { readonly version: string };
    const nextResult = await ensureSystemNotice(nextInput);
    const nextNoticeId = adminClientState.notices.find((notice) => notice.title === nextInput.title)?.id ?? "";

    // Then: both inserts used one deterministic id, one call noops, and a new version gets a distinct id.
    expect(results).toContainEqual({ ok: true, action: "inserted" });
    expect(results).toContainEqual({ ok: true, action: "noop", noticeId });
    expect(adminClientState.insertedIds.slice(0, 2)).toStrictEqual([noticeId, noticeId]);
    expect(adminClientState.notices.filter((notice) => notice.title === noticeInput.title)).toHaveLength(1);
    expect(nextResult).toStrictEqual({ ok: true, action: "inserted" });
    expect(nextNoticeId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(nextNoticeId).not.toBe(noticeId);
  });

  it("noops same content from another creator without requiring a session login", async () => {
    // Given: the release notice already exists and the only author signal is SYSTEM_NOTICE_AUTHOR_ID.
    vi.stubEnv("SYSTEM_NOTICE_AUTHOR_ID", adminId);
    adminClientState.notices = [existingNotice({ created_by: "55555555-5555-4555-8555-555555555555" })];
    const { ensureSystemNotice } = await loadRepository();

    // When: the system notice is ensured without a user session.
    const result = await ensureSystemNotice(noticeInput);

    // Then: the fake session auth path is never called.
    expect(result).toStrictEqual({ ok: true, action: "noop", noticeId: "33333333-3333-4333-8333-333333333333" });
    expect(adminClient.auth.getUser).not.toHaveBeenCalled();
    expect(adminClientState.operations).toStrictEqual(["select:profiles", "select:notices", "limit:notices:2"]);
  });

  it.each([
    ["notice-conflict", [existingNotice({ content: "다른 본문" })]],
    ["duplicate-notices", [existingNotice(), existingNotice({ id: "44444444-4444-4444-8444-444444444444" })]],
  ])("returns %s without insert when exact-title notices are unsafe", async (code, notices) => {
    // Given: an exact-title notice exists in a non-idempotent state.
    vi.stubEnv("SYSTEM_NOTICE_AUTHOR_ID", adminId);
    adminClientState.notices = notices;
    const { ensureSystemNotice } = await loadRepository();

    // When: the system notice is ensured.
    const result = await ensureSystemNotice(noticeInput);

    // Then: the conflict is explicit and no write is attempted.
    expect(result).toMatchObject({ ok: false, error: { code } });
    expect(adminClientState.operations).toStrictEqual(["select:profiles", "select:notices", "limit:notices:2"]);
  });
});
