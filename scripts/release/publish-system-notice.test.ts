import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { runPublishSystemNoticeCli, type PublishSystemNoticeCliDependencies } from "./publish-system-notice";

const changelogText = `# CHANGELOG

## v0.21.0 - Mobile Calendar Date Detail

### Added

- 모바일 월간 캘린더에서 선택한 날짜의 일정, 업무, 날짜 스티커를 확인하는 날짜 상세 바텀 시트
`;

const validAuthor = { ok: true, authorId: "11111111-1111-4111-8111-111111111111", role: "admin" } as const;
const insertedNotice = { ok: true, action: "inserted" } as const;
const releaseArgs = ["--version", "0.21.0", "--base", "HEAD~1", "--head", "HEAD"] as const;
const productionPublishArgs = ["publish", ...releaseArgs, "--deployment-environment", "Production", "--confirm-production"] as const;
const previewPublishArgs = ["publish", ...releaseArgs, "--deployment-environment", "Preview", "--confirm-production"] as const;
const secretStepNames = ["Validate system notice author", "Publish system notice for deployment", "Publish system notice for backfill"] as const;

function createDependencies(
  overrides: Partial<PublishSystemNoticeCliDependencies> = {},
): PublishSystemNoticeCliDependencies {
  return {
    env: {},
    readChangedPaths: vi.fn(async () => ["components/calendar/calendar-workspace.tsx"]),
    readChangelog: vi.fn(async () => changelogText),
    readPackageVersionAt: vi.fn(async (ref) => (ref === "HEAD~1" ? "0.20.2" : "0.21.0")),
    validateAuthor: vi.fn(async () => validAuthor),
    ensureNotice: vi.fn(async () => insertedNotice),
    stdout: vi.fn(),
    stderr: vi.fn(),
    ...overrides,
  };
}

type WorkflowStep = { readonly name: string; readonly raw: string; readonly index: number };

function workflowSteps(workflow: string): readonly WorkflowStep[] {
  const matches = Array.from(workflow.matchAll(/^      - name: (.+)$/gmu));
  return matches.map((match, index) => ({
    name: match[1] ?? "",
    raw: workflow.slice(match.index, matches[index + 1]?.index),
    index,
  }));
}

function stepNamed(steps: readonly WorkflowStep[], name: string): WorkflowStep {
  const step = steps.find((candidate) => candidate.name === name);
  if (step === undefined) throw new Error(`missing workflow step ${name}`);
  return step;
}

describe("publish-system-notice CLI", () => {
  it("dry-runs a release notice without touching the admin author or writer", async () => {
    // Given: a local dry-run command has explicit release source refs.
    const dependencies = createDependencies();

    // When: the CLI builds the notice preview.
    const exitCode = await runPublishSystemNoticeCli(["dry-run", ...releaseArgs], dependencies);

    // Then: the user sees a publishable preview and no DB-capable dependency is called.
    expect(exitCode).toBe(0);
    expect(dependencies.stdout).toHaveBeenCalledWith(expect.stringContaining("DRY_RUN publish"));
    expect(dependencies.validateAuthor).not.toHaveBeenCalled();
    expect(dependencies.ensureNotice).not.toHaveBeenCalled();
  });

  it("rejects publish-only flags during dry-run before author validation or writing", async () => {
    // Given: a local dry-run command includes production publish-only flags.
    const dependencies = createDependencies();

    // When: the CLI parses the dry-run command.
    const exitCode = await runPublishSystemNoticeCli(
      ["dry-run", "--version", "0.21.0", "--base", "HEAD~1", "--head", "HEAD", "--deployment-environment", "Production", "--confirm-production"],
      dependencies,
    );

    // Then: strict argument parsing fails before any DB-capable dependency can run.
    expect(exitCode).toBe(1);
    expect(dependencies.validateAuthor).not.toHaveBeenCalled();
    expect(dependencies.ensureNotice).not.toHaveBeenCalled();
  });

  it("rejects Preview publish before author validation or writing", async () => {
    // Given: GitHub Actions tries to publish a non-production deployment.
    const dependencies = createDependencies({ env: { GITHUB_ACTIONS: "true" } });

    // When: the publish command names Preview as the deployment environment.
    const exitCode = await runPublishSystemNoticeCli(previewPublishArgs, dependencies);

    // Then: the guard fails before any DB-capable dependency can run.
    expect(exitCode).toBe(1);
    expect(dependencies.validateAuthor).not.toHaveBeenCalled();
    expect(dependencies.ensureNotice).not.toHaveBeenCalled();
  });

  it("rejects local publish before author validation or writing", async () => {
    // Given: a local process tries to publish with otherwise production-shaped arguments.
    const dependencies = createDependencies();

    // When: the publish command runs outside GitHub Actions.
    const exitCode = await runPublishSystemNoticeCli(productionPublishArgs, dependencies);

    // Then: the GitHub Actions guard fails before any DB-capable dependency can run.
    expect(exitCode).toBe(1);
    expect(dependencies.validateAuthor).not.toHaveBeenCalled();
    expect(dependencies.ensureNotice).not.toHaveBeenCalled();
  });

  it("rejects missing production confirmation before author validation or writing", async () => {
    // Given: GitHub Actions tries to publish without the explicit production confirmation flag.
    const dependencies = createDependencies({ env: { GITHUB_ACTIONS: "true" } });

    // When: the publish command omits --confirm-production.
    const exitCode = await runPublishSystemNoticeCli(
      [
        "publish",
        "--version",
        "0.21.0",
        "--base",
        "HEAD~1",
        "--head",
        "HEAD",
        "--deployment-environment",
        "Production",
      ],
      dependencies,
    );

    // Then: strict argument parsing fails before any DB-capable dependency can run.
    expect(exitCode).toBe(1);
    expect(dependencies.validateAuthor).not.toHaveBeenCalled();
    expect(dependencies.ensureNotice).not.toHaveBeenCalled();
  });

  it("skips unchanged package versions before author validation or writing", async () => {
    // Given: a production publish has a user-facing diff but no package version bump.
    const dependencies = createDependencies({ env: { GITHUB_ACTIONS: "true" }, readPackageVersionAt: vi.fn(async () => "0.21.0") });

    // When: the publish command evaluates the release refs.
    const exitCode = await runPublishSystemNoticeCli(productionPublishArgs, dependencies);

    // Then: publication is skipped before any DB-capable dependency can run.
    expect(exitCode).toBe(0);
    expect(dependencies.stdout).toHaveBeenCalledWith("SKIP version_unchanged");
    expect(dependencies.readChangedPaths).not.toHaveBeenCalled();
    expect(dependencies.validateAuthor).not.toHaveBeenCalled();
    expect(dependencies.ensureNotice).not.toHaveBeenCalled();
  });

  it("rejects a requested version that does not match the head package version before writing", async () => {
    // Given: a production publish asks for a version different from head package.json.
    const dependencies = createDependencies({ env: { GITHUB_ACTIONS: "true" } });

    // When: the publish command evaluates the release refs.
    const exitCode = await runPublishSystemNoticeCli(
      ["publish", "--version", "0.22.0", "--base", "HEAD~1", "--head", "HEAD", "--deployment-environment", "Production", "--confirm-production"],
      dependencies,
    );

    // Then: publication fails before changelog evaluation or DB writes.
    expect(exitCode).toBe(1);
    expect(dependencies.readChangedPaths).not.toHaveBeenCalled();
    expect(dependencies.validateAuthor).not.toHaveBeenCalled();
    expect(dependencies.ensureNotice).not.toHaveBeenCalled();
  });

  it.each([
    ["package version read", { readPackageVersionAt: vi.fn(async () => Promise.reject(new Error("leaked package failure"))) }],
    ["git diff", { readChangedPaths: vi.fn(async () => Promise.reject(new Error("leaked diff failure"))) }],
    ["changelog read", { readChangelog: vi.fn(async () => Promise.reject(new Error("leaked changelog failure"))) }],
  ] as const)("reports a stable non-secret error when %s fails", async (_name, overrides) => {
    // Given: an operational read dependency fails with a sensitive raw message.
    const dependencies = createDependencies({ env: { GITHUB_ACTIONS: "true" }, ...overrides });

    // When: the production publish command reaches that dependency.
    const exitCode = await runPublishSystemNoticeCli(productionPublishArgs, dependencies);

    // Then: the CLI emits one stable error without validating or writing.
    expect(exitCode).toBe(1);
    expect(dependencies.stderr).toHaveBeenCalledWith("ERROR release command failed");
    expect(dependencies.validateAuthor).not.toHaveBeenCalled();
    expect(dependencies.ensureNotice).not.toHaveBeenCalled();
  });

  it("validates the author before exactly one writer call during production publish", async () => {
    // Given: GitHub Actions publishes a user-facing Production release.
    const calls: string[] = [];
    const dependencies = createDependencies({
      env: { GITHUB_ACTIONS: "true" },
      validateAuthor: vi.fn(async () => {
        calls.push("validate");
        return { ok: true, authorId: "11111111-1111-4111-8111-111111111111", role: "owner" } as const;
      }),
      ensureNotice: vi.fn(async () => {
        calls.push("ensure");
        return insertedNotice;
      }),
    });

    // When: the publish command is fully production-confirmed.
    const exitCode = await runPublishSystemNoticeCli(productionPublishArgs, dependencies);

    // Then: author preflight precedes one idempotent writer call.
    expect(exitCode).toBe(0);
    expect(calls).toStrictEqual(["validate", "ensure"]);
    expect(dependencies.ensureNotice).toHaveBeenCalledTimes(1);
  });

  it("stops after author preflight failure without calling the writer", async () => {
    // Given: the configured system notice author is not valid.
    const dependencies = createDependencies({
      env: { GITHUB_ACTIONS: "true" },
      validateAuthor: vi.fn(async () => ({
        ok: false,
        error: { code: "author-not-authorized", message: "System notice author must be an admin or owner." },
      }) as const),
    });

    // When: production publish reaches the DB preflight.
    const exitCode = await runPublishSystemNoticeCli(productionPublishArgs, dependencies);

    // Then: the writer is not called after a failed read-only author check.
    expect(exitCode).toBe(1);
    expect(dependencies.validateAuthor).toHaveBeenCalledTimes(1);
    expect(dependencies.ensureNotice).not.toHaveBeenCalled();
  });

  it("skips internal-only release changes without validating the author or writing", async () => {
    // Given: only release automation files changed.
    const dependencies = createDependencies({
      env: { GITHUB_ACTIONS: "true" },
      readChangedPaths: vi.fn(async () => [
        "scripts/release/publish-system-notice.ts",
        ".github/workflows/system-notice.yml",
        "package.json",
        "package-lock.json",
      ]),
    });

    // When: production publish evaluates the release source.
    const exitCode = await runPublishSystemNoticeCli(productionPublishArgs, dependencies);

    // Then: no DB dependency is touched for an internal-only release.
    expect(exitCode).toBe(0);
    expect(dependencies.stdout).toHaveBeenCalledWith(expect.stringContaining("SKIP internal_only_diff"));
    expect(dependencies.validateAuthor).not.toHaveBeenCalled();
    expect(dependencies.ensureNotice).not.toHaveBeenCalled();
  });

  it("skips a missing release entry without validating the author or writing", async () => {
    // Given: a production publish has user-facing changes but no matching changelog entry.
    const dependencies = createDependencies({
      env: { GITHUB_ACTIONS: "true" },
      readChangelog: vi.fn(async () => "# CHANGELOG\n"),
    });

    // When: production publish evaluates the release source.
    const exitCode = await runPublishSystemNoticeCli(productionPublishArgs, dependencies);

    // Then: no DB dependency is touched when release notes are absent.
    expect(exitCode).toBe(0);
    expect(dependencies.stdout).toHaveBeenCalledWith(expect.stringContaining("SKIP release_entry_missing"));
    expect(dependencies.validateAuthor).not.toHaveBeenCalled();
    expect(dependencies.ensureNotice).not.toHaveBeenCalled();
  });
});

describe("system notice workflow source contract", () => {
  it("serializes trusted Production notice publishing without dispatch shell interpolation", async () => {
    // Given: the checked-in GitHub Actions workflow source.
    const workflow = await readFile(".github/workflows/system-notice.yml", "utf8");

    // When: the workflow is inspected as structured step blocks.
    const normalized = workflow.toLowerCase();
    const steps = workflowSteps(workflow);
    const verifyCheckout = stepNamed(steps, "Verify trusted checkout");
    const readPackageVersion = stepNamed(steps, "Read package version");
    const verifyCurrentMain = stepNamed(steps, "Verify deployment event targets current main");
    const resolveDeploymentParent = stepNamed(steps, "Resolve deployment parent SHA");
    const verifyBackfill = stepNamed(steps, "Verify backfill has a successful Vercel Production deployment");
    const validateAuthor = stepNamed(steps, "Validate system notice author");
    const publishDeployment = stepNamed(steps, "Publish system notice for deployment");
    const publishBackfill = stepNamed(steps, "Publish system notice for backfill");
    const secretsSteps = steps.filter((step) => step.raw.includes("secrets."));
    const runScripts = Array.from(workflow.matchAll(/^\s*run:\s*(?:(?:[>|]-?)\r?\n(?:\s{10,}.+(?:\r?\n|$))*|.+)$/gmu), (match) => match[0]).join("\n");

    // Then: trust checks and serialization precede every secret-bearing step.
    expect(workflow).toContain("github.event_name == 'workflow_dispatch' &&\n        github.ref == 'refs/heads/main'");
    expect(workflow).toContain("github.event.deployment_status.state == 'success'");
    expect(workflow).toContain("github.event.deployment.environment == 'Production'");
    expect(workflow).toContain("github.event.deployment.creator.login == 'vercel[bot]'");
    expect(workflow).toContain("environment: Production");
    expect(workflow).toContain("group: system-notice-production");
    expect(workflow).toContain("cancel-in-progress: false");
    expect(stepNamed(steps, "Checkout release source").raw).toContain("ref: ${{ github.event_name == 'deployment_status' && github.event.deployment.sha || github.sha }}");
    expect(verifyCheckout.raw).toContain("EXPECTED_SHA: ${{ github.event_name == 'deployment_status' && github.event.deployment.sha || github.sha }}");
    expect(verifyCheckout.raw).toContain('test "$(git rev-parse HEAD)" = "$EXPECTED_SHA"');
    expect(readPackageVersion.raw).toContain('VERSION="$(node -p "require(\'./package.json\').version")"');
    expect(readPackageVersion.raw).toContain('test -n "$VERSION"');
    expect(readPackageVersion.raw).toContain('echo "version=$VERSION" >> "$GITHUB_OUTPUT"');
    expect(workflow).not.toContain('require(\\"./package.json\\").version');
    expect(resolveDeploymentParent.raw).toContain("id: deployment-parent");
    expect(resolveDeploymentParent.raw).toContain("HEAD_SHA: ${{ github.event.deployment.sha }}");
    expect(resolveDeploymentParent.raw).toContain('BASE_SHA="$(git rev-parse "${HEAD_SHA}^")"');
    expect(resolveDeploymentParent.raw).toContain('test -n "$BASE_SHA"');
    expect(resolveDeploymentParent.raw).toContain('echo "base_sha=$BASE_SHA" >> "$GITHUB_OUTPUT"');
    expect(publishDeployment.raw).toContain("BASE_SHA: ${{ steps.deployment-parent.outputs.base_sha }}");
    expect(publishDeployment.raw).not.toContain("BASE_SHA: ${{ github.event.deployment.sha }}^");
    expect(publishBackfill.raw).toContain("RELEASE_VERSION: ${{ inputs.version }}");
    expect(publishBackfill.raw).toContain('          --version "$RELEASE_VERSION"');
    expect(secretsSteps.map((step) => step.name)).toStrictEqual([...secretStepNames]);
    for (const step of secretsSteps) {
      expect(step.index).toBeGreaterThan(Math.max(verifyCheckout.index, verifyCurrentMain.index, resolveDeploymentParent.index, verifyBackfill.index));
    }
    expect(publishBackfill.index).toBeGreaterThan(validateAuthor.index);
    expect(runScripts).not.toContain("${{ inputs.");
    expect(workflow).toContain("statuses: read");
    expect(workflow).toContain("contents: read");
    expect(workflow).toContain("gh api --method GET");
    expect(workflow).not.toContain("pull_request");
    expect(workflow).not.toContain("preview");
    expect(normalized).not.toContain("build hook");
    expect(normalized).not.toContain("api/system-notice");
    expect(normalized).not.toContain("curl");
  });
});
