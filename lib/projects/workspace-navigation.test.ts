import { describe, expect, it } from "vitest";

import {
  workspaceEmptyActionsFor,
  workspaceNavigationFor,
  workspaceProjectType,
  workspaceQuickActionsFor,
} from "@/lib/projects/workspace-navigation";

describe("contextual project workspace navigation", () => {
  it("prioritizes travel work and moves notes into overflow", () => {
    expect(workspaceNavigationFor("travel")).toEqual({
      primary: ["overview", "schedule", "reservations", "map", "checklist", "budget", "files"],
      overflow: ["notes"],
    });
    expect(workspaceEmptyActionsFor("travel")).toEqual(["schedule", "reservations", "map", "checklist"]);
    expect(workspaceQuickActionsFor("travel")).toEqual(["schedule", "reservations", "map"]);
  });

  it.each([
    ["school", ["overview", "schedule", "checklist", "notes", "files", "budget", "reservations", "map"]],
    ["publication", ["overview", "notes", "files", "checklist", "schedule", "budget", "reservations", "map"]],
    ["development", ["overview", "checklist", "notes", "files", "schedule", "budget", "reservations", "map"]],
    ["workout", ["overview", "schedule", "checklist", "map", "budget", "notes", "files", "reservations"]],
    ["other", ["overview", "schedule", "checklist", "reservations", "budget", "notes", "files", "map"]],
  ] as const)("uses the %s tab priority", (type, expected) => {
    expect(workspaceNavigationFor(type).primary).toEqual(expected);
  });

  it("uses only unambiguous persisted preset signals", () => {
    expect(workspaceProjectType({ icon: "travel", color: "pink" })).toBe("travel");
    expect(workspaceProjectType({ icon: "folder", color: "blue" })).toBe("development");
    expect(workspaceProjectType({ icon: "folder", color: "yellow" })).toBe("other");
    expect(workspaceProjectType({ icon: "folder", color: "mint" })).toBe("other");
  });
});
