import { describe, expect, it } from "vitest";

import {
  assertIsolatedProductionQaIdentity,
  assertProductionQaCleanupComplete,
  buildProductionQaIdentity,
  hasProductionQaMarker,
} from "./guard";

const RUN_ID = "c9675180-74ae-4fab-9e22-4534824f917e";

describe("Production QA guard", () => {
  it("derives an isolated account and marker from the run ID", () => {
    expect(buildProductionQaIdentity(RUN_ID)).toEqual({
      email: `bogunon.qa+${RUN_ID}@example.invalid`,
      marker: `[BOGUNON_QA:${RUN_ID}]`,
      runId: RUN_ID,
    });
  });

  it("rejects a real account even when a service-role lookup found it", () => {
    const identity = buildProductionQaIdentity(RUN_ID);

    expect(() => assertIsolatedProductionQaIdentity({
      actualEmail: "real-user@example.com",
      actualUserId: "b61184fe-b423-416d-bea5-d5b5bece74e6",
      expectedQaUserId: "00000000-0000-4000-8000-000000000001",
      identity,
    })).toThrow("Production QA must use its generated isolated account");
  });

  it("accepts only the generated QA account and its resolved user ID", () => {
    const identity = buildProductionQaIdentity(RUN_ID);

    expect(() => assertIsolatedProductionQaIdentity({
      actualEmail: identity.email,
      actualUserId: "00000000-0000-4000-8000-000000000001",
      expectedQaUserId: "00000000-0000-4000-8000-000000000001",
      identity,
    })).not.toThrow();
  });

  it("finds a run marker even after a project link becomes null", () => {
    const identity = buildProductionQaIdentity(RUN_ID);

    expect(hasProductionQaMarker({
      memo: `${identity.marker} orphan cleanup candidate`,
      projectId: null,
    }, identity)).toBe(true);
  });

  it("requires every related table to be empty after cleanup", () => {
    expect(() => assertProductionQaCleanupComplete({
      events: 1,
      project_budgets: 0,
      project_checklist_items: 0,
      project_expenses: 0,
      project_files: 0,
      project_notes: 0,
      project_reservations: 0,
      projects: 0,
      storage_objects: 0,
    })).toThrow("Production QA cleanup is incomplete: events=1");
  });
});
