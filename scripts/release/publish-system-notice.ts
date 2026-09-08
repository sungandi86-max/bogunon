import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { buildReleaseNotice } from "../../lib/notices/release-notice";
import type { SystemNoticeAuthorValidationResult, SystemNoticeResult } from "../../lib/notices/system-repository";
import { ensureSystemNotice, validateSystemNoticeAuthor } from "../../lib/notices/system-repository";

type CommandName = "dry-run" | "publish" | "validate-author";
type ParsedCommand =
  | { readonly command: "validate-author" }
  | { readonly command: "dry-run"; readonly version: string; readonly base: string; readonly head: string }
  | { readonly command: "publish"; readonly version: string; readonly base: string; readonly head: string; readonly deploymentEnvironment: string; readonly confirmProduction: true };

type ParsedOptions = { readonly version?: string; readonly base?: string; readonly head?: string; readonly deploymentEnvironment?: string; readonly confirmProduction: boolean };

export type PublishSystemNoticeCliDependencies = {
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly readChangedPaths: (base: string, head: string) => Promise<readonly string[]>;
  readonly readChangelog: () => Promise<string>;
  readonly readPackageVersionAt: (ref: string) => Promise<string>;
  readonly validateAuthor: () => Promise<SystemNoticeAuthorValidationResult>;
  readonly ensureNotice: (input: Parameters<typeof ensureSystemNotice>[0]) => Promise<SystemNoticeResult>;
  readonly stdout: (line: string) => void;
  readonly stderr: (line: string) => void;
};

class CliUsageError extends Error {
  readonly name = "CliUsageError";
}

const execFileAsync = promisify(execFile);
const commands = ["dry-run", "publish", "validate-author"] as const satisfies readonly CommandName[];

export async function runPublishSystemNoticeCli(
  argv: readonly string[] = process.argv.slice(2),
  dependencies: PublishSystemNoticeCliDependencies = createDefaultDependencies(),
): Promise<number> {
  const parsed = parseArgs(argv);
  if (!parsed.ok) {
    dependencies.stderr(`ERROR ${parsed.error.message}`);
    return 1;
  }

  try {
    switch (parsed.command.command) {
      case "validate-author":
        return await validateAuthor(dependencies);
      case "dry-run":
        return await buildAndMaybePublish(parsed.command, dependencies, "dry-run");
      case "publish":
        return await publish(parsed.command, dependencies);
    }
  } catch {
    dependencies.stderr("ERROR release command failed");
    return 1;
  }
}

function createDefaultDependencies(): PublishSystemNoticeCliDependencies {
  return {
    env: process.env,
    readChangedPaths,
    readChangelog: () => readFile("CHANGELOG.md", "utf8"),
    readPackageVersionAt,
    validateAuthor: validateSystemNoticeAuthor,
    ensureNotice: ensureSystemNotice,
    stdout: (line) => {
      process.stdout.write(`${line}\n`);
    },
    stderr: (line) => {
      process.stderr.write(`${line}\n`);
    },
  };
}

async function validateAuthor(dependencies: PublishSystemNoticeCliDependencies): Promise<number> {
  const validation = await dependencies.validateAuthor();
  if (!validation.ok) {
    dependencies.stderr(`ERROR ${validation.error.code}: ${validation.error.message}`);
    return 1;
  }
  dependencies.stdout(`AUTHOR_VALID ${validation.role}`);
  return 0;
}

async function publish(
  command: Extract<ParsedCommand, { readonly command: "publish" }>,
  dependencies: PublishSystemNoticeCliDependencies,
): Promise<number> {
  if (dependencies.env["GITHUB_ACTIONS"] !== "true") {
    dependencies.stderr("ERROR publish requires GITHUB_ACTIONS=true");
    return 1;
  }
  if (command.deploymentEnvironment !== "Production") {
    dependencies.stderr("ERROR publish requires --deployment-environment Production");
    return 1;
  }
  return buildAndMaybePublish(command, dependencies, "publish");
}

async function buildAndMaybePublish(
  command: Extract<ParsedCommand, { readonly command: "dry-run" | "publish" }>,
  dependencies: PublishSystemNoticeCliDependencies,
  mode: "dry-run" | "publish",
): Promise<number> {
  const versionCheck = await checkReleaseVersion(command, dependencies);
  if (versionCheck === "unchanged") {
    dependencies.stdout("SKIP version_unchanged");
    return 0;
  }
  if (versionCheck === "mismatch") {
    dependencies.stderr("ERROR version-mismatch: head package.json version must match --version");
    return 1;
  }

  const changedPaths = await dependencies.readChangedPaths(command.base, command.head);
  const changelogText = await dependencies.readChangelog();
  const result = buildReleaseNotice({ version: command.version, changedPaths, changelogText });

  if (result.kind === "skip") {
    dependencies.stdout(`SKIP ${result.reason}`);
    return 0;
  }

  dependencies.stdout(`${mode === "dry-run" ? "DRY_RUN" : "READY"} publish ${result.notice.title}`);
  if (mode === "dry-run") return 0;

  const validation = await dependencies.validateAuthor();
  if (!validation.ok) {
    dependencies.stderr(`ERROR ${validation.error.code}: ${validation.error.message}`);
    return 1;
  }

  const publishResult = await dependencies.ensureNotice({ ...result.notice, version: command.version });
  if (!publishResult.ok) {
    dependencies.stderr(`ERROR ${publishResult.error.code}: ${publishResult.error.message}`);
    return 1;
  }

  dependencies.stdout(`PUBLISHED ${publishResult.action}`);
  return 0;
}

async function checkReleaseVersion(
  command: Extract<ParsedCommand, { readonly command: "dry-run" | "publish" }>,
  dependencies: PublishSystemNoticeCliDependencies,
): Promise<"changed" | "mismatch" | "unchanged"> {
  const [baseVersion, headVersion] = await Promise.all([dependencies.readPackageVersionAt(command.base), dependencies.readPackageVersionAt(command.head)]);
  if (baseVersion === headVersion) return "unchanged";
  return headVersion === command.version ? "changed" : "mismatch";
}

async function readChangedPaths(base: string, head: string): Promise<readonly string[]> {
  const { stdout } = await execFileAsync("git", ["diff", "--name-only", "--diff-filter=ACMRTUXB", base, head, "--"], {
    encoding: "utf8",
  });
  return stdout
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function readPackageVersionAt(ref: string): Promise<string> {
  const { stdout } = await execFileAsync("git", ["show", `${ref}:package.json`], { encoding: "utf8" });
  return parsePackageVersion(stdout);
}

function parsePackageVersion(json: string): string {
  const parsed: unknown = JSON.parse(json);
  if (typeof parsed !== "object" || parsed === null || !("version" in parsed)) throw new CliUsageError("package.json version is missing");
  const version = parsed.version;
  if (typeof version !== "string" || !isSafeToken(version)) throw new CliUsageError("package.json version is invalid");
  return version;
}

function parseArgs(
  argv: readonly string[],
): { readonly ok: true; readonly command: ParsedCommand } | { readonly ok: false; readonly error: CliUsageError } {
  const [commandName, ...flags] = argv;
  if (!isCommandName(commandName)) return parseFailure("expected command: validate-author, dry-run, or publish");
  if (commandName === "validate-author") {
    if (flags.length > 0) return parseFailure("validate-author accepts no flags");
    return { ok: true, command: { command: "validate-author" } };
  }

  const options = parseOptions(flags);
  if (!options.ok) return options;
  const source = parseReleaseSource(options.options);
  if (!source.ok) return source;

  if (commandName === "dry-run") {
    if (options.options.deploymentEnvironment !== undefined || options.options.confirmProduction) {
      return parseFailure("dry-run does not accept publish-only flags");
    }
    return { ok: true, command: { command: "dry-run", ...source.source } };
  }
  if (options.options.deploymentEnvironment === undefined) return parseFailure("missing --deployment-environment");
  if (!options.options.confirmProduction) return parseFailure("missing --confirm-production");

  return {
    ok: true,
    command: {
      command: "publish",
      ...source.source,
      deploymentEnvironment: options.options.deploymentEnvironment,
      confirmProduction: true,
    },
  };
}

function parseOptions(
  flags: readonly string[],
): { readonly ok: true; readonly options: ParsedOptions } | { readonly ok: false; readonly error: CliUsageError } {
  let options: ParsedOptions = { confirmProduction: false };
  const seen = new Set<string>();

  for (let index = 0; index < flags.length; index += 1) {
    const flag = flags[index];
    if (flag === undefined) return parseFailure("invalid empty flag");
    if (seen.has(flag)) return parseFailure(`duplicate ${flag}`);
    seen.add(flag);

    if (flag === "--confirm-production") {
      options = { ...options, confirmProduction: true };
      continue;
    }

    const value = flags[index + 1];
    if (value === undefined || value.startsWith("--")) return parseFailure(`missing value for ${flag}`);
    index += 1;

    if (flag === "--version") options = { ...options, version: value };
    else if (flag === "--base") options = { ...options, base: value };
    else if (flag === "--head") options = { ...options, head: value };
    else if (flag === "--deployment-environment") options = { ...options, deploymentEnvironment: value };
    else return parseFailure(`unknown flag ${flag}`);
  }

  return { ok: true, options };
}

function parseReleaseSource(
  options: ParsedOptions,
): { readonly ok: true; readonly source: { readonly version: string; readonly base: string; readonly head: string } } | { readonly ok: false; readonly error: CliUsageError } {
  if (options.version === undefined) return parseFailure("missing --version");
  if (options.base === undefined) return parseFailure("missing --base");
  if (options.head === undefined) return parseFailure("missing --head");
  if (!isSafeToken(options.version)) return parseFailure("invalid --version");
  if (!isSafeGitRef(options.base)) return parseFailure("invalid --base");
  if (!isSafeGitRef(options.head)) return parseFailure("invalid --head");
  return { ok: true, source: { version: options.version, base: options.base, head: options.head } };
}

function isCommandName(value: string | undefined): value is CommandName {
  return commands.some((command) => command === value);
}

function isSafeToken(value: string): boolean {
  return /^[0-9A-Za-z][0-9A-Za-z.+_-]*$/u.test(value);
}

function isSafeGitRef(value: string): boolean {
  return !value.startsWith("-") && !/\s/u.test(value) && value.length > 0;
}

function parseFailure(message: string): { readonly ok: false; readonly error: CliUsageError } {
  return { ok: false, error: new CliUsageError(message) };
}

function isDirectRun(moduleUrl: string, scriptPath: string | undefined): boolean {
  return scriptPath !== undefined && fileURLToPath(moduleUrl) === scriptPath;
}

if (isDirectRun(import.meta.url, process.argv[1])) {
  runPublishSystemNoticeCli().then((exitCode) => {
    process.exitCode = exitCode;
  });
}
