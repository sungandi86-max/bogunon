const QA_RUN_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const QA_TABLES = [
  "events",
  "project_budgets",
  "project_checklist_items",
  "project_expenses",
  "project_files",
  "project_notes",
  "project_places",
  "project_reservations",
  "projects",
  "storage_objects",
] as const;

type ProductionQaIdentity = {
  readonly email: string;
  readonly marker: string;
  readonly runId: string;
};

type ProductionQaIdentityCheck = {
  readonly actualEmail: string;
  readonly actualUserId: string;
  readonly expectedQaUserId: string;
  readonly identity: ProductionQaIdentity;
};

type ProductionQaMarkedRecord = {
  readonly memo: string | null;
  readonly projectId: string | null;
};

type ProductionQaCleanupCounts = Readonly<Record<(typeof QA_TABLES)[number], number>>;

export class ProductionQaSafetyError extends Error {
  readonly code: "cleanup-incomplete" | "identity-mismatch" | "invalid-run-id";

  constructor(
    code: ProductionQaSafetyError["code"],
    message: string,
  ) {
    super(message);
    this.name = "ProductionQaSafetyError";
    this.code = code;
  }
}

export function buildProductionQaIdentity(runId: string): ProductionQaIdentity {
  if (!QA_RUN_ID_PATTERN.test(runId)) {
    throw new ProductionQaSafetyError(
      "invalid-run-id",
      "Production QA requires a UUID run ID",
    );
  }

  return {
    email: `bogunon.qa+${runId}@example.invalid`,
    marker: `[BOGUNON_QA:${runId}]`,
    runId,
  };
}

export function assertIsolatedProductionQaIdentity(
  check: ProductionQaIdentityCheck,
): void {
  const emailMatches = check.actualEmail === check.identity.email;
  const userMatches =
    check.actualUserId === check.expectedQaUserId && check.actualUserId.length > 0;

  if (!emailMatches || !userMatches) {
    throw new ProductionQaSafetyError(
      "identity-mismatch",
      "Production QA must use its generated isolated account",
    );
  }
}

export function hasProductionQaMarker(
  record: ProductionQaMarkedRecord,
  identity: ProductionQaIdentity,
): boolean {
  return record.memo?.includes(identity.marker) ?? false;
}

export function assertProductionQaCleanupComplete(
  counts: ProductionQaCleanupCounts,
): void {
  const remaining = QA_TABLES
    .filter((table) => counts[table] !== 0)
    .map((table) => `${table}=${counts[table]}`);

  if (remaining.length > 0) {
    throw new ProductionQaSafetyError(
      "cleanup-incomplete",
      `Production QA cleanup is incomplete: ${remaining.join(", ")}`,
    );
  }
}
