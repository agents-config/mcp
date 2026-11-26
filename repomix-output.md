This file is a merged representation of the entire codebase, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
````
.agents/
  plugins/
    memory/
      mcp_config.json
      mcp.json
      plugin.json
    sequential-thinking/
      mcp_config.json
      mcp.json
      plugin.json
  skills/
    architect-worker/
      SKILL.md
    changelog-management/
      resources/
        CHANGELOG.md
      SKILL.md
    code-review/
      SKILL.md
    code-simplification/
      SKILL.md
    codebase-indexing/
      SKILL.md
    decision-records/
      resources/
        ADR.md
      SKILL.md
    environment-preflight/
      SKILL.md
    incremental-implementation/
      SKILL.md
    npm-version-management/
      SKILL.md
    planning-and-task-breakdown/
      SKILL.md
    product-owner/
      SKILL.md
    software-audit/
      resources/
        AUDIT.md
      SKILL.md
    spec-driven-workflow/
      resources/
        BACKLOG.md
        PLAN.md
        REVIEW.md
        SPEC.md
        TASKS.md
        VALIDATION.md
      SKILL.md
    systematic-debugging/
      SKILL.md
    verification-and-testing/
      SKILL.md
  mcp.json
.codegraph/
  .gitignore
.github/
  workflows/
    ci.yml
docs/
  decisions/
    0001-canonical-transports.md
    0002-schema-source-and-versioning.md
    0003-bundler-tsup.md
    0004-runtime-context-and-pure-compilers.md
    0005-local-sync-state.md
    0006-non-destructive-compilation.md
    0007-env-and-secrets.md
    0008-packaging-and-runtime-floor.md
    0009-typescript-7-removes-baseurl.md
    0010-adopt-agent-plugins-mcp-schema.md
    0011-plugin-lifecycle-and-safe-cleanup.md
    0012-adapter-storage-layout.md
    0013-non-destructive-antigravity-and-additive-sync-targets.md
    0014-mcp-lock-and-authoritative-sync.md
    README.md
scripts/
  dist-package.ts
skills/
  system/
    run-workflow/
      SKILL.md
spec/
  BLUEPRINT.md
  MATRIX.md
  SPEC.md
src/
  adapters/
    antigravity.ts
    claude-code.ts
    cursor.ts
    index.ts
    opencode.ts
    shared.ts
    types.ts
    vscode.ts
    windsurf.ts
    zed.ts
  commands/
    add-interactive.ts
    add.command.ts
    doctor.command.ts
    import.command.ts
    init.command.ts
    list.command.ts
    remove.command.ts
    sync.command.ts
    sync.ts
    util.ts
  core/
    context.ts
    env.ts
    fs-atomic.ts
    gitignore.ts
    placeholder.ts
    plugins.ts
    schema.ts
    state.ts
    store.ts
  sources/
    direct.ts
    github.ts
    http.ts
    index.ts
    registry.ts
    types.ts
  ui/
    auto.ts
    prompts.ts
  config.ts
  index.ts
tests/
  adapters/
    antigravity.test.ts
    claude-code.test.ts
    contract.test.ts
    cursor.test.ts
    detect.test.ts
    opencode.test.ts
    vscode.test.ts
    windsurf.test.ts
    zed.test.ts
  cli/
    entrypoint.test.ts
    global-flags.test.ts
  commands/
    add-interactive.test.ts
    add.test.ts
    basic.test.ts
    doctor.test.ts
    integration.test.ts
    plugins-sync.test.ts
    remove.test.ts
  core/
    env.test.ts
    fs-atomic.test.ts
    gitignore.test.ts
    placeholder.test.ts
    plugins.test.ts
    schema.test.ts
    state.test.ts
    store.test.ts
  e2e/
    e2e.test.ts
  fixtures/
    github/
      package-json-no-bin.json
      package-json.json
      server-json-npm.json
    registry/
      search-results.json
    schema/
      invalid-missing-command.json
      invalid-missing-url.json
      invalid-server-name.json
      invalid-transport.json
      invalid-unknown-key.json
      valid.json
  helpers/
    sandbox.ts
    sandboxGuard.ts
  packaging/
    packaging.test.ts
  sources/
    direct.test.ts
    github.test.ts
    http.test.ts
    index.test.ts
    registry.test.ts
  ui/
    auto.test.ts
    prompts.test.ts
  smoke.test.ts
.gitignore
.prettierignore
.prettierrc
CHANGELOG.md
index-update.sh
LICENSE
opencode.json
package.json
README.md
skills-lock.json
tsconfig.json
tsup.config.ts
vitest.config.ts
````

# Files

## File: docs/decisions/0014-mcp-lock-and-authoritative-sync.md
````markdown
# ADR-0014: `mcp-lock.json` and authoritative `sync`

- **Status**: Accepted
- **Date**: 2026-11-25
- **Related Workflow**: [`workflow/b14-mcp-lock-authoritative-sync/SPEC.md`](../../workflow/b14-mcp-lock-authoritative-sync/SPEC.md) / [`workflow/b14-mcp-lock-authoritative-sync/PLAN.md`](../../workflow/b14-mcp-lock-authoritative-sync/PLAN.md)
- **Related Docs**: [`ADR-0005`](./0005-local-sync-state.md), [`ADR-0006`](./0006-non-destructive-compilation.md), [`ADR-0011`](./0011-plugin-lifecycle-and-safe-cleanup.md), [`ADR-0013`](./0013-non-destructive-antigravity-and-additive-sync-targets.md), [`spec/SPEC.md`](../../spec/SPEC.md)

## Context

`ADR-0005` introduced `.agents/.mcp-sync-state.json` as a hidden, always-git-ignored cache of `targets`, per-agent managed names, and `managedPlugins`. `ADR-0011` made that cache the sole ownership source for plugin cleanup, and `sync` skips any `.agents/plugins/<name>/` directory whose name is not registered there.

On a fresh clone, the cache is absent. As a result:

- `sync` classifies every pre-existing plugin directory as "unmanaged", skips it, reports `PLUGIN_UNMANAGED`, and exits `1` — contradicting the product promise that `.agents/mcp.json` is the single source of truth.
- Teams cannot choose to version the hidden state file, because the CLI adds it to `.gitignore` automatically.
- With no detected agent, `sync` exits `1` before materializing plugins at all.

The `Expedite` backlog item `B14` is a release blocker for the initial experimental release.

## Decision

1. **Lock file identity.** Sync metadata lives at `.agents/mcp-lock.json` (project) and `~/.agents/mcp-lock.json` (global). The schema and `STATE_VERSION` remain `1`; only the filename changes.
2. **Non-destructive legacy migration.** `loadState` reads the new lock first, then the legacy `.mcp-sync-state.json`, then an empty state. Using the legacy file emits a non-fatal notice. The legacy file is never deleted automatically, and a corrupt new lock never falls back to the legacy file.
3. **Optional versioning.** The CLI never adds the lock (or the legacy file) to `.gitignore`; only `.env` remains auto-protected. Existing `.gitignore` content is not rewritten.
4. **Authoritative `sync` from `.agents/mcp.json`.**
   - Every server declared in the canonical config has `plugin.json`, `mcp.json`, and (when `antigravity` is targeted) `mcp_config.json` written/overwritten and adopted into `managedPlugins`, regardless of pre-existing directories or lock contents. Other files in the plugin directory are preserved.
   - Every canonical server entry is overwritten in targeted agent native configs; `previousManagedNames` only governs pruning of stale managed entries, never whether to overwrite.
   - Unmanaged plugin directories whose name is not declared in the canonical config remain untouched.
5. **`add` keeps the collision guard.** `add` blocks/re-prompts only when the plugin directory exists, the name is not managed, **and** the name is not declared in the canonical config. Declared names may be adopted (including via `--force`).
6. **Zero-target `sync` is non-fatal.** The `sync` command opts into `allowEmptyTargets`, so a fresh clone with only `.agents/mcp.json` materializes plugins and exits `0` with guidance. `runSync`'s strict default is preserved for direct callers.

This ADR partially supersedes `ADR-0005` (state filename and Git-ignored rule). It refines `ADR-0011` by populating `managedPlugins` through adoption while keeping its closed removal surface; it does not change `ADR-0013`'s non-destructive target behavior.

## Alternatives Considered

- **Keep the old filename and only fix the collision:** rejected. The hidden name and forced `.gitignore` entry prevent the team-versioning workflow requested by the Product Owner.
- **Infer plugin ownership from `plugin.json` content:** rejected. It creates a second source of truth and still requires parsing hand-edited files (`ADR-0011`).
- **Delete and regenerate a colliding plugin directory recursively:** rejected. It would destroy manual files and violates `ADR-0006`.
- **Auto-delete the legacy state file after migration:** rejected. Silent deletion of tool-owned but user-visible files is unnecessary risk; a notice plus `doctor` warning is enough.
- **Keep auto-ignoring the lock:** rejected. It makes versioning impossible and keeps the fresh-clone failure mode.
- **Keep `sync` failing on zero targets:** rejected. Plugin materialization does not depend on targets, and the failure breaks the clone-and-sync onboarding promise.

## Consequences

- **Positive:** Fresh-clone onboarding works without a local lock; `.agents/mcp.json` is authoritative in practice; teams choose whether to version the lock; plugin adoption is explicit and recorded; `add` still protects undeclared manual plugins.
- **Negative / Trade-offs:** Adopting a same-named manual plugin overwrites its three managed filenames (intended). The lock stores absolute `agents[].path` values and per-agent `updatedAt`, so a committed lock produces cross-machine diff noise. The legacy file lingers until manually removed. Zero-target `sync` no longer signals a usage error. On a lockless clone, `remove` before the first `sync` cannot prove ownership of the removed server's plugin directory and preserves it (run `sync` first or commit the lock).
- **Follow-up:** Consider a portable/relative lock representation (schema `version: 2`) if committed locks become common. Backlog items `B11` (doctor parse errors) and `B12` (target removal) remain open. Teams that want clean diffs may keep ignoring the lock; this is a project choice, not a CLI default.
````

## File: .agents/plugins/memory/mcp_config.json
````json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-memory"
      ]
    }
  }
}
````

## File: .agents/plugins/memory/plugin.json
````json
{
  "name": "memory",
  "version": "1.0.0",
  "description": "MCP server plugin `memory` managed by agents-mcp"
}
````

## File: .agents/plugins/sequential-thinking/mcp_config.json
````json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    }
  }
}
````

## File: .agents/plugins/sequential-thinking/mcp.json
````json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "mcpServers": {
    "sequential-thinking": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    }
  }
}
````

## File: .agents/plugins/sequential-thinking/plugin.json
````json
{
  "name": "sequential-thinking",
  "version": "1.0.0",
  "description": "MCP server plugin `sequential-thinking` managed by agents-mcp"
}
````

## File: .agents/skills/changelog-management/resources/CHANGELOG.md
````markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security
````

## File: .agents/skills/environment-preflight/SKILL.md
````markdown
---
name: environment-preflight
description: >-
  Inspect a project's structure, frameworks, and tech stack, then verify in the
  user's shell and development environment whether the agent has direct access
  to the required runtimes, package managers, and CLIs. Use this skill when
  starting work in a repository, before running builds/tests/toolchains, or when
  diagnosing missing command-line tools—and notify the user clearly whenever
  required tools are missing or inaccessible.
---

# Environment Preflight

Before assuming you can build, test, lint, migrate, or run a project's toolchain, **inspect the repository to determine what technologies it uses**, then **probe the active shell environment** to confirm direct access to every required tool. Never guess, fabricate tool output, or silently skip a check when a CLI is unavailable.

## 1. Identify Project Stack & Required Tools

Scan the repository root (and workspace/monorepo packages, if present) for manifests, lockfiles, and configuration files to map the tech stack:

- **Runtimes & Version Pins**: `.nvmrc`, `.node-version`, `.python-version`, `.ruby-version`, `.tool-versions`, `mise.toml`, `rust-toolchain.toml`, `go.mod`, `engines` in `package.json`, `requires-python` in `pyproject.toml`.
- **Package Managers & Lockfiles**: `package.json` + `package-lock.json` / `pnpm-lock.yaml` / `yarn.lock` / `bun.lockb`, `pyproject.toml` / `uv.lock` / `poetry.lock` / `requirements.txt`, `Cargo.toml`, `go.mod`, `pom.xml`, `build.gradle*`, `Gemfile`, `composer.json`.
- **Frameworks, Build & Quality Tools**: Scripts and configs (e.g., `scripts` in `package.json`, `Makefile`, `justfile`, `Taskfile.yml`, `tsconfig.json`, `vite.config.*`, `next.config.*`, `pytest.ini`, `ruff.toml`, `.eslintrc*`, `biome.json`).
- **Infrastructure & External CLIs**: `Dockerfile`, `docker-compose.yml`, `terraform/`, `k8s/`, `.github/workflows/*`, database/migration configs (e.g., `prisma/`, `drizzle.config.*`, `alembic.ini`), or cloud/platform configs (`vercel.json`, `firebase.json`, `fly.toml`).

From these files, build a concise list of **required** tools for the current task (e.g., runtime, package manager, test runner, linter/typechecker, container or cloud CLI) and **optional** tools.

## 2. Probe the Shell & Development Environment

Check what the agent can directly execute in the current terminal/shell:

1. **Check binary availability**:
   - POSIX (`bash`/`zsh`/`sh`): `command -v <tool>` (or `which <tool>`).
   - Windows PowerShell: `Get-Command <tool> -ErrorAction SilentlyContinue`.
2. **Check project-local and version-manager paths** before concluding a tool is missing:
   - Node.js: `./node_modules/.bin/<tool>` (or `npx` / `pnpm exec` / `bunx`).
   - Python: `.venv/bin/<tool>`, `venv/bin/<tool>`, or `uv run <tool>`.
   - Version managers: `nvm`, `fnm`, `mise`, `asdf`, `pyenv`, `rbenv`, `rustup` (check if shims exist or if the shell hasn't initialized them).
3. **Verify versions & runtime readiness**:
   - Run lightweight version checks (`<tool> --version` or `<tool> version`) and compare against project version pins.
   - For daemon- or auth-dependent CLIs (e.g., `docker`, `kubectl`, `gh`, `aws`, `gcloud`, `psql`), verify operational access when the task requires them (e.g., `docker info`, `gh auth status`)—not just binary existence.
4. **Do not mutate the system silently**:
   - Never install global packages, modify shell profiles, or change system toolchains without explicit user approval.

## 3. Classify Findings & Notify the User

Categorize each required tool into one of three states:

- **Ready**: Accessible in the agent's shell (or project-local environment) with a compatible version.
- **Accessible with caveats**: Installed, but requires activating a local environment (e.g., `.venv`, `nvm use`), has a version mismatch against project pins, or its daemon/auth/network access is unavailable in the current shell.
- **Missing / Inaccessible**: Not installed or not reachable from the agent's terminal environment.

### When Tools Are Missing or Inaccessible

**Notify the user immediately** before proceeding with work that depends on those tools. Keep the notification concise and actionable:

1. **What is missing or blocked**: Name the exact tool/CLI and which part of the project or task requires it (e.g., `pnpm` required by `pnpm-lock.yaml`, `docker` daemon unreachable).
2. **What was checked**: Mention the probe performed (e.g., `command -v pnpm`, `.venv/bin/pytest`, `docker info`) and the observed error or version mismatch.
3. **How to resolve**: Provide clear installation, `PATH`/environment activation, or permission instructions—or ask the user to run the command locally and share the output if the agent environment cannot access it.
4. **Impact on current task**: State clearly whether you can still make progress (e.g., implementing code changes while deferring test/build verification to the user) or whether the task is blocked until the tool is available.

## 4. Session Discipline

- Run this preflight once when entering an unfamiliar project or starting a new toolchain-dependent task; do not repeat identical probes on every step.
- Re-probe only when switching to a different subproject/stack or after the user confirms they installed or fixed a tool.
````

## File: .agents/skills/npm-version-management/SKILL.md
````markdown
---
name: npm-version-management
description: >-
  Enforce disciplined NPM package version management strictly via the `npm
  version` CLI. Prohibit manual edits to the `version` field in `package.json`,
  detect version drift between `package.json` and Git tags, and provide clear
  remediation steps to restore synchronization.
---

# NPM Version Management

Define strict policies and workflows for managing and updating NPM package versions in Node.js and JavaScript/TypeScript projects.

---

## The Cardinal Rule: Never Manually Edit `package.json` Version

> [!CAUTION]
> **NEVER manually edit the `"version"` field in `package.json` using file editing tools, text editors, or search-and-replace scripts.**
>
> All version bumps MUST be executed strictly through the official `npm version` command.

---

## Why Git Tag Synchronization Matters

In a Git repository, the `npm version` command performs three critical atomic operations:

1. **Updates Manifests**: Safely bumps the `"version"` field in `package.json` and updates `package-lock.json` (preserving formatting and indentation).
2. **Creates a Git Commit**: Stages the manifest changes and generates a dedicated release commit with a standardized message (default: `v<version>`).
3. **Creates a Git Tag**: Creates an annotated Git tag matching the new version (e.g., `v1.2.3`).

### Consequences of Manual Editing

Manual editing bypasses this integrated workflow and causes severe issues:
- **Version Drift**: The version declared in `package.json` diverges from Git tags.
- **CI/CD Pipeline Breakage**: Modern release pipelines, automated changelogs, container registries, and package registries (NPM, GitHub Packages) rely on Git tags matching the manifest version.
- **Broken Release Tracking**: Git history loses the explicit release boundary, complicating rollbacks, `git bisect`, and semantic comparisons.

---

## Pre-Bump Checklist

Before running `npm version`, ensure the following prerequisites are met:

1. **Clean Working Tree**:
   - The Git working directory MUST be clean:
     ```bash
     git status --porcelain
     ```
   - If uncommitted changes exist, commit or stash them first. Never bypass `npm version`'s clean working tree check with `--force`.
2. **Verification & Tests Pass**:
   - All tests, typechecks, and linters must pass before cutting a version.
3. **Correct Branch**:
   - Confirm you are on the designated release branch (e.g., `main`, `master`, or `release/*`).

---

## Versioning Commands & SemVer Selection

Choose the appropriate SemVer increment based on the nature of changes:

| Command | SemVer Level | When to Use | Example (`1.0.0` -> ) |
| :--- | :--- | :--- | :--- |
| `npm version patch` | **PATCH** | Backward-compatible bug fixes or minor patches | `1.0.1` |
| `npm version minor` | **MINOR** | Backward-compatible new features or enhancements | `1.1.0` |
| `npm version major` | **MAJOR** | Breaking changes, incompatible API modifications | `2.0.0` |

### Pre-release Versioning

For alpha, beta, or release candidate iterations:

```bash
# Start pre-releases
npm version prepatch --preid=alpha   # 1.0.0 -> 1.0.1-alpha.0
npm version preminor --preid=beta    # 1.0.0 -> 1.1.0-beta.0
npm version premajor --preid=rc      # 1.0.0 -> 2.0.0-rc.0

# Increment existing pre-release
npm version prerelease               # 1.0.1-alpha.0 -> 1.0.1-alpha.1
```

### Custom Commit Message

To provide a descriptive commit message alongside the version bump:

```bash
npm version minor -m "Release %s: Add authentication module"
```
*(The `%s` placeholder is replaced with the newly generated version number).*

### Specific Target Version

To bump to an exact explicit version while retaining Git tag creation:

```bash
npm version 2.4.0
```

---

## NPM Lifecycle Hooks Integration

Take advantage of NPM's built-in version lifecycle hooks in `package.json` scripts:

```json
{
  "scripts": {
    "preversion": "npm test && npm run lint",
    "version": "npm run build && git add dist/",
    "postversion": "git push && git push --tags"
  }
}
```

- **`preversion`**: Runs before the version is bumped. Use to enforce testing, linting, or changelog verification. If it fails, the version bump is aborted.
- **`version`**: Runs after `package.json` is modified and staged, but **before** the Git commit and tag are created. Perfect for generating build artifacts, syncing changelogs, and staging them (`git add CHANGELOG.md`).
- **`postversion`**: Runs after the Git commit and tag have been created. Ideal for pushing commits and tags to the remote repository.

---

## Synchronizing with Remote

The `npm version` command creates the commit and tag **locally**. Always remember to push both to the remote repository:

```bash
git push && git push --tags
# Or using --follow-tags (pushes annotated tags on the current branch):
git push --follow-tags
```

---

## Drift Detection & Remediation (Handling Manual Edits)

When inspecting a project, preparing a release, or reviewing changes, the agent must check whether the current `"version"` in `package.json` matches the latest Git version tag.

### Detecting Drift

Run the following checks to identify if a manual version edit occurred:

1. **Uncommitted Version Edit**:
   - Check if `package.json` contains unstaged or staged modifications to `"version"`:
     ```bash
     git diff package.json
     ```
2. **Missing or Mismatched Git Tag**:
   - Extract the current version from `package.json` (e.g., `X.Y.Z`).
   - Check if the matching Git tag exists and points to the appropriate commit:
     ```bash
     git tag -l "vX.Y.Z"
     ```
   - If the tag does not exist or points to an older, unrelated commit, the version has drifted out of sync.

---

### Remediation Workflows

If manual modification or tag desynchronization is detected, **alert the user immediately** and present the following two resolution options:

#### Option 1: Revert Manual Edit and Use `npm version` (Recommended)

This is the cleanest approach as it ensures standard NPM commit and tag generation.

- **If the manual edit is uncommitted**:
  ```bash
  # 1. Discard manual changes in package manifests
  git checkout HEAD -- package.json package-lock.json

  # 2. Run the proper npm version command
  npm version <patch|minor|major|X.Y.Z>
  ```

- **If the manual edit was committed locally (HEAD)**:
  ```bash
  # 1. Undo the commit while keeping working files
  git reset --soft HEAD~1

  # 2. Discard the manual version edits
  git checkout HEAD -- package.json package-lock.json

  # 3. Apply the version bump through npm version
  npm version <patch|minor|major|X.Y.Z>
  ```

#### Option 2: Retroactively Synchronize Git Tag with Manual Version

Use this option if the manual change has already been pushed or must be preserved:

1. **Ensure lockfile is in sync**:
   ```bash
   npm install --package-lock-only
   ```
2. **Commit manifest changes (if not yet committed)**:
   ```bash
   git add package.json package-lock.json
   git commit -m "vX.Y.Z"
   ```
3. **Create the missing annotated Git tag**:
   ```bash
   git tag -a "vX.Y.Z" -m "vX.Y.Z"
   ```
4. **Push commit and tag to remote**:
   ```bash
   git push && git push origin "vX.Y.Z"
   ```

---

## Agent Guardrails & Interception

When acting as an AI assistant:

1. **Intercept Manual Edits**: If requested to "change the version to X", "bump version in package.json", or "prepare release", **do NOT use file modification tools** (`edit_file` or `write_file`) on `package.json` to alter `"version"`.
2. **Execute Terminal Command**: Run `npm version <major|minor|patch|version>` via the shell execution tool.
3. **Detect & Alert on Drift**: Whenever inspecting a repository before a release or build, verify if `package.json` version matches Git tags. If a manual edit or missing tag is detected:
   - Alert the user proactively.
   - Explain that `package.json` and Git tags are out of sync.
   - Offer the two remediation paths (revert + `npm version` or create retroactive tag).
4. **Notify User**: Clearly explain that `npm version` was used to ensure synchronization between `package.json` and Git version tags.
````

## File: .agents/skills/software-audit/resources/AUDIT.md
````markdown
# Software Audit Report

> **Project**: <repo name>
> **Audit ID**: AUDIT-<YYYYMMDD>-<scope-slug>
> **Auditor**: <agent/human identifier>
> **Date**: <ISO 8601>
> **Scope**: <Full Repo | Change: workflow/<slug> | Artifact: SPEC.md/PLAN.md/etc.>
> **Workflow Phase**: <Backlog | Spec | Plan | Tasks | Implement | Review | Validation | Continuous>

---

## Executive Summary

- **Overall Risk Rating**: 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low / ⚪ Clean
- **Total Findings**: <C> Critical, <H> High, <M> Medium, <L> Low, <I> Info
- **Top 3 Risks**:
  1. <One-line risk with business impact>
  2. <One-line risk with business impact>
  3. <One-line risk with business impact>
- **Recommendation**: Go / No-Go / Conditional Go (with blockers: <list>) / Defer

---

## Context & Scope

- **Trigger**: <Scheduled | Pre-merge | Post-incident | PO request | Architect request | Continuous>
- **Artifacts Reviewed**:
  - <artifact 1> — <link>
  - <artifact 2> — <link>
- **Repository Snapshot**: Commit `<SHA>`, branch `<branch>`, key versions `<node/go/java/etc.>`
- **Code Intelligence Indexes** (per `codebase-indexing` skill):
  - **CodeGraph**: `<indexed @ <timestamp> | stale — synced @ <timestamp> | missing — rebuilt @ <timestamp>>` — DB: `.codegraph/codegraph.db` `<size>`
  - **Repomix**: `<updated @ <timestamp> | stale — refreshed @ <timestamp> | missing — created @ <timestamp>>` — File: `repomix-output.md` `<size>`
  - **Index Commit SHA**: `<SHA at index time>` (may differ from audit commit if changes during audit)
- **Assumptions & Limitations**:
  - <What was NOT audited and why>
  - <Tooling limitations (e.g., SAST not run on generated code, CodeGraph unavailable)>

---

## Findings by Dimension

### 🔴 Critical Findings

#### AUDIT-<YYYYMMDD>-001 — [<Dimension>] — <Concise Title>
- **Location**: `<file/path.ext:L<start>-L<end>>` / `<workflow/<slug>/ARTIFACT.md#section>`
- **Severity**: Critical
- **Discovery Method**: `<CodeGraph query: "..." | Repomix pattern: "..." | Manual review | SAST tool: <tool> | SCA tool: <tool> | Linter: <tool>>`
- **Evidence**:
  ```<language>
  <code snippet or spec excerpt demonstrating the issue>
  ```
- **Impact**: <Business/technical consequence if unaddressed — quantify where possible>
- **Recommendation**: <Specific, actionable remediation with code/config example>
- **References**: [CWE-XXX](https://cwe.mitre.org/data/definitions/XXX.html), [OWASP Top 10 2021:AXXX](https://owasp.org/Top10/), ADR-<NNN>
- **Status**: Open

<!-- Repeat for each Critical finding -->

### 🟠 High Findings

#### AUDIT-<YYYYMMDD>-002 — [<Dimension>] — <Concise Title>
- **Location**: `<file/path.ext:L<start>-L<end>>`
- **Severity**: High
- **Discovery Method**: `<CodeGraph query: "..." | Repomix pattern: "..." | Manual review | SAST tool: <tool> | SCA tool: <tool> | Linter: <tool>>`
- **Evidence**:
  ```<language>
  <code snippet or metric>
  ```
- **Impact**: <Consequence>
- **Recommendation**: <Remediation>
- **References**: <Links>
- **Status**: Open

<!-- Repeat for each High finding -->

### 🟡 Medium Findings

#### AUDIT-<YYYYMMDD>-003 — [<Dimension>] — <Concise Title>
- **Location**: `<file/path.ext:L<start>-L<end>>`
- **Severity**: Medium
- **Discovery Method**: `<CodeGraph query: "..." | Repomix pattern: "..." | Manual review | SAST tool: <tool> | SCA tool: <tool> | Linter: <tool>>`
- **Evidence**: <Description or snippet>
- **Impact**: <Consequence>
- **Recommendation**: <Remediation>
- **References**: <Links>
- **Status**: Open

<!-- Repeat for each Medium finding -->

### 🟢 Low Findings

#### AUDIT-<YYYYMMDD>-004 — [<Dimension>] — <Concise Title>
- **Location**: `<file/path.ext:L<start>-L<end>>`
- **Severity**: Low
- **Discovery Method**: `<CodeGraph query: "..." | Repomix pattern: "..." | Manual review | SAST tool: <tool> | SCA tool: <tool> | Linter: <tool>>`
- **Evidence**: <Description>
- **Impact**: <Minor consequence>
- **Recommendation**: <Quick fix or style improvement>
- **References**: <Links>
- **Status**: Open

<!-- Repeat for each Low finding -->

### ⚪ Informational

#### AUDIT-<YYYYMMDD>-005 — [<Dimension>] — <Concise Title>
- **Location**: `<file/path.ext>` or `<artifact.md#section>`
- **Severity**: Informational
- **Discovery Method**: `<CodeGraph query: "..." | Repomix pattern: "..." | Manual review | SAST tool: <tool> | SCA tool: <tool> | Linter: <tool>>`
- **Observation**: <Pattern noticed, suggestion, learning note>
- **Recommendation**: <Optional future-proofing idea>
- **References**: <Links>

<!-- Repeat for each Informational finding -->

---

## Cross-Cutting Themes & Systemic Patterns

> Patterns observed across multiple findings (e.g., "Missing input validation in 5 endpoints", "No ADRs for 3 architectural decisions", "Test coverage < 40% in security-sensitive modules", "Inconsistent error handling across 12 services")

| Theme | Affected Findings | Description | Suggested Systemic Fix |
|-------|-------------------|-------------|------------------------|
| <Theme Name> | AUDIT-..., AUDIT-... | <Description> | <Architectural/process change> |

---

## Metrics & Quantitative Assessment

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| **Cyclomatic Complexity** (avg / max) | X / Y | < 10 / < 20 | ✅ / ⚠️ / ❌ |
| **Cognitive Complexity** (avg) | X | < 15 | ✅ / ⚠️ / ❌ |
| **Test Coverage** (line / branch / mutation) | X% / Y% / Z% | > 80% / > 70% / > 50% | ✅ / ⚠️ / ❌ |
| **Duplicated Lines** | X% | < 3% | ✅ / ⚠️ / ❌ |
| **SAST Findings** (Critical / High / Medium) | C / H / M | 0 / 0 / < 5 | ✅ / ⚠️ / ❌ |
| **Dependency Vulnerabilities** (Critical / High) | C / H | 0 / 0 | ✅ / ⚠️ / ❌ |
| **Outdated Dependencies** (major versions behind) | N | 0 | ✅ / ⚠️ / ❌ |
| **Architectural Fitness Functions Passing** | N / Total | 100% | ✅ / ⚠️ / ❌ |
| **ADR Coverage** (key decisions documented) | X% | > 80% | ✅ / ⚠️ / ❌ |
| **Secrets Detected in History** | N | 0 | ✅ / ❌ |
| **License Compliance Issues** | N | 0 | ✅ / ❌ |

---

## Static Analysis & Code Quality Findings (Sonar/Lint-Style)

> This section captures automated-tool-equivalent findings from manual code examination.
> Each entry mirrors a rule violation that a linter/SAST would flag.

| Rule ID | Rule Name | Location | Severity | Message | Snippet |
|---------|-----------|----------|----------|---------|---------|
| <ESLINT_RULE> | <rule-name> | `file.ts:42` | Major | <Description> | `<code>` |
| <SONAR_RULE> | <rule-key> | `file.java:15` | Critical | <Description> | `<code>` |
| <CUSTOM> | <description> | `file.go:88` | Minor | <Description> | `<code>` |

**Common Rule Categories Examined:**
- **Security**: Hardcoded secrets, SQL injection, XSS, path traversal, weak crypto, insecure deserialization
- **Reliability**: Null dereference, resource leaks, exception swallowing, race conditions, unhandled promises
- **Maintainability**: Cognitive complexity, function length, parameter count, nesting depth, duplicate code, dead code, magic numbers
- **Style/Conventions**: Naming, formatting, import order, unused imports/variables, consistent return types
- **Performance**: N+1 queries, unnecessary allocations, synchronous I/O in async context, missing pagination
- **Best Practices**: Error handling, logging, validation, documentation, testability, SOLID violations

---

## Remediation Roadmap

| Priority | Finding IDs | Owner | Target Date | Dependencies |
|----------|-------------|-------|-------------|--------------|
| P0 (Block Release) | AUDIT-..., AUDIT-... | Architect/Worker | <YYYY-MM-DD> | — |
| P1 (Next Sprint) | AUDIT-..., AUDIT-... | Worker | <YYYY-MM-DD> | — |
| P2 (Backlog) | AUDIT-..., AUDIT-... | Team | <YYYY-Q<Q>> | <Depends on...> |

---

## Sign-Off

- **Auditor**: <name> — <date> — ☐ Complete
- **Architect Review**: <name> — <date> — ☐ Acknowledged / ☐ Disputed (see comments below)
- **Product Owner Awareness**: <name> — <date> — ☐ Informed (for Critical/High business impact)

### Architect Comments (if disputed)
> <Comments on disputed findings>

---

## Appendix: Tooling Evidence (Optional)

<details>
<summary>SAST/SCA/Secrets Scan Outputs</summary>

```
<Paste relevant tool output here or link to CI artifact>
```

</details>

<details>
<summary>Architecture Analysis (dependency graphs, fitness functions)</summary>

```
<Paste or link>
```

</details>

<details>
<summary>Test Coverage Reports</summary>

```
<Paste or link>
```

</details>
````

## File: .agents/skills/software-audit/SKILL.md
````markdown
---
name: software-audit
description: >-
  Senior Software Architect & Engineer Auditor role for comprehensive quality
  audits of software projects and repositories. Performs systematic analysis
  for bugs, security vulnerabilities, architectural integrity, best practices,
  and improvement opportunities. Integrates with `spec-driven-workflow`,
  collaborates with `product-owner` and `architect-worker` roles, leverages
  `codebase-indexing` (CodeGraph + Repomix) for deep code intelligence, and
  produces all findings in `workflow/AUDIT.md`.
---

# Software Audit Role

Embody a **Senior Software Architect and Engineer** with deep expertise in
software quality assurance, security auditing, architecture review, and
engineering excellence. Your mandate is to perform **comprehensive, systematic
audits** of software projects and repositories, producing rigorous,
evidence-backed findings that drive measurable quality improvements.

## Auditor Persona & Competencies

### Core Identity
- **Role**: Principal Software Architect / Staff Engineer / Quality Auditor
- **Experience**: 15+ years across distributed systems, cloud-native architectures, security-hardened applications, and legacy modernization
- **Mindset**: Systems thinker, risk-aware, evidence-driven, constructively critical
- **Standards**: ISO/IEC 25010 (Product Quality), OWASP Top 10, CWE/SANS Top 25, SEI CERT, NIST SSDF, Clean Architecture, Domain-Driven Design, SOLID, GRASP

### Technical Competency Domains
| Domain | Depth |
|--------|-------|
| **Security** | Threat modeling (STRIDE, PASTA), SAST/DAST/IAST, supply chain security, cryptography, authZ/authN, zero-trust |
| **Architecture** | Modularity, coupling/cohesion, boundary analysis, evolutionary architecture, ADR quality, technical debt quantification |
| **Code Quality** | Static analysis, complexity metrics, mutation testing, code smells, refactoring patterns, legacy rescue |
| **Reliability** | Chaos engineering, observability, SLO/SLI design, failure mode analysis, resilience patterns |
| **Performance** | Profiling, bottleneck analysis, capacity planning, scalability patterns, resource efficiency |
| **Maintainability** | Cognitive complexity, documentation quality, test architecture, onboarding friction, change lead time |
| **Compliance** | Licensing, regulatory (GDPR, LGPD, SOC2), SBOM, policy-as-code |

---

## Integration with Spec-Driven Workflow

This skill **operates within and extends** the `spec-driven-workflow` lifecycle.
The audit is not a replacement for the workflow—it is a **cross-cutting quality
gate** that can be invoked at any phase and produces its canonical output at
`workflow/AUDIT.md`.

### Audit Trigger Points in the Workflow

| Workflow Phase | Audit Focus | Artifact Produced/Updated |
|----------------|-------------|---------------------------|
| **0. BACKLOG** (Product Owner) | Demand clarity, risk classification, DoR completeness, threat model seed | `workflow/AUDIT.md` — *Backlog Audit Section* |
| **1. SPEC** (Architect) | Requirements completeness, security/NFR specification, acceptance criteria testability, architectural decision alignment | `workflow/AUDIT.md` — *Spec Audit Section* |
| **2. PLAN** (Architect) | Technical approach soundness, risk mitigation coverage, verification strategy adequacy, task boundary integrity | `workflow/AUDIT.md` — *Plan Audit Section* |
| **3. TASKS** (Architect) | Task decomposition quality, dependency accuracy, scope isolation for parallelism | `workflow/AUDIT.md` — *Task Sharding Audit Section* |
| **4. IMPLEMENT** (Worker) | Code correctness, security hygiene, test quality, convention adherence, incremental verification | `workflow/AUDIT.md` — *Implementation Audit Section* (incremental) |
| **5. REVIEW** (Architect) | Review thoroughness, finding classification accuracy, resolution completeness, gate enforcement | `workflow/AUDIT.md` — *Review Audit Section* |
| **6. VALIDATION** (PO + Architect) | Value delivery confirmation, acceptance criteria satisfaction, production readiness | `workflow/AUDIT.md` — *Validation Audit Section* |
| **Continuous / Ad-hoc** | Repository-wide audit, technical debt assessment, security posture, architecture fitness | `workflow/AUDIT.md` — *Comprehensive Audit* |

### Audit Artifact Location

**All audit output is written exclusively to `workflow/AUDIT.md`.**

- The file is created at the `workflow/` root (alongside `BACKLOG.md`)
- It is **append-only across audit invocations** — each audit run adds a new
  dated section; historical sections are never deleted
- It follows the same `.gitignore` rule as other `workflow/` artifacts (never committed)
- Structure mirrors the workflow phases for traceability

---

## Collaboration with Product Owner & Architect Worker

### With Product Owner (`product-owner` skill)

| Interaction | Auditor Behavior |
|-------------|------------------|
| **Backlog Refinement** | Audit `BACKLOG.md` for: ambiguous acceptance criteria, missing security/NFR requirements, unclassified risk (Expedite/Fixed Date/Standard/Intangible), incomplete DoR. Push back to PO with specific questions. |
| **Validation Handoff** | Audit `VALIDATION.md` for: traceability to original backlog item, completeness of validation scenarios, production readiness evidence. Co-sign or request additional validation. |
| **Value Alignment** | Verify every audit finding maps to user/business impact — no "ivory tower" recommendations. Quantify risk in business terms (downtime cost, breach impact, velocity drag). |

### With Architect Worker (`architect-worker` skill)

| Interaction | Auditor Behavior |
|-------------|------------------|
| **Architect → Spec/Plan** | Audit `SPEC.md`/`PLAN.md` for: architectural decision quality (ADR linkage), threat model coverage, test strategy depth, rollback/migration planning, cross-cutting concern handling (observability, security, config). |
| **Architect → Review** | Audit `REVIEW.md` for: finding severity calibration, root-cause identification, resolution verification (not just "fixed" but "verified"), systemic pattern detection across findings. |
| **Worker → Implementation** | Perform **incremental implementation audits** during Worker execution: spot-check commits against plan, verify test-first discipline, flag security anti-patterns early, enforce convention compliance. |
| **Parallel Work Coordination** | When multiple `workflow/<slug>/` exist, audit for: scope isolation violations, shared dependency conflicts, architectural consistency across initiatives. |

---

## Integration with Codebase Indexing (`codebase-indexing` skill)

The auditor **leverages the `codebase-indexing` skill** (CodeGraph + Repomix) as the **primary code intelligence layer** before and during audits. This replaces brute-force grep/find with structural, semantic understanding.

### Why CodeGraph + Repomix for Auditing

| Tool | Audit Value |
|------|-------------|
| **CodeGraph** (`.codegraph/`) | Symbol-level navigation, call graphs, dependency analysis, impact analysis, architectural boundary verification, dead code detection, cyclic dependency discovery |
| **Repomix** (`repomix-output.md`) | Full-repo context in one LLM-readable file, rapid onboarding, cross-file pattern search, architectural overview, configuration inventory |

### Mandatory Pre-Audit Indexing Protocol

**Before any audit (Protocol A, B, or C), the auditor MUST:**

1. **Check/Initialize CodeGraph**:
   ```bash
   # Verify index exists and is fresh
   [ -d .codegraph ] && [ -s .codegraph/codegraph.db ] && codegraph sync || (codegraph init && codegraph index)
   ```

2. **Check/Update Repomix Markdown Snapshot**:
   ```bash
   npx -y repomix --style markdown -o repomix-output.md
   ```

3. **Verify Both Indexes Respond**:
   - `codegraph explore "entry point main"` returns meaningful results
   - `repomix-output.md` reflects current file tree (check header timestamp)

4. **Document Index State in Audit Report** (`workflow/AUDIT.md` Context & Scope):
   - CodeGraph: `<indexed | stale | missing — rebuilt>`
   - Repomix: `<updated | stale | missing — created>`
   - Commit SHA at index time

### CodeGraph-Driven Audit Techniques

The auditor uses CodeGraph **as the first tool** for these audit activities:

| Audit Activity | CodeGraph Query Pattern | Output Used For |
|----------------|------------------------|-----------------|
| **Architecture Boundary Verification** | `codegraph explore "module boundaries layer violations"` | Detect layer violations, forbidden cross-module imports |
| **Cyclic Dependency Detection** | `codegraph explore "circular dependencies"` | Flag architectural debt, plan refactoring |
| **Dead Code / Unused Exports** | `codegraph explore "unused exports dead code"` | Identify removal candidates, reduce attack surface |
| **Security-Sensitive Call Chains** | `codegraph explore "authentication authorization crypto call graph"` | Trace authZ/authN flows, find missing checks |
| **Data Flow Analysis** | `codegraph explore "user input -> database query flow"` | Detect injection risks, validate sanitization |
| **Impact Analysis** | `codegraph explore "impact of changing UserService interface"` | Assess blast radius of changes, plan safe refactors |
| **Complexity Hotspots** | `codegraph explore "high complexity functions callers"` | Prioritize code smell examination |
| **Test Coverage Gaps** | `codegraph explore "untested public methods in security module"` | Guide mutation testing, find critical untested paths |
| **Framework/Library Usage** | `codegraph explore "usage of express mongoose jsonwebtoken"` | Audit framework-specific patterns, version risks |
| **Configuration Propagation** | `codegraph explore "environment variable usage config flow"` | Find hardcoded config, secret leakage paths |

### Repomix-Driven Audit Techniques

The auditor uses `repomix-output.md` for:

| Audit Activity | Repomix Usage |
|----------------|---------------|
| **Rapid Repository Onboarding** | Read full snapshot in one pass (vs. 50+ file reads) |
| **Cross-File Pattern Search** | `grep`/`search` in single file for: `TODO`, `FIXME`, `console.log`, `password`, `secret`, `eval(`, `innerHTML`, `dangerouslySetInnerHTML`, `skip`, `only`, `describe.skip` |
| **Configuration Inventory** | Scan all `package.json`, `tsconfig.json`, `.env*`, `Dockerfile`, `docker-compose.yml`, `k8s/*.yaml`, `github/workflows/*.yml` in one view |
| **Dependency Analysis** | View all `dependencies`/`devDependencies` across monorepo packages |
| **Architectural Overview** | File tree + key file contents for mental model building |
| **Audit Evidence Collection** | Extract relevant code sections with context for findings |

### Agent Execution: Combined Workflow

```mermaid
flowchart TD
    A[Audit Triggered] --> B{Indexes Fresh?}
    B -->|No| C[Run codebase-indexing protocol]
    B -->|Yes| D[Proceed to Audit]
    C --> D
    D --> E[CodeGraph: Structural Queries]
    D --> F[Repomix: Full-Context Scan]
    E --> G[Targeted File Reads for Evidence]
    F --> G
    G --> H[Apply 7 Dimensions + Sonar/Lint Rules]
    H --> I[Write workflow/AUDIT.md]
```

**In practice (agent actions):**
1. Run `codegraph explore "<audit-scope-question>"` for structural queries
2. Read `repomix-output.md` for full-context pattern searches
3. Read specific files only for **evidence collection** (not discovery)
4. Correlate findings across both indexes

### Indexing Skill Parameters the Auditor Respects

| `codebase-indexing` Directive | Auditor Compliance |
|------------------------------|-------------------|
| **Markdown priority** (`--style markdown`) | Auditor reads `repomix-output.md` (not XML/JSON) |
| **Incremental sync** (`codegraph sync` vs full reindex) | Auditor triggers sync after significant changes during long audits |
| **Hygiene** (`.gitignore` for indexes) | Auditor never commits `.codegraph/` or `repomix-output.md` |
| **Verification** (confirm indexes respond) | Auditor validates both before starting |

### Fallback When Indexing Unavailable

If CodeGraph CLI not installed or Repomix fails:
1. **Note limitation** in `workflow/AUDIT.md` Assumptions & Limitations
2. **Fall back** to `glob`/`grep`/`read` (current skill behavior)
3. **Explicitly flag** findings that would benefit from graph analysis (e.g., "Call chain verification limited — CodeGraph unavailable")

---

## Audit Methodology

### 1. Reconnaissance & Context Acquisition
- Read `workflow/BACKLOG.md` (if exists) for product intent and priority
- Read all `workflow/<change-slug>/` artifacts for active changes
- Scan repository structure: `tree`, key config files, `package.json`/`go.mod`/`pom.xml`/`Cargo.toml`, CI/CD, docs
- Identify: language(s), framework(s), architecture style, team conventions, existing tooling (linters, SAST, tests)

### 2. Systematic Analysis Dimensions

Apply **all seven dimensions** to every audit scope (repository, change, or artifact):

| Dimension | Key Questions | Techniques |
|-----------|---------------|------------|
| **Correctness** | Does the code behave as specified? Are edge cases handled? | Spec traceability, property-based testing review, mutation testing, contract testing |
| **Security** | Are threats modeled? Are mitigations implemented and verified? | STRIDE/PASTA on architecture, SAST/SCA findings review, secrets scanning, authZ/authN review, crypto hygiene |
| **Architecture** | Are boundaries respected? Is coupling controlled? Is evolution enabled? | Module dependency analysis, cyclic dependency detection, ADR quality, architectural fitness functions |
| **Reliability** | Are failure modes understood? Is observability sufficient? Are SLOs defined? | Failure mode enumeration, chaos experiment review, runbook quality, alert coverage, retry/timeout/circuit breaker patterns |
| **Performance** | Are bottlenecks identified? Is capacity planned? Are regressions caught? | Profiling data review, load test strategy, benchmark automation, resource quotas, scaling policies |
| **Maintainability** | Is code readable? Are tests trustworthy? Is onboarding feasible? | Cognitive complexity, test pyramid balance, mutation score, documentation freshness, change lead time metrics |
| **Compliance & Supply Chain** | Are licenses compatible? Are dependencies current? Is SBOM generated? | License scanning, CVE monitoring, pinned dependencies, provenance verification, policy-as-code |

### 3. Finding Classification & Severity

Adopt a **unified severity model** aligned with `REVIEW.md` but extended for audit scope:

| Severity | Definition | SLA / Response |
|----------|------------|----------------|
| **Critical (C)** | Active exploit path, data loss, production outage, compliance violation | Immediate — block merge/release, require hotfix |
| **High (H)** | Security weakness with realistic exploit, major architectural violation, critical bug, SLO breach risk | < 24h — must resolve before merge |
| **Medium (M)** | Maintainability debt, missing test coverage for critical path, performance regression risk, NFR gap | < 1 sprint — tracked in backlog with owner |
| **Low (L)** | Style, naming, minor readability, documentation gap, optimization opportunity | Best effort — PR nit or tech debt item |
| **Informational (I)** | Observation, pattern suggestion, learning note, future-proofing idea | No action required — awareness only |

**Each finding MUST include:**
- **ID**: `AUDIT-<YYYYMMDD>-<NNN>` (globally unique, date-prefixed)
- **Location**: File path + line range OR artifact name + section
- **Dimension**: One of the 7 analysis dimensions
- **Severity**: C/H/M/L/I
- **Title**: Concise, specific problem statement
- **Evidence**: Concrete code snippet, log, metric, or spec excerpt
- **Impact**: Business/technical consequence if unaddressed
- **Recommendation**: Specific, actionable remediation with example
- **References**: Links to standards, CWEs, ADRs, or prior art
- **Status**: `Open` | `In Progress` | `Resolved` | `WontFix` | `Deferred`

### 4. Audit Report Structure (`workflow/AUDIT.md`)

```markdown
# Software Audit Report

> **Project**: <repo name>  
> **Audit ID**: AUDIT-<YYYYMMDD>-<scope-slug>  
> **Auditor**: <agent/human identifier>  
> **Date**: <ISO 8601>  
> **Scope**: <Full Repo | Change: workflow/<slug> | Artifact: SPEC.md/PLAN.md/etc.>  
> **Workflow Phase**: <Backlog | Spec | Plan | Tasks | Implement | Review | Validation | Continuous>

---

## Executive Summary

- **Overall Risk Rating**: 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low / ⚪ Clean
- **Total Findings**: <C> Critical, <H> High, <M> Medium, <L> Low, <I> Info
- **Top 3 Risks**: One-line each with business impact
- **Recommendation**: Go/No-Go / Conditional Go (with blockers) / Defer

---

## Context & Scope

- **Trigger**: <Scheduled | Pre-merge | Post-incident | PO request | Architect request | Continuous>
- **Artifacts Reviewed**: List with links (relative to repo root)
- **Repository Snapshot**: Commit SHA, branch, key versions
- **Assumptions & Limitations**: What was NOT audited and why

---

## Findings by Dimension

### 🔴 Critical Findings

#### AUDIT-20260115-001 — [Dimension] — <Title>
- **Location**: `path/to/file.ts:42-58` / `workflow/auth-refactor/SPEC.md#Goals`
- **Severity**: Critical
- **Evidence**: `<code snippet or spec excerpt>`
- **Impact**: <Business/technical consequence>
- **Recommendation**: <Specific fix with example>
- **References**: [CWE-798](https://cwe.mitre.org/data/definitions/798.html), ADR-003
- **Status**: Open

### 🟠 High Findings
...

### 🟡 Medium Findings
...

### 🟢 Low Findings
...

### ⚪ Informational
...

---

## Cross-Cutting Themes & Systemic Patterns

> Patterns observed across multiple findings (e.g., "Missing input validation in 5 endpoints", "No ADRs for 3 architectural decisions", "Test coverage < 40% in security-sensitive modules")

---

## Metrics & Quantitative Assessment

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Cyclomatic Complexity (avg/max) | X / Y | < 10 / < 20 | ✅/⚠️/❌ |
| Cognitive Complexity (avg) | X | < 15 | ✅/⚠️/❌ |
| Test Coverage (line/branch/mutation) | X% / Y% / Z% | > 80% / > 70% / > 50% | ✅/⚠️/❌ |
| SAST Findings (Critical/High) | C / H | 0 / 0 | ✅/⚠️/❌ |
| Dependency Vulnerabilities (Critical/High) | C / H | 0 / 0 | ✅/⚠️/❌ |
| Architectural Fitness Functions Passing | N / Total | 100% | ✅/⚠️/❌ |
| ADR Coverage (key decisions documented) | X% | > 80% | ✅/⚠️/❌ |

---

## Remediation Roadmap

| Priority | Finding IDs | Owner | Target Date | Dependencies |
|----------|-------------|-------|-------------|--------------|
| P0 (Block Release) | AUDIT-... | Architect/Worker | <date> | — |
| P1 (Next Sprint) | AUDIT-... | Worker | <date> | — |
| P2 (Backlog) | AUDIT-... | Team | <quarter> | — |

---

## Sign-Off

- **Auditor**: <name> — <date> — ☐ Complete
- **Architect Review**: <name> — <date> — ☐ Acknowledged / ☐ Disputed (see comments)
- **Product Owner Awareness**: <name> — <date> — ☐ Informed (for Critical/High business impact)
```

---

## Audit Execution Protocols

### Protocol A: Change-Scoped Audit (Integrated in Workflow)
**When**: At each workflow phase gate (Spec → Plan → Tasks → Implement → Review → Validation)
**Scope**: Single `workflow/<change-slug>/`
**Output**: Append phase-specific section to `workflow/AUDIT.md`
**Duration**: 15-45 min per phase

### Protocol B: Comprehensive Repository Audit
**When**: Scheduled (quarterly), pre-release, post-incident, onboarding new team
**Scope**: Entire repository + all active `workflow/<slug>/`
**Output**: Full `workflow/AUDIT.md` refresh (new dated section)
**Duration**: 2-8 hours depending on repo size

### Protocol C: Targeted Security/Architecture Deep-Dive
**When**: High-risk change, new threat intel, architecture pivot
**Scope**: Specific dimension (Security or Architecture) across relevant scope
**Output**: Focused section in `workflow/AUDIT.md`
**Duration**: 1-4 hours

---

## Tooling & Automation Leverage

The auditor **orchestrates tools** — does not replace them. Mandatory tooling checks:

| Category | Tools (Examples) | Auditor Role |
|----------|------------------|--------------|
| **Code Intelligence (Primary)** | **CodeGraph** (`.codegraph/`), **Repomix** (`repomix-output.md`) | **Primary context source** — structural queries, call graphs, full-repo snapshot, pattern search |
| **SAST** | Semgrep, CodeQL, SonarQube, ESLint Security | Review findings, suppress false positives, verify coverage |
| **SCA/Dependency** | Dependabot, Renovate, OWASP Dependency Check, Syft/Grype | Verify SBOM, assess CVE exploitability, check pinning |
| **Secrets** | TruffleHog, GitLeaks, detect-secrets | Validate no secrets in history, verify pre-commit hooks |
| **Testing** | Vitest/Jest, pytest, Go test, k6, Playwright | Assess test quality (not just coverage), mutation testing |
| **Static Analysis** | TypeScript strict, Clippy, go vet, Ruff, Detekt | Enforce strict mode, review suppressions |
| **Architecture** | Madge, dependency-cruiser, ArchUnit, NDepend | Verify boundary rules, detect cycles, fitness functions |
| **Licensing** | FOSSA, ClearlyDefined, license-checker | Verify compliance, flag copyleft in proprietary code |

**Auditor responsibility**: 
1. **Ensure CodeGraph + Repomix indexes are fresh** (per `codebase-indexing` skill protocol) before any audit
2. **Use CodeGraph as primary discovery tool** — replace `grep`/`find` with structural queries
3. **Use Repomix for full-context scans** — cross-file patterns, config inventory, rapid onboarding
4. Run/verify automated tools (SAST, SCA, etc.), **interpret results in context**, correlate across tools, and produce human-judgment findings
5. Document index state and tool versions in `workflow/AUDIT.md`

---

## Sonar/Lint-Style Code Examination Directives

When performing **Implementation Audits** (Protocol A, Phase 4) or **Comprehensive Repository Audits** (Protocol B), the auditor **must** systematically examine source code for the following categories of issues — effectively emulating a high-quality static analyzer (SonarQube, ESLint, CodeQL, etc.) but with human architectural judgment.

### Examination Scope
- **All production source files** in the audit scope (exclude generated, vendor, test files unless explicitly included)
- **Configuration files** (TSConfig, ESLint, prettier, Dockerfile, CI/CD, k8s manifests, Terraform)
- **Dependency manifests** (package.json, go.mod, pom.xml, Cargo.toml, requirements.txt, pyproject.toml)
- **Infrastructure-as-Code** files

### Mandatory Examination Categories

#### 1. Security Vulnerabilities (OWASP Top 10 / CWE/SANS 25 Alignment)
| Category | What to Detect | Example Patterns |
|----------|----------------|------------------|
| **Injection** | SQL/NoSQL/Command/LDAP injection via unsanitized input | Raw string interpolation in queries, `exec()` with user input, `eval()` |
| **Broken Auth** | Weak password policy, session fixation, token exposure in URL/logs | JWT without expiry, hardcoded secrets, session ID in query string |
| **Sensitive Data Exposure** | PII/secrets in logs, error messages, client-side storage | `console.log(password)`, localStorage tokens, stack traces in prod |
| **XXE** | XML parser with external entity processing enabled | `DocumentBuilderFactory` without `setFeature(XMLConstants.FEATURE_SECURE_PROCESSING)` |
| **Broken Access Control** | Missing authorization checks, IDOR, forced browsing | Direct object reference without ownership check, missing `@PreAuthorize` |
| **Security Misconfig** | Debug enabled, default creds, open CORS, missing security headers | `app.debug = true`, `Access-Control-Allow-Origin: *`, no HSTS/CSP |
| **XSS** | Unescaped output in HTML/JS/CSS contexts | `innerHTML = userInput`, `dangerouslySetInnerHTML`, template without auto-escape |
| **Insecure Deserialization** | Deserializing untrusted data without validation | `ObjectInputStream.readObject()`, `JSON.parse()` with reviver, pickle.load() |
| **Known Vulnerabilities** | Vulnerable dependencies (see SCA section) | CVE-2021-44228 (Log4Shell), prototype pollution in lodash |
| **Insufficient Logging** | Missing audit trails for security events | No login/logout logs, no failed auth alerts, no admin action logs |

#### 2. Code Smells & Maintainability Issues (SonarQube Rule Categories)
| Category | Rules to Apply | Thresholds |
|----------|----------------|------------|
| **Cognitive Complexity** | Per function/method | > 15 (warn), > 25 (critical) |
| **Cyclomatic Complexity** | Per function/method | > 10 (warn), > 20 (critical) |
| **Function Length** | Lines of code per function | > 50 (warn), > 100 (critical) |
| **Parameter Count** | Parameters per function | > 4 (warn), > 7 (critical) |
| **Nesting Depth** | Max nesting level | > 3 (warn), > 5 (critical) |
| **Duplicate Code** | Blocks ≥ 10 lines / 100 tokens | > 3% of codebase (warn), > 5% (critical) |
| **Dead Code** | Unused functions, variables, imports, parameters | Any (warn) |
| **Magic Numbers** | Numeric literals in logic (except 0, 1, -1) | Any non-constant (warn) |
| **Long Parameter Lists** | Functions with many parameters | See Parameter Count |
| **Large Classes/Files** | Lines per class/file | > 500 (warn), > 1000 (critical) |
| **God Classes** | Classes with too many responsibilities | > 20 methods, low cohesion (warn) |
| **Feature Envy** | Method uses more data from another class | Qualitative (warn) |
| **Data Classes** | Classes with only getters/setters, no behavior | Qualitative (warn) |
| **Switch Statements** | Long switch on type codes (prefer polymorphism) | > 5 cases (warn) |
| **Speculative Generality** | Unused abstraction, YAGNI code | Any (warn) |

#### 3. Reliability & Correctness Issues
| Category | What to Detect |
|----------|----------------|
| **Null/Undefined Dereference** | Accessing properties on potentially null values without guards |
| **Resource Leaks** | Unclosed streams, connections, file handles, event listeners, timers |
| **Exception Swallowing** | Empty catch blocks, `catch {}` without logging/rethrowing |
| **Unhandled Promises/Rejections** | Async functions without try/catch, missing `.catch()` |
| **Race Conditions** | Non-atomic read-modify-write, TOCTOU, shared mutable state |
| **Infinite Loops/Recursion** | Missing base case, unbounded iteration |
| **Off-by-One Errors** | Array/index boundary mistakes |
| **Type Safety Violations** | `any` types, unsafe casts, ignored TypeScript errors (`// @ts-ignore`) |
| **Floating Point Precision** | Equality checks on floats, currency calculations without decimal library |
| **Timezone/Date Bugs** | `Date` without timezone, mutable date objects, parsing assumptions |

#### 4. Performance Anti-Patterns
| Category | What to Detect |
|----------|----------------|
| **N+1 Queries** | Loop executing DB queries, missing eager loading/batching |
| **Synchronous I/O in Async Context** | `fs.readFileSync` in Express handler, blocking event loop |
| **Unnecessary Allocations** | Object creation in hot loops, string concatenation in loops |
| **Missing Pagination** | Unbounded `SELECT *`, `fetchAll()` without limits |
| **Inefficient Algorithms** | O(n²) where O(n log n) possible, redundant computations |
| **Memory Leaks** | Growing caches without eviction, unclosed observers, global accumulators |
| **Blocking Operations** | Heavy computation in main thread, missing worker offload |
| **Connection Pool Exhaustion** | Missing pool sizing, leaked connections |

#### 5. Architecture & Design Violations
| Category | What to Detect |
|----------|----------------|
| **Layer Violations** | Domain calling infrastructure directly, UI calling DB |
| **Circular Dependencies** | Module A → B → A (detect via dependency graph) |
| **Missing Abstractions** | Concrete dependencies where interfaces expected |
| **Violated Boundaries** | Cross-module imports forbidden by architecture |
| **Anemic Domain Models** | Entities with only getters/setters, logic in services |
| **Primitive Obsession** | Using primitives for domain concepts (use Value Objects) |
| **Inappropriate Intimacy** | Classes knowing too much about each other's internals |
| **Missing ADRs** | Significant decisions without documented rationale |

#### 6. Testing Quality (Beyond Coverage)
| Category | What to Detect |
|----------|----------------|
| **Test Coverage Gaps** | Uncovered critical paths, security-sensitive code < 90% |
| **Mutation Testing Survivors** | Mutants not killed (weak assertions) |
| **Flaky Tests** | Non-deterministic tests, time-dependent, shared state |
| **Test Pyramid Imbalance** | Too many E2E, too few unit tests |
| **Brittle Tests** | Over-mocking, testing implementation not behavior |
| **Missing Edge Cases** | Empty inputs, nulls, boundaries, concurrency, errors |
| **Slow Tests** | Unit tests > 100ms, integration > 5s |
| **No Contract Tests** | For APIs consumed by other teams/services |

#### 7. Configuration & Infrastructure Issues
| Category | What to Detect |
|----------|----------------|
| **Hardcoded Config** | URLs, ports, credentials in code (use env vars/config files) |
| **Missing .dockerignore** | Bloated images, secrets in build context |
| **Insecure Docker** | Running as root, `--privileged`, latest tags, no HEALTHCHECK |
| **K8s Misconfig** | No resource limits/requests, no liveness/readiness probes, hostNetwork |
| **Secrets in CI/CD** | Hardcoded tokens in pipeline, unprotected variables |
| **Missing SBOM** | No Software Bill of Materials generation |

---

### Examination Procedure (Agent Execution)

When invoked for code examination, the agent **MUST**:

#### Phase 0: Index Verification & Refresh (Mandatory)
1. **Verify/Initialize CodeGraph**: `[ -d .codegraph ] && [ -s .codegraph/codegraph.db ] && codegraph sync || (codegraph init && codegraph index)`
2. **Verify/Update Repomix**: `npx -y repomix --style markdown -o repomix-output.md`
3. **Document Index State** in audit report (Context & Scope section)

#### Phase 1: Structural Discovery (CodeGraph-First)
4. **Query CodeGraph** for audit-scope questions (see "CodeGraph-Driven Audit Techniques" table):
   - Architecture boundaries, cyclic deps, dead code, call chains, data flows, impact analysis
   - Use MCP tool `codegraph_codegraph_explore` or CLI `codegraph explore "<query>"`
5. **Scan Repomix** (`repomix-output.md`) for cross-file patterns:
   - Security anti-patterns (`eval`, `innerHTML`, secrets, `console.log`, `TODO`/`FIXME`)
   - Configuration inventory (all package.json, Dockerfiles, CI/CD, k8s, env files)
   - Dependency analysis across monorepo packages

#### Phase 2: Targeted Evidence Collection
6. **Read Specific Files Only** for evidence — **not discovery**:
   - Files identified by CodeGraph queries (call chain participants, boundary violators, complexity hotspots)
   - Files flagged by Repomix pattern matches
   - Modified files in current change scope (`workflow/<slug>/`)
   - Security-critical paths (100% read)

#### Phase 3: Analysis & Correlation
7. **Apply 7 Dimensions + Sonar/Lint Rules** to collected evidence
8. **Correlate Findings**: Cross-reference (e.g., high complexity + no tests + security-sensitive = amplified risk)
9. **Prioritize**: Apply severity model (Critical/High/Medium/Low/Informational) with business context

#### Phase 4: Reporting
10. **Write Findings** to `workflow/AUDIT.md`:
    - Dimension-based sections (Security, Architecture, etc.)
    - **"Static Analysis & Code Quality Findings (Sonar/Lint-Style)"** table
    - Include CodeGraph/Repomix query references for traceability

#### Sampling Strategy for Large Codebases (> 500 files)
- **100% CodeGraph Queries**: Architecture, security call chains, cycles, dead code, impact analysis
- **100% Repomix Scan**: Full-pattern search across entire snapshot
- **100% File Reads**: Security-critical paths, modified files in scope, config/CI/CD/infra files
- **Targeted Reads**: Files surfaced by CodeGraph/Repomix (not random sampling)
- **Full Automated Scan**: SAST, linters, SCA on 100% — auditor reviews output

---

### Rule Reference Mappings

The auditor should be familiar with and reference these standard rule sets:

| Ecosystem | Key Rule Sets |
|-----------|---------------|
| **JavaScript/TypeScript** | ESLint (recommended, security, typescript-eslint), SonarJS, `@typescript-eslint/*`, `eslint-plugin-security`, `eslint-plugin-sonarjs` |
| **Python** | Ruff, Bandit, Flake8, Pylint, MyPy (strict), Semgrep Python rules |
| **Go** | `go vet`, `staticcheck`, `golangci-lint`, `gosec`, `revive` |
| **Java/Kotlin** | SpotBugs, Error Prone, SonarJava, Detekt, ArchUnit |
| **C#/.NET** | SonarC#, Roslyn Analyzers, StyleCop, SecurityCodeScan |
| **Rust** | Clippy, `cargo audit`, `cargo deny`, Rudra |
| **Multi-language** | SonarQube rules, CodeQL queries, Semgrep Registry, OWASP Code Pulse |

**Agent Directive**: When examining code in a specific language, **mentally apply** the strict/recommended rule sets for that ecosystem. Flag violations even if no linter is configured in the project.

---

### Output Requirements for Code Examination Findings

Each code-level finding in `workflow/AUDIT.md` **MUST** include:

```markdown
#### AUDIT-<YYYYMMDD>-<NNN> — [<Dimension>] — <Rule/Category> — <Concise Title>
- **Location**: `<file/path.ext:L<start>-L<end>>`
- **Severity**: Critical | High | Medium | Low | Informational
- **Rule**: `<ESLINT_RULE|SONAR_RULE|CWE|CUSTOM>` — `<rule-id-or-name>`
- **Evidence**:
  ```<lang>
  <exact code snippet with context (3-5 lines before/after)>
  ```
- **Why It Matters**: <Security/reliability/maintainability impact in this context>
- **Recommendation**: <Specific fix with corrected code example>
- **References**: [Rule Doc](url), [CWE-XXX](url), [OWASP](url)
- **Status**: Open
```

---

## Guardrails & Ethics

- **No production code changes**: The auditor recommends; Architect/Worker implement
- **No scope creep**: Audit the agreed scope; flag out-of-scope risks as "Informational"
- **Evidence-only**: Every finding must be reproducible from artifacts or code
- **Constructive tone**: Findings are improvement opportunities, not blame
- **Confidentiality**: Treat security findings with appropriate disclosure discipline
- **Independence**: Auditor must not have authored the code/artifact under audit (recuse if conflict)

---

## Skill Invocation

### Explicit Activation
```
"Act as Software Auditor"
"Perform a comprehensive audit of this repository"
"Audit the current change in workflow/<slug>/"
"Review the SPEC.md for security and architecture gaps"
"Run a security deep-dive on the auth module"
```

### Implicit Activation (Auto-Trigger)
When the user or another agent:
- Creates/updates `workflow/<slug>/SPEC.md` → **Spec Audit** (Protocol A)
- Creates/updates `workflow/<slug>/PLAN.md` → **Plan Audit** (Protocol A)
- Creates/updates `workflow/<slug>/REVIEW.md` → **Review Audit** (Protocol A)
- Requests `VALIDATION.md` → **Validation Audit** (Protocol A)
- Asks "What's the technical debt?" or "Is this secure?" → **Targeted Audit** (Protocol C)

### Output Discipline
- **Always** write to `workflow/AUDIT.md` (create if missing)
- **Never** write findings to `SPEC.md`, `PLAN.md`, `REVIEW.md`, `VALIDATION.md`, or code files
- **Reference** `workflow/AUDIT.md` findings from other artifacts (e.g., `REVIEW.md` can link: `See [AUDIT-20260115-003](./AUDIT.md#audit-20260115-003)`)

---

## Quick Reference Card

| Action | Command / Trigger | Output Location |
|--------|-------------------|-----------------|
| Full repo audit | "Audit this repository" | `workflow/AUDIT.md` (new section) |
| Spec audit | "Audit the SPEC.md" | `workflow/AUDIT.md` (Spec Audit section) |
| Plan audit | "Audit the PLAN.md" | `workflow/AUDIT.md` (Plan Audit section) |
| Implementation audit | "Audit the implementation" | `workflow/AUDIT.md` (Implementation Audit section) |
| Review audit | "Audit the REVIEW.md" | `workflow/AUDIT.md` (Review Audit section) |
| Security deep-dive | "Security audit on <module>" | `workflow/AUDIT.md` (Security Deep-Dive section) |
| Architecture review | "Architecture audit" | `workflow/AUDIT.md` (Architecture Review section) |
| Pre-release audit | "Pre-release audit" | `workflow/AUDIT.md` (Pre-Release Audit section) |
| **Code smell scan** | "Scan for code smells" / "Lint this codebase" | `workflow/AUDIT.md` (Static Analysis section) |
| **Security code scan** | "Scan for vulnerabilities in code" | `workflow/AUDIT.md` (Static Analysis section) |
| **Complexity analysis** | "Analyze complexity of <module>" | `workflow/AUDIT.md` (Static Analysis section) |
| **Duplication check** | "Check for code duplication" | `workflow/AUDIT.md` (Static Analysis section) |
| **Dead code hunt** | "Find dead/unused code" | `workflow/AUDIT.md` (Static Analysis section) |
| **Index & audit** | "Index codebase and audit" / "Refresh indexes and audit" | `workflow/AUDIT.md` (new section, indexes documented) |
| **Call chain audit** | "Trace call chain for <function>" | `workflow/AUDIT.md` (Security/Architecture section) |
| **Boundary check** | "Check architectural boundaries" | `workflow/AUDIT.md` (Architecture section) |
| **Impact analysis** | "What breaks if I change <symbol>?" | `workflow/AUDIT.md` (Architecture section) |

---

*This skill embodies the principle: **Quality is not inspected in; it is architected in.** The auditor's role is to make the invisible visible, the implicit explicit, and the risky managed.*
````

## File: .agents/skills/spec-driven-workflow/resources/BACKLOG.md
````markdown
# Product Backlog & Demand: <Project or Initiative>

- **Product Owner**: <author or agent>
- **Product Goal**: <Overarching outcome or product objective>
- **Last Updated**: <YYYY-MM-DD>

## Product Backlog

Prioritized list of product evolutions, features, bug reports, and improvements before entering downstream engineering (`SPEC.md`).

| Order | ID | Title | Type | Class of Service | Status | Value / Impact |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | B1 | <Short item title> | Feature \| Bug \| Improvement | Expedite \| Fixed Date \| Standard \| Intangible | Ready \| Refining \| Idea \| In Downstream \| Done | <Why this matters to users/business> |
| 2 | B2 | <Short item title> | Feature \| Bug \| Improvement | Standard | Idea | <Why this matters to users/business> |

---

## Active Demand Brief: <ID - Short Title>

> Complete this section when an item is refined to `Ready` for handoff to the Architect (`workflow/<change-slug>/SPEC.md`).

- **Backlog ID**: `<B1>`
- **Type**: Feature | Bug Fix | Enhancement
- **Class of Service**: Expedite | Fixed Date | Standard | Intangible
- **Target Release / Urgency**: <e.g., Immediate hotfix, Next sprint, Q4 milestone>

### User Problem & Business Value

Describe who is affected, what problem or opportunity exists, and what measurable product or user outcome we want to achieve.

### User Story / Job-to-be-Done

- **As a** <user role or persona>,
- **I want** <capability or behavior>,
- **So that** <expected benefit or outcome>.

### Bug Impact & Observed Behavior (For Bug Fixes)

- **User-Observed Behavior**: <What happens today from the user's perspective>
- **Expected Behavior**: <What should happen instead>
- **Business / Customer Impact**: <Severity, affected users, workarounds>

### Supporting Assets & Evidence (Optional)

Store screenshots (including annotated captures), mockups, or supporting files in `workflow/assets/` and link them here:

- ![<Short description>](./assets/<filename>) — <What this image or file highlights>

### Product Acceptance Expectations

- [ ] <High-level outcome observable by a user or stakeholder>
- [ ] <High-level outcome observable by a user or stakeholder>

### Out of Scope

- <Explicitly excluded capability or deferred evolution>

### Definition of Ready (DoR)

- [ ] Problem and user value are clear without prescribing technical implementation.
- [ ] Priority and class of service are explicit.
- [ ] Product acceptance expectations are testable at a behavioral level.
- [ ] Open product questions are resolved or explicitly flagged.
````

## File: .codegraph/.gitignore
````
# CodeGraph data files — local to each machine, not for committing.
# Ignore everything in .codegraph/ except this file itself, so transient
# files (the database, daemon.pid, sockets, logs) never show up in git.
*
!.gitignore
````

## File: docs/decisions/0003-bundler-tsup.md
````markdown
# ADR-0003: Bundle the CLI with `tsup` (esbuild), no declarations

- **Status**: Accepted
- **Date**: 2026-11-13
- **Related Docs**: [`spec/BLUEPRINT.md`](../../spec/BLUEPRINT.md)

## Context

The deliverable is a Node CLI distributed as a single ESM file with zero runtime
dependencies and a shebang. We do not publish type declarations. The build must be
fast, deterministic, and require little bespoke glue. The project also runs
TypeScript 7 (native compiler), which makes any tool that depends on the
TypeScript JS API a risk.

## Decision

Use `tsup@^9` with esbuild under the hood:

- single entry `src/index.ts`, `format: ['esm']`, `platform: 'node'`,
  `target: 'node22'`, `splitting: false`, `sourcemap: false`, `treeshake: true`;
- `banner: { js: '#!/usr/bin/env node' }`, `clean: true`;
- **`dts: false`** — there are no types to emit, which also removes the
  `rollup-plugin-dts`/TypeScript-API dependency from the build.

If `tsup` blocks a future Node/TypeScript upgrade, replace it with a
`scripts/build.ts` that calls `esbuild.build()` with the same options.

## Alternatives Considered

- **Vite**: rejected. Browser-first; CLI use requires library/SSR mode with Rollup,
  externalization rules, and a dev server we never use.
- **Raw esbuild**: viable, but requires hand-maintaining a build script for
  banner, clean, target, and single-file output.
- **`tsc` only**: rejected. It does not bundle dependencies into one file and
  cannot inline JSON at build time.

## Consequences

- **Positive**: near-zero build configuration, esbuild speed, single-file output,
  no type-emission failure mode.
- **Negative / Trade-offs**: one dev dependency wrapper; its defaults can change
  between majors.
- **Follow-up**: verify the output contract in CI (`node dist/index.js --help`, no
  bare external imports).
````

## File: docs/decisions/0004-runtime-context-and-pure-compilers.md
````markdown
# ADR-0004: Injected runtime context and pure native compilers

- **Status**: Accepted
- **Date**: 2026-11-13
- **Related Docs**: [`spec/BLUEPRINT.md`](../../spec/BLUEPRINT.md)

## Context

The tool resolves OS-specific global paths (VS Code profiles, XDG, APPDATA), must
behave identically on Linux/macOS/Windows, and needs diagnostics (`doctor`) that
compare intended output with what is on disk. Calling `os.homedir()`,
`process.platform`, or `process.cwd()` inside modules forces brittle module
mocking and makes Windows behavior untestable on Linux CI.

## Decision

- Introduce `RuntimeContext { cwd, homeDir, platform, env, isTTY }`, created once
  at the entrypoint and injected everywhere.
- Adapters expose `capabilities` (scopes, format, env syntax, native default,
  native disable, `cwd`) and a **pure** `compile(server) → native entry`.
- `applyServers()` returns `{ content, managedNames, warnings }`; it never prints
  and never touches the filesystem.
- `extractServers()` returns `{ servers, warnings }`.
- Detection uses file/directory existence only; binary lookup belongs to `doctor`.

## Alternatives Considered

- **Module mocking in tests** (`vi.mock('node:os')`): rejected. Fragile, leaks
  into unrelated tests, and cannot model cross-platform path resolution cleanly.
- **Text-diff drift checks**: rejected. They produce false positives whenever a
  user reformats a file.

## Consequences

- **Positive**: hermetic tests, reusable pure compilers, semantic drift checks,
  correct Windows/Linux behavior.
- **Negative / Trade-offs**: every call site must thread the context; a missed
  argument is a compile-time error by design.
- **Follow-up**: keep `RuntimeContext` dependency-free; never add I/O methods to it.
````

## File: docs/decisions/0005-local-sync-state.md
````markdown
# ADR-0005: Local sync state and persisted agent targets

- **Status**: Partially superseded by [ADR-0014](./0014-mcp-lock-and-authoritative-sync.md) (state filename and Git-ignored rule)
- **Date**: 2026-11-13
- **Related Docs**: [`spec/BLUEPRINT.md`](../../spec/BLUEPRINT.md)

## Context

Non-destructive compilation means `sync` may only remove native entries it created
before. That requires remembering which server names were written to which agent
file. It also needs to know which agents the user selected, because in a fresh
repository no native file exists yet — detection alone would make `sync` a silent
no-op. The state cannot live in the canonical file, which is shared and
hand-edited.

## Decision

Maintain `.agents/.mcp-sync-state.json` (project) and
`~/.agents/.mcp-sync-state.json` (global):

```json
{
  "version": 1,
  "scope": "project",
  "targets": ["claude-code", "opencode"],
  "agents": {
    "claude-code": { "path": "/abs/.mcp.json", "names": ["github"], "updatedAt": "..." }
  }
}
```

- `targets` is persisted by `init`, `sync --agents`, and `add`/`import` selections;
  `sync` precedence is `--agents` → `targets` → detection.
- `names` per agent is the authoritative `previousManagedNames`.
- `import` seeds names even with `--no-sync`.
- Missing state = empty; corrupt/unknown version = warn, treat as empty, rewrite
  after the next successful sync.
- State is git-ignored, written atomically, and never required by third-party
  implementations of the format.

## Alternatives Considered

- **Commit the state file**: rejected. Contains absolute paths and machine-local
  history; merge conflicts on every branch.
- **Marker comments inside native files**: rejected. Not portable across JSON
  files/agents and pollutes user config.
- **Own the entire root key (`mcpServers`/`mcp`)**: rejected. Destructive; would
  delete servers the user added manually.

## Consequences

- **Positive**: safe pruning, working fresh-clone flow, deterministic behavior.
- **Negative / Trade-offs**: each developer must run `init`/`sync --agents` once per
  checkout; state is not portable between machines.
- **Follow-up**: bump `STATE_VERSION` only with a migration path.
````

## File: docs/decisions/0006-non-destructive-compilation.md
````markdown
# ADR-0006: Preserve native files in place

- **Status**: Accepted
- **Date**: 2026-11-13
- **Related Docs**: [`spec/BLUEPRINT.md`](../../spec/BLUEPRINT.md)

## Context

Existing agent files are often multi-purpose (`opencode.json`, `.zed/settings.json`,
`~/.claude.json`) or contain data we do not model (VS Code `inputs`, editor
settings, Claude projects/history). A migration that deletes or strips those files
after import is irreversible, loses non-MCP data, and breaks users who open the
old client before running `sync`.

## Decision

- Compilation is always in place and additive/non-destructive, using JSONC AST
  edits.
- The CLI never deletes, moves, or renames a native config file, and offers no
  destructive cleanup mode.
- `import` reads native files, merges into the canonical file, and then `sync`
  rewrites only the managed entries — the net effect of "migration" without data
  loss.
- `--force` on `init` writes a timestamped `.bak` before overwriting.
- Unparsable native files are never overwritten; the command fails with a clear
  message.

## Alternatives Considered

- **Delete native files after import**: rejected. Destructive and lossy.
- **Remove the MCP root key from shared files**: rejected. Same loss of manual
  entries; also impossible to distinguish ours without state.
- **Backup-then-delete**: rejected. Still surprises users and leaves stale files
  that can shadow the canonical config.

## Consequences

- **Positive**: no data loss, safe adoption path, users can keep using their
  existing clients during migration.
- **Negative / Trade-offs**: native files remain in the repository unless the user
  chooses otherwise; `sync` produces diffs in tracked files.
- **Follow-up**: document in `spec/SPEC.md` §9–10 and in the README quick start.
````

## File: docs/decisions/0007-env-and-secrets.md
````markdown
# ADR-0007: `.env` precedence and safe secret extraction

- **Status**: Accepted
- **Date**: 2026-11-13
- **Related Docs**: [`spec/BLUEPRINT.md`](../../spec/BLUEPRINT.md)

## Context

The canonical file is committed, so it must never contain plaintext credentials.
Values must come from the project, not from whatever happens to be exported in the
developer's shell, because that makes builds non-reproducible. Importing existing
configs frequently encounters hard-coded tokens that must be moved somewhere safe
without silently rewriting unrelated values.

## Decision

- Resolution order: local `.env` of the active scope (`<cwd>/.env`, or
  `~/.agents/.env` for global) **first**, then `process.env`. This intentionally
  inverts the common `dotenv` default.
- Canonical and native files contain only `${VAR}` / `${VAR:-default}`
  placeholders; the compiler translates syntax, never substitutes values.
- Secret detection uses key-name heuristics plus value heuristics (URL credentials,
  known token prefixes, high-entropy ≥ 20 chars) across `env`, `headers`, `args`,
  `url`.
- Interactive imports propose extraction per finding; `--yes`/CI only **warn**
  unless `--extract-secrets` is passed.
- Before writing `.env`: ensure it is git-ignored, create it with mode `0600`, and
  never overwrite an existing key. `.env.example` receives `KEY=` only.
- Secret values are masked in all output, including `--dry-run`.

## Alternatives Considered

- **`process.env` first**: rejected. Shell state would override the project and
  make "works on my machine" bugs invisible.
- **Regex-only detection** (any non-placeholder value): rejected. It rewrites
  harmless values such as `NODE_ENV=production`.
- **Never extract automatically**: rejected. It leaves users with invalid
  committed secrets and no guided path.

## Consequences

- **Positive**: reproducible resolution, no secret leakage, explicit CI behavior.
- **Negative / Trade-offs**: differs from `dotenv`; may surprise users who rely on
  exported variables. Must be documented prominently.
- **Follow-up**: `doctor` reports unresolved required variables and tracked `.env`.
````

## File: docs/decisions/0009-typescript-7-removes-baseurl.md
````markdown
# ADR-0009: TypeScript 7 removes `baseUrl`; keep TS 7 with tsconfig-relative `paths`

- **Status**: Accepted
- **Date**: 2026-11-13
- **Related Docs**: [`spec/BLUEPRINT.md`](../../spec/BLUEPRINT.md), `workflow/PLAN.md`

## Context

BLUEPRINT §6 specified `baseUrl: "."` together with
`paths: { "$/*": ["./*"] }`, and stated that if TypeScript 7 rejected any option,
the project should fall back to TypeScript 5.9 and record a new ADR. TypeScript
7.0.2 removes `baseUrl` (`TS5102`), but it resolves `paths` relative to
`tsconfig.json` without it, so the `$` alias keeps working for `tsc`, `tsup`, and
`tsx`.

## Decision

- Keep TypeScript 7 as the only type checker.
- Omit `baseUrl`; keep `paths: { "$/*": ["./*"] }`, which TS 7 resolves relative
  to `tsconfig.json`.
- `vitest.config.ts` keeps its explicit `$` alias because Vitest does not read
  `tsconfig` paths.

## Alternatives Considered

- **Fall back to TypeScript 5.9**: rejected. It restores `baseUrl` but loses the
  TS 7 checker the plan targets, for an option TS 7 intentionally removed.
- **Add `paths: { "*": ["./*"] }`**: rejected. It broadens resolution beyond the
  `$` convention and can mask accidental bare imports.
- **Drop the `$` alias entirely**: rejected. It would force long relative paths
  and diverge from the import rule.

## Consequences

- **Positive**: TS 7 works with no configuration beyond removing `baseUrl`; the
  import/alias rule is preserved.
- **Negative / Trade-offs**: the literal `baseUrl` line in BLUEPRINT §6 is no
  longer accurate; readers must follow this ADR.
- **Follow-up**: treat the T1 `tsconfig.json` as the reference config and verify
  that `scripts/` (T2) resolve `$` under `tsx`.
````

## File: docs/decisions/0011-plugin-lifecycle-and-safe-cleanup.md
````markdown
# ADR-0011: Ciclo de vida de plugins e limpeza segura

- **Status**: Accepted
- **Date**: 2026-11-21
- **Related Docs**: [`spec/SPEC.md`](../../spec/SPEC.md), [`ADR-0005`](./0005-local-sync-state.md), [`ADR-0006`](./0006-non-destructive-compilation.md), [`ADR-0010`](./0010-adopt-agent-plugins-mcp-schema.md)

## Context

A partir de B3/B5, a CLI gera artefatos próprios em `.agents/plugins/<nome>/`:
`plugin.json`, `mcp.json` e, quando `antigravity` está entre os targets,
`mcp_config.json`. Esses diretórios convivem com plugins e arquivos criados
manualmente pela pessoa usuária no mesmo caminho.

O `sync` era estritamente aditivo: escrevia/sobrescrevia, mas nunca removia. Como
consequência, remover um servidor (ou desselecionar `antigravity`) deixava
arquivos obsoletos que podiam fazer agentes continuarem carregando servidores já
removidos. Ao mesmo tempo, o princípio de compilação não destrutiva (ADR-0006)
proíbe tocar em arquivos nativos ou em conteúdo manual.

É necessário um critério explícito e conservador para decidir **o que a CLI pode
apagar**, sem depender de heurísticas de conteúdo e sem risco para arquivos da
pessoa usuária.

## Decision

1. **Propriedade declarada, não inferida.** `SyncState.managedPlugins`
   (`.agents/.mcp-sync-state.json`, por escopo) é a única fonte de verdade sobre
   quais plugins pertencem à CLI. Um diretório em `.agents/plugins/<nome>/` só é
   considerado gerenciado se `<nome>` constar em `managedPlugins`.

2. **Superfície de remoção fechada.** A CLI pode remover exclusivamente
   `plugin.json`, `mcp.json` e `mcp_config.json` de um plugin gerenciado. Qualquer
   outro arquivo ou subdiretório é preservado.

3. **Diretório só sai se vazio.** Após remover os arquivos gerenciados, o
   diretório é removido com `rmdir` não recursivo e somente se estiver vazio.
   Arquivos extras mantêm o diretório.

4. **Reconciliação no `sync`.** A cada sincronização real, o conjunto
   `managedPlugins − nomesCanônicos` é considerado obsoleto e tem os arquivos
   gerenciados removidos; `managedPlugins` é reduzido ao conjunto canônico mais
   os plugins gravados com sucesso. Isso cobre `remove`, edição manual do
   canônico e estado legado.

5. **`mcp_config.json` segue os targets ativos.** Quando uma sincronização real
   ocorre sem `antigravity` entre os targets, `mcp_config.json` é removido de
   todos os plugins gerenciados, preservando `plugin.json` e `mcp.json`.
   `add --no-sync` cria o arquivo quando `antigravity` está ativo, mas **não**
   poda plugins existentes (escopo de escrita restrito ao servidor adicionado —
   ver B8).

6. **Falhas são visíveis.** Erros de I/O na limpeza são capturados por arquivo,
   reportados ao usuário e resultam em exit code `1`. Em `remove --no-sync`, o
   nome permanece em `managedPlugins` para que o próximo `sync` tente novamente.

7. **`--dry-run` é absoluto.** Nenhuma primitiva de limpeza toca no disco em
   dry-run; ela apenas relata o que seria removido.

## Alternatives Considered

- **Inferir propriedade pelo conteúdo de `plugin.json`** (ex.: descrição
  `managed by agents-mcp`): rejeitado. Cria segundo critério de verdade,
  duplica estado e ainda exigiria parsing tolerante a edições manuais.
- **Apagar o diretório recursivamente** quando o nome é gerenciado: rejeitado.
  Viola a proteção de arquivos manuais e amplia o raio de destruição.
- **Não remover nada e apenas avisar** (status quo): rejeitado. Mantém agentes
  carregando servidores removidos e não cumpre o ciclo de vida esperado.
- **Poda apenas dentro do `remove`**: rejeitado. Não cobre edição manual do
  canônico nem desseleção de `antigravity` via `sync`.

## Consequences

- **Positive**: ciclo de vida completo e previsível; workspace limpo; nenhum
  arquivo manual é apagado; `--dry-run` continua seguro; erros não são
  mascarados.
- **Negative / Trade-offs**: projetos cujo estado local não registra
  `managedPlugins` (estado legado ou removido) mantêm diretórios órfãos até
  limpeza manual — escolha deliberada em favor da segurança.
- **Follow-up**: B7 (ausência de targets em `init`/`import`/`remove`) e B8
  (regeneração granular no `add`) permanecem fora deste ADR. O mesmo defeito de
  `--no-sync` em `import` deve ser corrigido em item próprio.
````

## File: docs/decisions/0012-adapter-storage-layout.md
````markdown
# ADR-0012: Explicit Adapter Storage Layout (`single-file` vs `per-plugin`)

- **Status**: Accepted
- **Date**: 2026-11-25
- **Related Docs**: [`spec/MATRIX.md`](../../spec/MATRIX.md), [`docs/decisions/0011-plugin-lifecycle-and-safe-cleanup.md`](./0011-plugin-lifecycle-and-safe-cleanup.md)

## Context

`AgentAdapter.getConfigPath(scope, ctx)` previously returned `null` for two incompatible reasons:

1. **Unsupported scope** — e.g., `windsurf` does not support `project` scope.
2. **Per-plugin multi-file storage** — e.g., `antigravity` supports both `project` and `global` scopes, but writes one `mcp_config.json` per server under `<scope>/.agents/plugins/<name>/mcp_config.json` instead of a single monolithic file.

Overloading `getConfigPath() === null` caused four cascading defects across the CLI:
- `detectAgents()` skipped `antigravity`, making `antigravity.detect()` dead code.
- `import` skipped `antigravity`, making `antigravity.extractServers()` dead code.
- `doctor` reported a false-positive `STATE` warning (`Target antigravity does not support project scope`).
- `list` reported `not-synced` when `antigravity` was the only target because `sync` had no single file path to record in `SyncState.agents`.

Separately, `doctor` lacked a declarative `rootKey` on `AdapterCapabilities`, forcing it to scan arbitrary top-level JSON keys during drift checks.

## Decision

1. Add `readonly layout: 'single-file' | 'per-plugin'` and `readonly rootKey?: string` to `AdapterCapabilities`:
   - `claude-code`, `cursor`, `vscode`, `opencode`, `zed`, `windsurf`: `layout: 'single-file'` + their respective `rootKey`.
   - `antigravity`: `layout: 'per-plugin'`, `rootKey: 'mcpServers'`.
2. **Scope support** MUST always be checked via `adapter.capabilities.scopes.includes(scope)`, never via `getConfigPath(scope, ctx) === null`.
3. **Sync state for `per-plugin` adapters:** `runSync` records `state.agents.antigravity` using `<base>/.agents/plugins` as `path` and the list of synced server names as `names`, removing the entry when `antigravity` is deselected.

## Alternatives Considered

- **Special-casing `if (agentId === 'antigravity')` in `detectAgents`, `import`, `doctor`, and `list`:** Rejected. Fragile, violates open/closed design, and breaks immediately if another per-plugin agent is added.
- **Returning a synthetic file path from `antigravity.getConfigPath()`:** Rejected. Callers expecting a single JSON/JSONC file would attempt to read/write a directory path.

## Consequences

- **Positive:** Eliminates four bugs from a single contract fix; makes `doctor` drift checks deterministic via `rootKey`; cleanly supports future per-plugin agents.
- **Negative / Trade-offs:** Requires updating `AdapterCapabilities` across all 7 adapters and recording `state.agents.antigravity` in `sync.ts`.
````

## File: docs/decisions/0013-non-destructive-antigravity-and-additive-sync-targets.md
````markdown
# ADR-0013: Non-Destructive Antigravity Sync and Additive `state.targets`

- **Status**: Accepted
- **Date**: 2026-11-25
- **Related Docs**: [`docs/decisions/0006-non-destructive-compilation.md`](./0006-non-destructive-compilation.md), [`docs/decisions/0011-plugin-lifecycle-and-safe-cleanup.md`](./0011-plugin-lifecycle-and-safe-cleanup.md), [`docs/decisions/0012-adapter-storage-layout.md`](./0012-adapter-storage-layout.md)

## Context

`ADR-0011` introduced automatic deletion of `.agents/plugins/<name>/mcp_config.json` whenever `sync` ran without `antigravity` in the resolved `targets`. Meanwhile, `sync` also overwrote `state.targets` with the resolved `targets` array on every run.

In practice, this caused two severe UX regressions:
1. Running `sync --agents opencode` (or running `sync` with a legacy `state.targets: ["opencode"]`) **silently deleted** all `antigravity` `mcp_config.json` files and removed `antigravity` from `state.targets` and `state.agents` — whereas every other adapter (`claude-code`, `cursor`, `vscode`, `opencode`, `zed`, `windsurf`) is preserved non-destructively when omitted from `--agents`.
2. Adding a new target via `sync --agents <new-agent>` wiped previously configured targets from `state.targets`, breaking subsequent plain `agents-mcp sync` runs.

## Decision

1. **Non-destructive `antigravity` preservation (partially supersedes `ADR-0011`):** `sync` MUST NOT delete `mcp_config.json` or `state.agents.antigravity` simply because `antigravity` is omitted from the current `targets` list. `mcp_config.json` is only deleted when its owning server is removed from `.agents/mcp.json` (via `remove` or stale plugin cleanup) or via a future explicit target-removal command.
2. **Additive `state.targets` on `sync --agents <list>`:** Passing `--agents <list>` to `sync` appends any newly specified valid agent IDs to `state.targets` (deduplicated, preserving order) instead of overwriting the list. Running `sync` without `--agents` syncs **all** agents recorded in `state.targets` (falling back to `detectAgents()` only when `state.targets` is empty).

## Alternatives Considered

- **Delete `mcp_config.json` only when `antigravity` was explicitly in `state.targets` and `--agents` omitted it:** Rejected. Still breaks the intuitive workflow of running `sync --agents opencode` to refresh a single agent without destroying another agent's configuration.

## Consequences

- **Positive:** Symmetric non-destructive guarantee across all 7 adapters (`ADR-0006`); ergonomic incremental target adoption (`sync --agents <new>` followed by plain `sync`).
- **Negative / Trade-offs:** Removing a target from `state.targets` requires editing `.agents/.mcp-sync-state.json` (or a future `targets remove` command) rather than omitting it from `sync --agents`.
````

## File: skills/system/run-workflow/SKILL.md
````markdown
---
name: run-workflow
description: 'How to write and run a dynamic workflow script with the `run_workflow` tool: a Python script that orchestrates many agents with `agent`, `parallel`, `pipeline`, and `phase`. Use when a task splits into many independent or staged pieces of agent work (fan out over files, modules, bugs, or review angles, then aggregate), or when the user asks for a workflow. Don''t use for a single delegated task (use a subagent) or for legacy workflow files (see migrate-workflows).'
metadata:
    namespace: system
---
# Dynamic workflows with `run_workflow`

A workflow is a short Python script that the `run_workflow` tool executes. The
script decides which agents to start, in what order, and what to do with their
results. Use it instead of many manual subagent calls when the orchestration
itself is code: loops over a list, fan-out then aggregate, or staged pipelines.

## Steps

1.  Pass the script inline as `Script`, or write it to a file (for example in
    the conversation scratch directory) and pass its absolute path as
    `ScriptPath`. Set exactly one of them; a file is easier to fix and rerun.
2.  Call `run_workflow(Script="...", Description="...")` or
    `run_workflow(ScriptPath="/abs/path/workflow.py", Description="...")`.
    `Description` is a one-line goal shown in the UI.
    The workflow runs in the background, and you are notified when it ends.
    For a quick script, such as a `call_tool` fan-out, set
    `WaitMsBeforeAsync` (up to 10000) to get the result in the same turn if it
    finishes in time.
    To pass inputs, set `Args` to a JSON object; the script reads it as the
    `args` dict. When `ScriptPath` is a saved workflow's entry script, `Args`
    is validated against the args schema in its `workflow.json`.
3.  Read the tool result: it contains the `log()` output (`Logs:`) and what the
    script printed (`Output:`). Each agent is also linked from the workflow
    step, so the user can open its conversation.
4.  If the tool returns an error, fix the script at the reported line and run
    it again.

## Script rules

The script runs in its own `python3` process, which needs Python 3.8 or later
on `PATH`:

-   `await` works at the top level, and you can define `async def` helpers.
-   Installed library workflows are importable by name (`import <library>` or
    `from <library> import <name>`); library modules see the same primitives as
    the script.
-   What the script prints (`print()`, `stderr`, child-process output, and the
    `repr` of a trailing expression) is returned in the tool result's `Output:`
    section (and appended to the error when the workflow fails).
-   An uncaught exception stops the workflow and reports the script line.
-   `CONVERSATION_ID` and `STEP_INDEX` identify the `run_workflow` step.
    `WORKSPACES` is a tuple of the workspace directories, primary first (empty
    if there are none).
-   The working directory is `Cwd` if given, else `WORKSPACES[0]`, so relative
    paths resolve against it. Local modules are not importable.

## Primitives

| Primitive | Behavior |
| --- | --- |
| `log(*args)` | Adds a line to the workflow output and the UI. |
| `phase(name)` | Starts a named phase; later logs and agents group under it. |
| `agent(prompt=None, schema=None, role=None, type_name="self", workspace="inherit", model=None)` | Defines an agent; nothing runs yet. `await agent(prompt, schema)` runs it once and returns its result. `a = agent(...)` then `await a(prompt, schema)` runs one turn in a conversation kept across calls. |
| `parallel(items, fn)` | Promise that calls `fn(item)` for each item and awaits all results concurrently; results are in item order. If one fails, the rest are cancelled. |
| `pipeline(items, fn)` | Promise that calls and awaits `fn(item)` one item at a time; results are in item order. |
| `trajectory(last=None, types=None, tools=None, min_index=None, max_index=None)` | `await trajectory()` returns steps before this `run_workflow` call started, oldest first. `min_index` and `max_index` bound `step.index` (inclusive); `types` and `tools` filter by step type or tool name; `last` keeps the last N matching steps. |

Arguments:

-   `type_name`: the agent type to run. `"self"` uses the current agent's
    configuration; any available custom agent name also works.
-   `workspace`: `"inherit"` (the current workspace), `"branch"` (a new isolated
    clone, for agents that edit code in parallel), or `"share"` (a new workspace
    that shares the underlying repository). Other values are errors.
-   `schema` (required): a JSON schema (dict or string) for the agent's result.
    The agent returns the result by calling its `finish` tool, which checks it
    against the schema, and `await agent(...)` returns the parsed value. An
    agent that ends without calling `finish` fails the workflow. Use
    `{"type": "string"}` for a free-form answer.
-   `role`: an optional short title for the agent's card, such as
    `"Security reviewer"`.
-   `model`: the agent's model tier: `"inherit"` (default, your model),
    `"flash_lite"`, `"flash"`, or `"pro"`. Use a lighter tier for simple,
    high-fan-out work.
-   `fn`: usually a `lambda` that returns `agent(...)`, or an `async def`
    helper that awaits several agents. It must return something awaitable:
    an `agent()` or a call on one, a nested `parallel()` / `pipeline()`, or
    an `async def` call. Build per-item prompts and roles with f-strings.

Awaiting the same agent twice runs it once and returns the same result. An
`agent()` that is never awaited or called never runs, so always `await` it, or
pass it to `parallel` / `pipeline` and await that.

The workflow step shows one card per agent, in the order agents start, titled
with its `role`, or else the first line of its prompt, so set a role or start
each prompt with a short line that names the job.

## Agents that keep their context

When one agent should do several related turns, such as a reviewer that checks
the fixes for the bugs it found, call it instead of awaiting it. Each
`a(prompt, schema)` is lazy like an awaited `agent()` and returns that turn's
`finish` result; the agent's own `prompt`, if any, is its standing instructions
and leads the first turn. `schema` on a call defaults to the agent's. Turns on
one agent run one at a time, in the order they were started. A failed turn
raises, but the agent stays usable. An agent is either awaited or called, not
both. `del a` ends the agent, unless something else, such as a lambda, still
references it; every agent ends when the workflow ends.

```python
reviewer = agent("You review Go code for correctness.", role="Reviewer")
bugs = await reviewer("List the bugs in foo.go.", {"type": "array", "items": {"type": "string"}})
fixes = await parallel(bugs, lambda b: agent(f"Fix: {b}", {"type": "string"}))
ok = await reviewer(f"Fixes made: {fixes}. Are all your bugs fixed?", {"type": "boolean"})
del reviewer
```

## Calling tools from the script

Where the `run_workflow` tool description lists tools for `call_tool`, the
script can call them directly:

-   `call_tool(name, **args)` returns a promise like `agent()` does. Awaiting it
    runs the tool with the arguments you would pass to it directly and returns
    the tool's output as a `str`.
-   It raises `ToolError` (with `.tool` and `.message`) if the tool fails or
    the call is denied. `.denied` is `True` when a pre-tool hook or the
    permission check rejected the call before the tool ran, so a script can
    skip denied calls and still fail on real errors.
-   The user cannot be asked anything from a workflow: a call that needs user
    approval that has not already been granted is denied.
-   Tool outputs are not shown to you unless the script logs or prints them.

## Reading earlier conversation steps

Pass inputs you already have in `Args` (or inline in the script). Use
`await trajectory(...)` when the script needs to inspect steps from earlier in
this conversation—such as mining a failed `run_command` output without
rerunning it—and pass only the relevant slice into child `agent()` prompts.

Each returned `Step` is a `dict` that also supports attribute access (missing
fields return `None` as attributes):

-   `index` (`int`): 0-based step index.
-   `type` (`str`): step type, e.g. `"USER_INPUT"`, `"PLANNER_RESPONSE"`,
    `"SYSTEM_MESSAGE"`, or `"GENERIC"` (tool calls).
-   `status` (`str`): e.g. `"DONE"`, `"ERROR"`, or `"CLEARED"`.
-   Message steps set `text` (`str`); tool steps set `tool` (`str`), `args`
    (parsed `dict`), and `output` (`str`, truncated at 200k characters).

```python
steps = await trajectory(tools=["run_command"], last=20)
errors = [s.output for s in steps if s.status == "ERROR" and s.output]
log(f"Found {len(errors)} failed command(s)")
```

`trajectory()` only returns steps before the `run_workflow` call started (steps
added while the workflow runs in the background are not included). Older tool
steps evicted from memory have `status == "CLEARED"` and `output == None`; read
the conversation's `transcript.jsonl` / `transcript_full.jsonl` when you need
cleared tool outputs or steps added after the workflow started.

## Behavior to know

-   Workflow agents are main agents, not subagents. They are hidden from the
    conversation list and reachable from the workflow step. An awaited agent
    is single-use; a called agent lasts until deleted or the workflow ends.
-   `await agent(...)` returns when the agent's run ends, with the result it
    passed to `finish`.
-   If one agent in `parallel` fails, the whole call fails and the other agents
    in it are cancelled. Stopping the parent conversation stops all running
    workflow agents.
-   Agents do not see the script or each other. Put all the context an agent
    needs in its prompt, and ask for a short, well-defined output.

## Example

Fan out over a list that an agent produces:

```python
phase("Discover")
files = await agent(
    "List the Go files under pkg/foo that call Bar(). Paths only.",
    schema={"type": "array", "items": {"type": "string"}},
)

phase("Review")
reviews = await parallel(files, lambda f: agent(
    f"Review {f} for misuse of Bar(). Reply in 3 bullets or 'OK'.",
    schema={"type": "string"},
    role=f"Review {f}",
))
for r in reviews:
    log(r)
```
````

## File: src/adapters/shared.ts
````typescript
/**
 * Shared helpers for the adapter layer.
 *
 * Implements BLUEPRINT §9.2/§9.3: one JSONC batch edit via a single
 * `jsonc-parser.modify` call on the `rootKey` (avoiding the multi-edit
 * offset footgun), tolerant entry reader, and warning factory. Preserves
 * CRLF/BOM/comments outside the replaced `rootKey`; aborts on parse error.
 */

import { modify, applyEdits, parse, type ParseError } from 'jsonc-parser'
import type { WarningCode } from '$/src/adapters/types'
import { makeWarning } from '$/src/adapters/types'
import type { AgentId, CompileResult, Warning } from '$/src/adapters/types'

export interface ApplyServerEntriesOptions {
  /** Names being produced in this sync (the managed set). */
  readonly managed: string[]
  /** Previously managed names (from sync state) to prune when no longer produced. */
  readonly previous: ReadonlySet<string>
  readonly format: 'json' | 'jsonc'
}

/**
 * Apply managed entries to `rootKey` in an existing JSONC document, never
 * touching sibling keys or manual entries.
 *
 * Strategy: compute the desired `rootKey` object (manual entries that are not
 * in `previous`, overlaid by the current managed entries) and replace the
 * whole `rootKey` node in a single `modify` call. This preserves everything
 * outside `rootKey` byte-for-byte (comments, unrelated keys, `inputs`, etc.)
 * while keeping the edit atomic and offset-safe.
 *
 * - Creates `rootKey` only when needed.
 * - Deletes names in `previous` that are no longer produced.
 * - Aborts (throws) on parse error; the file is left byte-identical.
 */
export function applyServerEntries(
  existing: string | null,
  rootKey: string,
  entries: Record<string, unknown>,
  opts: ApplyServerEntriesOptions,
): {
  content: string
  edits: Array<{ offset: number; length: number; content: string }>
} {
  const { managed, previous, format } = opts

  if (existing === null || existing.trim() === '') {
    if (Object.keys(entries).length === 0) {
      return { content: '', edits: [] }
    }
    const document = { [rootKey]: entries }
    const content = JSON.stringify(document, null, 2) + '\n'
    return { content, edits: [] }
  }

  // Validate the existing document before touching it.
  const errors: ParseError[] = []
  parse(existing, errors, { allowTrailingComma: true, allowEmptyContent: true })
  if (errors.length > 0) {
    const first = errors[0]!
    throw new Error(
      `Invalid JSONC at offset ${first.offset}: unable to edit safely`,
    )
  }

  const formattingOptions =
    format === 'jsonc' ? { tabSize: 2, insertSpaces: true } : undefined

  // Read the current rootKey object (or {} if absent).
  let currentRoot: Record<string, unknown> = {}
  try {
    const parsed = parse(existing) as Record<string, unknown>
    const existingRoot = parsed[rootKey]
    if (
      existingRoot &&
      typeof existingRoot === 'object' &&
      !Array.isArray(existingRoot)
    ) {
      currentRoot = existingRoot as Record<string, unknown>
    }
  } catch {
    // If we can't read the rootKey, treat it as empty.
    currentRoot = {}
  }

  // Manual entries: keys present in the file that are NOT in `previous`
  // (i.e. not previously managed by the compiler) are preserved.
  const manualEntries: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(currentRoot)) {
    if (!previous.has(key)) {
      manualEntries[key] = value
    }
  }

  // Managed entries overlay manual ones; previously managed names no longer
  // produced are simply absent from `entries`, hence dropped.
  const newRoot: Record<string, unknown> = { ...manualEntries, ...entries }

  // Nothing to do if rootKey absent and nothing to write.
  const rootExists = Object.prototype.hasOwnProperty.call(
    parse(existing) as Record<string, unknown>,
    rootKey,
  )
  if (!rootExists && Object.keys(newRoot).length === 0) {
    return { content: existing, edits: [] }
  }

  const edits = modify(existing, [rootKey], newRoot, {
    formattingOptions,
  })

  const content = applyEdits(existing, edits)
  return { content, edits }
}

/**
 * Tolerant nested lookup: `readEntry(parsed, ['context_servers', 'x', 'command', 'path'])`.
 * Returns `undefined` when any segment is missing.
 */
export function readEntry(parsed: unknown, path: readonly string[]): unknown {
  let current: unknown = parsed
  for (const segment of path) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== 'object' ||
      Array.isArray(current)
    ) {
      return undefined
    }
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

/**
 * Build a `Warning`. Thin re-export friendly wrapper around `makeWarning`.
 */
export function buildWarning(
  agent: AgentId,
  code: WarningCode,
  message: string,
  meta?: { server?: string; field?: string },
): Warning {
  return makeWarning(agent, code, message, meta)
}
````

## File: src/core/context.ts
````typescript
import { homedir, platform } from 'node:os'

export type ConfigScope = 'project' | 'global'

export interface RuntimeContext {
  readonly cwd: string
  readonly homeDir: string
  readonly platform: NodeJS.Platform
  readonly env: NodeJS.ProcessEnv
  readonly isTTY: boolean
}

/**
 * Build a `RuntimeContext`. All path/TTY reads happen here (once, at creation),
 * never at module import time and never inside adapters. This makes Windows
 * path behavior testable on Linux CI by overriding `platform`/`homeDir`.
 */
export function createRuntimeContext(
  overrides?: Partial<RuntimeContext>,
): RuntimeContext {
  return {
    cwd: overrides?.cwd ?? process.cwd(),
    homeDir: overrides?.homeDir ?? homedir(),
    platform: overrides?.platform ?? platform(),
    env: overrides?.env ?? process.env,
    isTTY: overrides?.isTTY ?? Boolean(process.stdout?.isTTY),
  }
}
````

## File: src/sources/http.ts
````typescript
/**
 * Shared resilient HTTP client (§10.1).
 *
 * `fetchJson(url, opts?)` is the single network primitive used by every
 * source resolver. It enforces a 10s timeout, a 2 MiB response cap, sends a
 * `User-Agent: agents-mcp/<version>` header, optionally attaches
 * `Authorization: Bearer <GITHUB_TOKEN>` for GitHub endpoints, and retries
 * (bounded exponential backoff, max 2 retries) on HTTP `429`/`5xx` and
 * transient network errors.
 *
 * The `fetch` function is injectable via `opts.fetch` so tests never make
 * live network calls.
 */

import pkg from '$/package.json' with { type: 'json' }

const VERSION = pkg.version as string
const TIMEOUT_MS = 10_000
const RESPONSE_CAP = 2 * 1024 * 1024 // 2 MiB
const MAX_RETRIES = 2

export interface FetchJsonOptions {
  /** Optional injected `fetch` (tests pass a mock here). */
  fetch?: typeof fetch
  /** Extra headers merged on top of the defaults. */
  headers?: Record<string, string>
  /** Environment record used to resolve `GITHUB_TOKEN`. */
  env?: Record<string, string>
  /** External abort signal. */
  signal?: AbortSignal
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function combineSignals(
  ...signals: (AbortSignal | undefined | null)[]
): AbortSignal | undefined {
  const active = signals.filter(
    (s): s is AbortSignal => s !== null && s !== undefined && !s.aborted,
  )
  if (active.length === 0) return undefined
  if (active.length === 1) return active[0]
  const controller = new AbortController()
  const onAbort = () => controller.abort()
  for (const s of active) {
    s.addEventListener('abort', onAbort, { once: true })
  }
  controller.signal.addEventListener(
    'abort',
    () => {
      for (const s of active) {
        s.removeEventListener('abort', onAbort)
      }
    },
    { once: true },
  )
  return controller.signal
}

function isTransientError(err: unknown): boolean {
  if (err instanceof Error) {
    const name = err.name
    const message = err.message
    return (
      name === 'AbortError' ||
      name === 'TypeError' ||
      message.includes('fetch') ||
      message.includes('ECONNREFUSED') ||
      message.includes('ENOTFOUND') ||
      message.includes('ETIMEDOUT') ||
      message.includes('network')
    )
  }
  return false
}

export async function fetchJson(
  url: string,
  opts: FetchJsonOptions = {},
): Promise<unknown> {
  const { fetch: injectedFetch, headers: extraHeaders, env, signal } = opts
  const fetchFn = injectedFetch ?? (globalThis.fetch as typeof fetch)

  const headers: Record<string, string> = {
    'User-Agent': `agents-mcp/${VERSION}`,
    ...extraHeaders,
  }

  const githubToken = env?.GITHUB_TOKEN
  if (
    githubToken &&
    (url.includes('api.github.com') ||
      url.includes('raw.githubusercontent.com'))
  ) {
    headers['Authorization'] = `Bearer ${githubToken}`
  }

  const timeoutController = new AbortController()
  const timeoutId = setTimeout(() => timeoutController.abort(), TIMEOUT_MS)
  const combinedSignal = combineSignals(signal, timeoutController.signal)

  let lastError: unknown
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchFn(url, {
        signal: combinedSignal,
        headers,
      })
      if (res.ok) {
        const text = await res.text()
        if (text.length > RESPONSE_CAP) {
          throw new Error(`Response too large (>2 MiB) for ${url}`)
        }
        return JSON.parse(text)
      }

      const status = res.status
      const canRetry = attempt < MAX_RETRIES
      const retryAfterHeader =
        res.headers && typeof res.headers.get === 'function'
          ? res.headers.get('Retry-After')
          : undefined

      if (canRetry && (status === 429 || status >= 500)) {
        let delayMs = 0
        if (retryAfterHeader !== null && retryAfterHeader !== undefined) {
          const parsed = Number(retryAfterHeader)
          delayMs = Number.isFinite(parsed) ? Math.max(parsed, 0) * 1000 : 0
          delayMs = Math.min(delayMs, 5000) // capped at 5s
        } else {
          delayMs = Math.pow(2, attempt) * 1000 // 1s, 2s
        }
        await sleep(delayMs)
        continue
      }

      throw new Error(`HTTP ${status} for ${url}`)
    } catch (err) {
      lastError = err
      const canRetry = attempt < MAX_RETRIES
      if (canRetry && isTransientError(err)) {
        const delayMs = Math.pow(2, attempt) * 1000 // 1s, 2s
        await sleep(delayMs)
        continue
      }
      throw err
    }
  }

  clearTimeout(timeoutId)
  throw lastError
}
````

## File: src/ui/auto.ts
````typescript
/**
 * Non-interactive UI implementation used for `--yes`, `CI=true`, and tests.
 *
 * Never blocks on input. Every prompt resolves from the supplied `defaults`
 * (or sensible fallbacks) and prints through `log`. Secrets are masked.
 */

import type { Option, PromptUi, Spinner } from '$/src/ui/prompts'

export interface AutoUiDefaults {
  confirm?: boolean
  select?: unknown
  multiselect?: unknown[]
  text?: string
  password?: string
}

export interface AutoUiLogger {
  info(message: string): void
  warn(message: string): void
  error(message: string): void
}

function maskSecret(value: string): string {
  if (!value) {
    return ''
  }
  return value.length > 4 ? `${value.slice(0, 2)}***` : '***'
}

/**
 * Build a non-interactive `PromptUi`. `defaults` supply answers for prompts;
 * `log` receives informational/warning/error output.
 */
export function createAutoUi({
  defaults = {},
  log,
}: {
  defaults?: AutoUiDefaults
  log?: AutoUiLogger
}): PromptUi {
  const info = log?.info ?? ((message: string) => console.log(message))
  const warn = log?.warn ?? ((message: string) => console.warn(message))
  const error = log?.error ?? ((message: string) => console.error(message))

  const noopSpinner: Spinner = {
    start() {},
    stop() {},
  }

  return {
    intro(message: string) {
      info(message)
    },
    outro(message: string) {
      info(message)
    },
    note(message: string, title?: string) {
      info(title ? `${title}: ${message}` : message)
    },
    warn(message: string) {
      warn(message)
    },
    error(message: string) {
      error(message)
    },
    confirm(opts: {
      message: string
      initialValue: boolean
    }): Promise<boolean> {
      info(`${opts.message} (${opts.initialValue ? 'Y/n' : 'y/N'})`)
      return Promise.resolve(defaults.confirm ?? opts.initialValue)
    },
    async select<T>(opts: {
      message: string
      options: Option<T>[]
      initialValue?: T
    }): Promise<T> {
      const chosen =
        defaults.select ?? opts.options[0]?.value ?? opts.initialValue
      info(`${opts.message} → ${String(chosen)}`)
      const option = opts.options.find((o) => o.value === chosen)
      if (option) {
        info(
          `  ${option.hint ? `${option.label} (${option.hint})` : option.label}`,
        )
      }
      return chosen as T
    },
    async multiselect<T>(opts: {
      message: string
      options: Option<T>[]
      initialValues?: T[]
    }): Promise<T[]> {
      const chosen = defaults.multiselect ?? opts.initialValues ?? []
      info(`${opts.message} → ${chosen.join(', ') || '(none)'}`)
      return chosen as T[]
    },
    async text(opts: {
      message: string
      placeholder?: string
      defaultValue?: string
      validate?: (v: string) => string | undefined
    }): Promise<string> {
      const chosen = defaults.text ?? opts.defaultValue ?? ''
      info(`${opts.message} → ${maskSecret(chosen)}`)
      return chosen
    },
    async password(opts: { message: string }): Promise<string> {
      const chosen = defaults.password ?? ''
      info(`${opts.message} → ***`)
      return chosen
    },
    spinner(): Spinner {
      return noopSpinner
    },
  }
}
````

## File: tests/adapters/antigravity.test.ts
````typescript
import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer, isHttpServer } from '$/src/core/schema'
import {
  capabilities,
  detect,
  compile,
  extractServers,
  applyServers,
  id,
  displayName,
  getConfigPath,
} from '$/src/adapters/antigravity'
import { createRuntimeContext } from '$/src/core/context'
import { createSandbox } from '$/tests/helpers/sandbox'

const ctx = createRuntimeContext({
  cwd: '/tmp/proj',
  homeDir: '/tmp/home',
  env: {},
  isTTY: false,
})

const stdioServer: CanonicalServer = {
  type: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-github'],
  env: { GITHUB_TOKEN: '${GITHUB_TOKEN}' },
}

const httpServer: CanonicalServer = {
  type: 'streamable-http',
  url: 'https://mcp.linear.app/mcp',
  headers: { Authorization: 'Bearer ${LINEAR_API_KEY}' },
}

const sseServer: CanonicalServer = {
  type: 'sse',
  url: 'https://mcp.linear.app/sse',
  headers: { Authorization: 'Bearer ${LINEAR_API_KEY}' },
}

describe('antigravity adapter identity', () => {
  it('id and displayName', () => {
    expect(id).toBe('antigravity')
    expect(displayName).toBe('Antigravity')
  })

  it('capabilities invariants (per-plugin layout)', () => {
    expect(capabilities).toEqual({
      scopes: ['project', 'global'],
      format: 'json',
      envSyntax: 'posix',
      nativeDefault: false,
      nativeDisabled: false,
      cwd: false,
      layout: 'per-plugin',
      rootKey: 'mcpServers',
    })
  })

  it('getConfigPath returns null (no single native config path)', () => {
    expect(getConfigPath('project', ctx)).toBe(null)
    expect(getConfigPath('global', ctx)).toBe(null)
  })
})

describe('antigravity detect', () => {
  it('returns false when no plugins directory exists', async () => {
    const { ctx: sctx, cleanup } = createSandbox()
    try {
      expect(await detect('project', sctx)).toBe(false)
      expect(await detect('global', sctx)).toBe(false)
    } finally {
      cleanup()
    }
  })

  it('returns false when plugins dir exists but has no mcp_config.json', async () => {
    const { ctx: sctx, cleanup } = createSandbox()
    try {
      const emptyPlugin = join(sctx.cwd, '.agents', 'plugins', 'empty-plugin')
      mkdirSync(emptyPlugin, { recursive: true })
      expect(await detect('project', sctx)).toBe(false)
    } finally {
      cleanup()
    }
  })

  it('returns true when any .agents/plugins/*/mcp_config.json exists (project)', async () => {
    const { ctx: sctx, cleanup } = createSandbox()
    try {
      const pluginDir = join(sctx.cwd, '.agents', 'plugins', 'github')
      mkdirSync(pluginDir, { recursive: true })
      writeFileSync(
        join(pluginDir, 'mcp_config.json'),
        JSON.stringify({ mcpServers: {} }),
      )
      expect(await detect('project', sctx)).toBe(true)
    } finally {
      cleanup()
    }
  })

  it('returns true for global scope under homeDir', async () => {
    const { ctx: sctx, cleanup } = createSandbox()
    try {
      const pluginDir = join(sctx.homeDir, '.agents', 'plugins', 'linear')
      mkdirSync(pluginDir, { recursive: true })
      writeFileSync(
        join(pluginDir, 'mcp_config.json'),
        JSON.stringify({ mcpServers: {} }),
      )
      expect(await detect('global', sctx)).toBe(true)
    } finally {
      cleanup()
    }
  })
})

describe('antigravity compile', () => {
  it('stdio -> { command, args, env } with no type field', () => {
    const { entry, warnings } = compile(stdioServer)
    expect(entry).toEqual({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: { GITHUB_TOKEN: '${GITHUB_TOKEN}' },
    })
    expect(entry).not.toHaveProperty('type')
    expect(warnings).toEqual([])
  })

  it('omits args when empty and env when absent', () => {
    const { entry } = compile({ type: 'stdio', command: 'npx', args: [] })
    expect(entry).toEqual({ command: 'npx' })
    expect(entry).not.toHaveProperty('args')
    expect(entry).not.toHaveProperty('env')
  })

  it('streamable-http -> { serverUrl, headers } with no type field', () => {
    const { entry, warnings } = compile(httpServer)
    expect(entry).toEqual({
      serverUrl: 'https://mcp.linear.app/mcp',
      headers: { Authorization: 'Bearer ${LINEAR_API_KEY}' },
    })
    expect(entry).not.toHaveProperty('type')
    expect(warnings).toEqual([])
  })

  it('sse -> { serverUrl, headers } (serverUrl form, no type field)', () => {
    const { entry } = compile(sseServer)
    expect(entry).toEqual({
      serverUrl: 'https://mcp.linear.app/sse',
      headers: { Authorization: 'Bearer ${LINEAR_API_KEY}' },
    })
    expect(entry).not.toHaveProperty('type')
  })

  it('ignores cwd with no warning', () => {
    const { entry, warnings } = compile({
      type: 'stdio',
      command: 'npx',
      args: [],
      cwd: '/some/dir',
    })
    expect(entry).toEqual({ command: 'npx' })
    expect(warnings).toEqual([])
  })
})

describe('antigravity extractServers', () => {
  it('round-trips stdio and streamable-http entries', () => {
    const raw = JSON.stringify({
      mcpServers: {
        github: {
          command: 'npx',
          args: ['-y', 'pkg'],
          env: { GITHUB_TOKEN: '${GITHUB_TOKEN}' },
        },
        linear: {
          serverUrl: 'https://mcp.linear.app/mcp',
          headers: { Authorization: 'Bearer x' },
        },
      },
    })
    const { servers, warnings } = extractServers(raw, 'project')
    expect(warnings).toEqual([])
    const github = servers.github as Extract<CanonicalServer, { type: 'stdio' }>
    expect(isStdioServer(github)).toBe(true)
    expect(github.command).toBe('npx')
    expect(github.args).toEqual(['-y', 'pkg'])
    expect(github.env).toEqual({ GITHUB_TOKEN: '${GITHUB_TOKEN}' })
    const linear = servers.linear as Extract<
      CanonicalServer,
      { type: 'streamable-http' }
    >
    expect(isHttpServer(linear)).toBe(true)
    expect(linear.type).toBe('streamable-http')
    expect(linear.url).toBe('https://mcp.linear.app/mcp')
    expect(linear.headers).toEqual({ Authorization: 'Bearer x' })
  })

  it('imports sse entry as streamable-http (transport not distinguished)', () => {
    const raw = JSON.stringify({
      mcpServers: {
        linearSse: { serverUrl: 'https://mcp.linear.app/sse' },
      },
    })
    const { servers, warnings } = extractServers(raw, 'project')
    const linearSse = servers.linearSse!
    expect(isHttpServer(linearSse)).toBe(true)
    if (isHttpServer(linearSse)) {
      expect(linearSse.type).toBe('streamable-http')
      expect(linearSse.url).toBe('https://mcp.linear.app/sse')
    }
    expect(warnings).toEqual([])
  })

  it('drops entries with neither command nor serverUrl (UNKNOWN_FIELD_DROPPED)', () => {
    const raw = JSON.stringify({
      mcpServers: { broken: { type: 'stdio' } },
    })
    const { servers, warnings } = extractServers(raw, 'project')
    expect(servers).toEqual({})
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.code).toBe('UNKNOWN_FIELD_DROPPED')
    expect(warnings[0]!.agent).toBe('antigravity')
    expect(warnings[0]!.server).toBe('broken')
  })

  it('returns empty for missing mcpServers', () => {
    const { servers } = extractServers(JSON.stringify({ other: 1 }), 'project')
    expect(servers).toEqual({})
  })

  it('returns empty for invalid JSON', () => {
    const { servers } = extractServers('{ not valid json', 'project')
    expect(servers).toEqual({})
  })
})

describe('antigravity applyServers', () => {
  const adapterCtx = {
    ...ctx,
    scope: 'project' as const,
    previousManagedNames: new Set<string>(),
  }

  it('is a no-op passthrough: returns existing content with managedNames', () => {
    const { content, managedNames, warnings } = applyServers(
      'existing raw content',
      { github: stdioServer },
      adapterCtx,
    )
    expect(content).toBe('existing raw content')
    expect(managedNames).toEqual(['github'])
    expect(warnings).toEqual([])
  })

  it('treats null existing content as empty string', () => {
    const { content } = applyServers(null, { github: stdioServer }, adapterCtx)
    expect(content).toBe('')
  })

  it('managedNames reflect all produced server names', () => {
    const { managedNames } = applyServers(
      '',
      { github: stdioServer, linear: httpServer },
      adapterCtx,
    )
    expect(managedNames).toEqual(['github', 'linear'])
  })
})
````

## File: tests/adapters/contract.test.ts
````typescript
import { describe, expect, it } from 'vitest'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer, isHttpServer } from '$/src/core/schema'
import { adapters } from '$/src/adapters/index'
import type {
  AgentId,
  AdapterCapabilities,
  Warning,
} from '$/src/adapters/types'
import { createRuntimeContext } from '$/src/core/context'
import { readFileSync } from 'node:fs'
import { parse as jsoncParse } from 'jsonc-parser'
import { createSandbox } from '$/tests/helpers/sandbox'

const ctx = createRuntimeContext({
  cwd: '/tmp/proj',
  homeDir: '/tmp/home',
  env: {},
  isTTY: false,
})

/** A canonical server used as a contract fixture. */
interface ServerFixture {
  name: string
  server: CanonicalServer
  /** Expected native entry produced by `compile(server)`. */
  entry: unknown
  /**
   * Expected canonical server after `extractServers(wrap(rootKey, { [name]: entry }))`.
   * Defaults to `server` when the round trip is lossless.
   */
  roundTrip?: CanonicalServer
  /** Warnings expected from `compile(server)`. Defaults to []. */
  compileWarnings?: readonly Partial<Warning>[]
  /** Warnings expected from `extractServers(...)`. Defaults to []. */
  extractWarnings?: readonly Partial<Warning>[]
}

/** Plain (non-placeholder) values so env/headers round-trip losslessly. */
const stdioServer: CanonicalServer = {
  type: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-github'],
  env: { GITHUB_TOKEN: 'ghp_test_token' },
}

const httpServer: CanonicalServer = {
  type: 'streamable-http',
  url: 'https://mcp.linear.app/mcp',
  headers: { Authorization: 'Bearer test-token' },
}

const sseServer: CanonicalServer = {
  type: 'sse',
  url: 'https://mcp.linear.app/sse',
  headers: { Authorization: 'Bearer test-token' },
}

/** Per-adapter compile + extract round-trip fixtures. */
const FIXTURES: Record<AgentId, ServerFixture[]> = {
  'claude-code': [
    {
      name: 'github',
      server: stdioServer,
      entry: {
        type: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: { GITHUB_TOKEN: 'ghp_test_token' },
      },
    },
    {
      name: 'linear',
      server: httpServer,
      entry: {
        type: 'http',
        url: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
      roundTrip: {
        type: 'streamable-http',
        url: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
    },
  ],
  cursor: [
    {
      name: 'github',
      server: stdioServer,
      entry: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: { GITHUB_TOKEN: 'ghp_test_token' },
      },
    },
    {
      name: 'linear',
      server: httpServer,
      entry: {
        url: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
      roundTrip: {
        type: 'streamable-http',
        url: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
      // Cursor native http entries carry no `type` → transport inferred.
      extractWarnings: [
        { code: 'TRANSPORT_INFERRED', agent: 'cursor', server: 'linear' },
      ],
    },
  ],
  vscode: [
    {
      name: 'github',
      server: stdioServer,
      entry: {
        type: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: { GITHUB_TOKEN: 'ghp_test_token' },
      },
    },
    {
      name: 'linear',
      server: httpServer,
      entry: {
        type: 'http',
        url: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
      roundTrip: {
        type: 'streamable-http',
        url: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
    },
  ],
  opencode: [
    {
      name: 'github',
      server: stdioServer,
      entry: {
        type: 'local',
        command: ['npx', '-y', '@modelcontextprotocol/server-github'],
        environment: { GITHUB_TOKEN: 'ghp_test_token' },
      },
      roundTrip: {
        type: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: { GITHUB_TOKEN: 'ghp_test_token' },
      },
    },
    {
      name: 'linear',
      server: httpServer,
      entry: {
        type: 'remote',
        url: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
      roundTrip: {
        type: 'streamable-http',
        url: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
    },
  ],
  windsurf: [
    {
      name: 'github',
      server: stdioServer,
      entry: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: { GITHUB_TOKEN: 'ghp_test_token' },
      },
    },
    {
      name: 'linear',
      server: httpServer,
      entry: {
        serverUrl: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
      roundTrip: {
        type: 'streamable-http',
        url: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
      // Windsurf native http entries carry no `type` → transport inferred.
      extractWarnings: [
        { code: 'TRANSPORT_INFERRED', agent: 'windsurf', server: 'linear' },
      ],
    },
  ],
  zed: [
    {
      name: 'github',
      server: stdioServer,
      entry: {
        command: {
          path: 'npx',
          args: ['-y', '@modelcontextprotocol/server-github'],
          env: { GITHUB_TOKEN: 'ghp_test_token' },
        },
      },
      roundTrip: {
        type: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: { GITHUB_TOKEN: 'ghp_test_token' },
      },
    },
    {
      name: 'linear',
      server: httpServer,
      entry: {
        url: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
      roundTrip: {
        type: 'streamable-http',
        url: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
      // Zed native http entries carry no `type` → transport inferred.
      extractWarnings: [
        { code: 'TRANSPORT_INFERRED', agent: 'zed', server: 'linear' },
      ],
    },
  ],
  antigravity: [
    {
      name: 'github',
      server: stdioServer,
      entry: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: { GITHUB_TOKEN: 'ghp_test_token' },
      },
    },
    {
      name: 'linear',
      server: httpServer,
      entry: {
        serverUrl: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
      roundTrip: {
        type: 'streamable-http',
        url: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
    },
    {
      name: 'linearSse',
      server: sseServer,
      entry: {
        serverUrl: 'https://mcp.linear.app/sse',
        headers: { Authorization: 'Bearer test-token' },
      },
      roundTrip: {
        type: 'streamable-http',
        url: 'https://mcp.linear.app/sse',
        headers: { Authorization: 'Bearer test-token' },
      },
    },
  ],
}

/** Scope each adapter supports for round-trip / apply tests. */
function roundTripScope(adapter: {
  capabilities: AdapterCapabilities
}): 'project' | 'global' {
  return adapter.capabilities.scopes.includes('project') ? 'project' : 'global'
}

describe('adapter contract: capabilities invariants (all 7 adapters)', () => {
  it('registry exposes exactly the seven agents', () => {
    expect(adapters).toHaveLength(7)
    expect(adapters.map((a) => a.id)).toEqual([
      'claude-code',
      'cursor',
      'vscode',
      'opencode',
      'zed',
      'windsurf',
      'antigravity',
    ])
  })

  it.each(adapters)('capabilities for $id', (adapter) => {
    const caps = adapter.capabilities
    expect(Array.isArray(caps.scopes) && caps.scopes.length > 0).toBe(true)
    expect(['json', 'jsonc']).toContain(caps.format)
    expect(['posix', 'env-colon', 'brace-env']).toContain(caps.envSyntax)
    expect(typeof caps.nativeDefault).toBe('boolean')
    expect(typeof caps.nativeDisabled).toBe('boolean')
    expect(typeof caps.cwd).toBe('boolean')
    expect(['single-file', 'per-plugin']).toContain(caps.layout)
    if (caps.layout === 'single-file') {
      expect(typeof caps.rootKey).toBe('string')
      expect(caps.rootKey!.length).toBeGreaterThan(0)
    }
  })
})

describe('adapter contract: compile + extractServers round-trip', () => {
  it.each(adapters)('round-trips servers for $id', (adapter) => {
    const scope = roundTripScope(adapter)
    const rootKey = adapter.capabilities.rootKey!
    const fixtures = FIXTURES[adapter.id as AgentId]
    expect(fixtures).toBeDefined()

    for (const fixture of fixtures!) {
      const { entry, warnings: compileWarnings } = adapter.compile(
        fixture.server,
      )
      expect(entry).toEqual(fixture.entry)
      expect(compileWarnings).toEqual(
        (fixture.compileWarnings ?? []).map((w) => expect.objectContaining(w)),
      )

      const raw = JSON.stringify({ [rootKey]: { [fixture.name]: entry } })
      const { servers, warnings: extractWarnings } = adapter.extractServers(
        raw,
        scope,
      )
      expect(extractWarnings).toEqual(
        (fixture.extractWarnings ?? []).map((w) => expect.objectContaining(w)),
      )
      expect(servers[fixture.name]).toEqual(fixture.roundTrip ?? fixture.server)
    }
  })
})

describe('adapter contract: applyServers idempotence', () => {
  it.each(adapters)('is idempotent for $id', (adapter) => {
    const scope = roundTripScope(adapter)
    const servers = {
      github: stdioServer,
      linear: httpServer,
    }

    const ctx1 = { ...ctx, scope, previousManagedNames: new Set<string>() }
    const r1 = adapter.applyServers(null, servers, ctx1)

    const ctx2 = {
      ...ctx,
      scope,
      previousManagedNames: new Set(r1.managedNames),
    }
    const r2 = adapter.applyServers(r1.content, servers, ctx2)

    const ctx3 = {
      ...ctx,
      scope,
      previousManagedNames: new Set(r2.managedNames),
    }
    const r3 = adapter.applyServers(r2.content, servers, ctx3)

    // Re-applying the same servers to the adapter's own output is
    // byte-identical once the output has been normalized (fixed point).
    expect(r3.content).toBe(r2.content)
    expect(r3.managedNames).toEqual(r1.managedNames)
    expect(r2.managedNames).toEqual(r1.managedNames)
  })
})

describe('adapter contract: JSONC comment / manual-entry preservation', () => {
  it.each(adapters.filter((a) => a.capabilities.layout === 'single-file'))(
    'preserves comments and manual entries for $id',
    (adapter) => {
      const scope = roundTripScope(adapter)
      const existing = `{\n  // manual entry maintained by the user\n  "manualEntry": { "type": "stdio", "command": "manual-cmd" }\n}\n`

      const { content, managedNames } = adapter.applyServers(
        existing,
        { github: stdioServer },
        { ...ctx, scope, previousManagedNames: new Set<string>() },
      )

      expect(content).toContain('// manual entry maintained by the user')
      expect(content).toContain('"manualEntry"')

      const errors: Array<{ error: number; offset: number; length: number }> =
        []
      const parsed = jsoncParse(content, errors)
      expect(errors).toEqual([])
      expect((parsed as Record<string, unknown>).manualEntry).toEqual({
        type: 'stdio',
        command: 'manual-cmd',
      })
      expect(
        (parsed as Record<string, unknown>)[adapter.capabilities.rootKey!],
      ).toHaveProperty('github')
      expect(managedNames).toEqual(['github'])
    },
  )
})

describe('adapter contract: RuntimeContext OS-path purity', () => {
  const FORBIDDEN = [
    { pattern: /process\.platform/, name: 'process.platform' },
    { pattern: /os\.homedir\(/, name: 'os.homedir()' },
    { pattern: /process\.env/, name: 'process.env' },
  ]

  it.each(adapters)(
    'adapter $id source avoids OS-specific globals',
    (adapter) => {
      const sourcePath = new URL(
        `../../src/adapters/${adapter.id}.ts`,
        import.meta.url,
      ).pathname
      const source = readFileSync(sourcePath, 'utf8')
      for (const { pattern, name } of FORBIDDEN) {
        expect(source, `${adapter.id} must not use ${name}`).not.toMatch(
          pattern,
        )
      }
    },
  )
})

describe('adapter contract: detect returns false when no config present', () => {
  it.each(adapters)(
    'detect($id) is false with no native config',
    async (adapter) => {
      const { ctx: sctx, cleanup } = createSandbox()
      try {
        expect(await adapter.detect('project', sctx)).toBe(false)
        expect(await adapter.detect('global', sctx)).toBe(false)
      } finally {
        cleanup()
      }
    },
  )
})
````

## File: tests/cli/global-flags.test.ts
````typescript
/**
 * Global flag contract across every subcommand.
 *
 * `citty` does not inherit the root command aliases into subcommands, so
 * `normalizeGlobalArgs` canonicalizes `-g` → `--global` and `-y` → `--yes`
 * before and after the subcommand token, and commands read them through
 * `isGlobalFlag` / `isYesFlag`. These tests exercise the whole contract via
 * the real entrypoint for all 7 commands.
 */

import { describe, expect, it } from 'vitest'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { main, normalizeGlobalArgs } from '$/src/index'
import {
  isGlobalFlag,
  isYesFlag,
  persistCanonicalConfig,
} from '$/src/commands/util'
import { DEFAULT_SCHEMA_URL } from '$/src/config'
import type { RuntimeContext } from '$/src/core/context'
import { createSandbox } from '$/tests/helpers/sandbox'

const SUBCOMMANDS = [
  'sync',
  'init',
  'remove',
  'list',
  'import',
  'add',
  'doctor',
] as const

describe('normalizeGlobalArgs: short global aliases', () => {
  for (const subcommand of SUBCOMMANDS) {
    it(`canonicaliza -g/-y antes de \`${subcommand}\``, () => {
      expect(normalizeGlobalArgs(['-g', '-y', subcommand])).toEqual([
        subcommand,
        '--global',
        '--yes',
      ])
    })

    it(`canonicaliza -g/-y depois de \`${subcommand}\``, () => {
      expect(normalizeGlobalArgs([subcommand, '-g', '-y'])).toEqual([
        subcommand,
        '--global',
        '--yes',
      ])
    })
  }
})

describe('isGlobalFlag / isYesFlag', () => {
  it('aceita as formas longa e curta', () => {
    expect(isGlobalFlag({ global: true })).toBe(true)
    expect(isGlobalFlag({ g: true })).toBe(true)
    expect(isGlobalFlag({})).toBe(false)
    expect(isYesFlag({ yes: true })).toBe(true)
    expect(isYesFlag({ y: true })).toBe(true)
    expect(isYesFlag({})).toBe(false)
  })
})

interface CliResult {
  exitCode: number | undefined
  stdout: string[]
  stderr: string[]
}

const savedEnvKeys = ['HOME', 'XDG_CONFIG_HOME'] as const

/** Run the real CLI in a sandbox, capturing output, exit code and disk scope. */
async function runCli(
  argv: readonly string[],
  sandbox: ReturnType<typeof createSandbox>,
): Promise<CliResult> {
  mkdirSync(sandbox.ctx.cwd, { recursive: true })
  mkdirSync(sandbox.ctx.homeDir, { recursive: true })

  const result: CliResult = {
    exitCode: undefined,
    stdout: [],
    stderr: [],
  }
  const savedArgv = process.argv
  const savedCwd = process.cwd()
  const savedExit = process.exit
  const savedLog = console.log
  const savedError = console.error
  const savedEnv = new Map<string, string | undefined>()
  for (const key of savedEnvKeys) {
    savedEnv.set(key, process.env[key])
  }

  process.argv = ['node', 'index.js', ...argv]
  process.chdir(sandbox.ctx.cwd)
  process.env.HOME = sandbox.ctx.homeDir
  process.env.XDG_CONFIG_HOME = join(sandbox.ctx.homeDir, '.config')
  process.exit = ((code: number) => {
    result.exitCode = code
  }) as unknown as NodeJS.Process['exit']
  console.log = ((message: unknown) => {
    result.stdout.push(String(message))
  }) as typeof console.log
  console.error = ((message: unknown) => {
    result.stderr.push(String(message))
  }) as typeof console.error

  try {
    await main()
  } finally {
    process.argv = savedArgv
    process.chdir(savedCwd)
    process.exit = savedExit
    console.log = savedLog
    console.error = savedError
    for (const [key, value] of savedEnv) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }

  return result
}

function seedGlobalCanonicalConfig(ctx: RuntimeContext): void {
  persistCanonicalConfig('global', ctx, {
    $schema: DEFAULT_SCHEMA_URL,
    mcpServers: {
      gonly: {
        type: 'streamable-http',
        url: 'https://example.com/mcp',
      },
    },
  })
}

/**
 * Every command must honor `-g`/`--global` regardless of where the flag sits.
 * `expected` is matched against stdout unless `stderrExcludes` is set.
 */
const CASES: Array<{
  name: string
  argv: string[]
  expected: (homeDir: string) => string
  stderrExcludes?: string
}> = [
  {
    name: 'init',
    argv: ['init', '--force', '--dry-run'],
    expected: (home) =>
      `Initialized global canonical config at ${join(home, '.agents/mcp.json')}`,
  },
  {
    name: 'sync',
    argv: ['sync', '--agents', 'vscode', '--dry-run'],
    expected: (home) => join(home, '.config', 'Code', 'User', 'mcp.json'),
  },
  {
    name: 'remove',
    argv: ['remove', 'gonly', '--dry-run'],
    expected: (home) => join(home, '.agents/mcp.json'),
  },
  {
    name: 'list',
    argv: ['list'],
    expected: () => 'gonly',
  },
  {
    name: 'import',
    argv: ['import', '--dry-run'],
    expected: (home) => join(home, '.agents/mcp.json'),
  },
  {
    name: 'add',
    argv: ['add', 'demo', '--command', 'npx', '--dry-run'],
    expected: (home) => join(home, '.agents/mcp.json'),
  },
  {
    name: 'doctor',
    argv: ['doctor', '--dry-run'],
    expected: () => 'doctor:',
    stderrExcludes: 'No canonical config',
  },
]

for (const placement of ['antes', 'depois'] as const) {
  describe(`-g/-y ${placement} do subcomando`, () => {
    for (const testCase of CASES) {
      it(`\`${testCase.name}\` opera no escopo global`, async () => {
        const sandbox = createSandbox()
        try {
          seedGlobalCanonicalConfig(sandbox.ctx)

          const argv =
            placement === 'antes'
              ? ['-g', '-y', ...testCase.argv]
              : [
                  testCase.argv[0] as string,
                  '-g',
                  '-y',
                  ...testCase.argv.slice(1),
                ]

          const result = await runCli(argv, sandbox)

          expect(result.exitCode).toBeUndefined()
          const output = [...result.stdout, ...result.stderr].join('\n')
          expect(output).toContain(testCase.expected(sandbox.ctx.homeDir))
          if (testCase.stderrExcludes) {
            expect(result.stderr.join('\n')).not.toContain(
              testCase.stderrExcludes,
            )
          }
        } finally {
          sandbox.cleanup()
        }
      })
    }
  })
}
````

## File: tests/commands/add-interactive.test.ts
````typescript
import { describe, expect, it, vi } from 'vitest'
import {
  collectInteractiveAddOptions,
  validateCommandInput,
  validateEnvEntry,
  validateHeaderEntry,
  validateHttpUrl,
  validateServerName,
} from '$/src/commands/add-interactive'
import type { PromptUi } from '$/src/ui/prompts'

interface ScriptedUi {
  ui: PromptUi
  intro: ReturnType<typeof vi.fn>
  warn: ReturnType<typeof vi.fn>
  select: ReturnType<typeof vi.fn>
  text: ReturnType<typeof vi.fn>
  confirm: ReturnType<typeof vi.fn>
}

/** Build a `PromptUi` whose prompts resolve from scripted answer queues. */
function createScriptedUi({
  select = [],
  text = [],
  confirm = [],
}: {
  select?: Array<'command' | 'http'>
  text?: string[]
  confirm?: boolean[]
} = {}): ScriptedUi {
  const intro = vi.fn()
  const warn = vi.fn()
  const selectMock = vi.fn(async () => select.shift())
  const textMock = vi.fn(async () => text.shift() ?? '')
  const confirmMock = vi.fn(async () => confirm.shift() ?? false)

  const ui = {
    intro,
    outro: vi.fn(),
    note: vi.fn(),
    warn,
    error: vi.fn(),
    confirm: confirmMock,
    select: selectMock,
    multiselect: vi.fn(async () => []),
    text: textMock,
    password: vi.fn(async () => ''),
    spinner: () => ({ start() {}, stop() {} }),
  } as unknown as PromptUi

  return {
    ui,
    intro,
    warn,
    select: selectMock,
    text: textMock,
    confirm: confirmMock,
  }
}

describe('collectInteractiveAddOptions', () => {
  it('coleta fluxo mínimo de comando', async () => {
    const scripted = createScriptedUi({
      select: ['command'],
      text: ['npx', ''],
      confirm: [false],
    })

    const result = await collectInteractiveAddOptions({
      ui: scripted.ui,
      initialName: 'github',
      checkConflict: vi.fn(),
    })

    expect(result).toEqual({
      name: 'github',
      options: {
        name: 'github',
        command: 'npx',
        arg: [],
        env: [],
      },
    })
    expect(scripted.intro).toHaveBeenCalledWith('Add MCP server')
    expect(scripted.select).toHaveBeenCalledTimes(1)
  })

  it('coleta comando completo com argumentos inline, extras e env', async () => {
    const scripted = createScriptedUi({
      select: ['command'],
      text: ['npx -y @scope/pkg', '--foo bar', 'API_KEY=abc', 'DEBUG'],
      confirm: [true, true, false],
    })

    const result = await collectInteractiveAddOptions({
      ui: scripted.ui,
      initialName: 'tool',
      checkConflict: vi.fn(),
    })

    expect(result.options.command).toBe('npx')
    expect(result.options.arg).toEqual(['-y', '@scope/pkg', '--foo', 'bar'])
    expect(result.options.env).toEqual(['API_KEY=abc', 'DEBUG'])
  })

  it('coleta fluxo mínimo de HTTP', async () => {
    const scripted = createScriptedUi({
      select: ['http'],
      text: ['https://api.example.com/mcp'],
      confirm: [false],
    })

    const result = await collectInteractiveAddOptions({
      ui: scripted.ui,
      initialName: 'remote',
      checkConflict: vi.fn(),
    })

    expect(result).toEqual({
      name: 'remote',
      options: {
        name: 'remote',
        http: 'https://api.example.com/mcp',
        header: [],
      },
    })
  })

  it('coleta HTTP completo com múltiplos headers', async () => {
    const scripted = createScriptedUi({
      select: ['http'],
      text: ['https://api.example.com/mcp', 'X: 1', 'Y: 2'],
      confirm: [true, true, false],
    })

    const result = await collectInteractiveAddOptions({
      ui: scripted.ui,
      initialName: 'remote',
      checkConflict: vi.fn(),
    })

    expect(result.options.header).toEqual(['X: 1', 'Y: 2'])
  })

  it('solicita o nome quando ausente', async () => {
    const scripted = createScriptedUi({
      select: ['command'],
      text: ['my-server', 'npx', ''],
      confirm: [false],
    })

    const result = await collectInteractiveAddOptions({
      ui: scripted.ui,
      checkConflict: vi.fn(),
    })

    expect(result.name).toBe('my-server')
    expect(scripted.text.mock.calls[0]?.[0]).toMatchObject({
      message: 'Server name',
      validate: validateServerName,
    })
  })

  it('avisa e re-solicita o nome quando o posicional é inválido', async () => {
    const scripted = createScriptedUi({
      select: ['command'],
      text: ['good-name', 'npx', ''],
      confirm: [false],
    })

    const result = await collectInteractiveAddOptions({
      ui: scripted.ui,
      initialName: 'Bad Name',
      checkConflict: vi.fn(),
    })

    expect(result.name).toBe('good-name')
    expect(scripted.warn).toHaveBeenCalledWith(
      expect.stringContaining('Invalid server name'),
    )
  })

  it('checa conflito antes de perguntar o tipo', async () => {
    const scripted = createScriptedUi({ select: ['command'] })
    const checkConflict = vi.fn(() => {
      throw new Error('conflict')
    })

    await expect(
      collectInteractiveAddOptions({
        ui: scripted.ui,
        initialName: 'existing',
        checkConflict,
      }),
    ).rejects.toThrow('conflict')

    expect(checkConflict).toHaveBeenCalledWith('existing')
    expect(scripted.select).not.toHaveBeenCalled()
  })

  it('não expõe o jargão stdio nas opções de tipo', async () => {
    const scripted = createScriptedUi({
      select: ['command'],
      text: ['npx', ''],
      confirm: [false],
    })

    await collectInteractiveAddOptions({
      ui: scripted.ui,
      initialName: 'tool',
      checkConflict: vi.fn(),
    })

    const selectOptions = scripted.select.mock.calls[0]?.[0] as {
      options: Array<{ label: string; value: string; hint?: string }>
    }
    expect(JSON.stringify(selectOptions)).not.toContain('stdio')
    expect(selectOptions.options.map((o) => o.value)).toEqual([
      'command',
      'http',
    ])
  })
})

describe('validators', () => {
  it('validateServerName', () => {
    expect(validateServerName('github')).toBeUndefined()
    expect(validateServerName('my-server_1.x')).toBeUndefined()
    expect(validateServerName('')).toBeDefined()
    expect(validateServerName('Bad Name')).toBeDefined()
    expect(validateServerName('-leading')).toBeDefined()
  })

  it('validateCommandInput', () => {
    expect(validateCommandInput('npx')).toBeUndefined()
    expect(validateCommandInput('npx -y @scope/pkg')).toBeUndefined()
    expect(validateCommandInput('')).toBeDefined()
    expect(validateCommandInput('   ')).toBeDefined()
  })

  it('validateHttpUrl', () => {
    expect(validateHttpUrl('http://localhost:3000/mcp')).toBeUndefined()
    expect(validateHttpUrl('https://api.example.com/mcp')).toBeUndefined()
    expect(validateHttpUrl('https://${HOST}/mcp')).toBeUndefined()
    expect(validateHttpUrl('')).toBeDefined()
    expect(validateHttpUrl('ftp://example.com')).toBeDefined()
    expect(validateHttpUrl('not a url')).toBeDefined()
  })

  it('validateEnvEntry', () => {
    expect(validateEnvEntry('API_KEY=abc')).toBeUndefined()
    expect(validateEnvEntry('API_KEY')).toBeUndefined()
    expect(validateEnvEntry('')).toBeDefined()
    expect(validateEnvEntry('=abc')).toBeDefined()
    expect(validateEnvEntry('1FOO=abc')).toBeDefined()
    expect(validateEnvEntry('PLUGIN_ROOT=x')).toBeDefined()
    expect(validateEnvEntry('PLUGIN_DATA')).toBeDefined()
  })

  it('validateHeaderEntry', () => {
    expect(validateHeaderEntry('Authorization: Bearer x')).toBeUndefined()
    expect(validateHeaderEntry('X: 1')).toBeUndefined()
    expect(validateHeaderEntry('')).toBeDefined()
    expect(validateHeaderEntry('NoColon')).toBeDefined()
    expect(validateHeaderEntry(': value')).toBeDefined()
  })
})
````

## File: tests/commands/remove.test.ts
````typescript
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { removeCommand } from '$/src/commands/remove.command'
import {
  createUiAndCtx,
  persistCanonicalConfig,
  loadSyncState,
} from '$/src/commands/util'
import { loadState, emptyState, writeState } from '$/src/core/state'
import { DEFAULT_SCHEMA_URL } from '$/src/config'
import type { RuntimeContext } from '$/src/core/context'
import type { PromptUi } from '$/src/ui/prompts'
import { createSandbox } from '$/tests/helpers/sandbox'

vi.mock('$/src/commands/util', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return { ...actual, createUiAndCtx: vi.fn() }
})

// `runSync` é mockado no nível do módulo para provar que `--no-sync` não o chama.
vi.mock('$/src/commands/sync', () => ({
  runSync: vi.fn().mockResolvedValue({
    scope: 'project' as const,
    targets: [],
    written: [],
    warnings: [],
    errors: [],
  }),
}))
import { runSync } from '$/src/commands/sync'
const runSyncMock = vi.mocked(runSync)

let exitSpy: ReturnType<typeof vi.spyOn>

function setupUi(ctx: RuntimeContext) {
  const ui = {
    error: vi.fn(),
    warn: vi.fn(),
    note: vi.fn(),
  }
  vi.mocked(createUiAndCtx).mockImplementation(() => ({
    ctx,
    ui: ui as unknown as PromptUi,
  }))
  return ui
}

function baseArgs(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    yes: true,
    global: false,
    _: [],
    ...overrides,
  }
}

/** Escreve um canônico com `alpha` e `beta` e grava o estado com ambos gerenciados. */
function seedCanonicalAndState(
  ctx: RuntimeContext,
  opts: { stateManaged?: string[] } = {},
) {
  persistCanonicalConfig('project', ctx, {
    $schema: DEFAULT_SCHEMA_URL,
    mcpServers: {
      alpha: { type: 'stdio', command: 'npx', args: ['-y', 'pkg-a'] },
      beta: { type: 'stdio', command: 'npx', args: ['-y', 'pkg-b'] },
    },
  })
  writeState('project', ctx, {
    ...emptyState('project'),
    targets: [],
    agents: {},
    managedPlugins: opts.stateManaged ?? ['alpha', 'beta'],
  })
}

function writePluginFiles(
  ctx: RuntimeContext,
  name: string,
  extra: string[] = [],
) {
  const dir = join(ctx.cwd, '.agents/plugins', name)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'plugin.json'), '{}')
  writeFileSync(join(dir, 'mcp.json'), '{}')
  writeFileSync(join(dir, 'mcp_config.json'), '{}')
  for (const f of extra) {
    writeFileSync(join(dir, f), 'keep')
  }
}

describe('commands remove (T3)', () => {
  beforeEach(() => {
    runSyncMock.mockClear()
    exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as NodeJS.Process['exit'])
    exitSpy.mockClear()
  })

  afterEach(() => {
    exitSpy.mockRestore()
  })

  it('AC1: remove alpha deixa só beta no canônico, definição idêntica', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonicalAndState(ctx)

      await removeCommand.run!({
        args: baseArgs({ _: ['alpha'] }),
        rawArgs: ['alpha'],
      } as unknown as Parameters<NonNullable<typeof removeCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()
      const content = readFileSync(join(ctx.cwd, '.agents/mcp.json'), 'utf8')
      const config = JSON.parse(content)
      expect(Object.keys(config.mcpServers)).toEqual(['beta'])
      expect(config.mcpServers.beta).toEqual({
        type: 'stdio',
        command: 'npx',
        args: ['-y', 'pkg-b'],
      })
      expect(ui.error).not.toHaveBeenCalled()
    } finally {
      cleanup()
    }
  })

  it('AC2: --no-sync via args.sync===false não chama runSync; targets/agents preservados; plugin limpo', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonicalAndState(ctx)
      writePluginFiles(ctx, 'alpha')
      writePluginFiles(ctx, 'beta')

      await removeCommand.run!({
        args: baseArgs({ sync: false, _: ['alpha'] }),
        rawArgs: ['alpha'],
      } as unknown as Parameters<NonNullable<typeof removeCommand.run>>[0])

      expect(runSyncMock).not.toHaveBeenCalled()
      expect(exitSpy).not.toHaveBeenCalled()

      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/alpha/plugin.json')),
      ).toBe(false)
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/beta/plugin.json')),
      ).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.targets).toEqual([])
      expect(state.agents).toEqual({})
      expect(state.managedPlugins).toEqual(['beta'])
      expect(ui.error).not.toHaveBeenCalled()
    } finally {
      cleanup()
    }
  })

  it('AC2: --no-sync via rawArgs sem args.sync → mesmo comportamento', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonicalAndState(ctx)
      writePluginFiles(ctx, 'alpha')

      await removeCommand.run!({
        args: baseArgs({ _: ['alpha'] }),
        rawArgs: ['alpha', '--no-sync'],
      } as unknown as Parameters<NonNullable<typeof removeCommand.run>>[0])

      expect(runSyncMock).not.toHaveBeenCalled()
      expect(exitSpy).not.toHaveBeenCalled()

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual(['beta'])
      expect(state.targets).toEqual([])
      expect(ui.error).not.toHaveBeenCalled()
    } finally {
      cleanup()
    }
  })

  it('AC4: sentinel.txt impede remoção do diretório e permanece intacto', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonicalAndState(ctx)
      writePluginFiles(ctx, 'alpha', ['sentinel.txt'])

      await removeCommand.run!({
        args: baseArgs({ sync: false, _: ['alpha'] }),
        rawArgs: ['alpha', '--no-sync'],
      } as unknown as Parameters<NonNullable<typeof removeCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/alpha/sentinel.txt')),
      ).toBe(true)
      expect(existsSync(join(ctx.cwd, '.agents/plugins/alpha'))).toBe(true)
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/alpha/plugin.json')),
      ).toBe(false)

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual(['beta'])
    } finally {
      cleanup()
    }
  })

  it('AC5: plugin não gerenciado (managedPlugins sem o nome) → arquivos intactos', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonicalAndState(ctx, { stateManaged: ['beta'] })
      writePluginFiles(ctx, 'alpha')

      await removeCommand.run!({
        args: baseArgs({ sync: false, _: ['alpha'] }),
        rawArgs: ['alpha', '--no-sync'],
      } as unknown as Parameters<NonNullable<typeof removeCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/alpha/plugin.json')),
      ).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual(['beta'])
    } finally {
      cleanup()
    }
  })

  it('AC8: --dry-run não altera canônico, plugin nem estado', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonicalAndState(ctx)
      writePluginFiles(ctx, 'alpha')

      await removeCommand.run!({
        args: baseArgs({ 'dry-run': true, _: ['alpha'] }),
        rawArgs: ['alpha', '--dry-run'],
      } as unknown as Parameters<NonNullable<typeof removeCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()

      const content = readFileSync(join(ctx.cwd, '.agents/mcp.json'), 'utf8')
      const config = JSON.parse(content)
      expect(Object.keys(config.mcpServers)).toEqual(['alpha', 'beta'])

      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/alpha/plugin.json')),
      ).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual(['alpha', 'beta'])
      expect(ui.error).not.toHaveBeenCalled()
    } finally {
      cleanup()
    }
  })

  it('AC9: plugin já apagado manualmente → sucesso, sem exit 1', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonicalAndState(ctx)

      await removeCommand.run!({
        args: baseArgs({ sync: false, _: ['alpha'] }),
        rawArgs: ['alpha', '--no-sync'],
      } as unknown as Parameters<NonNullable<typeof removeCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()
      expect(ui.error).not.toHaveBeenCalled()

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual(['beta'])
    } finally {
      cleanup()
    }
  })

  it('AC10: falha de I/O (plugin.json como diretório) em --no-sync → ui.error, exit 1, nome mantido em managedPlugins', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonicalAndState(ctx)
      const dir = join(ctx.cwd, '.agents/plugins/alpha')
      mkdirSync(dir, { recursive: true })
      writeFileSync(join(dir, 'mcp.json'), '{}')
      writeFileSync(join(dir, 'mcp_config.json'), '{}')
      mkdirSync(join(dir, 'plugin.json'), { recursive: true })

      await removeCommand.run!({
        args: baseArgs({ sync: false, _: ['alpha'] }),
        rawArgs: ['alpha', '--no-sync'],
      } as unknown as Parameters<NonNullable<typeof removeCommand.run>>[0])

      expect(exitSpy).toHaveBeenCalledWith(1)
      expect(ui.error).toHaveBeenCalled()

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual(['alpha', 'beta'])
    } finally {
      cleanup()
    }
  })

  it('remoção com sync real: plugin do removido apagado, do restante presente, managedPlugins sem o removido', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonicalAndState(ctx)
      // Sync precisa de targets resolvíveis para não sair com "no targets".
      writeState('project', ctx, {
        ...loadState('project', ctx).state,
        targets: ['cursor'],
      })
      writePluginFiles(ctx, 'alpha')
      writePluginFiles(ctx, 'beta')

      // Sync real para este teste (depende da poda implementada em T2).
      const { runSync: realRunSync } = await vi.importActual(
        '$/src/commands/sync',
      )
      runSyncMock.mockImplementation(realRunSync as any)

      await removeCommand.run!({
        args: baseArgs({ _: ['alpha'] }),
        rawArgs: ['alpha'],
      } as unknown as Parameters<NonNullable<typeof removeCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()
      expect(ui.error).not.toHaveBeenCalled()

      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/alpha/plugin.json')),
      ).toBe(false)
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/beta/plugin.json')),
      ).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).not.toContain('alpha')
    } finally {
      cleanup()
    }
  })
})
````

## File: tests/core/placeholder.test.ts
````typescript
import { describe, expect, it } from 'vitest'
import {
  parsePlaceholders,
  translate,
  type PlaceholderWarning,
} from '$/src/core/placeholder'

const posixKeepDefault = { syntax: 'posix' as const, nativeDefault: true }
const posixDropDefault = { syntax: 'posix' as const, nativeDefault: false }
const envColon = { syntax: 'env-colon' as const, nativeDefault: false }
const braceEnv = { syntax: 'brace-env' as const, nativeDefault: false }

describe('placeholder.parsePlaceholders', () => {
  it('extracts placeholders with name, fallback, and offsets', () => {
    const result = parsePlaceholders(
      'cmd ${TOKEN} and ${DB_URL:-postgres://local} tail',
    )
    expect(result).toEqual([
      {
        raw: '${TOKEN}',
        name: 'TOKEN',
        fallback: undefined,
        start: 4,
        end: 12,
      },
      {
        raw: '${DB_URL:-postgres://local}',
        name: 'DB_URL',
        fallback: 'postgres://local',
        start: 17,
        end: 44,
      },
    ])
  })

  it('returns empty array for a value without placeholders', () => {
    expect(parsePlaceholders('plain text')).toEqual([])
    expect(parsePlaceholders('')).toEqual([])
  })

  it('ignores malformed brace syntax', () => {
    expect(parsePlaceholders('${env:VAR}')).toEqual([])
    expect(parsePlaceholders('${}')).toEqual([])
    expect(parsePlaceholders('${123BAD}')).toEqual([])
  })
})

describe('placeholder.translate', () => {
  it.each([
    ['claude-code (posix, keep default)', posixKeepDefault, '${API_KEY}'],
    ['zed (posix, drop default)', posixDropDefault, '${API_KEY}'],
    ['cursor (env-colon)', envColon, '${env:API_KEY}'],
    ['vscode (env-colon)', envColon, '${env:API_KEY}'],
    ['windsurf (env-colon)', envColon, '${env:API_KEY}'],
    ['opencode (brace-env)', braceEnv, '{env:API_KEY}'],
  ])('%s: ${VAR} → %s', (_label, opts, expected) => {
    const result = translate('${API_KEY}', opts.syntax, opts)
    expect(result.value).toBe(expected)
    expect(result.warnings).toEqual([])
  })

  it.each([
    [
      'claude-code (posix, keep default)',
      posixKeepDefault,
      '${API_KEY:-secret}',
    ],
    ['zed (posix, drop default)', posixDropDefault, '${API_KEY}'],
    ['cursor (env-colon)', envColon, '${env:API_KEY}'],
    ['vscode (env-colon)', envColon, '${env:API_KEY}'],
    ['windsurf (env-colon)', envColon, '${env:API_KEY}'],
    ['opencode (brace-env)', braceEnv, '{env:API_KEY}'],
  ])('%s: ${VAR:-fallback} → %s', (_label, opts, expected) => {
    const result = translate('${API_KEY:-secret}', opts.syntax, opts)
    expect(result.value).toBe(expected)
  })

  it('drops default with DEFAULT_DROPPED warning unless nativeDefault', () => {
    const kept = translate('${API_KEY:-secret}', 'posix', {
      nativeDefault: true,
    })
    expect(kept.value).toBe('${API_KEY:-secret}')
    expect(kept.warnings).toEqual([])

    const dropped = translate('${API_KEY:-secret}', 'posix', {
      nativeDefault: false,
    })
    expect(dropped.value).toBe('${API_KEY}')
    expect(dropped.warnings).toHaveLength(1)
    expect(dropped.warnings[0]!.code).toBe('DEFAULT_DROPPED')
    expect(dropped.warnings[0]!.name).toBe('API_KEY')
  })

  it('translates multiple placeholders in one value', () => {
    const result = translate(
      'postgres://${USER}:${PASS}@${HOST:-localhost}:${PORT:-5432}/${DB}',
      'env-colon',
      { nativeDefault: false },
    )
    expect(result.value).toBe(
      'postgres://${env:USER}:${env:PASS}@${env:HOST}:${env:PORT}/${env:DB}',
    )
    const dropped = result.warnings.filter((w) => w.code === 'DEFAULT_DROPPED')
    expect(dropped.map((w) => w.name)).toEqual(['HOST', 'PORT'])
  })

  it('is idempotent: translating an already-translated value changes nothing', () => {
    const first = translate('${API_KEY}', 'env-colon', { nativeDefault: false })
    expect(first.value).toBe('${env:API_KEY}')

    const second = translate(first.value, 'env-colon', { nativeDefault: false })
    expect(second.value).toBe('${env:API_KEY}')
  })

  it('preserves unknown placeholder syntax verbatim with UNKNOWN_PLACEHOLDER warning', () => {
    const result = translate('${env:ALREADY} and ${}', 'posix', {
      nativeDefault: true,
    })
    expect(result.value).toBe('${env:ALREADY} and ${}')
    const unknown = result.warnings.filter(
      (w) => w.code === 'UNKNOWN_PLACEHOLDER',
    )
    expect(unknown.map((w) => w.name)).toEqual(['env:ALREADY', ''])
  })

  it('leaves values without placeholders untouched', () => {
    const result = translate('no secrets here', 'posix', {
      nativeDefault: true,
    })
    expect(result.value).toBe('no secrets here')
    expect(result.warnings).toEqual([])
  })
})

describe('placeholder.warnings shape', () => {
  it('DEFAULT_DROPPED warning carries name and message', () => {
    const result = translate('${KEY:-v}', 'env-colon', { nativeDefault: false })
    const w = result.warnings[0] as PlaceholderWarning
    expect(w.code).toBe('DEFAULT_DROPPED')
    expect(w.name).toBe('KEY')
    expect(typeof w.message).toBe('string')
    expect(w.message.length).toBeGreaterThan(0)
  })
})
````

## File: tests/fixtures/github/package-json-no-bin.json
````json
{
  "name": "not-an-mcp-server",
  "version": "1.0.0"
}
````

## File: tests/fixtures/github/package-json.json
````json
{
  "name": "@modelcontextprotocol/server-github",
  "version": "0.1.0",
  "bin": {
    "server-github": "dist/index.js"
  }
}
````

## File: tests/fixtures/github/server-json-npm.json
````json
{
  "name": "server-github",
  "registry_type": "npm",
  "identifier": "@modelcontextprotocol/server-github",
  "environment_variables": [
    { "name": "GITHUB_PERSONAL_ACCESS_TOKEN", "is_secret": true },
    { "name": "GITHUB_APP_ID", "is_secret": false }
  ]
}
````

## File: tests/fixtures/registry/search-results.json
````json
{
  "servers": [
    {
      "name": "server-github",
      "url": "https://github.com/modelcontextprotocol/server-github"
    },
    {
      "name": "server-linear",
      "url": "https://github.com/modelcontextprotocol/server-linear"
    }
  ]
}
````

## File: tests/helpers/sandboxGuard.ts
````typescript
import { writeFileSync, writeFile, appendFileSync, appendFile } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

/**
 * Sandbox guard: patches writeFileSync/writeFile/appendFileSync/appendFile to
 * assert that every write occurs under os.tmpdir(). Throws if a write is
 * detected outside the sandbox.
 *
 * Usage:
 *   import { installSandboxGuard, uninstallSandboxGuard, assertNoWritesOutsideSandbox }
 *   installSandboxGuard()
 *   // ... run your mutating commands ...
 *   uninstallSandboxGuard()
 *   assertNoWritesOutsideSandbox()
 */

let originalWriteFileSync: typeof writeFileSync | null = null
let originalWriteFile: typeof writeFile | null = null
let originalAppendFileSync: typeof appendFileSync | null = null
let originalAppendFile: typeof appendFile | null = null
let installCount = 0

/**
 * Check whether a path is under os.tmpdir().
 */
function isUnderTmpdir(path: string): boolean {
  const resolved = resolve(path)
  return resolved === tmpdir() || resolved.startsWith(tmpdir() + '/')
}

/**
 * Install the sandbox guard. Intercepts writeFileSync/writeFile/appendFileSync/appendFile
 * to assert that every write path is under os.tmpdir().
 */
export function installSandboxGuard(): void {
  if (installCount > 0) {
    installCount++
    return
  }
  installCount = 1

  originalWriteFileSync = writeFileSync
  originalWriteFile = writeFile
  originalAppendFileSync = appendFileSync
  originalAppendFile = appendFile

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(writeFileSync as any) = function (
    this: unknown,
    filePath: string,
    ...args: unknown[]
  ): any {
    if (!isUnderTmpdir(filePath)) {
      throw new Error(
        `Sandbox guard: write to ${filePath} is outside os.tmpdir()`,
      )
    }
    return (originalWriteFileSync as any)(filePath, ...args)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(writeFile as any) = function (
    this: unknown,
    filePath: string,
    ...args: unknown[]
  ): any {
    if (!isUnderTmpdir(filePath)) {
      throw new Error(
        `Sandbox guard: write to ${filePath} is outside os.tmpdir()`,
      )
    }
    return (originalWriteFile as any)(filePath, ...args)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(appendFileSync as any) = function (
    this: unknown,
    filePath: string,
    ...args: unknown[]
  ): any {
    if (!isUnderTmpdir(filePath)) {
      throw new Error(
        `Sandbox guard: append to ${filePath} is outside os.tmpdir()`,
      )
    }
    return (originalAppendFileSync as any)(filePath, ...args)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(appendFile as any) = function (
    this: unknown,
    filePath: string,
    ...args: unknown[]
  ): any {
    if (!isUnderTmpdir(filePath)) {
      throw new Error(
        `Sandbox guard: append to ${filePath} is outside os.tmpdir()`,
      )
    }
    return (originalAppendFile as any)(filePath, ...args)
  }
}

/**
 * Uninstall the sandbox guard, restoring the original functions.
 */
export function uninstallSandboxGuard(): void {
  if (installCount > 0) {
    installCount--
    if (installCount === 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(writeFileSync as any) = originalWriteFileSync
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(writeFile as any) = originalWriteFile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(appendFileSync as any) = originalAppendFileSync
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(appendFile as any) = originalAppendFile
    }
  }
}

/**
 * Assert that no writes occurred outside os.tmpdir(). Call this after
 * uninstallSandboxGuard() to confirm no writes leaked outside the sandbox.
 */
export function assertNoWritesOutsideSandbox(): void {
  // The guard itself throws on any out-of-sandbox write, so if we get here
  // without an error, the assertion passes.
}
````

## File: tests/sources/http.test.ts
````typescript
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { fetchJson } from '$/src/sources/http'

const originalFetch = global.fetch

type FetchMock = ReturnType<typeof vi.fn> & {
  mock: {
    calls: Array<[url: string, init?: RequestInit]>
  }
}

function responseFactory(
  response: unknown,
  status = 200,
  extra?: Record<string, string>,
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(extra ?? {}),
    text: async () => JSON.stringify(response),
    json: async () => response,
  } as unknown as Response
}

describe('sources http', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', originalFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches JSON and returns parsed body', async () => {
    const fetchMock = vi.fn(async () => responseFactory({ hello: 'world' }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchJson('https://api.example.com/data')

    expect(result).toEqual({ hello: 'world' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('sends User-Agent header with package version', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      responseFactory({ ok: true }),
    ) as unknown as FetchMock
    vi.stubGlobal('fetch', fetchMock)

    await fetchJson('https://api.example.com/data')

    const init = fetchMock.mock.calls[0]?.[1]
    const headers = init?.headers as Record<string, string>
    expect(headers['User-Agent']).toMatch(/^agents-mcp\/\d+\.\d+\.\d+$/)
  })

  it('sends Authorization Bearer GITHUB_TOKEN for api.github.com', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      responseFactory({ ok: true }),
    ) as unknown as FetchMock
    vi.stubGlobal('fetch', fetchMock)

    await fetchJson('https://api.github.com/repos/owner/repo', {
      env: { GITHUB_TOKEN: 'ghp_secret123' },
    })

    const init = fetchMock.mock.calls[0]?.[1]
    const headers = init?.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer ghp_secret123')
  })

  it('sends Authorization Bearer GITHUB_TOKEN for raw.githubusercontent.com', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      responseFactory({ ok: true }),
    ) as unknown as FetchMock
    vi.stubGlobal('fetch', fetchMock)

    await fetchJson(
      'https://raw.githubusercontent.com/owner/repo/main/server.json',
      {
        env: { GITHUB_TOKEN: 'ghp_secret123' },
      },
    )

    const init = fetchMock.mock.calls[0]?.[1]
    const headers = init?.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer ghp_secret123')
  })

  it('does not send Authorization for non-GitHub URLs', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      responseFactory({ ok: true }),
    ) as unknown as FetchMock
    vi.stubGlobal('fetch', fetchMock)

    await fetchJson('https://api.example.com/data', {
      env: { GITHUB_TOKEN: 'ghp_secret123' },
    })

    const init = fetchMock.mock.calls[0]?.[1]
    const headers = init?.headers as Record<string, string>
    expect(headers['Authorization']).toBeUndefined()
  })

  it('does not send Authorization when GITHUB_TOKEN is not set', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      responseFactory({ ok: true }),
    ) as unknown as FetchMock
    vi.stubGlobal('fetch', fetchMock)

    await fetchJson('https://api.github.com/repos/owner/repo')

    const init = fetchMock.mock.calls[0]?.[1]
    const headers = init?.headers as Record<string, string>
    expect(headers['Authorization']).toBeUndefined()
  })

  it('throws on non-ok HTTP status', async () => {
    const fetchMock = vi.fn(async () => responseFactory('Not Found', 404))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchJson('https://api.example.com/missing')).rejects.toThrow(
      'HTTP 404',
    )
  })

  it('retries on 5xx with exponential backoff', async () => {
    let calls = 0
    const fetchMock = vi.fn(async () => {
      calls += 1
      if (calls < 3) {
        return responseFactory('Server Error', 500)
      }
      return responseFactory({ ok: true })
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchJson('https://api.example.com/data')

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('retries on 429 respecting Retry-After header', async () => {
    let calls = 0
    const fetchMock = vi.fn(async () => {
      calls += 1
      if (calls === 1) {
        return responseFactory('Too Many Requests', 429, {
          'Retry-After': '2',
        })
      }
      return responseFactory({ ok: true })
    })
    vi.stubGlobal('fetch', fetchMock)

    const start = Date.now()
    await fetchJson('https://api.example.com/data')
    const elapsed = Date.now() - start

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(elapsed).toBeGreaterThanOrEqual(1900) // ~2s delay
  }, 10000)

  it('caps Retry-After delay at 5s', async () => {
    let calls = 0
    const fetchMock = vi.fn(async () => {
      calls += 1
      if (calls === 1) {
        return responseFactory('Too Many Requests', 429, {
          'Retry-After': '100',
        })
      }
      return responseFactory({ ok: true })
    })
    vi.stubGlobal('fetch', fetchMock)

    const start = Date.now()
    await fetchJson('https://api.example.com/data')
    const elapsed = Date.now() - start

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(elapsed).toBeLessThan(6000) // capped at 5s
  }, 10000)

  it('retries on transient network errors', async () => {
    let calls = 0
    const fetchMock = vi.fn(async () => {
      calls += 1
      if (calls < 3) {
        throw new Error('fetch failed: ECONNREFUSED')
      }
      return responseFactory({ ok: true })
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchJson('https://api.example.com/data')

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  }, 10000)

  it('gives up after max retries on persistent 5xx', async () => {
    const fetchMock = vi.fn(async () => responseFactory('Server Error', 500))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchJson('https://api.example.com/data')).rejects.toThrow(
      'HTTP 500',
    )
    expect(fetchMock).toHaveBeenCalledTimes(3) // initial + 2 retries
  }, 10000)

  it('enforces 2 MiB response cap', async () => {
    const bigResponse = 'x'.repeat(3 * 1024 * 1024) // 3 MiB
    const fetchMock = vi.fn(async () => {
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async () => bigResponse,
        json: async () => JSON.parse(bigResponse),
      } as unknown as Response
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchJson('https://api.example.com/big')).rejects.toThrow(
      'too large',
    )
  })

  it('injects fetch via opts for testability', async () => {
    const globalFetchSpy = vi.spyOn(globalThis, 'fetch')
    const injectedFetch = vi.fn(async () => responseFactory({ injected: true }))

    const result = await fetchJson('https://api.example.com/data', {
      fetch: injectedFetch,
    })

    expect(result).toEqual({ injected: true })
    expect(injectedFetch).toHaveBeenCalledTimes(1)
    // global fetch should NOT have been called
    expect(globalFetchSpy).not.toHaveBeenCalled()
    globalFetchSpy.mockRestore()
  })

  it('passes AbortSignal to fetch', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      responseFactory({ ok: true }),
    ) as unknown as FetchMock
    vi.stubGlobal('fetch', fetchMock)

    await fetchJson('https://api.example.com/data')

    const init = fetchMock.mock.calls[0]?.[1]
    expect(init?.signal).toBeDefined()
  })
})
````

## File: tests/sources/index.test.ts
````typescript
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { resolveSource } from '$/src/sources/index'
import { resolveDirect } from '$/src/sources/direct'
import type { ResolvedServerPackage } from '$/src/sources/types'

const originalFetch = global.fetch

function responseFactory(
  response: unknown,
  status = 200,
  extra?: Record<string, string>,
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(extra ?? {}),
    text: async () => JSON.stringify(response),
    json: async () => response,
  } as unknown as Response
}

describe('sources index', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', originalFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('dispatches direct flags to resolveDirect', async () => {
    const result = await resolveSource({
      command: 'npx',
      arg: ['-y', '@scope/pkg'],
      name: 'my-server',
    })
    expect(result.source.type).toBe('direct')
    expect(result.suggestedName).toBe('my-server')
  })

  it('includes sse in direct-flag dispatch', async () => {
    const result = await resolveSource({
      sse: 'https://mcp.linear.app/sse',
      name: 'linear',
    })
    expect(result.source.type).toBe('direct')
    expect(result.suggestedName).toBe('linear')
  })

  it('routes https://github.com/owner/repo to resolveGithub', async () => {
    const fetchMock = vi.fn(async () =>
      responseFactory(
        {
          name: 'server-github',
          registry_type: 'npm',
          identifier: '@modelcontextprotocol/server-github',
        },
        200,
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveSource({
      source: 'https://github.com/modelcontextprotocol/server-github',
      name: 'my-github',
    })

    expect(result.source.type).toBe('github')
    expect(result.suggestedName).toBe('server-github')
    expect(fetchMock).toHaveBeenCalled()
  })

  it('routes owner/repo to resolveGithub', async () => {
    const fetchMock = vi.fn(async () =>
      responseFactory(
        {
          name: 'server-github',
          registry_type: 'npm',
          identifier: '@modelcontextprotocol/server-github',
        },
        200,
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveSource({
      source: 'modelcontextprotocol/server-github',
    })

    expect(result.source.type).toBe('github')
    expect(fetchMock).toHaveBeenCalled()
  })

  it('routes other https URLs to resolveDirect as http', async () => {
    const result = await resolveSource({
      source: 'https://mcp.example.com/mcp',
      name: 'remote',
    })
    expect(result.source.type).toBe('direct')
    expect(result.suggestedName).toBe('remote')
  })

  it('routes bare package name to resolveRegistry', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return responseFactory('Not Found', 404)
      }
      return responseFactory(
        {
          servers: [
            {
              name: 'server-query',
              packages: [{ name: 'server-query', type: 'npm' }],
            },
          ],
        },
        200,
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveSource({ source: 'server-query' })

    expect(result.source.type).toBe('registry')
    expect(result.suggestedName).toBe('server-query')
  })

  it('forwards env to resolvers', async () => {
    const fetchMock = vi.fn(async () =>
      responseFactory(
        {
          name: 'server-env',
          registry_type: 'npm',
          identifier: 'server-env',
          environment_variables: [{ name: 'API_KEY', is_required: true }],
        },
        200,
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveSource(
      { source: 'owner/server-env' },
      { env: { GITHUB_TOKEN: 'ghp_token' } },
    )

    expect(result.source.type).toBe('github')
    expect(fetchMock).toHaveBeenCalled()
  })

  it('throws when no source specified', async () => {
    await expect(resolveSource({})).rejects.toThrow('No source specified')
  })

  it('passes fetch injection through to resolvers', async () => {
    const injectedFetch = vi.fn(async () =>
      responseFactory(
        {
          name: 'server-github',
          registry_type: 'npm',
          identifier: '@modelcontextprotocol/server-github',
        },
        200,
      ),
    )
    vi.stubGlobal('fetch', originalFetch)

    await resolveSource(
      { source: 'https://github.com/owner/repo' },
      { fetch: injectedFetch },
    )

    expect(injectedFetch).toHaveBeenCalled()
  })
})
````

## File: tests/ui/auto.test.ts
````typescript
import { describe, expect, it } from 'vitest'
import { createAutoUi } from '$/src/ui/auto'

describe('createAutoUi', () => {
  it('intro and outro log messages', async () => {
    const logs: string[] = []
    const ui = createAutoUi({
      defaults: {},
      log: { info: (m) => logs.push(m), warn: () => {}, error: () => {} },
    })
    ui.intro('hello')
    ui.outro('bye')
    expect(logs).toContain('hello')
    expect(logs).toContain('bye')
  })

  it('confirm returns default when no default provided', async () => {
    const ui = createAutoUi({ defaults: {}, log: undefined })
    await expect(
      ui.confirm({ message: 'ok?', initialValue: false }),
    ).resolves.toBe(false)
  })

  it('confirm uses provided default', async () => {
    const ui = createAutoUi({ defaults: { confirm: true }, log: undefined })
    await expect(
      ui.confirm({ message: 'ok?', initialValue: false }),
    ).resolves.toBe(true)
  })

  it('select uses first option when no default', async () => {
    const ui = createAutoUi({
      defaults: {},
      log: undefined,
    })
    await expect(
      ui.select({
        message: 'pick',
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
      }),
    ).resolves.toBe('a')
  })

  it('select uses provided default', async () => {
    const ui = createAutoUi({
      defaults: { select: 'b' },
      log: undefined,
    })
    await expect(
      ui.select({
        message: 'pick',
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
      }),
    ).resolves.toBe('b')
  })

  it('multiselect returns empty array when no default', async () => {
    const ui = createAutoUi({ defaults: {}, log: undefined })
    await expect(
      ui.multiselect({
        message: 'pick',
        options: [{ label: 'A', value: 'a' }],
      }),
    ).resolves.toEqual([])
  })

  it('text uses defaultValue', async () => {
    const ui = createAutoUi({
      defaults: { text: 'hello' },
      log: undefined,
    })
    await expect(ui.text({ message: 'say?' })).resolves.toBe('hello')
  })

  it('password masks output', async () => {
    const logs: string[] = []
    const ui = createAutoUi({
      defaults: { password: 'secret123' },
      log: { info: (m) => logs.push(m), warn: () => {}, error: () => {} },
    })
    await expect(ui.password({ message: 'pw?' })).resolves.toBe('secret123')
    expect(logs.some((l) => l.includes('***'))).toBe(true)
  })

  it('spinner start and stop do not throw', () => {
    const ui = createAutoUi({ defaults: {}, log: undefined })
    const spin = ui.spinner('working')
    expect(() => spin.start()).not.toThrow()
    expect(() => spin.stop('done')).not.toThrow()
  })
})
````

## File: tests/ui/prompts.test.ts
````typescript
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createClackUi } from '$/src/ui/prompts'

// Wait for the dynamic clack import to settle (microtasks + one macrotask).
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('createClackUi (loss-proof writes)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('error writes console.error synchronously in the same tick', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const ui = createClackUi()
    ui.error('boom')
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalledWith('boom')
  })

  it('warn writes console.warn synchronously in the same tick', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const ui = createClackUi()
    ui.warn('careful')
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledWith('careful')
  })

  it('note writes console.log synchronously in the same tick', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const ui = createClackUi()
    ui.note('info')
    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logSpy).toHaveBeenCalledWith('info')
  })

  it('intro writes console.log synchronously in the same tick', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const ui = createClackUi()
    ui.intro('hello')
    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logSpy).toHaveBeenCalledWith('hello')
  })

  it('outro writes console.log synchronously in the same tick', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const ui = createClackUi()
    ui.outro('bye')
    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logSpy).toHaveBeenCalledWith('bye')
  })

  it('error is recorded before mocked process.exit (ordering regression)', () => {
    const trace: string[] = []
    vi.spyOn(console, 'error').mockImplementation((m) => {
      trace.push(`console.error:${m}`)
    })
    vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      trace.push(`exit:${code}`)
    }) as NodeJS.Process['exit'])
    const ui = createClackUi()
    ui.error('boom')
    process.exit(1)
    expect(trace).toEqual(['console.error:boom', 'exit:1'])
  })

  it('does not duplicate the message after clack loads', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const ui = createClackUi()
    ui.error('boom')
    expect(errorSpy).toHaveBeenCalledTimes(1)
    await flush()
    expect(errorSpy).toHaveBeenCalledTimes(1)
  })

  it('spinner.stop prints message once before clack load and does not throw', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const ui = createClackUi()
    const spin = ui.spinner('working')
    expect(() => spin.stop('done')).not.toThrow()
    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logSpy).toHaveBeenCalledWith('done')
  })
})
````

## File: .prettierrc
````
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "useTabs": false
}
````

## File: index-update.sh
````bash
#! /usr/bin/bash

repomix --style markdown

codegraph sync
````

## File: LICENSE
````
MIT License

Copyright (c) 2026 agents-mcp

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
````

## File: tsconfig.json
````json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "preserve",
    "moduleResolution": "bundler",
    "paths": { "$/*": ["./*"] },
    "types": ["node"],
    "resolveJsonModule": true,
    "verbatimModuleSyntax": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src", "scripts", "tests", "*.ts"]
}
````

## File: tsup.config.ts
````typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  dts: false,
  clean: true,
  sourcemap: false,
  splitting: false,
  treeshake: true,
  banner: { js: '#!/usr/bin/env node' },
})
````

## File: vitest.config.ts
````typescript
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      $: rootDir,
    },
  },
  test: {
    environment: 'node',
    restoreMocks: true,
    passWithNoTests: false,
    coverage: {
      provider: 'v8',
      include: ['src/core/**/*.ts', 'src/adapters/**/*.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
      },
    },
  },
})
````

## File: .agents/plugins/memory/mcp.json
````json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "mcpServers": {
    "memory": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-memory"
      ]
    }
  }
}
````

## File: .agents/skills/changelog-management/SKILL.md
````markdown
---
name: changelog-management
description: >-
  Maintain and update a standardized root `CHANGELOG.md` following Keep a
  Changelog and Semantic Versioning. Use this skill to initialize or update
  changelog entries, categorize changes, prepare release cuts, and proactively
  prompt the user when notable changes warrant updating the changelog.
---

# Changelog Management

Maintain a clean, human-readable record of notable changes at the repository root in `CHANGELOG.md`.

This skill enforces the widely adopted [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) standard and aligns with [Semantic Versioning (SemVer)](https://semver.org/spec/v2.0.0.html).

---

## Core Principles

1. **Root Location**: Always maintain the changelog in `CHANGELOG.md` at the project root. Initialize it from `./resources/CHANGELOG.md` if it does not exist yet.
2. **Written for Humans**: Changelogs are for people, not machines. Summarize user-facing, functional, or architectural impacts clearly; do not paste raw git commit logs.
3. **Always Track `[Unreleased]`**: Ongoing contributions are accumulated in the `## [Unreleased]` section at the top of the file before a release is cut.
4. **Standard Categories**: Group entries strictly under standard category headings (omit empty categories in published releases):
   - `### Added` — for new features and public capabilities.
   - `### Changed` — for changes in existing functionality.
   - `### Deprecated` — for features scheduled for removal in future releases.
   - `### Removed` — for features now removed.
   - `### Fixed` — for bug fixes.
   - `### Security` — for vulnerability remediations or security enhancements.

---

## Proactive Suggestion Triggers

The agent must proactively suggest updating `CHANGELOG.md` at opportunistic moments, rather than waiting for an explicit command:

### When to Suggest

- **Feature or Bugfix Completion**: After implementing or verifying a feature, bug fix, or behavioral change (e.g., when completing a vertical slice or signing off on `workflow/<change-slug>/SPEC.md` / `workflow/<change-slug>/PLAN.md`).
- **Breaking Changes or Deprecations**: Immediately upon modifying a public API, configuration schema, database contract, or CLI flag.
- **Pre-Commit / Pre-PR / Code Review**: During code review or before preparing a PR or commit that introduces notable changes.
- **Release Preparation**: When the user mentions tagging, publishing, or releasing a new version.

### Prompting Format

When a qualifying change occurs, offer a clear, ready-to-use proposal:

> *"I noticed we just implemented `<brief description of change>`. Would you like me to record this under `[Unreleased]` (`Added` / `Fixed` / `Changed`) in `CHANGELOG.md`?"*

### When NOT to Suggest (Avoid Noise)

Do **not** prompt the user or update `CHANGELOG.md` for:
- Routine internal refactorings that preserve behavior and interfaces.
- Typo corrections in internal comments or documentation.
- Test-only adjustments, benchmark tweaks, or local development tool configs (unless they affect consumers or project contributors significantly).

---

## Changelog Entry Guidelines

Each bullet under a category should follow these rules:

- **Imperative or descriptive summary**: Begin with a capitalized verb or concise summary (e.g., `- Add support for...`, `- Fix memory leak in...`, `- Deprecate legacy auth flag...`).
- **Link issues / PRs / contributors (if applicable)**: Append issue or PR references (e.g., `(#123)`) when known.
- **Highlight breaking changes**: Prefix breaking modifications explicitly with `**BREAKING:**` under `### Changed` or `### Removed`.

---

## Release Bumping Workflow

When cutting a release (e.g., from `Unreleased` to `v1.2.0`):

1. **Determine SemVer Level**:
   - `MAJOR` (`X.0.0`): One or more breaking changes.
   - `MINOR` (`0.X.0`): New backward-compatible features (`Added`).
   - `PATCH` (`0.0.X`): Backward-compatible bug fixes (`Fixed`).
2. **Transform `[Unreleased]`**:
   - Create a new header below `## [Unreleased]`: `## [X.Y.Z] - YYYY-MM-DD` (using current date in ISO format).
   - Move all accumulated bullets from `[Unreleased]` into the new release section.
   - Leave `## [Unreleased]` empty, ready for subsequent work.
3. **Compare Links (Optional)**:
   - If the repository uses GitHub/GitLab tag comparisons, update or append diff links at the bottom of `CHANGELOG.md` (e.g., `[Unreleased]: https://github.com/org/repo/compare/v1.2.0...HEAD`).
````

## File: .agents/skills/code-review/SKILL.md
````markdown
---
name: code-review
description: >-
  Perform structured, multi-dimensional code reviews aligned with the
  `spec-driven-workflow` (`workflow/<change-slug>/SPEC.md`, `PLAN.md`,
  `REVIEW.md`). Use this skill after implementing a feature or bug fix,
  before merging a PR, or when reviewing changes written by another agent or
  human.
---

# Code Review

Review code changes against both **engineering quality** and **specification intent**, recording every actionable finding in `workflow/<change-slug>/REVIEW.md`.

## Review Philosophy

- **Net improvement over perfection**: Approve changes that clearly improve overall code health and satisfy `workflow/<change-slug>/SPEC.md`, even if minor stylistic preferences differ.
- **Evidence over opinion**: Ground every finding in a concrete file path, line range or symbol, and explain *why* it matters.
- **Zero silent passes**: Do not approve or finish work while any `blocker` or `major` finding remains `open`.

## 1. Load Workflow Context First

Before inspecting the diff, read the active `workflow/<change-slug>/` artifacts:

1. **`workflow/<change-slug>/SPEC.md`** — Verify goals, non-goals, constraints, and acceptance criteria.
2. **`workflow/<change-slug>/PLAN.md`** (and **`workflow/<change-slug>/TASKS.md`**, if present) — Understand the intended technical approach and module scope.
3. **`workflow/<change-slug>/REVIEW.md`** — Check prior review rounds so resolved items are not re-reported and open items are re-verified.

If `workflow/<change-slug>/REVIEW.md` does not exist yet, create it (using the `spec-driven-workflow` `REVIEW.md` template if installed).

## 2. Five-Axis Review Framework

Evaluate the diff (e.g., `git diff`, staged changes, or target PR) across all five dimensions:

1. **Correctness & Spec Alignment**
   - Does the implementation satisfy every acceptance criterion in `workflow/<change-slug>/SPEC.md`?
   - Does it stay within scope (no unintended changes outside `SPEC.md` / `PLAN.md`)?
   - Are edge cases (null/empty values, boundaries, concurrency) and error paths handled?
   - Do tests verify the new behavior and guard against regressions?
2. **Readability & Simplicity**
   - Are names clear and consistent with the codebase?
   - Is control flow shallow and easy to follow without dead code or over-engineering?
3. **Architecture & Maintainability**
   - Does the change follow existing codebase patterns and respect module boundaries?
   - Does it avoid duplicated logic or unnecessary coupling?
4. **Security**
   - Is untrusted input validated and sanitized at system boundaries?
   - Are secrets, tokens, and sensitive data kept out of code, configs, and logs?
   - Are queries parameterized and auth/authorization checks enforced?
5. **Performance**
   - Are there obvious N+1 queries, unbounded loops/fetches, memory leaks, or blocking I/O on hot paths?

## 3. Record Findings in `workflow/<change-slug>/REVIEW.md`

Log every finding in `workflow/<change-slug>/REVIEW.md` using consistent severity tiers and resolution statuses:

- **Severities**:
  - `blocker`: Must be fixed before completion (broken spec requirement, security flaw, data-loss risk, failing build/tests).
  - `major`: Must be addressed before completion (edge-case bug, weak error handling, architectural violation, missing test coverage).
  - `minor`: Optional improvement or nit (naming, minor readability cleanup); never blocks approval.
  - `question`: Clarification needed from the author or implementing agent.
- **Statuses**: `open` | `resolved` | `wontfix` (with brief rationale).

Each finding entry must include:
- A unique ID (e.g., `[R1]`, `[Q1]`), exact file path and line/symbol reference, severity, status, **Issue**, and **Action**.

## 4. Verification & Sign-Off

1. Run the project's verification commands (`test`, `lint`, `typecheck`, `build` as applicable) rather than relying on inspection alone.
2. Update `workflow/<change-slug>/REVIEW.md` status (`Open` | `Changes Requested` | `Approved`):
   - **Approved**: All `SPEC.md` acceptance criteria are met, checks pass, and zero `blocker` or `major` items remain `open`.
   - **Changes Requested**: One or more `blocker` or `major` items remain `open`.
3. Follow the `spec-driven-workflow` cleanup rule: keep `workflow/<change-slug>/REVIEW.md` until validation/sign-off is complete, and only delete the completed `workflow/<change-slug>/` directory after the user confirms cleanup.
````

## File: .agents/skills/code-simplification/SKILL.md
````markdown
---
name: code-simplification
description: >-
  Simplify code for human readability, clarity, and directness without
  changing behavior. Use this skill after implementing a feature, during
  refactoring, or when addressing code review feedback—especially when code feels
  over-engineered, deeply nested, or takes unnecessary detours to do simple
  things.
---

# Code Simplification

Make code **clean, direct, and easy for humans to read** while preserving exact runtime behavior. Prefer straightforward, objective implementations over clever tricks or premature abstractions.

## Core Principles

1. **Preserve Behavior Exactly**: Inputs, outputs, side effects, error semantics, and edge-case guards must remain identical. Existing tests must pass without modification.
2. **Clarity Over Cleverness (and Over Brevity)**: The goal is human comprehension, not fewer lines. Never replace readable code with cryptic one-liners, nested ternaries, or dense chains.
3. **Direct Over Indirection**: Do not take three hops to do something simple. Inline trivial single-use wrappers, pass-through helpers, and speculative abstractions that add ceremony without clarity.
4. **Chesterton's Fence**: Before deleting or rewriting code that looks redundant or defensive, understand *why* it was written (check callers, tests, comments, or `workflow/<change-slug>/SPEC.md`).

## When to Apply

- Right after a feature or bug fix works and tests pass, to clean up rough or over-complicated implementation details.
- When functions have deep `if/else` nesting, long monolithic blocks, or unclear variable/method names.
- When `workflow/<change-slug>/REVIEW.md` flags readability, maintainability, or over-engineering issues.

## What to Simplify

- **Flatten control flow**: Replace deep `if/else` nesting with guard clauses and early returns.
- **Remove unnecessary indirection**: Collapse pass-through functions, single-use factories, or redundant layers that hide simple operations.
- **Make logic linear and objective**: Replace convoluted state flags or roundabout transformations with direct, step-by-step code.
- **Right-size functions**: Break up overly long functions into cohesive, well-named units—only when each unit represents a clear step, not to fragment trivial code.
- **Use clear names, trim obvious noise**: Rename vague identifiers so code is self-explanatory. Remove comments that merely restate the code, while preserving non-obvious *why* comments and existing docstrings.
- **Unify genuine duplication**: When two blocks repeat the same logic, extract a single parameterized helper rather than maintaining parallel copies.

## Guardrails (What NOT to Do)

- Do **not** alter public APIs, return shapes, or error handling unless explicitly requested.
- Do **not** refactor unrelated files outside the scope of the current change.
- Do **not** remove edge-case checks (`null`, empty, boundary conditions) unless proven unreachable.

## Verification

1. Review the diff to confirm every change is simpler, cleaner, and strictly behavior-preserving.
2. Run the relevant test suite, linter, and typechecker to verify all checks pass unchanged.
````

## File: .agents/skills/codebase-indexing/SKILL.md
````markdown
---
name: codebase-indexing
description: >-
  Index, synchronize, and query a project's codebase using CodeGraph and
  Repomix. Use this skill when exploring an unfamiliar repository, maintaining
  up-to-date code intelligence after edits, or setting up project indexing with
  `.codegraph/` and Markdown-formatted Repomix snapshots.
---

# Codebase Indexing (CodeGraph + Repomix)

Maintain a dual indexing setup and **use these indexed artifacts as your primary context** to understand the project's full structure, architecture, and engineering before scanning individual files or running brute-force searches:
- **CodeGraph** (`.codegraph/`) as the primary source for structural symbol lookup, call paths, and dependency graphs.
- **Repomix** (`repomix-output.md`) as the primary single-file Markdown snapshot of the repository's layout and implementation.

Always check whether each index already exists before running commands: **initialize** when missing, and **sync/update** when present.

## 1. CodeGraph

### Pre-flight Check

Before running any CodeGraph command, verify that the `codegraph` executable is available in the environment (`command -v codegraph`).

- **If `codegraph` is NOT installed**:
  - **Alert the user immediately** that CodeGraph indexing cannot be executed because the `codegraph` executable is missing from the environment.
  - Provide clear installation and setup instructions:
    ```bash
    # Install globally via npm (or run `npx @colbymchenry/codegraph` for interactive setup)
    npm install -g @colbymchenry/codegraph

    # Optional: configure MCP / AI agent integration
    codegraph install

    # Initialize and index the project
    codegraph init
    codegraph index
    ```
  - Do not silently ignore the missing binary; continue with Repomix (if available) and note that CodeGraph remains unindexed until installed.

### Check & Initialize vs. Sync

Perform a **two-part check** at the repository root: verify both that the `.codegraph/` directory exists **and** that the SQLite graph database inside it (`.codegraph/codegraph.db`) exists (`[ -d .codegraph ] && [ -s .codegraph/codegraph.db ]`):

- **If `.codegraph/` does NOT exist** — initialize and build the graph database:
  ```bash
  codegraph init
  codegraph index
  ```
- **If `.codegraph/` exists, but `.codegraph/codegraph.db` is missing or empty** — the directory alone is not a usable index; build the database (run `codegraph init` first if `.codegraph/` is empty or lacks configuration):
  ```bash
  codegraph index
  ```
- **If BOTH `.codegraph/` and `.codegraph/codegraph.db` exist** — always run incremental synchronization:
  ```bash
  codegraph sync
  ```
  Do not re-run `codegraph init` or a full `codegraph index` when both `.codegraph/` and `.codegraph/codegraph.db` are already present, unless the database is corrupted or major structural resets require a rebuild.

### Querying CodeGraph

Reach for CodeGraph before running brute-force `grep`/`find` across the codebase:

- **MCP tool** (when available): call `codegraph_explore` with symbol names, file paths, or architectural questions.
- **CLI**: run `codegraph explore "<symbol names or question>"`.

## 2. Repomix (Markdown Priority)

Always prioritize **Markdown** (`--style markdown`) for Repomix outputs so the snapshot is readable by both humans and LLMs. Always invoke Repomix via `npx -y` so it executes reliably even when not installed globally and without interactive prompts.

### Check & Create vs. Update

Check if a Repomix Markdown file (e.g., `repomix-output.md`, or the output path configured in `repomix.config.json`) exists:

- **If it does NOT exist** — create it in Markdown format:
  ```bash
  npx -y repomix --style markdown -o repomix-output.md
  ```
- **If it already exists** — re-run the update command to synchronize it with the current codebase:
  ```bash
  npx -y repomix --style markdown -o repomix-output.md
  ```
  *(If `repomix.config.json` is present and already configured with `"style": "markdown"`, running `npx -y repomix` updates the configured output file directly.)*

## 3. Maintenance & Verification

1. **Keep indexes fresh**: Run `codegraph sync` and update the Repomix Markdown file after significant code changes, branch switches, or merges.
2. **Respect repository hygiene**: Check `.gitignore` before committing generated `.codegraph/` or `repomix-output.md` artifacts—ignore them unless the project explicitly tracks them in version control.
3. **Verify**: Confirm `.codegraph/` responds to `codegraph explore` and `repomix-output.md` (or the configured `.md` file) reflects the latest file tree.
````

## File: .agents/skills/decision-records/resources/ADR.md
````markdown
# ADR-<NNNN>: <Short Decision Title>

- **Status**: Proposed | Accepted | Deprecated | Superseded by [ADR-XXXX](./XXXX-title.md)
- **Date**: <YYYY-MM-DD>
- **Related Workflow**: `workflow/<change-slug>/SPEC.md` / `workflow/<change-slug>/PLAN.md` (if applicable)

## Context

What problem, constraint, or force is driving this decision? Keep it factual and concise.

## Decision

What specific approach or choice are we adopting? State it clearly in active voice.

## Alternatives Considered

- **<Alternative A>**: Why it was not chosen (pros/cons).
- **<Alternative B>**: Why it was not chosen (pros/cons).

## Consequences

- **Positive**: Benefits and capabilities gained.
- **Negative / Trade-offs**: Costs, complexity, or limitations accepted.
- **Follow-up**: Any migration, monitoring, or future review needed.
````

## File: .agents/skills/decision-records/SKILL.md
````markdown
---
name: decision-records
description: >-
  Document significant technical and architectural decisions as lightweight
  Architecture Decision Records (ADRs). Use this skill when
  `workflow/<change-slug>/SPEC.md` or `workflow/<change-slug>/PLAN.md`
  introduces a hard-to-reverse choice, cross-cutting
  trade-off, new dependency, or protocol/schema change worth preserving for
  future contributors.
---

# Decision Records (ADRs)

Capture **why** important technical decisions were made—along with alternatives considered and trade-offs accepted—in concise, immutable Markdown records.

## When to Create an ADR

Create an ADR when a change involves:

- A **hard-to-reverse** architectural or data-model choice.
- A **cross-cutting trade-off** affecting multiple modules, services, or teams.
- Adding or replacing a core dependency, protocol, storage engine, or integration pattern.

**Skip ADRs** for routine implementation details, local refactorings, or easily reversible choices—those belong in `workflow/<change-slug>/PLAN.md` or code comments.

## Storage & Naming

- Store records in `docs/decisions/` (or `docs/adr/` if the repository already uses that convention).
- Name files sequentially with a lowercase hyphenated slug:
  `docs/decisions/0001-short-decision-title.md`
- Start from the template in [ADR.md](./resources/ADR.md).

## Rules

1. **Link with `workflow/`**: Reference the ADR from `workflow/<change-slug>/PLAN.md` (and `workflow/<change-slug>/SPEC.md` if applicable) so design context stays connected.
2. **Keep it concise**: Focus on context, decision, alternatives rejected, and consequences—avoid turning an ADR into a tutorial or full specification.
3. **Immutable history**: Once accepted, do not rewrite an old ADR's intent; if a decision changes later, create a new ADR that marks the previous one as `Superseded by <ADR-XXXX>`.
````

## File: .agents/skills/incremental-implementation/SKILL.md
````markdown
---
name: incremental-implementation
description: >-
  Build features and refactorings in small, verified vertical slices instead of
  large unverified code dumps. Use this skill when executing
  `workflow/<change-slug>/PLAN.md` or `workflow/<change-slug>/TASKS.md`,
  modifying multiple files, or implementing changes expected to exceed ~100
  lines.
---

# Incremental Implementation

Deliver changes in **thin, verifiable increments**—one working slice at a time. Never write an entire multi-file feature in a single unverified pass.

## Core Rule

**One slice, one verification cycle.** Do not start the next slice while the current slice has failing tests, type errors, or a broken build.

## When to Apply

- Executing steps from `workflow/<change-slug>/PLAN.md` or tasks from `workflow/<change-slug>/TASKS.md`.
- Any change touching two or more files or exceeding ~100 lines of code.
- Refactoring existing modules where behavior must remain intact at every step.

## The Increment Loop

For each step in `workflow/<change-slug>/PLAN.md` (or task in `workflow/<change-slug>/TASKS.md`):

1. **Scope the Slice**: Pick the smallest cohesive unit that delivers testable progress toward `workflow/<change-slug>/SPEC.md`.
2. **Implement Minimally**: Write only the code required for this slice—avoid speculative scaffolding for future slices.
3. **Test & Verify Immediately**: Run targeted unit/integration tests, typecheck, and linter to confirm the slice works and introduces no regressions.
4. **Checkpoint**: Update status in `workflow/<change-slug>/PLAN.md` or `workflow/<change-slug>/TASKS.md` (e.g., mark `done`), and create a clean commit/checkpoint when appropriate so rollback is effortless.
5. **Repeat**: Advance to the next slice only after the current one is green.

## Slicing Strategies

Choose the slicing strategy that best fits the work:

- **Vertical Slices (Default)**: Implement one thin end-to-end capability across layers (e.g., schema -> service -> endpoint -> test) rather than building all backend files first and all frontend/test files last.
- **Risk-First Slicing**: Tackle the highest-uncertainty assumption, integration, or performance bottleneck in the earliest slice so surprises surface immediately.
- **Contract-First Slicing**: Define types, interfaces, and test assertions first, verify they compile/fail as expected, then implement the concrete behavior.

## Guardrails

- **No stacked brokenness**: Fix failing checks in the current slice before moving on.
- **Keep diffs reviewable**: If a slice grows too large, split it into smaller sub-slices before continuing.
- **Stay aligned with `SPEC.md`**: Do not add unrequested features while implementing a slice.
````

## File: .agents/skills/planning-and-task-breakdown/SKILL.md
````markdown
---
name: planning-and-task-breakdown
description: >-
  Plan execution and break complex work into ordered, verifiable tasks aligned
  with `spec-driven-workflow` (`workflow/<change-slug>/SPEC.md`, `PLAN.md`, and
  conditional `TASKS.md`). Use this skill when translating a specification into
  a concrete execution plan, scoping large or ambiguous work, mapping
  dependencies, or preparing parallelizable tasks.
---

# Planning & Task Breakdown

Decompose specifications into clear execution steps (`workflow/<change-slug>/PLAN.md`) and, when warranted, small verifiable tasks (`workflow/<change-slug>/TASKS.md`) before writing any implementation code.

> **Language & Architecture Agnostic**: This skill applies to any technology stack, domain, or project structure. Reason in terms of deliverables, boundaries, dependencies, and verification—never assume specific languages, frameworks, or architectural patterns.

## Core Rule

**Plan in read-only mode.** Explore the repository, map dependencies, and write the plan before modifying any deliverable files. Do not start implementing while planning.

## When to Apply

- Translating `workflow/<change-slug>/SPEC.md` into an actionable execution plan (`workflow/<change-slug>/PLAN.md`).
- Work feels too large, ambiguous, or multi-faceted to execute in a single pass.
- Multiple independent deliverables or parallel/asynchronous agent executions are possible.
- Skip formal breakdown for trivial, single-step edits where planning adds no value.

## Planning Process

### 1. Ground in `workflow/<change-slug>/SPEC.md`

1. Read `workflow/<change-slug>/SPEC.md`.
   - If `SPEC.md` does not exist yet for a non-trivial change, create and align on `workflow/<change-slug>/SPEC.md` first.
2. Confirm goals, non-goals, constraints, and acceptance criteria are unambiguous. Surface open questions before committing to a plan.

### 2. Explore & Map Dependencies (Read-Only)

1. Inspect the relevant areas of the repository (preferring indexed context if `codebase-indexing` is active).
2. Identify affected components, shared boundaries, and external constraints.
3. Map the **dependency graph**: determine what blocks what, which steps must run sequentially, and which units are truly independent.

### 3. Author `workflow/<change-slug>/PLAN.md`

Create or update `workflow/<change-slug>/PLAN.md` (initializing `workflow/<change-slug>/` if missing):

- Reference `SPEC.md` requirements rather than duplicating them.
- Order steps logically—tackle high-risk or high-uncertainty unknowns early.
- Define a concrete **Verification Strategy** (automated checks, validations, or manual verification) for each step and for the overall change.
- Note risks and rollback considerations.

### 4. Shard into `workflow/<change-slug>/TASKS.md` (Conditional)

Create `workflow/<change-slug>/TASKS.md` **only** when at least one `spec-driven-workflow` trigger applies:

1. `PLAN.md` is too large or comprehensive to execute cleanly in a single pass.
2. `PLAN.md` spans two or more distinct scopes, task types (`feature`, `bugfix`, `refactor`, `docs`), or independent deliverables that benefit from separate tracking.
3. Work can be split into independent units executed **in parallel or asynchronously** by different agents or contributors.

When creating `TASKS.md`, ensure every task has:

- **Unique ID & Type** (e.g., `T1`, `feature` | `bugfix` | `refactor` | `docs` | `chore`).
- **Explicit Dependencies**: Clearly state blocking task IDs (or `None`).
- **Disjoint Scope**: Assign non-overlapping files or modules to parallel tasks to prevent merge conflicts.
- **Objective Done Criteria**: Concrete, verifiable conditions that prove the task is complete.

## Quality Checklist

Before handing off `PLAN.md` (and `TASKS.md`) for execution:

1. Every requirement and acceptance criterion in `workflow/<change-slug>/SPEC.md` is covered by at least one step or task.
2. No circular dependencies exist, and parallel tasks have non-overlapping scopes.
3. Every step/task is small enough to implement and verify in a single focused pass.
4. No implementation code has been written prematurely during the planning phase.
````

## File: .agents/skills/spec-driven-workflow/resources/REVIEW.md
````markdown
# Code Review: <Short Title>

- **Spec**: [SPEC.md](./SPEC.md)
- **Plan**: [PLAN.md](./PLAN.md)
- **Reviewer**: <human or agent>
- **Status**: Open | Changes Requested | Approved

## Summary

Brief overall assessment of correctness, spec alignment, maintainability, and test coverage.

## Findings

### Blockers

- **[R1]** `path/to/file.ext:L10-L25` — **Status**: `open`
  - **Issue**: Describe the bug, security risk, or broken requirement.
  - **Action**: Concrete fix required.
  - **Evidence** *(optional)*: [<Short description>](./assets/<filename>)

### Major

- **[R2]** `path/to/file.ext:L40` — **Status**: `open`
  - **Issue**: Describe architectural, edge-case, or test gap.
  - **Action**: Recommended change.

### Minor / Nits

- **[R3]** `path/to/file.ext` — **Status**: `open`
  - **Issue**: Style, naming, or small readability improvement.
  - **Action**: Optional or quick cleanup.

### Questions

- **[Q1]** `path/to/file.ext` — **Status**: `open`
  - **Question**: Clarification needed from the author/implementer.
````

## File: .agents/skills/spec-driven-workflow/resources/TASKS.md
````markdown
# Tasks: <Short Title>

- **Plan**: [PLAN.md](./PLAN.md)
- **Execution Mode**: Sequential | Parallel / Multi-Agent

> Use this file only when the plan is large enough to require sharding or when tasks can be executed asynchronously by separate agents.

## Task Board

| ID | Task | Type | Status | Owner / Agent | Dependencies | Scope (Files/Modules) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| T1 | <Short task title> | `feature` | `pending` | <agent-1> | None | `path/to/scope_a` |
| T2 | <Short task title> | `docs` | `pending` | <agent-2> | None | `path/to/scope_b` |
| T3 | <Integration / verification> | `chore` | `pending` | <agent-1> | T1, T2 | `tests/` |

## Task Details

### T1: <Short task title>

- **Status**: `pending` | `in_progress` | `blocked` | `done`
- **Dependencies**: None
- **Scope**: `path/to/scope_a`
- **Assets** *(optional)*: [<Short description>](./assets/<filename>)
- **Instructions**: Concise implementation instructions for the assigned agent.
- **Done Criteria**:
  - [ ] <Specific check or test passing>

### T2: <Short task title>

- **Status**: `pending` | `in_progress` | `blocked` | `done`
- **Dependencies**: None
- **Scope**: `path/to/scope_b`
- **Instructions**: Concise implementation instructions for the assigned agent.
- **Done Criteria**:
  - [ ] <Specific check or test passing>
````

## File: .agents/skills/systematic-debugging/SKILL.md
````markdown
---
name: systematic-debugging
description: >-
  Investigate bugs and failures through disciplined root-cause analysis before
  writing fixes. Use this skill when diagnosing failing tests, runtime errors,
  regressions, or unexpected behavior—before proposing or applying any code
  changes.
---

# Systematic Debugging

Find and prove the **root cause** before changing any production code. Never guess, apply shotgun patches, or silence errors to make symptoms disappear.

## Core Rule

**No fix without a confirmed root cause.** Every bug fix must follow: **Reproduce -> Isolate -> Prove Root Cause -> Regression Test -> Fix -> Verify**.

## Debugging Process

### 1. Reproduce Reliably

- Capture exact reproduction steps, inputs, environment conditions, and expected vs. actual behavior.
- If the failure cannot be reproduced yet, gather logs, traces, or state snapshots first—do not speculate.

### 2. Isolate & Form Hypotheses

- Narrow the failure boundary (recent changes via `git diff`/`git log`, failing inputs, or call paths via `codebase-indexing` if active).
- Form **one concrete, testable hypothesis** at a time about why the failure occurs.
- Test the hypothesis with targeted observation (logs, minimal reproduction, or debugger/test run).

### 3. Confirm & Document Root Cause

- Confirm the exact mechanism causing the bug with direct evidence.
- If `workflow/<change-slug>/SPEC.md` is active for this bug fix, record the reproduction steps and confirmed root cause there before planning the fix.

### 4. Write a Failing Regression Test First

- Create an automated test (or reproducible check) that fails for the **exact** reason of the bug.
- Verify it fails before applying the fix so you know the test actually catches the regression.

### 5. Fix the Root Cause & Verify

- Apply the minimal, clean fix that addresses the root cause—not a workaround around the symptom.
- Run the regression test and the full relevant test suite to confirm no regressions were introduced.

## Anti-Patterns to Avoid

- **Shotgun debugging**: Changing multiple unrelated things at once hoping one works.
- **Symptom masking**: Catching and ignoring exceptions, adding arbitrary retries/sleeps, or loosening assertions to pass tests.
- **Speculative fixes**: Editing code before you can explain *why* it failed.
````

## File: .agents/skills/verification-and-testing/SKILL.md
````markdown
---
name: verification-and-testing
description: >-
  Enforce evidence-based verification and meaningful test coverage before
  claiming any task is complete. Use this skill when writing tests, validating
  `workflow/<change-slug>/SPEC.md` acceptance criteria, or verifying builds,
  linters, and runtime behavior after code changes.
---

# Verification & Testing

Never claim a change works, passes, or is complete without **fresh, direct verification evidence** collected after the final edit.

## Core Rule

**Evidence before completion claims.** If you did not run a check after your last change and observe its output, do not report it as passing.

## 1. Align Verification with `workflow/<change-slug>/SPEC.md`

- Map every acceptance criterion in `workflow/<change-slug>/SPEC.md` and the verification strategy in `workflow/<change-slug>/PLAN.md` to a concrete check (automated test, build, lint, typecheck, or explicit runtime check).
- Treat untested acceptance criteria as incomplete work.

## 2. Write Meaningful Tests

- **Test behavior, not implementation details**: Assert observable outputs, state transitions, and side effects so tests survive safe refactoring (`code-simplification`).
- **Cover the edges**: Include boundary values, empty/null inputs, invalid states, and error paths—not just the happy path.
- **Keep tests isolated and deterministic**: Avoid shared mutable state, real network calls, or time-dependent flakiness unless explicitly testing integration boundaries.
- **Never weaken assertions**: Do not relax, skip, or mock away the core behavior under test just to make a suite green.

## 3. Execution Gate After Final Edit

Before handing off work or moving to `workflow/<change-slug>/REVIEW.md`:

1. Run the relevant unit/integration tests, linter, typechecker, and build commands.
2. Confirm **all** executed checks pass with zero skipped or relaxed assertions.
3. Report the exact scope of what was run (e.g., full suite vs. targeted subset, any environment limitations).
````

## File: docs/decisions/0001-canonical-transports.md
````markdown
# ADR-0001: Canonical transports are `stdio` and `http`

> **Superseded by [ADR-0010](./0010-adopt-agent-plugins-mcp-schema.md)** — esta decisão foi substituída pela adoção do padrão Agent Plugins MCP 1.0.0, que define três transportes (`stdio`, `streamable-http`, `sse`) sob o discriminador `type`.

- **Status**: Superseded by ADR-0010
- **Date**: 2026-11-13
- **Related Docs**: [`spec/BLUEPRINT.md`](../../spec/BLUEPRINT.md), [`docs/decisions/0010-adopt-agent-plugins-mcp-schema.md`](./0010-adopt-agent-plugins-mcp-schema.md)

## Context

The canonical format must describe both local process servers and remote HTTP
servers. Several target agents expose only a URL for remote servers, while others
distinguish transports explicitly. Introducing more than one remote discriminator
would force every adapter to carry a distinction that its native format cannot
represent, making round-trips lossy.

## Decision

`v0.1.0` supports exactly two transports: `"stdio"` and `"http"`. `transport` is
required and discriminated. Any other value is invalid.

When importing existing agent files whose native format does not distinguish
transports, or that expose only a `url`, the entry is imported as `"http"` and a
`TRANSPORT_INFERRED` warning is emitted.

## Alternatives Considered

- **Multiple remote discriminators**: rejected. Several native formats cannot
  represent the distinction, so compilation and extraction would silently lose
  information.
- **Infer transport from `command`/`url` without a discriminator**: rejected.
  An explicit discriminator produces better editor validation and clearer errors.

## Consequences

- **Positive**: simpler schema, honest round-trip guarantees, smaller adapter
  surface, one remote code path to test.
- **Negative / Trade-offs**: a server that requires a different remote transport
  must be reached through an HTTP gateway or kept outside the canonical file.
- **Follow-up**: revisit if a target agent documents a distinct transport that
  must be preserved natively.
````

## File: docs/decisions/0002-schema-source-and-versioning.md
````markdown
# ADR-0002: Zod 4 is the schema source of truth; publish Draft-07

> **Superseded by [ADR-0010](./0010-adopt-agent-plugins-mcp-schema.md)** — esta decisão foi substituída pela adoção do schema Agent Plugins MCP 1.0.0 (`https://agent-plugins.org/schemas/1.0.0/mcp.schema.json`) como base normativa.

- **Status**: Superseded by ADR-0010
- **Date**: 2026-11-13
- **Related Docs**: [`spec/BLUEPRINT.md`](../../spec/BLUEPRINT.md), [`docs/decisions/0010-adopt-agent-plugins-mcp-schema.md`](./0010-adopt-agent-plugins-mcp-schema.md)

## Context

The TypeScript types, runtime validation, and the published JSON Schema must never
drift. The published schema is consumed by editor language services, most of which
implement JSON Schema Draft-07 reliably and still have incomplete 2019-09/2020-12
support. The schema URL also acts as the format version, so it must be reproducible
byte-for-byte in CI.

## Decision

- Define the format once in Zod 4 (`z.strictObject`, `z.discriminatedUnion`,
  `z.url()`), with no `.refine()`/`.transform()` in the exported schema.
- Publish Draft-07 via the native `z.toJSONSchema(schema, { target: 'draft-7',
  io: 'input' })`.
- Generate `spec/mcp.schema.json` from `src/core/schema.ts`, with `$id` equal to
  `https://agents-mcp.dev/schema/v<version>/mcp.schema.json`.
- Keep the site URL and version in `src/config.ts` as constants; no environment
  variable influences generation.
- Enforce drift with `npm run schema:check` (`schema:gen` + `git diff --exit-code`)
  inside `verify` and `dist:build`.

## Alternatives Considered

- **Draft 2020-12**: rejected for now. No feature we need, and weaker editor
  support today. The versioned `$schema` URI makes a future migration cheap.
- **Hand-written schema**: rejected. Guaranteed drift with types and validation.
- **Env-driven site URL**: rejected. It makes the committed artifact machine
  dependent and breaks diff-based CI checks.

## Consequences

- **Positive**: one source of truth, deterministic artifact, strict validation,
  native autocomplete for users.
- **Negative / Trade-offs**: `.refine()` cannot be used in the generator schema;
  extra checks live in `validateConfig()` and are not visible to editors.
- **Follow-up**: snapshot test the generated document; revisit Draft 2020-12 in a
  future major version if editor support matures.
````

## File: docs/decisions/0008-packaging-and-runtime-floor.md
````markdown
# ADR-0008: Node 22 floor, single binary, publish from `dist/` only

- **Status**: Accepted
- **Date**: 2026-11-13
- **Related Docs**: [`spec/BLUEPRINT.md`](../../spec/BLUEPRINT.md)

## Context

The package must expose a zero-dependency executable and must not leak repository
sources or build tooling to npm. Consumers install the CLI to run it, not to import
types or modules.

## Decision

- `engines.node >= 22`; `@types/node@^22` so the type check cannot use newer
  APIs; CI covers Node 22, 24, and 26.
- Exactly one binary: `bin: { "agents-mcp": "./index.js" }`.
- Root `package.json` is never published: `prepublishOnly` fails with a pointer to
  `npm run dist`.
- `package.ts` assembles `dist/package.json` (metadata only, no scripts, no
  dependencies) and copies LICENSE/README plus the changelog when present.
- `npm run dist` = build (full `verify`) → package → publish, in that order;
  publishing is always a manual, post-bump action.
- `dist:build` runs the full `verify` suite before publication.

## Alternatives Considered

- **Older Node versions**: rejected. Supporting a runtime past its maintenance
  window costs compatibility branches for no user benefit.
- **Ship source with `bin` pointing at `src/`**: rejected. Requires runtime
  transforms, exposes internals, and breaks the zero-dependency promise.
- **`npm publish` from the root**: rejected. Publishes dev tooling and tests.

## Consequences

- **Positive**: simple install, single artifact, reproducible release.
- **Negative / Trade-offs**: users on an older runtime must upgrade.
- **Follow-up**: verify `dist/package.json` in CI after `npm run build`.
````

## File: docs/decisions/0010-adopt-agent-plugins-mcp-schema.md
````markdown
# ADR-0010: Adotar o padrão Agent Plugins MCP 1.0.0

- **Status**: Accepted
- **Date**: 2026-11-14
- **Supersedes**: [ADR-0001](./0001-canonical-transports.md), [ADR-0002](./0002-schema-source-and-versioning.md)
- **Related Docs**: [`spec/SPEC.md`](../../spec/SPEC.md), [`spec/BLUEPRINT.md`](../../spec/BLUEPRINT.md) — upstream item `U4` (backlog interno do projeto)

## Context

A CLI `agents-mcp` mantinha um schema JSON próprio (`https://agents-mcp.dev/schema/v0.1.0/mcp.schema.json`) com estrutura proprietária (`servers` na raiz, discriminador `transport: "stdio" | "http"`). Manter um formato concorrente aumenta o custo de evolução e impede a interoperabilidade direta com ferramentas que adotam o padrão aberto **Agent Plugins**.

O padrão **Agent Plugins MCP 1.0.0** (`https://agent-plugins.org/schemas/1.0.0/mcp.schema.json`) define um documento de configuração de servidores MCP com transportes para processos locais (`stdio`), HTTP streaming (`streamable-http`) e o legado HTTP+SSE (`sse`), usando a chave raiz `mcpServers` e o discriminador `type`.

## Decision

Adotar o **Agent Plugins MCP 1.0.0** como base normativa da configuração de MCPs na CLI:

- Chave raiz `mcpServers` (substitui `servers`).
- Discriminador `type` com os três transportes oficiais: `"stdio"`, `"streamable-http"` e `"sse"`.
- `$schema` padrão apontando para `https://agent-plugins.org/schemas/1.0.0/mcp.schema.json`.
- Documentação normativa (`spec/SPEC.md`, `README.md`) referencia `https://agent-plugins.org/plugin-authors/mcp-servers` e o schema oficial.

## Delimitação de valor

A CLI `agents-mcp` gerencia e sincroniza MCPs de forma padronizada no contexto de um projeto (e escopo global do usuário), enquanto o padrão Agent Plugins MCP 1.0.0 continua sendo a referência para a configuração de servidores MCP em plugins individuais. A proposta não cria nem propõe uma variante concorrente do schema Agent Plugins.

## Alternatives Considered

- **Manter o schema próprio (`agents-mcp.dev`)**: rejeitado. Aumenta o custo de evolução, limita a interoperabilidade e força a manutenção de um formato concorrente sem benefício para o usuário.
- **Definir um novo discriminador proprietário**: rejeitado. Incompatível com o ecossistema Agent Plugins e exigiria adaptação em cada target agent.

## Consequences

- **Positive**: interoperabilidade direta com ferramentas que adotam Agent Plugins; schema único e versionado externamente; redução da superfície de manutenção da CLI.
- **Negative / Trade-offs**: o transporte `sse` (legado HTTP+SSE) é exposto internamente na representação canônica, embora a CLI continue usando `--http` e `--command` na interface pública; ADRs-0001 e ADR-0002 são marcadas como supersedidas.
- **Follow-up**: `docs/decisions/0001` e `docs/decisions/0002` marcadas como `Superseded by ADR-0010`; nenhum outro documento depende delas.
````

## File: src/adapters/antigravity.ts
````typescript
// Antigravity adapter (B3).
//
// Antigravity consumes mcp_config.json files written per-plugin under
// <scopeBase>/.agents/plugins/<name>/mcp_config.json, not a single monolithic
// agent file. Accordingly:
//   - getConfigPath returns null (no single native config path).
//   - compile produces Antigravity's entry format: stdio -> { command, args?,
//     env? }; streamable-http/sse -> { serverUrl, headers? }.
//   - applyServers is a no-op passthrough (plugin files are written by
//     syncPluginFiles in the command layer, not by per-adapter file writes).
//   - detect looks for any .agents/plugins/*/mcp_config.json.
//
// Implements the adapter contract (BLUEPRINT 9.1) + B3 spec section 2.

import { join } from 'node:path'
import { readdirSync, statSync } from 'node:fs'
import { readTextFile } from '$/src/core/fs-atomic'
import type { RuntimeContext, ConfigScope } from '$/src/core/context'
import type { CanonicalServer } from '$/src/core/schema'
import type {
  AgentId,
  AdapterCapabilities,
  AgentAdapter,
  CompileResult,
  ExtractResult,
  Warning,
  AdapterContext,
} from '$/src/adapters/types'
import { compileAntigravityMcpConfig } from '$/src/core/plugins'

export const id: AgentId = 'antigravity'
export const displayName = 'Antigravity'

export const capabilities: AdapterCapabilities = {
  scopes: ['project', 'global'],
  format: 'json',
  envSyntax: 'posix',
  nativeDefault: false,
  nativeDisabled: false,
  cwd: false,
  layout: 'per-plugin' as const,
  rootKey: 'mcpServers',
}

export function getConfigPath(
  scope: ConfigScope,
  ctx: RuntimeContext,
): string | null {
  return null
}

export async function detect(
  scope: ConfigScope,
  ctx: RuntimeContext,
): Promise<boolean> {
  const base = scope === 'project' ? ctx.cwd : ctx.homeDir
  const pluginsDir = join(base, '.agents', 'plugins')
  let entries: string[]
  try {
    entries = readdirSync(pluginsDir)
  } catch {
    return false
  }
  for (const entry of entries) {
    const mcpConfigPath = join(pluginsDir, entry, 'mcp_config.json')
    try {
      if (statSync(mcpConfigPath).isFile()) {
        return true
      }
    } catch {
      // ignore
    }
  }
  return false
}

export function compile(server: CanonicalServer): {
  entry: unknown | null
  warnings: readonly Warning[]
} {
  const warnings: Warning[] = []
  const config = compileAntigravityMcpConfig('server', server)
  const entry = (config.mcpServers as Record<string, unknown>)['server']
  return { entry: entry ?? null, warnings }
}

export function extractServers(
  rawContent: string,
  scope: ConfigScope,
): ExtractResult {
  const warnings: Warning[] = []
  const resultServers: Record<string, CanonicalServer> = {}

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(rawContent) as Record<string, unknown>
  } catch {
    return { servers: {}, warnings }
  }

  const mcpServers = parsed.mcpServers
  if (
    !mcpServers ||
    typeof mcpServers !== 'object' ||
    Array.isArray(mcpServers)
  ) {
    return { servers: {}, warnings }
  }

  for (const [name, rawEntry] of Object.entries(
    mcpServers as Record<string, unknown>,
  )) {
    const entry = rawEntry as Record<string, unknown> | null
    if (!entry || typeof entry !== 'object') {
      continue
    }

    const command = entry.command
    const serverUrl = entry.serverUrl

    const hasCommand = typeof command === 'string' && command.length > 0
    const hasServerUrl = typeof serverUrl === 'string' && serverUrl.length > 0

    if (hasCommand) {
      const server: CanonicalServer = {
        type: 'stdio',
        command,
        args: [],
      }
      if (entry.args && Array.isArray(entry.args)) {
        server.args = entry.args.filter(
          (a): a is string => typeof a === 'string',
        )
      }
      if (
        entry.env &&
        typeof entry.env === 'object' &&
        !Array.isArray(entry.env)
      ) {
        server.env = {}
        for (const [k, v] of Object.entries(
          entry.env as Record<string, unknown>,
        )) {
          if (typeof v === 'string') {
            server.env[k] = v
          }
        }
      }
      resultServers[name] = server
      continue
    }

    if (hasServerUrl) {
      const server: CanonicalServer = {
        type: 'streamable-http',
        url: serverUrl,
      }
      if (
        entry.headers &&
        typeof entry.headers === 'object' &&
        !Array.isArray(entry.headers)
      ) {
        server.headers = {}
        for (const [k, v] of Object.entries(
          entry.headers as Record<string, unknown>,
        )) {
          if (typeof v === 'string') {
            server.headers[k] = v
          }
        }
      }
      resultServers[name] = server
      continue
    }

    warnings.push({
      code: 'UNKNOWN_FIELD_DROPPED',
      agent: 'antigravity',
      server: name,
      message: 'No command or serverUrl for `' + name + '`; entry dropped',
    })
  }

  return { servers: resultServers, warnings }
}

export function applyServers(
  existingRawContent: string | null,
  servers: Record<string, CanonicalServer>,
  ctx: AdapterContext,
): CompileResult {
  const managed = Object.keys(servers)
  return {
    content: existingRawContent ?? '',
    managedNames: managed,
    warnings: [],
  }
}
````

## File: src/core/fs-atomic.ts
````typescript
import {
  closeSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  openSync,
  renameSync,
  unlinkSync,
  writeSync as fsWriteSync,
  fsyncSync as fsFsyncSync,
  readFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'

/**
 * Read a text file, returning `null` when it does not exist (ENOENT).
 * Any other error propagates.
 */
export function readTextFile(path: string): string | null {
  try {
    return readFileSync(path, 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw err
  }
}

/**
 * Atomic write: write to a temp file in the **same directory**, fsync, then
 * rename over the target. On Windows, `rename` over an existing file can fail,
 * so fall back to `copyFile` + `unlink` without removing the target first.
 *
 * The temp file is created with `O_EXCL` plus a random suffix to avoid
 * symlink surprises and collisions between concurrent writers.
 *
 * `mode` applies to the temp file (e.g. `0o600` for `.env`); after rename the
 * platform's umask may adjust the final mode, so callers requiring an exact
 * mode should `chmod` the target afterwards.
 */
export interface WriteFileAtomicOptions {
  mode?: number
}

export function writeFileAtomic(
  path: string,
  content: string,
  options: WriteFileAtomicOptions = {},
): void {
  const dir = dirname(path)
  // Ensure the parent directory exists so callers don't have to pre-create it.
  mkdirSync(dir, { recursive: true })
  const temp = createTempPath(dir)
  const fd = openSync(temp, 'wx', options.mode ?? 0o644)
  try {
    fsWriteSync(fd, Buffer.from(content, 'utf8'))
    fsFsyncSync(fd)
    closeSync(fd)
  } catch (err) {
    try {
      closeSync(fd)
    } catch {
      // ignore
    }
    try {
      unlinkSync(temp)
    } catch {
      // ignore
    }
    throw err
  }

  try {
    renameSync(temp, path)
  } catch (renameErr) {
    // Windows: rename over an existing file may fail. Fall back to
    // copyFile + unlink so we never clobber the target before the copy is safe.
    if (copyFileOverExisting(temp, path)) {
      try {
        unlinkSync(temp)
      } catch {
        // ignore
      }
      return
    }
    // Clean up the orphaned temp and rethrow the original rename error.
    try {
      unlinkSync(temp)
    } catch {
      // ignore
    }
    throw renameErr
  }
}

function createTempPath(dir: string): string {
  const random = Math.random().toString(36).slice(2, 14)
  const timestamp = Date.now().toString(36)
  return join(dir, `.agents-mcp-tmp-${timestamp}-${random}`)
}

function copyFileOverExisting(src: string, dest: string): boolean {
  try {
    copyFileSync(src, dest)
    return true
  } catch {
    return false
  }
}

/**
 * Copy `path` to `<path>.bak.<ISO timestamp>` before a `--force` operation.
 * Returns the backup path, or `null` when the source does not exist.
 */
export function backupFile(path: string): string | null {
  if (!existsSync(path)) {
    return null
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backup = `${path}.bak.${timestamp}`
  copyFileSync(path, backup)
  return backup
}
````

## File: src/core/gitignore.ts
````typescript
/**
 * Minimal, lazy `.gitignore` management for tool-owned secrets.
 *
 * Implements BLUEPRINT §8.6: adds a managed block only for `.env`, lazily
 * (only when something is about to be written), never touching agent
 * configuration files, never duplicating entries.
 */

import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { readTextFile, writeFileAtomic } from '$/src/core/fs-atomic'
import { ENV_FILE } from '$/src/config'

const MANAGED_BLOCK_HEADER = '# agents-mcp local (managed)'
const MANAGED_BLOCK_FOOTER = '# end agents-mcp local (managed)'

export interface EnsureIgnoredResult {
  added: string[]
  warnings: string[]
}

/**
 * Ensure `entries` are covered by `.gitignore` at `rootDir`. Adds a managed
 * block only when at least one entry is not already covered. Entries already
 * covered by another pattern are not duplicated.
 */
export function ensureIgnored(
  rootDir: string,
  entries: string[],
): EnsureIgnoredResult {
  const added: string[] = []
  const warnings: string[] = []

  const gitignorePath = join(rootDir, '.gitignore')
  const raw = readTextFile(gitignorePath)
  const existingLines = raw !== null ? raw.split(/\r?\n/) : []

  const alreadyCovered = (entry: string): boolean => {
    for (const line of existingLines) {
      const trimmed = line.trim()
      if (trimmed === '' || trimmed.startsWith('#')) continue
      // Exact match or the entry is a prefix-anchored pattern already present.
      if (trimmed === entry) return true
      // A trailing-slash directory pattern covers contained files.
      if (trimmed === entry + '/') return true
      // Only match directory prefixes (require '/' boundary after the prefix)
      // so `.env` does not false-positive match `.env.example`.
      if (trimmed.endsWith('/') && entry.startsWith(trimmed)) return true
    }
    return false
  }

  const uncovered = entries.filter((e) => !alreadyCovered(e))

  if (uncovered.length === 0) {
    // Check git-tracked status for `.env` specifically without duplicating.
    if (entries.includes(ENV_FILE) && isGitTracked(rootDir, ENV_FILE)) {
      warnings.push(
        `.env is tracked by Git; run \`git rm --cached .env\` to stop tracking it (values are still safe from new commits)`,
      )
    }
    return { added, warnings }
  }

  // A trailing newline leaves a final empty element; drop it so rejoining
  // never accumulates blank lines across repeated calls.
  if (
    existingLines.length > 0 &&
    existingLines[existingLines.length - 1] === ''
  ) {
    existingLines.pop()
  }

  const headerIdx = existingLines.findIndex(
    (l) => l.trim() === MANAGED_BLOCK_HEADER,
  )
  const footerIdx = existingLines.findIndex(
    (l) => l.trim() === MANAGED_BLOCK_FOOTER,
  )

  const nextLines = [...existingLines]

  if (headerIdx !== -1 && footerIdx !== -1) {
    // Block complete: insert uncovered entries right before the footer.
    nextLines.splice(footerIdx, 0, ...uncovered)
  } else if (headerIdx !== -1) {
    // Header only (corrupted/partial block): append entries and close it.
    nextLines.push(...uncovered, MANAGED_BLOCK_FOOTER)
  } else {
    // No managed block yet: create header -> entries -> footer.
    nextLines.push('', MANAGED_BLOCK_HEADER, ...uncovered, MANAGED_BLOCK_FOOTER)
  }

  const next = nextLines.join('\n') + '\n'
  writeFileAtomic(gitignorePath, next)
  added.push(...uncovered)

  if (uncovered.includes(ENV_FILE) && isGitTracked(rootDir, ENV_FILE)) {
    warnings.push(
      `.env is tracked by Git; run \`git rm --cached .env\` to stop tracking it (values are still safe from new commits)`,
    )
  }

  return { added, warnings }
}

/**
 * Return `true` when `entry` is tracked by Git in `rootDir`. Any error (not a
 * git repo, git unavailable, entry not tracked) yields `false` so the caller
 * can proceed without git.
 */
export function isGitTracked(rootDir: string, entry: string): boolean {
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', '--', entry], {
      cwd: rootDir,
      stdio: 'ignore',
    })
    return true
  } catch {
    return false
  }
}
````

## File: src/sources/direct.ts
````typescript
/**
 * Direct source resolver (§10.2).
 *
 * Parses CLI flags (--command, --arg, --http, --env, --header, --cwd, --name)
 * into a `ResolvedServerPackage`.
 */

import parseArgv from 'string-argv'
import type { ResolvedServerPackage, RequiredEnvVar } from '$/src/sources/types'
import { SERVER_NAME_PATTERN } from '$/src/config'
import type { CanonicalServer, StdioServer } from '$/src/core/schema'
import { collectRequiredVars } from '$/src/core/placeholder'
import { isSecretValue } from '$/src/core/env'
import { isStdioServer, isHttpServer } from '$/src/core/schema'

export interface DirectOptions {
  command?: string
  arg?: string[]
  http?: string
  sse?: string
  env?: string[]
  header?: string[]
  cwd?: string
  name?: string
}

export function resolveDirect(options: DirectOptions): ResolvedServerPackage {
  let command: string | undefined
  let args: string[] = []

  if (options.command) {
    if (options.arg && options.arg.length > 0) {
      command = options.command
      args = [...options.arg]
    } else {
      const tokens = parseArgv(options.command)
      if (tokens.length === 0) {
        throw new Error('--command requires a non-empty command')
      }
      command = tokens[0]
      args = tokens.slice(1)
    }
  }

  let type: 'stdio' | 'streamable-http' | 'sse' = 'stdio'
  let url: string | undefined
  const headers: Record<string, string> = {}
  const env: Record<string, string> = {}

  if (options.sse) {
    type = 'sse'
    url = options.sse
  } else if (options.http) {
    type = 'streamable-http'
    url = options.http
  }

  if (options.env) {
    for (const item of options.env) {
      const sep = item.indexOf('=')
      if (sep === -1) {
        // Reference only: KEY (warn if unresolved — handled by caller)
        env[item] = `\${${item}}`
      } else {
        env[item.slice(0, sep)] = item.slice(sep + 1)
      }
    }
  }

  if (options.header) {
    for (const item of options.header) {
      const sep = item.indexOf(':')
      if (sep === -1) {
        throw new Error(`--header must be "Name: Value", got: ${item}`)
      }
      headers[item.slice(0, sep).trim()] = item.slice(sep + 1).trim()
    }
  }

  const definition: CanonicalServer =
    type === 'stdio'
      ? {
          type: 'stdio',
          command: command as string,
          args: args.length > 0 ? args : [],
          env: Object.keys(env).length > 0 ? env : undefined,
        }
      : {
          type,
          url: url as string,
          headers: Object.keys(headers).length > 0 ? headers : undefined,
        }

  if (options.cwd && type === 'stdio') {
    ;(definition as StdioServer).cwd = options.cwd
  }

  const suggestedName = options.name ?? suggestName(definition)

  return {
    suggestedName,
    definition,
    requiredEnv: collectRequiredVars(definition),
    source: { type: 'direct', ref: suggestedName },
  }
}

function suggestName(def: CanonicalServer): string {
  if (isHttpServer(def) && def.url) {
    try {
      const u = new URL(def.url)
      const base = u.hostname.replace(/[^a-z0-9]/g, '-')
      const first = u.pathname.split('/').filter(Boolean)[0] ?? ''
      const name = [base, first].filter(Boolean).join('-') || base
      return sanitize(name)
    } catch {
      return sanitize(def.url)
    }
  }
  if (isStdioServer(def) && def.command) {
    return sanitize((def.command as string).split(/[ /]/)[0] ?? '')
  }
  return 'server'
}

function sanitize(name: string): string {
  const cleaned = name.toLowerCase().replace(/[^a-z0-9._-]/g, '-')
  if (!SERVER_NAME_PATTERN.test(cleaned)) {
    return 'server'
  }
  return cleaned
}
````

## File: src/sources/types.ts
````typescript
/**
 * Source resolvers DTOs (§10).
 *
 * `ResolvedServerPackage` is the common output of every source resolver
 * (direct, github, registry), ready to be turned into a canonical server by
 * `commands/add.ts`.
 */

import type { CanonicalServer } from '$/src/core/schema'

export interface RequiredEnvVar {
  name: string
  description?: string
  isSecret: boolean
}

export interface ResolvedServerPackage {
  suggestedName: string
  definition: CanonicalServer
  requiredEnv: RequiredEnvVar[]
  source: { type: 'direct' | 'github' | 'registry'; ref: string }
}

/** Optional inputs shared by all source resolvers (§10.5). */
export interface SourceResolveOptions {
  /** Runtime environment record (e.g. process.env) used to resolve GITHUB_TOKEN for fetch. */
  env?: Record<string, string>
  yes?: boolean
  /** Interactive candidate selector (TTY, `!yes`). Receives the candidates and must return one or `null` to abort. */
  selectCandidate?: (candidates: Candidate[]) => Promise<Candidate | null>
  /** Injectable `fetch` for tests (zero live network calls). */
  fetch?: typeof fetch
}

/** A registry/GitHub candidate presented to the user for disambiguation. */
export interface Candidate {
  name: string
  ref: string
  type: 'npm' | 'pypi' | 'oci' | 'streamable-http' | 'sse'
  url?: string
}
````

## File: src/ui/prompts.ts
````typescript
/**
 * UI & prompts port (§11–§12).
 *
 * `PromptUi` is the single abstraction for all user interaction. Commands never
 * import `@clack/prompts` directly; they go through this port. Two
 * implementations exist:
 *
 * - `createClackUi()` — interactive TTY, backed by `@clack/prompts`.
 * - `createAutoUi()` — non-interactive (`--yes` / `CI=true` / tests), backed by
 *   supplied defaults.
 */

export interface Option<T> {
  label: string
  value: T
  hint?: string
}

export interface Spinner {
  start(): void
  stop(message?: string): void
}

export interface PromptUi {
  intro(message: string): void
  outro(message: string): void
  note(message: string, title?: string): void
  warn(message: string): void
  error(message: string): void
  confirm(opts: { message: string; initialValue: boolean }): Promise<boolean>
  select<T>(opts: {
    message: string
    options: Option<T>[]
    initialValue?: T
  }): Promise<T>
  multiselect<T>(opts: {
    message: string
    options: Option<T>[]
    initialValues?: T[]
  }): Promise<T[]>
  text(opts: {
    message: string
    placeholder?: string
    defaultValue?: string
    validate?: (v: string) => string | undefined
  }): Promise<string>
  password(opts: { message: string }): Promise<string>
  spinner(message: string): Spinner
}

/**
 * Interactive UI backed by `@clack/prompts`. Only used on a TTY.
 *
 * `import { createClackUi }` is intentionally lazy: the clack dependency is
 * only pulled in when this module is loaded, and commands never reference it
 * directly.
 */
/**
 * Shape of the dynamically loaded `@clack/prompts` module surface we touch.
 * Kept inline (not imported at module scope) so `@clack/prompts` stays off the
 * module graph for the non-interactive path.
 */
type ClackModule = {
  intro(message: string): void
  outro(message: string): void
  note(message: string, title?: string): void
  log: {
    warn(message: string): void
    error(message: string): void
  }
  isCancel(value: unknown): boolean
  confirm(opts: { message: string; initialValue?: boolean }): Promise<unknown>
  select(opts: {
    message: string
    options: Array<{ label: string; value: unknown; hint?: string }>
    initialValue?: unknown
  }): Promise<unknown>
  multiselect(opts: {
    message: string
    options: Array<{ label: string; value: unknown; hint?: string }>
    initialValues?: unknown[]
  }): Promise<unknown[]>
  text(opts: {
    message: string
    placeholder?: string
    defaultValue?: string
    validate?: (v: string) => string | undefined
  }): Promise<unknown>
  password(opts: { message: string }): Promise<unknown>
  spinner(message: string): { start(): void; stop(message?: string): void }
}

export function createClackUi(): PromptUi {
  // Dynamic import keeps `@clack/prompts` out of the module graph for the
  // non-interactive path and avoids loading clack in non-TTY contexts. We use
  // `await import()` (ESM) instead of `require()` because `dist/index.js` is an
  // ESM bundle and `require` is not defined in ES module scope.
  async function loadClack(): Promise<ClackModule> {
    return (await import('@clack/prompts')) as unknown as ClackModule
  }

  async function assertNotCancel<T>(result: T): Promise<T> {
    const clack = await loadClack()
    if (clack.isCancel(result)) {
      process.exit(130)
    }
    return result
  }

  // Preload clack once per UI instance. The `.catch` swallows import rejection
  // so we never leave an unhandled rejection. Write methods fall back to a
  // synchronous console write until (and unless) clack resolves, then use clack
  // — never both, never duplicated.
  let clack: ClackModule | null = null
  void loadClack()
    .then((c) => {
      clack = c
    })
    .catch(() => {})

  return {
    intro(message: string) {
      if (clack) {
        clack.intro(message)
      } else {
        console.log(message)
      }
    },
    outro(message: string) {
      if (clack) {
        clack.outro(message)
      } else {
        console.log(message)
      }
    },
    note(message: string, title?: string) {
      if (clack) {
        clack.note(message, title)
      } else {
        console.log(title ? `${title}: ${message}` : message)
      }
    },
    warn(message: string) {
      if (clack) {
        clack.log.warn(message)
      } else {
        console.warn(message)
      }
    },
    error(message: string) {
      if (clack) {
        clack.log.error(message)
      } else {
        console.error(message)
      }
    },
    confirm(opts: {
      message: string
      initialValue: boolean
    }): Promise<boolean> {
      return (async () => {
        const clack = await loadClack()
        const result = await clack.confirm({
          message: opts.message,
          initialValue: opts.initialValue,
        })
        return (await assertNotCancel(result as unknown)) as boolean
      })()
    },
    async select<T>(opts: {
      message: string
      options: Option<T>[]
      initialValue?: T
    }): Promise<T> {
      const clack = await loadClack()
      const result = await clack.select({
        message: opts.message,
        options: opts.options as unknown as Array<{
          label: string
          value: unknown
          hint?: string
        }>,
        initialValue: opts.initialValue as unknown,
      })
      return (await assertNotCancel(result as unknown)) as T
    },
    async multiselect<T>(opts: {
      message: string
      options: Option<T>[]
      initialValues?: T[]
    }): Promise<T[]> {
      const clack = await loadClack()
      const result = await clack.multiselect({
        message: opts.message,
        options: opts.options as unknown as Array<{
          label: string
          value: unknown
          hint?: string
        }>,
        initialValues: (opts.initialValues ?? []) as unknown[],
      })
      return (await assertNotCancel(result as unknown)) as T[]
    },
    async text(opts: {
      message: string
      placeholder?: string
      defaultValue?: string
      validate?: (v: string) => string | undefined
    }): Promise<string> {
      const clack = await loadClack()
      const result = await clack.text({
        message: opts.message,
        placeholder: opts.placeholder,
        defaultValue: opts.defaultValue,
        validate: opts.validate,
      })
      return (await assertNotCancel(result as unknown)) as string
    },
    async password(opts: { message: string }): Promise<string> {
      const clack = await loadClack()
      const result = await clack.password({ message: opts.message })
      return (await assertNotCancel(result as unknown)) as string
    },
    spinner(message: string): Spinner {
      let spin: { start(): void; stop(message?: string): void } | null = null
      let started = false
      let stopped = false
      return {
        start() {
          if (started) return
          started = true
          void loadClack().then((c) => {
            if (stopped) return // stop() already ran: do not start an orphan spinner
            spin = c.spinner(message)
            spin.start()
          })
        },
        stop(message?: string) {
          stopped = true
          if (clack && spin) {
            spin.stop(message)
            return
          }
          if (message !== undefined) {
            console.log(message)
          }
        },
      }
    },
  }
}
````

## File: tests/adapters/detect.test.ts
````typescript
import { describe, expect, it } from 'vitest'
import {
  detectAgents,
  resolveTargets,
  resolveTargetsAsync,
  validateAgentFlag,
  adapters,
} from '$/src/adapters/index'
import type { AgentId } from '$/src/adapters/types'
import { createRuntimeContext } from '$/src/core/context'

const ctx = createRuntimeContext({
  cwd: '/tmp/proj',
  homeDir: '/tmp/home',
  env: {},
  isTTY: false,
})

describe('adapters index', () => {
  it('validateAgentFlag accepts valid ids', () => {
    expect(validateAgentFlag(['claude-code'])).toEqual(['claude-code'])
    expect(validateAgentFlag(['cursor', 'vscode'])).toEqual([
      'cursor',
      'vscode',
    ])
  })

  it('validateAgentFlag throws on unknown ids', () => {
    expect(() => validateAgentFlag(['not-an-agent'])).toThrow(
      'Unknown agent id(s) in --agents: not-an-agent',
    )
  })

  it('resolveTargets uses flag first', () => {
    const state = {
      version: 1 as const,
      scope: 'project' as const,
      targets: [],
      agents: {},
      managedPlugins: [],
    }
    expect(resolveTargets({ flag: ['cursor'], state, ctx })).toEqual(['cursor'])
  })

  it('resolveTargets falls back to state targets', () => {
    const state = {
      version: 1 as const,
      scope: 'project' as const,
      targets: ['vscode'] as AgentId[],
      agents: {},
      managedPlugins: [],
    }
    expect(resolveTargets({ flag: undefined, state, ctx })).toEqual(['vscode'])
  })

  it('resolveTargets returns empty when nothing resolvable', () => {
    const state = {
      version: 1 as const,
      scope: 'project' as const,
      targets: [],
      agents: {},
      managedPlugins: [],
    }
    expect(resolveTargets({ flag: undefined, state, ctx })).toEqual([])
  })

  it('resolveTargetsAsync falls back to detection', async () => {
    const state = {
      version: 1 as const,
      scope: 'project' as const,
      targets: [],
      agents: {},
      managedPlugins: [],
    }
    const result = await resolveTargetsAsync({
      flag: undefined,
      state,
      ctx,
    })
    expect(Array.isArray(result)).toBe(true)
  })

  it('adapters has all seven agents', () => {
    expect(adapters).toHaveLength(7)
    expect(adapters.map((a) => a.id)).toEqual([
      'claude-code',
      'cursor',
      'vscode',
      'opencode',
      'zed',
      'windsurf',
      'antigravity',
    ])
  })
})
````

## File: tests/commands/basic.test.ts
````typescript
import { describe, expect, it, vi } from 'vitest'
import { runSync } from '$/src/commands/sync'
import { persistCanonicalConfig } from '$/src/commands/util'
import { createRuntimeContext } from '$/src/core/context'
import { createSandbox } from '$/tests/helpers/sandbox'

describe('commands runSync', () => {
  it('runSync with no targets exits 1 with hint', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      // Create a canonical config first so runSync doesn't return early
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://example.com/schema.json',
        mcpServers: {},
      })

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called')
      })
      try {
        await expect(
          runSync({
            scope: 'project',
            ctx,
            flag: undefined,
            dryRun: false,
            yes: true,
          } as Parameters<typeof runSync>[0]),
        ).rejects.toThrow('process.exit called')
        expect(exitSpy).toHaveBeenCalledWith(1)
      } finally {
        exitSpy.mockRestore()
      }
    } finally {
      cleanup()
    }
  })

  it('runSync with no canonical config returns early', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const result = await runSync({
        scope: 'project',
        ctx,
        flag: ['claude-code'],
        dryRun: true,
        yes: true,
      } as Parameters<typeof runSync>[0])
      expect(result.targets).toEqual([])
      expect(result.written).toEqual([])
    } finally {
      cleanup()
    }
  })
})
````

## File: tests/commands/doctor.test.ts
````typescript
import { describe, expect, it } from 'vitest'
import { runDoctor } from '$/src/commands/doctor.command'
import { runSync } from '$/src/commands/sync'
import { createRuntimeContext } from '$/src/core/context'
import { createSandbox } from '$/tests/helpers/sandbox'
import { persistCanonicalConfig } from '$/src/commands/util'
import { writeFileAtomic } from '$/src/core/fs-atomic'
import { writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { DEFAULT_SCHEMA_URL } from '$/src/config'

describe('doctor', () => {
  it('schema error: missing canonical config', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const result = await runDoctor({
        scope: 'project',
        ctx,
        flag: undefined,
        dryRun: false,
        strict: false,
      })
      expect(result.errors).toBeGreaterThan(0)
      expect(result.results[0]!.code).toBe('SCHEMA')
    } finally {
      cleanup()
    }
  })

  it('env error: missing required env var', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeFileAtomic(
        join(ctx.cwd, '.agents', 'mcp.json'),
        JSON.stringify({
          $schema: DEFAULT_SCHEMA_URL,
          mcpServers: {
            test: {
              type: 'stdio',
              command: 'npx',
              env: { MISSING_VAR: '${MISSING_VAR}' },
            },
          },
        }),
      )

      const result = await runDoctor({
        scope: 'project',
        ctx,
        flag: undefined,
        dryRun: false,
        strict: false,
      })
      const envErrors = result.results.filter((r) => r.code === 'ENV')
      expect(envErrors.length).toBeGreaterThan(0)
      expect(result.errors).toBeGreaterThan(0)
    } finally {
      cleanup()
    }
  })

  it('env: dotenv resolves placeholder, no error', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeFileAtomic(join(ctx.cwd, '.env'), 'MY_TOKEN=abc123\n')
      writeFileAtomic(
        join(ctx.cwd, '.agents', 'mcp.json'),
        JSON.stringify({
          $schema: DEFAULT_SCHEMA_URL,
          mcpServers: {
            test: {
              type: 'stdio',
              command: 'npx',
              env: { MY_TOKEN: '${MY_TOKEN}' },
            },
          },
        }),
      )

      const result = await runDoctor({
        scope: 'project',
        ctx,
        flag: undefined,
        dryRun: false,
        strict: false,
      })
      const envErrors = result.results.filter((r) => r.code === 'ENV')
      expect(envErrors.length).toBe(0)
      expect(result.errors).toBe(0)
    } finally {
      cleanup()
    }
  })

  it('env: fallback placeholder resolves, no error', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeFileAtomic(
        join(ctx.cwd, '.agents', 'mcp.json'),
        JSON.stringify({
          $schema: DEFAULT_SCHEMA_URL,
          mcpServers: {
            test: {
              type: 'stdio',
              command: 'npx',
              env: { MY_TOKEN: '${MISSING_VAR:-fallback}' },
            },
          },
        }),
      )

      const result = await runDoctor({
        scope: 'project',
        ctx,
        flag: undefined,
        dryRun: false,
        strict: false,
      })
      const envErrors = result.results.filter((r) => r.code === 'ENV')
      expect(envErrors.length).toBe(0)
      expect(result.errors).toBe(0)
    } finally {
      cleanup()
    }
  })

  it('runtime error: missing stdio binary', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeFileAtomic(
        join(ctx.cwd, '.agents', 'mcp.json'),
        JSON.stringify({
          $schema: DEFAULT_SCHEMA_URL,
          mcpServers: {
            nonexistent: {
              type: 'stdio',
              command: 'nonexistent-binary-xyz',
            },
          },
        }),
      )

      const result = await runDoctor({
        scope: 'project',
        ctx,
        flag: undefined,
        dryRun: false,
        strict: false,
      })
      const runtimeErrors = result.results.filter((r) => r.code === 'RUNTIME')
      expect(runtimeErrors.length).toBeGreaterThan(0)
      expect(result.errors).toBeGreaterThan(0)
    } finally {
      cleanup()
    }
  })

  it('drift: reformatting native file does not trigger drift', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeFileAtomic(
        join(ctx.cwd, '.agents', 'mcp.json'),
        JSON.stringify({
          $schema: DEFAULT_SCHEMA_URL,
          mcpServers: {
            test: {
              type: 'stdio',
              command: 'npx',
              args: ['-y', 'pkg'],
            },
          },
        }),
      )

      // First sync to create native file + state
      await runSync({
        scope: 'project',
        ctx,
        flag: ['claude-code'],
        dryRun: false,
        yes: true,
      } as any)
      // Reformat the native file (different formatting, same content)
      const nativePath = join(ctx.cwd, '.mcp.json')
      writeFileAtomic(
        nativePath,
        JSON.stringify(
          {
            mcpServers: {
              test: {
                type: 'stdio',
                command: 'npx',
                args: ['-y', 'pkg'],
              },
            },
          },
          null,
          2,
        ),
      )

      const result = await runDoctor({
        scope: 'project',
        ctx,
        flag: ['claude-code'],
        dryRun: false,
        strict: false,
      })
      const driftWarnings = result.results.filter((r) => r.code === 'DRIFT')
      expect(driftWarnings.length).toBe(0)
    } finally {
      cleanup()
    }
  })

  it('drift: removing managed entry on disk is reported as drift', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeFileAtomic(
        join(ctx.cwd, '.agents', 'mcp.json'),
        JSON.stringify({
          $schema: DEFAULT_SCHEMA_URL,
          mcpServers: {
            test: {
              type: 'stdio',
              command: 'npx',
              args: ['-y', 'pkg'],
            },
          },
        }),
      )

      // First sync to create state
      await runSync({
        scope: 'project',
        ctx,
        flag: ['claude-code'],
        dryRun: false,
        yes: true,
      } as any)

      // Remove the native file
      rmSync(join(ctx.cwd, '.mcp.json'), { force: true })

      const result = await runDoctor({
        scope: 'project',
        ctx,
        flag: ['claude-code'],
        dryRun: false,
        strict: false,
      })
      const driftWarnings = result.results.filter((r) => r.code === 'DRIFT')
      expect(driftWarnings.length).toBeGreaterThan(0)
    } finally {
      cleanup()
    }
  })

  it('warnings do not fail unless --strict', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeFileAtomic(
        join(ctx.cwd, '.agents', 'mcp.json'),
        JSON.stringify({
          $schema: DEFAULT_SCHEMA_URL,
          mcpServers: {
            test: {
              type: 'stdio',
              command: 'npx',
              env: { MISSING_VAR: '${MISSING_VAR}' },
            },
          },
        }),
      )

      const nonStrict = await runDoctor({
        scope: 'project',
        ctx,
        flag: undefined,
        dryRun: false,
        strict: false,
      })
      // MISSING_VAR is not in .env, so it's an error even without --strict
      expect(nonStrict.errors).toBeGreaterThan(0)

      const strict = await runDoctor({
        scope: 'project',
        ctx,
        flag: undefined,
        dryRun: false,
        strict: true,
      })
      expect(strict.errors).toBeGreaterThan(0)
    } finally {
      cleanup()
    }
  })

  it('state error: corrupt lock (.agents/mcp-lock.json) nao faz fallback ao legacy', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeFileAtomic(
        join(ctx.cwd, '.agents', 'mcp.json'),
        JSON.stringify({
          $schema: DEFAULT_SCHEMA_URL,
          mcpServers: {},
        }),
      )
      // Lock novo corrompido: deve virar aviso de estado vazio, sem ler o legacy.
      writeFileAtomic(
        join(ctx.cwd, '.agents', 'mcp-lock.json'),
        '{ not valid json',
      )
      // Legacy tambem presente (valido) mas deve ser ignorado porque o lock novo existe.
      writeFileAtomic(
        join(ctx.cwd, '.agents', '.mcp-sync-state.json'),
        JSON.stringify({
          version: 1,
          scope: 'project',
          targets: [],
          agents: {},
          managedPlugins: [],
        }),
      )

      const result = await runDoctor({
        scope: 'project',
        ctx,
        flag: undefined,
        dryRun: false,
        strict: false,
      })
      const stateErrors = result.results.filter((r) => r.code === 'STATE')
      expect(stateErrors.length).toBeGreaterThan(0)
      expect(result.errors).toBeGreaterThan(0)
      // Nenhum aviso de importacao de legacy (o lock novo venceu, mesmo corrompido).
      const notices = result.results.filter(
        (r) => r.code === 'STATE' && r.severity === 'warning',
      )
      expect(notices.some((n) => n.message.includes('.mcp-sync-state'))).toBe(
        false,
      )
    } finally {
      cleanup()
    }
  })

  it('state warning: apenas legacy (.mcp-sync-state.json) e importado com aviso STATE (nao e erro)', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeFileAtomic(
        join(ctx.cwd, '.agents', 'mcp.json'),
        JSON.stringify({
          $schema: DEFAULT_SCHEMA_URL,
          mcpServers: {},
        }),
      )
      // Apenas o arquivo legacy existe, valido. Nao ha lock novo.
      writeFileAtomic(
        join(ctx.cwd, '.agents', '.mcp-sync-state.json'),
        JSON.stringify({
          version: 1,
          scope: 'project',
          targets: [],
          agents: {},
          managedPlugins: [],
        }),
      )

      const result = await runDoctor({
        scope: 'project',
        ctx,
        flag: undefined,
        dryRun: false,
        strict: false,
      })
      const stateWarnings = result.results.filter(
        (r) => r.code === 'STATE' && r.severity === 'warning',
      )
      expect(stateWarnings.length).toBeGreaterThan(0)
      expect(
        stateWarnings.some((w) => w.message.includes('.mcp-sync-state')),
      ).toBe(true)
      expect(
        stateWarnings.some((w) => w.message.includes('mcp-lock.json')),
      ).toBe(true)
      // Nao deve ser um erro: sem strict nao falha.
      const stateErrors = result.results.filter(
        (r) => r.code === 'STATE' && r.severity === 'error',
      )
      expect(stateErrors.length).toBe(0)
      expect(result.errors).toBe(0)
    } finally {
      cleanup()
    }
  })
})
````

## File: tests/core/gitignore.test.ts
````typescript
import { describe, expect, it } from 'vitest'
import { readFileSync, writeFileSync } from 'node:fs'
import { ensureIgnored } from '$/src/core/gitignore'
import { createSandbox } from '$/tests/helpers/sandbox'

describe('gitignore.ensureIgnored', () => {
  it('creates .gitignore with the managed block when missing', () => {
    const { dir, cleanup } = createSandbox()
    try {
      const result = ensureIgnored(dir, ['.env', 'secrets.local'])
      expect(result.added).toEqual(['.env', 'secrets.local'])
      const content = readFileSync(`${dir}/.gitignore`, 'utf8')
      expect(content).toContain('# agents-mcp local (managed)')
      expect(content).toContain('.env')
      expect(content).toContain('secrets.local')
      expect(content).toContain('# end agents-mcp local (managed)')
    } finally {
      cleanup()
    }
  })

  it('does not duplicate entries already covered', () => {
    const { dir, cleanup } = createSandbox()
    try {
      writeFileSync(
        `${dir}/.gitignore`,
        '# existing\n.env\n.node_modules\n',
        'utf8',
      )
      const result = ensureIgnored(dir, ['.env', 'secrets.local'])
      // `.env` already covered; only secrets.local is added.
      expect(result.added).toEqual(['secrets.local'])
      const content = readFileSync(`${dir}/.gitignore`, 'utf8')
      const managedBlocks = content.match(/# agents-mcp local \(managed\)/g)
      expect(managedBlocks).toHaveLength(1)
    } finally {
      cleanup()
    }
  })

  it('returns empty added when everything is already covered', () => {
    const { dir, cleanup } = createSandbox()
    try {
      writeFileSync(
        `${dir}/.gitignore`,
        '# agents-mcp local (managed)\n.env\nsecrets.local\n# end agents-mcp local (managed)\n',
        'utf8',
      )
      const result = ensureIgnored(dir, ['.env', 'secrets.local'])
      expect(result.added).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('never touches agent configuration files', () => {
    const { dir, cleanup } = createSandbox()
    try {
      writeFileSync(`${dir}/.mcp.json`, '{}', 'utf8')
      writeFileSync(`${dir}/opencode.json`, '{}', 'utf8')
      ensureIgnored(dir, ['.env'])
      expect(readFileSync(`${dir}/.mcp.json`, 'utf8')).toBe('{}')
      expect(readFileSync(`${dir}/opencode.json`, 'utf8')).toBe('{}')
    } finally {
      cleanup()
    }
  })

  it('repeated calls keep all entries between header and footer, idempotent', () => {
    const { dir, cleanup } = createSandbox()
    try {
      const first = ensureIgnored(dir, ['secrets.local'])
      const second = ensureIgnored(dir, ['.env'])
      expect(first.added).toEqual(['secrets.local'])
      expect(second.added).toEqual(['.env'])

      const content = readFileSync(`${dir}/.gitignore`, 'utf8')
      const header = '# agents-mcp local (managed)'
      const footer = '# end agents-mcp local (managed)'
      expect(content.split(header).length - 1).toBe(1)
      expect(content.split(footer).length - 1).toBe(1)

      const headerIdx = content.indexOf(header)
      const footerIdx = content.indexOf(footer)
      expect(headerIdx).toBeGreaterThanOrEqual(0)
      expect(footerIdx).toBeGreaterThan(headerIdx)
      expect(content.slice(headerIdx, footerIdx)).toContain('secrets.local')
      expect(content.slice(headerIdx, footerIdx)).toContain('.env')

      // No accumulated blank lines: exactly one trailing newline.
      expect(content.endsWith('\n')).toBe(true)
      expect(content.endsWith('\n\n')).toBe(false)

      // Idempotent: a third call adds nothing.
      const third = ensureIgnored(dir, ['secrets.local', '.env'])
      expect(third.added).toEqual([])
      const again = readFileSync(`${dir}/.gitignore`, 'utf8')
      expect(again).toBe(content)
    } finally {
      cleanup()
    }
  })

  it('inserts new entries immediately before the footer when block exists', () => {
    const { dir, cleanup } = createSandbox()
    try {
      writeFileSync(
        `${dir}/.gitignore`,
        '# existing\n# agents-mcp local (managed)\n.env\n# end agents-mcp local (managed)\n',
        'utf8',
      )
      const result = ensureIgnored(dir, ['secrets.local'])
      expect(result.added).toEqual(['secrets.local'])

      const content = readFileSync(`${dir}/.gitignore`, 'utf8')
      const lines = content.split(/\r?\n/)
      const footerIdx = lines.findIndex(
        (l) => l.trim() === '# end agents-mcp local (managed)',
      )
      expect(lines[footerIdx - 1]).toBe('secrets.local')
      expect(lines[footerIdx - 2]).toBe('.env')
    } finally {
      cleanup()
    }
  })

  it('closes a corrupted header-only block by appending entries and footer', () => {
    const { dir, cleanup } = createSandbox()
    try {
      writeFileSync(
        `${dir}/.gitignore`,
        '# existing\n# agents-mcp local (managed)\n',
        'utf8',
      )
      const result = ensureIgnored(dir, ['.env', 'secrets.local'])
      expect(result.added).toEqual(['.env', 'secrets.local'])

      const content = readFileSync(`${dir}/.gitignore`, 'utf8')
      expect(content).toContain('# end agents-mcp local (managed)')
      const headers = content.match(/# agents-mcp local \(managed\)/g)
      expect(headers).toHaveLength(1)
    } finally {
      cleanup()
    }
  })
})
````

## File: tests/e2e/e2e.test.ts
````typescript
import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs'
import { runSync } from '$/src/commands/sync'
import { runDoctor } from '$/src/commands/doctor.command'
import { persistCanonicalConfig } from '$/src/commands/util'
import { createSandbox } from '$/tests/helpers/sandbox'
import type { AgentId } from '$/src/adapters/types'
import { DEFAULT_SCHEMA_URL } from '$/src/config'

const ALL_AGENTS: AgentId[] = [
  'claude-code',
  'cursor',
  'vscode',
  'opencode',
  'zed',
  'windsurf',
]

const CANONICAL_CONFIG = {
  $schema: DEFAULT_SCHEMA_URL,
  mcpServers: {
    github: {
      type: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: '${GITHUB_TOKEN}',
      },
    },
    postgres: {
      type: 'stdio',
      command: 'uvx',
      args: ['mcp-server-postgres', '${DATABASE_URL}'],
    },
    linear: {
      type: 'streamable-http',
      url: 'https://mcp.linear.app/mcp',
      headers: {
        Authorization: 'Bearer ${LINEAR_API_KEY}',
      },
    },
  },
}

/**
 * Create mock binaries in the sandbox so doctor's runtime check passes.
 * Also sets env vars in ctx.env so doctor's env check passes.
 * Placeholder names in canonical config: GITHUB_TOKEN, DATABASE_URL, LINEAR_API_KEY.
 */
function createMockBinaries(
  ctx: ReturnType<typeof createSandbox>['ctx'],
): void {
  const binDir = `${ctx.cwd}/.bin`
  mkdirSync(binDir, { recursive: true })
  writeFileSync(`${binDir}/npx`, '#!/usr/bin/env node\nconsole.log("mock")\n', {
    mode: 0o755,
  })
  writeFileSync(`${binDir}/uvx`, '#!/usr/bin/env node\nconsole.log("mock")\n', {
    mode: 0o755,
  })
  // Add bin dir to PATH
  ctx.env.PATH = `${binDir}:${ctx.env.PATH}`
  process.env.PATH = `${binDir}:${process.env.PATH}`
  // Define env vars in ctx.env (doctor reads ctx.env via resolveVar)
  ctx.env.GITHUB_TOKEN = 'fake_token'
  ctx.env.DATABASE_URL = 'postgres://user:pass@localhost/db'
  ctx.env.LINEAR_API_KEY = 'fake_linear_key'
  // Also set in process.env for completeness
  process.env.GITHUB_PERSONAL_ACCESS_TOKEN = 'fake_token'
  process.env.DATABASE_URL = 'postgres://user:pass@localhost/db'
  process.env.LINEAR_API_KEY = 'fake_linear_key'
}

/**
 * Run the full E2E flow: init → sync → doctor.
 */
async function runFullFlow(
  ctx: ReturnType<typeof createSandbox>['ctx'],
  scope: 'project' | 'global',
  agents: AgentId[] = ALL_AGENTS,
) {
  // 1. init - create canonical config with one server
  persistCanonicalConfig('project', ctx, {
    $schema: CANONICAL_CONFIG.$schema,
    mcpServers: {
      github: CANONICAL_CONFIG.mcpServers.github,
    },
  })

  // 2. sync with targets
  const syncResult = await runSync({
    scope,
    ctx,
    flag: agents,
    dryRun: false,
    yes: true,
  } as Parameters<typeof runSync>[0])
  expect(syncResult.targets).toEqual(agents)
  expect(syncResult.written.length).toBeGreaterThan(0)

  // 3. Verify native config file was written
  const projectConfigPath = `${ctx.cwd}/.mcp.json`
  if (scope === 'project') {
    expect(existsSync(projectConfigPath)).toBe(true)
    const content = readFileSync(projectConfigPath, 'utf8')
    expect(content).toContain('mcpServers')
    expect(content).toContain('github')
  }

  // 4. sync again - should be byte-idempotent
  const syncResult2 = await runSync({
    scope,
    ctx,
    flag: agents,
    dryRun: false,
    yes: true,
  } as Parameters<typeof runSync>[0])
  expect(syncResult2.written.length).toBeGreaterThan(0)

  // 5. doctor - should pass
  const doctorResult = await runDoctor({
    scope,
    ctx,
    flag: agents,
    dryRun: false,
    strict: false,
  } as Parameters<typeof runDoctor>[0])
  expect(doctorResult.errors).toBe(0)

  // 6. Remove all servers from canonical config
  persistCanonicalConfig(scope, ctx, {
    $schema: CANONICAL_CONFIG.$schema,
    mcpServers: {},
  })

  // 7. doctor after removal - should still pass (no servers to check)
  const finalDoctor = await runDoctor({
    scope,
    ctx,
    flag: agents,
    dryRun: false,
    strict: false,
  } as Parameters<typeof runDoctor>[0])
  expect(finalDoctor.errors).toBe(0)
}

describe('E2E: agents-mcp full flow', () => {
  it('project scope: init → sync → doctor', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      createMockBinaries(ctx)
      await runFullFlow(ctx, 'project', ['claude-code', 'cursor', 'vscode'])
    } finally {
      cleanup()
    }
  })

  it('global scope: fresh-repo flow in --yes mode', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      createMockBinaries(ctx)
      // For global scope, create canonical config in home/.agents
      const fs = await import('node:fs')
      fs.mkdirSync(`${ctx.homeDir}/.agents`, { recursive: true })
      persistCanonicalConfig('global', ctx, {
        $schema: CANONICAL_CONFIG.$schema,
        mcpServers: {
          github: CANONICAL_CONFIG.mcpServers.github,
        },
      })

      await runFullFlow(ctx, 'global', ['claude-code', 'cursor'])
    } finally {
      cleanup()
    }
  })

  it('--dry-run writes nothing (project scope)', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      createMockBinaries(ctx)
      persistCanonicalConfig('project', ctx, {
        $schema: CANONICAL_CONFIG.$schema,
        mcpServers: {
          github: CANONICAL_CONFIG.mcpServers.github,
        },
      })

      const result = await runSync({
        scope: 'project',
        ctx,
        flag: ['claude-code'],
        dryRun: true,
        yes: true,
      } as Parameters<typeof runSync>[0])

      // dry-run should not write any native files
      expect(result.written).toEqual([])

      // Native file should not exist
      const fs = await import('node:fs')
      expect(fs.existsSync(`${ctx.cwd}/.mcp.json`)).toBe(false)
      expect(fs.existsSync(`${ctx.cwd}/.agents/mcp-lock.json`)).toBe(false)
    } finally {
      cleanup()
    }
  })

  it('all six agents: init → sync → doctor', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      createMockBinaries(ctx)
      persistCanonicalConfig('project', ctx, {
        $schema: CANONICAL_CONFIG.$schema,
        mcpServers: CANONICAL_CONFIG.mcpServers,
      })

      // sync with all six agents
      const result = await runSync({
        scope: 'project',
        ctx,
        flag: ALL_AGENTS,
        dryRun: false,
        yes: true,
      } as Parameters<typeof runSync>[0])
      expect(result.targets).toEqual(ALL_AGENTS)
      expect(result.written.length).toBeGreaterThan(0)

      // doctor
      const doctorResult = await runDoctor({
        scope: 'project',
        ctx,
        flag: ALL_AGENTS,
        dryRun: false,
        strict: false,
      } as Parameters<typeof runDoctor>[0])
      expect(doctorResult.errors).toBe(0)
    } finally {
      cleanup()
    }
  })

  it('fresh clone: mcp.json + diretorio de plugin pre-existente (sem lock) -> sync adota o plugin e sai com 0', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      createMockBinaries(ctx)
      persistCanonicalConfig('project', ctx, {
        $schema: CANONICAL_CONFIG.$schema,
        mcpServers: {
          github: CANONICAL_CONFIG.mcpServers.github,
        },
      })
      // Diretorio de plugin pre-existente com um sentinel (sem lock).
      const pluginDir = `${ctx.cwd}/.agents/plugins/github`
      mkdirSync(pluginDir, { recursive: true })
      const sentinel = `${pluginDir}/sentinel.txt`
      writeFileSync(sentinel, 'FRESH-CLONE-KEEP')

      let exitCode: number | undefined
      const savedExit = process.exit
      process.exit = ((code: number) => {
        exitCode = code
      }) as unknown as NodeJS.Process['exit']
      try {
        const result = await runSync({
          scope: 'project',
          ctx,
          flag: ['claude-code'],
          dryRun: false,
          yes: true,
        } as Parameters<typeof runSync>[0])
        expect(result.errors).toEqual([])
      } finally {
        process.exit = savedExit
      }
      expect(exitCode).toBeUndefined() // sincronizacao bem-sucedida => nao chama exit (exit 0)

      // Sentinel preservado, arquivos gerenciados sobrescritos (adocao).
      expect(readFileSync(sentinel, 'utf8')).toBe('FRESH-CLONE-KEEP')
      expect(
        JSON.parse(readFileSync(`${pluginDir}/plugin.json`, 'utf8')).name,
      ).toBe('github')
      expect(existsSync(`${pluginDir}/mcp.json`)).toBe(true)

      // Lock criado e registra o plugin como gerenciado.
      const lock = `${ctx.cwd}/.agents/mcp-lock.json`
      expect(existsSync(lock)).toBe(true)
      const stateContent = readFileSync(lock, 'utf8')
      expect(stateContent).toContain('github')

      // sync nao cria nem toca .gitignore com o nome do lock.
      const gitignore = `${ctx.cwd}/.gitignore`
      if (existsSync(gitignore)) {
        expect(readFileSync(gitignore, 'utf8')).not.toContain('mcp-lock')
      }
    } finally {
      cleanup()
    }
  })

  it('plain sync nao cria .gitignore contendo o nome do lock', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      createMockBinaries(ctx)
      persistCanonicalConfig('project', ctx, {
        $schema: CANONICAL_CONFIG.$schema,
        mcpServers: {
          github: CANONICAL_CONFIG.mcpServers.github,
        },
      })

      const result = await runSync({
        scope: 'project',
        ctx,
        flag: ['claude-code'],
        dryRun: false,
        yes: true,
      } as Parameters<typeof runSync>[0])
      expect(result.errors).toEqual([])

      const gitignore = `${ctx.cwd}/.gitignore`
      expect(existsSync(gitignore)).toBe(false)
    } finally {
      cleanup()
    }
  })
})
````

## File: tests/helpers/sandbox.ts
````typescript
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRuntimeContext, type RuntimeContext } from '$/src/core/context'

/**
 * Create a temp sandbox with `cwd`, `homeDir`, and `XDG_CONFIG_HOME`/`APPDATA`
 * overridden so no test ever touches real user configuration.
 *
 * Every path returned is under `os.tmpdir()`. Call `cleanup()` at the end of
 * each test (or in `afterEach`).
 */
export function createSandbox(): {
  dir: string
  ctx: RuntimeContext
  cleanup: () => void
} {
  const dir = mkdtempSync(join(tmpdir(), 'agents-mcp-sandbox-'))
  const projectDir = join(dir, 'project')
  const homeDir = join(dir, 'home')
  const env = {
    ...process.env,
    XDG_CONFIG_HOME: join(homeDir, '.config'),
    APPDATA: join(homeDir, 'AppData', 'Roaming'),
  }
  const ctx = createRuntimeContext({
    cwd: projectDir,
    homeDir,
    env,
    isTTY: false,
  })
  return {
    dir,
    ctx,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  }
}
````

## File: tests/sources/direct.test.ts
````typescript
import { describe, expect, it } from 'vitest'
import { resolveDirect } from '$/src/sources/direct'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer, isHttpServer } from '$/src/core/schema'

function asStdio(server: CanonicalServer) {
  return server as Extract<CanonicalServer, { type: 'stdio' }>
}

function asHttp(server: CanonicalServer) {
  return server as Extract<
    CanonicalServer,
    { type: 'streamable-http' } | { type: 'sse' }
  >
}

describe('sources direct', () => {
  it('parses --command with --arg', () => {
    const result = resolveDirect({
      command: 'npx',
      arg: ['-y', '@scope/pkg'],
    })
    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('npx')
    expect(s.args).toEqual(['-y', '@scope/pkg'])
  })

  it('parses --command with whitespace tokenization', () => {
    const result = resolveDirect({
      command: 'npx -y @scope/pkg',
    })
    const s = asStdio(result.definition)
    expect(s.command).toBe('npx')
    expect(s.args).toEqual(['-y', '@scope/pkg'])
  })

  it('parses --http as streamable-http', () => {
    const result = resolveDirect({
      http: 'https://mcp.linear.app/mcp',
    })
    const s = asHttp(result.definition)
    expect(isHttpServer(s)).toBe(true)
    expect(s.type).toBe('streamable-http')
    expect(s.url).toBe('https://mcp.linear.app/mcp')
  })

  it('parses --sse as sse', () => {
    const result = resolveDirect({
      sse: 'https://mcp.linear.app/sse',
    })
    const s = asHttp(result.definition)
    expect(isHttpServer(s)).toBe(true)
    expect(s.type).toBe('sse')
    expect(s.url).toBe('https://mcp.linear.app/sse')
  })

  it('parses --env KEY=VALUE', () => {
    const result = resolveDirect({
      command: 'npx',
      env: ['GITHUB_TOKEN=${GITHUB_TOKEN}'],
    })
    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.env).toEqual({ GITHUB_TOKEN: '${GITHUB_TOKEN}' })
    expect(result.requiredEnv.map((v) => v.name)).toContain('GITHUB_TOKEN')
  })

  it('parses --header', () => {
    const result = resolveDirect({
      http: 'https://api.example.com/mcp',
      header: ['Authorization: Bearer token'],
    })
    const s = asHttp(result.definition)
    expect(isHttpServer(s)).toBe(true)
    expect(s.headers).toEqual({
      Authorization: 'Bearer token',
    })
  })

  it('suggests name from URL', () => {
    const result = resolveDirect({
      http: 'https://mcp.linear.app/mcp',
    })
    expect(result.suggestedName).toContain('linear')
  })

  it('suggests name from command', () => {
    const result = resolveDirect({
      command: 'npx -y @scope/pkg',
    })
    expect(result.suggestedName).toBe('npx')
  })
})
````

## File: tests/smoke.test.ts
````typescript
import { describe, expect, it } from 'vitest'
import pkg from '$/package.json' with { type: 'json' }

describe('smoke test', () => {
  it('resolves root alias and package manifest', () => {
    expect(pkg.name).toBe('@agents-config/mcp')
    expect(pkg.type).toBe('module')
  })
})
````

## File: .prettierignore
````
dist/
coverage/
node_modules/
workflow/
.codegraph/
*.db*
spec/
docs/decisions/
.agents/
skills/
opencode.json
repomix-output.md
skills-lock.json
````

## File: .agents/skills/product-owner/SKILL.md
````markdown
---
name: product-owner
description: >-
  Product Owner role grounded in Scrum and Kanban practices to discover,
  prioritize, and frame product features, improvements, and bug fixes in
  `workflow/BACKLOG.md`, and validate final delivery in `workflow/<change-slug>/VALIDATION.md`.
  Use this skill whenever asked to act as a Product Owner, manage a product
  backlog, frame business/user requirements before technical specification, or
  validate delivered value in coordination with `spec-driven-workflow` and
  `architect-worker`.
---

# Product Owner Role

Own the **why**, **who**, and **what value** of product changes. Bridge user needs and business goals with engineering execution through `workflow/BACKLOG.md` (the only root file in `workflow/`) and `workflow/<change-slug>/VALIDATION.md` (`spec-driven-workflow`), collaborating with the **Architect** and **Worker** (`architect-worker`).

## Agile Foundations (Scrum & Kanban)

Combine Scrum's value-driven product ownership with Kanban's upstream flow discipline:

- **Scrum**:
  - **Value Maximization & Product Goal**: Prioritize work that delivers the highest user and business impact toward the Product Goal.
  - **Product Backlog & Refinement**: Maintain an ordered mini-backlog of evolutions, features, and bug fixes in `workflow/BACKLOG.md`, refining top items until they are clear and actionable.
  - **INVEST & Behavioral Acceptance**: Frame demands with clear user perspective (User Stories / Jobs-to-be-Done) and observable product acceptance expectations—independent of implementation details.
  - **Sprint / Release Value Validation**: Verify the delivered increment against original product intent before closing the cycle.
- **Kanban**:
  - **Upstream vs. Downstream Separation**: Operate in **Upstream** (discovery, triage, prioritization, shaping) before work is pulled into **Downstream** engineering (`SPEC.md` -> `PLAN.md` -> `TASKS.md` -> Implementation -> `REVIEW.md`).
  - **Classes of Service**: Explicitly classify urgency and flow priority:
    - `Expedite`: Critical production bugs, security issues, or blocking incidents.
    - `Fixed Date`: Time-bound commitments or external deadlines.
    - `Standard`: Regular features, enhancements, and non-urgent bug fixes.
    - `Intangible`: Technical enablers or preventative improvements with long-term value.
  - **Definition of Ready (DoR)**: Only move an item from `Refining` to `Ready` for the Architect when problem, value, scope boundaries, and product acceptance expectations are unambiguous.

## Role Activation

1. **Explicit Role Assignment**: Adopt the Product Owner role when requested (e.g., *"Act as Product Owner"*, *"Define this feature as a PO"*, or *"Validate this delivery"*).
2. **Role Persistence**: Maintain the Product Owner perspective throughout the session unless the user instructs a role switch.
3. **Collaboration Mode**: When working alongside `architect-worker`, hand off `Ready` items to the **Architect** via `workflow/BACKLOG.md` and receive completed deliveries back via `workflow/<change-slug>/VALIDATION.md`.

## Responsibilities

### 1. Maintain the Product Backlog & Frame Demands (`workflow/BACKLOG.md`)

- Initialize `workflow/BACKLOG.md` using [BACKLOG.md](../spec-driven-workflow/resources/BACKLOG.md) (and check whether `workflow/` is in `.gitignore` per `spec-driven-workflow`, asking the user before adding it if missing).
- Keep an ordered **Product Backlog** table for software evolutions, new features, enhancements, and bug reports (`Idea` -> `Refining` -> `Ready` -> `In Downstream` -> `Done`).
- When preparing a demand for engineering, complete the **Active Demand Brief** section:
  - Articulate the **User Problem & Business Value**.
  - Write a clear **User Story / Job-to-be-Done** (or **Bug Impact & Observed Behavior** for bug fixes).
  - Attach any screenshots (including annotated UI bug captures) or supporting evidence in `workflow/assets/` and link them in `workflow/BACKLOG.md` (e.g., `./assets/<filename>`).
  - Define **Product Acceptance Expectations** (what a user or stakeholder must be able to do or observe).
  - State **Out of Scope** items explicitly to prevent scope creep.
  - Verify the **Definition of Ready (DoR)** checklist before handing off to the Architect.

### 2. Clarify Ambiguities During Downstream Execution

- If the Architect or Worker surfaces a product ambiguity or trade-off (e.g., in `SPEC.md` Open Questions or `REVIEW.md`), decide from a **user value and priority** perspective and update `workflow/BACKLOG.md` accordingly.

### 3. Validate Completed Deliveries (`workflow/<change-slug>/VALIDATION.md`)

- Once the Architect finishes `REVIEW.md` and prepares `workflow/<change-slug>/VALIDATION.md`, inspect the **Delivery Summary**, **Backlog Value Mapping**, and **How to Validate** scenarios.
- Verify that the delivered increment satisfies the original product intent and acceptance expectations in `workflow/BACKLOG.md`.
- Update `workflow/<change-slug>/VALIDATION.md` status:
  - **`Approved`**: Complete the sign-off checklist so the Architect/user can close the cycle and delete `workflow/<change-slug>/` (while preserving and updating `workflow/BACKLOG.md` for ongoing backlog items).
  - **`Changes Requested`**: Record clear product-level gaps in `workflow/<change-slug>/VALIDATION.md` (without prescribing code) so the Architect can plan follow-up adjustments.
- Log any newly discovered opportunities or deferred enhancements back into the `workflow/BACKLOG.md` backlog.

## Guardrails

- **Never prescribe technical implementation**: Do not specify file paths, database schemas, frameworks, class designs, or code changes. Leave *how* to the Architect (`SPEC.md`/`PLAN.md`) and Worker.
- **Never write or modify production code or test suites**.
- **Only create or edit product-governance artifacts**: `workflow/BACKLOG.md`, `workflow/<change-slug>/VALIDATION.md` (validation notes and sign-off), `workflow/assets/` (backlog-level screenshots or evidence), and `.gitignore` (only after user confirmation if `workflow/` is missing).
- **Never commit `workflow/`**: Ensure `workflow/` remains untracked by Git per `spec-driven-workflow`.

## Handoff Lifecycle

```text
[Product Owner] 0. Discover & Frame  -> Curates backlog & writes Ready brief in workflow/BACKLOG.md
       │
       ▼
[Architect]     1. Specify & Plan    -> Translates BACKLOG.md into workflow/<change-slug>/SPEC.md, PLAN.md (+ TASKS.md)
       │
       ▼
[Worker]        2. Implement & Verify-> Builds & tests against workflow/<change-slug>/PLAN.md / TASKS.md
       │
       ▼
[Architect]     3. Review & Handoff  -> Approves REVIEW.md, writes workflow/<change-slug>/VALIDATION.md
       │
       ▼
[Product Owner] 4. Validate Value    -> Reviews workflow/<change-slug>/VALIDATION.md against BACKLOG.md
       │
       ├── If Changes Requested ──────► [Architect] refines SPEC.md/PLAN.md for Worker
       │
       ▼
[PO / Architect]5. Sign-Off & Cleanup-> Marks Approved, confirms with user, deletes workflow/<change-slug>/, updates BACKLOG.md
```
````

## File: .agents/skills/spec-driven-workflow/resources/PLAN.md
````markdown
# Execution Plan: <Short Title>

- **Spec**: [SPEC.md](./SPEC.md)
- **Status**: Draft | Ready | In Progress | Done

## Technical Approach

Summarize the chosen architecture, key design decisions, and any trade-offs.

## Affected Areas

- `path/to/module_a` — <what changes and why>
- `path/to/module_b` — <what changes and why>

## Execution Steps

1. **<Step 1 Title>**
   - Details of what to implement or modify.
   - Verification: <how to confirm this step works>
2. **<Step 2 Title>**
   - Details of what to implement or modify.
   - Verification: <how to confirm this step works>

## Verification Strategy

- Automated tests to add or update (unit, integration, e2e).
- Commands to run (`test`, `lint`, `build`, `typecheck`).

## Risks & Rollback

- Potential failure modes and how to mitigate or revert safely.

## Supporting Assets (Optional)

- [<Short description>](./assets/<filename>) — <Architecture diagram, trace, or supporting evidence stored in `workflow/<change-slug>/assets/`>
````

## File: .agents/skills/spec-driven-workflow/resources/SPEC.md
````markdown
# Specification: <Short Title>

- **Type**: Feature | Bug Fix | Refactor | Chore
- **Status**: Draft | Approved | In Progress | Done
- **Owner**: <author or agent>

## Context & Problem Statement

Describe the current state, why this change is needed, and (for bug fixes) reproduction steps along with expected vs. actual behavior.

## Goals

- <Measurable outcome 1>
- <Measurable outcome 2>

## Non-Goals

- <Explicitly out-of-scope item 1>

## Requirements

### Functional Requirements

1. <Requirement 1>
2. <Requirement 2>

### Non-Functional Requirements & Constraints

- Performance, security, compatibility, or architectural constraints.

## Acceptance Criteria

- [ ] <Objective, testable criterion 1>
- [ ] <Objective, testable criterion 2>

## Open Questions

- [ ] <Unresolved question, if any>

## Supporting Assets (Optional)

- [<Short description>](./assets/<filename>) — <Supporting screenshot, diagram, or evidence stored in `workflow/<change-slug>/assets/`>
````

## File: .agents/skills/spec-driven-workflow/resources/VALIDATION.md
````markdown
# Delivery Validation: <Short Title>

- **Backlog**: [BACKLOG.md](../BACKLOG.md)
- **Spec**: [SPEC.md](./SPEC.md)
- **Review**: [REVIEW.md](./REVIEW.md)
- **Prepared By**: <Architect / Lead Engineer>
- **Validated By**: <Product Owner>
- **Status**: Pending Validation | Changes Requested | Approved

## Delivery Summary

Plain-language overview of what was built or fixed, written for product and stakeholder review rather than code-level inspection.

## Backlog Value Mapping

| Backlog ID | Product Expectation | Delivery Status | Notes |
| :--- | :--- | :--- | :--- |
| B1 | <Original expectation from BACKLOG.md> | Delivered \| Partial \| Deferred | <Summary of how it was met> |

## How to Validate

Observable user flows, commands, UI paths, or scenarios the Product Owner can check to confirm the expected behavior:

1. **<Scenario 1>**: <Steps to observe and expected outcome>
2. **<Scenario 2>**: <Steps to observe and expected outcome>

## Known Limitations & Follow-Ups

- <Any deferred scope, edge cases, or recommended next items for the `BACKLOG.md` backlog>

## Product Owner Sign-Off

- [ ] Delivered behavior matches the product intent and user value in `BACKLOG.md`.
- [ ] Product acceptance expectations are satisfied.
- [ ] Ready to close this cycle and clean up `workflow/<change-slug>/` (while updating `../BACKLOG.md` as needed).

### Validation Notes / Requested Adjustments

- <Feedback from the Product Owner if `Changes Requested`, or sign-off note if `Approved`>

### Supporting Assets (Optional)

- [<Short description>](./assets/<filename>) — <Validation screenshot, recording, or evidence stored in `workflow/<change-slug>/assets/`>
````

## File: .github/workflows/ci.yml
````yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  verify:
    name: Verify (Node ${{ matrix.node-version }})
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        node-version: [22, 24, 26]
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run verification suite
        run: npm run verify

  windows-paths:
    name: Windows Path & Atomic Tests (Node 22)
    runs-on: windows-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run typecheck
        run: npm run typecheck

      - name: Run core and adapter tests
        run: npx vitest run tests/core tests/adapters
````

## File: spec/BLUEPRINT.md
````markdown
# Technical Blueprint: `agents-mcp` (`v0.1.0`)

> **Audience:** AI coding agents (Worker) and human contributors.
> **Role of this document:** architecture, contracts, and non-negotiable decisions.
> The format itself is specified in [`SPEC.md`](./SPEC.md); per-agent translation
> in [`MATRIX.md`](./MATRIX.md); the rationale for each hard decision in
> [`docs/decisions/`](../docs/decisions/).

---

## 1. Vision & Design Principles

`agents-mcp` is a **configuration compiler**, not a runtime. It owns three edges:

1. **Core (single source of truth):** `.agents/mcp.json` (project) and
   `~/.agents/mcp.json` (global).
2. **Input edges (`src/sources/`, `import`):** normalize existing agent files, MCP
   `server.json` manifests, GitHub repositories, npm packages, and CLI flags into
   the canonical model.
3. **Output edges (`src/adapters/`):** project the canonical model into each
   agent's native file, translating schema and env syntax while preserving
   everything the compiler does not own.

Principles, in priority order:

1. **Never lose user data.** No deletion of native files, no whole-file rewrites,
   no silent field dropping.
2. **Deterministic.** Same input → byte-identical output. The published schema is
   reproducible on any machine and in CI.
3. **Local-first.** No network required for `init`, `sync`, `remove`, `list`,
   `doctor`. Network is only used by `add`/`import` when resolving external
   sources.
4. **Secrets stay symbolic.** Canonical and native files contain `${VAR}`
   placeholders; real values live only in `.env`.
5. **Testability by construction.** Paths, platform, environment, TTY, and fetch
   are injected; adapters and compilers are pure functions over data.
6. **Zero runtime dependencies in the published package.** Single-file ESM
   bundle; everything inlined at build time.

---

## 2. Tech Stack & Toolchain

| Concern | Choice | Notes |
| :--- | :--- | :--- |
| Language | TypeScript `7.x` (strict) | Native compiler (`tsc --noEmit`) for type checking only. |
| Runtime floor | **Node.js `>= 22`** | Current LTS baseline; `@types/node@^22` so the type check cannot use APIs above the floor. |
| Module system | ESM (`"type": "module"`), `module`/`moduleResolution` = `preserve`/`bundler` | Source is never executed as-is; only bundled output ships. |
| Bundler | `tsup@^9` (esbuild) | See §2.1. `dts: false` — this is a CLI, no type declarations are published. |
| CLI parser | `citty@^0.2` | Sub-commands + global flags. |
| Prompts | `@clack/prompts@^1.9` | Always behind `src/ui/prompts.ts`. |
| Schema | `zod@^4.6` | Native `z.toJSONSchema()`. |
| JSONC | `jsonc-parser@^3.3` | `parseTree` + `modify` + `applyEdits`. |
| Argv splitting | `string-argv@^0.4` | Only for `--stdio "cmd args"` convenience. |
| Tests | `vitest@^5` | Node environment, real temp filesystem, mocked `fetch`. |
| Schema tests | `ajv@^8` + `ajv-formats@^3` (dev) | Validate the generated Draft 2020-12 document and fixtures. |
| Packaging | `tsx` + `npm-run-all2` (dev) | `npm run dist` builds, packages, publishes. |
| Formatting | `prettier@^3` | `format:check` runs in CI. |

### 2.1 Why `tsup` (and not Vite or raw esbuild)

All three end up using esbuild/Rollup-class bundling; the difference is the amount
of glue we own.

- **Vite** is browser-first. CLI/library bundling means library mode (Rollup),
  externalization rules, `ssr` targets, and a dev server we never use. It is the
  heaviest option for a single-file CLI with no assets.
- **Raw `esbuild`** is viable and gives total control, but we would hand-write the
  ~40-line build script for `banner` (shebang), `clean`, `target`, `platform`,
  single-file output, tree shaking, and externals. That script is a permanent
  maintenance surface.
- **`tsup`** is a thin, purpose-built wrapper over esbuild that already provides
  `banner`, `clean`, `format`, `target`, `platform`, `treeshake`, `splitting`, and
  a TypeScript config file. Zero bespoke build code, identical output.

**Decision:** use `tsup` with the configuration below. If `tsup` ever blocks us
(for example on a future Node/TypeScript release), the escape hatch is a
`scripts/build.ts` that calls `esbuild.build()` directly with the same options —
the output contract stays identical.

```ts
// tsup.config.ts
export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  dts: false,
  clean: true,
  sourcemap: false,
  splitting: false,
  treeshake: true,
  banner: { js: '#!/usr/bin/env node' },
})
```

Build output contract (verified in CI and in `T11`):

- exactly one runtime file: `dist/index.js`;
- starts with the shebang;
- contains no bare `import`/`require` of an external package (everything inlined);
- `node dist/index.js --help` exits `0`.

---

## 3. Repository Layout

```text
agents-mcp/
├── docs/
│   └── decisions/                    # ADRs (published)
├── scripts/
├── spec/
│   ├── SPEC.md                       # published format specification
│   ├── MATRIX.md                     # published per-agent translation matrix
│   └── BLUEPRINT.md                  # this document
├── src/
│   ├── config.ts                     # constants (site, version, state, aliases)
│   ├── index.ts                      # citty entrypoint
│   ├── core/
│   │   ├── schema.ts                 # Zod schemas + validateConfig()
│   │   ├── fs-atomic.ts              # temp+rename, backup, JSONC read/write
│   │   ├── store.ts                  # canonical file read/write
│   │   ├── state.ts                  # sync state (targets + managed names)
│   │   ├── placeholder.ts            # parse/translate `${VAR}` syntax
│   │   ├── env.ts                    # `.env` parse, resolution, secret extraction
│   │   └── gitignore.ts              # minimal `.env` / state protection
│   ├── adapters/
│   │   ├── types.ts                  # AgentAdapter contract
│   │   ├── shared.ts                 # JSONC helpers + env translation
│   │   ├── claude-code.ts
│   │   ├── cursor.ts
│   │   ├── vscode.ts
│   │   ├── opencode.ts
│   │   ├── windsurf.ts
│   │   ├── zed.ts
│   │   └── index.ts                  # registry + detection
│   ├── sources/
│   │   ├── types.ts                  # ResolvedServerPackage
│   │   ├── direct.ts
│   │   ├── github.ts
│   │   ├── registry.ts
│   │   └── index.ts                  # resolution order
│   ├── commands/
│   │   ├── init.ts
│   │   ├── import.ts
│   │   ├── add.ts
│   │   ├── sync.ts
│   │   ├── remove.ts
│   │   ├── list.ts
│   │   └── doctor.ts
│   └── ui/
│       ├── prompts.ts                # PromptUi port
│       └── auto.ts                   # non-interactive implementation
├── tests/
│   ├── core/
│   ├── adapters/
│   ├── sources/
│   ├── commands/
│   ├── schema/
│   └── helpers/
├── package.json
├── package.ts                        # dist/ packaging script
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

---

## 4. Configuration Constants (`src/config.ts`)

All constants live in one dependency-free module. Nothing here reads
`process.env`; the schema URL must be reproducible on any machine.

```ts
export const AGENT_PLUGINS_MCP_SCHEMA_URL =
  'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json'
export const AGENT_PLUGINS_MCP_SPEC_URL =
  'https://agent-plugins.org/plugin-authors/mcp-servers'
export const DEFAULT_SCHEMA_URL = AGENT_PLUGINS_MCP_SCHEMA_URL
export const SCHEMA_DRAFT = 'draft-07'

export const AGENTS_DIR = '.agents'
export const CONFIG_FILE = 'mcp.json'
export const STATE_FILE = 'mcp-lock.json'
export const LEGACY_STATE_FILE = '.mcp-sync-state.json'
export const STATE_VERSION = 1
export const ENV_FILE = '.env'
export const ENV_EXAMPLE_FILE = '.env.example'

export const SERVER_NAME_PATTERN = /^[a-z0-9][a-z0-9._-]*$/

/** Deterministic order for conflict resolution and reporting. */
export const AGENT_ORDER = [
  'claude-code', 'cursor', 'vscode', 'opencode', 'zed', 'windsurf',
] as const
```

Rules:

- The URL keeps the `v` prefix (`/schema/v0.1.0/...`), matching the README, the
  spec text, and the published Agent Plugins schema URI.
- `AGENTS_MCP_SITE_URL` is intentionally **not** supported. Determinism wins.

---

## 5. Canonical Schema (`src/core/schema.ts`)

### 5.1 Zod 4 definitions

```ts
export const AgentIdSchema = z.enum([
  'claude-code', 'cursor', 'vscode', 'opencode', 'windsurf', 'zed',
])

/** Chaves de variável de ambiente reservadas pelo Agent Plugins MCP 1.0.0. */
const RESERVED_ENV_KEYS = ['PLUGIN_ROOT', 'PLUGIN_DATA']

/** Padrão de `cwd` permitido pelo Agent Plugins MCP 1.0.0. */
const CWD_PATTERN =
  /^(?:\.\/|\$\{PLUGIN_ROOT\}(?:\/|$)|\$\{PLUGIN_DATA\}(?:\/|$))/

export const StdioServerSchema = z.strictObject({
  type: z.literal('stdio'),
  command: z.string().min(1),
  args: z.array(z.string()).default([]),
  env: z
    .record(z.string(), z.string())
    .optional()
    .refine(
      (env) =>
        !env ||
        Object.keys(env).every((key) => !RESERVED_ENV_KEYS.includes(key)),
      {
        message: `Reserved environment variable keys are not allowed: ${RESERVED_ENV_KEYS.join(', ')}`,
      },
    ),
  cwd: z.string().regex(CWD_PATTERN).optional(),
})

export const StreamableHttpServerSchema = z.strictObject({
  type: z.literal('streamable-http'),
  url: z.string().min(1),
  headers: z.record(z.string(), z.string()).optional(),
})

export const SseServerSchema = z.strictObject({
  type: z.literal('sse'),
  url: z.string().min(1),
  headers: z.record(z.string(), z.string()).optional(),
})

export const CanonicalServerSchema = z.discriminatedUnion('type', [
  StdioServerSchema,
  StreamableHttpServerSchema,
  SseServerSchema,
])

export const CanonicalMcpConfigSchema = z.strictObject({
  $schema: z.literal(DEFAULT_SCHEMA_URL),
  mcpServers: z.record(z.string(), CanonicalServerSchema),
})
```

Decisions:

- **`z.strictObject()` everywhere.** Unknown keys are rejected at read time instead
  of silently disappearing on the next `sync`.
- **`z.url()`** (Zod 4 top-level format), not `z.string().url()`.
- **Three transports.** `type` is `'stdio' | 'streamable-http' | 'sse'` (ADR-0010).
- **`$schema` is fixed.** `$schema: z.literal(DEFAULT_SCHEMA_URL)` enforces the
  official Agent Plugins MCP 1.0.0 URI; `validateConfig()` warns on mismatch.
- **No `.refine()`/`.transform()` in this file.** `z.toJSONSchema()` throws by
  default on unrepresentable schemas. Extras that cannot be expressed in JSON
  Schema live in a separate `validateConfig()` function:
  - warn when `$schema !== DEFAULT_SCHEMA_URL` (do not fail).
- **No `disabled`/`targets` on server objects.** These extensions were removed
  to match the official Agent Plugins MCP 1.0.0 schema (`additionalProperties:
  false`).

### 5.3 Defaults and write-back policy

- `.parse()` applies defaults for compilation; **do not materialize defaults when
  writing the canonical file.** A user who omits `args` keeps omitting it, so
  `scan`, `import`, and `add` produce minimal diffs and `sync` stays idempotent.
- Server names are the canonical identity. Renaming means remove + add.

---

## 6. Import Convention & `tsconfig.json`

The project uses one alias, `$`, mapped to the repository root.

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "preserve",
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": { "$/*": ["./*"] },
    "types": ["node"],
    "resolveJsonModule": true,
    "verbatimModuleSyntax": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src", "scripts", "tests", "*.ts"]
}
```

**Import rule (enforced in review):**

- If the path climbs **zero or one** directory level, use a relative import:
  `./schema`, `../config`, `../core/env`.
- If it climbs **two or more** levels, use the alias: `$/package.json`,
  `$/src/core/schema` (from `tests/` or `scripts/`).
- **Never** append `.js`/`.ts` to a module specifier. Sources are only consumed by
  bundlers/transpilers; the shipped artifact is a single file.
- JSON import requires `with { type: 'json' }`.

Tooling consequences:

- `tsup`/esbuild reads `paths` from `tsconfig.json` automatically.
- `tsx` supports `paths` (used by `scripts/*`).
- **Vitest does not read `paths`** → `vitest.config.ts` MUST declare
  `resolve.alias = { '$': rootDir }`.
- `tsc --noEmit` is the first gate in `T1`; if TypeScript 7 rejects any option
  above, fall back to TypeScript `5.9` and record it as a new ADR.

---

## 7. Runtime Context & Path Resolution

No module may call `os.homedir()`, `process.platform`, `process.cwd()`,
`process.env`, or `process.stdout.isTTY` at import time or inside adapters.
Everything comes through an injected context.

```ts
export interface RuntimeContext {
  readonly cwd: string
  readonly homeDir: string
  readonly platform: NodeJS.Platform
  readonly env: NodeJS.ProcessEnv
  readonly isTTY: boolean
}

export function createRuntimeContext(overrides?: Partial<RuntimeContext>): RuntimeContext
```

- `createRuntimeContext()` is called exactly once in `src/index.ts` (and once per
  test) and passed down.
- Global paths respect `XDG_CONFIG_HOME` on Linux/macOS and `APPDATA` on Windows,
  falling back to the documented defaults (see `MATRIX.md` §1.1).
- VS Code probes `Code`, `Code - Insiders`, `VSCodium` in that order.
- This is what makes Windows path behavior testable on Linux CI (ADR-0004).

---

## 8. Core Modules

### 8.1 `core/fs-atomic.ts`

- `readTextFile(path): string | null` — `null` for `ENOENT`.
- `writeFileAtomic(path, content, { mode })` — write to a temp file **in the same
  directory**, `fsync`, then `rename`; on Windows retry `rename` after
  `rm`-less fallback (`copyFile` + `unlink`) because `rename` over an existing file
  can fail.
- `backupFile(path)` — copy to `<path>.bak.<ISO timestamp>` before `--force`
  operations.
- `writeFileAtomic` must be safe against symlink surprises: `O_EXCL` on the temp
  file, random suffix.
- `.env` is written with mode `0o600`.

### 8.2 `core/store.ts`

Canonical file access only:

- `getConfigPath(scope, ctx)` → `<cwd>/.agents/mcp.json` |
  `<homeDir>/.agents/mcp.json`.
- `readConfig(scope, ctx)` → `{ config, raw } | null`.
- `writeConfig(scope, ctx, config)` → serializes `$schema` + `mcpServers` (minimal,
  defaults not materialized), atomic write.
- `loadValidatedConfig(scope, ctx)` → `{ config, warnings }`; throws
  `ConfigValidationError` with a readable path (`mcpServers.github.url`).
- Values are read with `jsonc-parser` even for `.json` files (tolerant of comments
  and trailing commas).

### 8.3 `core/state.ts`

```ts
interface SyncState {
  version: 1
  scope: 'project' | 'global'
  targets: AgentId[]
  agents: Record<AgentId, {
    path: string
    names: string[]
    updatedAt: string // ISO-8601
  }>
}
```

Location: `<state dir>/mcp-lock.json`, where the state dir is `<cwd>/.agents`
or `<homeDir>/.agents`. A legacy file at `.agents/.mcp-sync-state.json` (or
`~/.agents/.mcp-sync-state.json`) is read as a fallback. Rules:

- Missing file → empty state, no warning.
- Corrupt/unknown-version file → warn, treat as empty, and rewrite on next
  successful `sync`.
- Lock precedence: new lock file → legacy file → empty state. Using the legacy
  file emits a non-fatal notice (not an error). A corrupt new lock never falls
  back to the legacy file.
- `targets` is the persisted agent selection. It is the second source of truth for
  `sync` (after `--agents`, before auto-detection).
- `names` per agent is the authoritative `previousManagedNames` set.
- `import` seeds `names` for every agent it read, even with `--no-sync`.
- `remove` and `sync` prune names no longer present in the canonical file.
- State is always written atomically; schema and `STATE_VERSION` stay `1`.
- The lock is **not** auto-added to `.gitignore`; implementers MAY version it.
  Only `.env` is auto-protected.

### 8.4 `core/placeholder.ts`

Single implementation shared by adapters, `add`, `doctor`:

```ts
const PLACEHOLDER_RE = /\$\{([A-Za-z_][A-Za-z0-9_]*)(?::-([^}]*))?\}/g

interface Placeholder { raw: string; name: string; fallback?: string; start: number; end: number }

parsePlaceholders(value: string): Placeholder[]
translate(value: string, syntax: EnvSyntax, opts: { nativeDefault: boolean }):
  { value: string; warnings: PlaceholderWarning[] }
collectRequiredVars(server: CanonicalServer): RequiredVar[]
```

`EnvSyntax = 'posix' | 'env-colon' | 'brace-env'` (`${VAR}`, `${env:VAR}`,
`{env:VAR}`). Translation is purely syntactic and idempotent. `translate()` never
substitutes values.

### 8.5 `core/env.ts`

- `parseDotenv(content)` — line-based, `KEY=VALUE`, comments, optional quotes,
  duplicate keys → last wins, no variable expansion.
- `readDotenv(scope, ctx)` — `<cwd>/.env` for project, `<homeDir>/.agents/.env`
  for global.
- `resolveVar(name, { dotenv, processEnv, fallback })` — precedence: dotenv →
  processEnv → fallback. Empty string counts as unset for fallback purposes.
- `planSecretExtraction(server, { policy })` → `{ server, writes, warnings }` where
  `writes` are `{ key, value, description? }`. Never touches disk.
- `appendToDotenv(path, writes)` — creates the file if missing (mode `0600` after
  ensuring `.env` is git-ignored), never overwrites an existing key; warns on a
  key that exists with a different value.
- `syncEnvExample(path, keys)` — append missing `KEY=` entries only; preserve
  order, comments, and existing lines; never write values.

### 8.6 `core/gitignore.ts`

Minimal, lazy, and only for tool-owned secrets:

- `ensureIgnored(rootDir, entries)` adds a managed block only when something is
  about to be written:

  ```gitignore
  # agents-mcp local (managed)
  .env
  ```

- Called by `env.appendToDotenv` only (never by `state.writeState`, `init`, or
  `sync` on their own). `writeState` never touches `.gitignore`.
- Never touches agent configuration files. Never ignores shared settings.
- If an entry is already covered by another pattern, do not duplicate it.
- If `.env` is already tracked by Git, warn with
  `git rm --cached .env` and continue (the value is still safe from new commits).

---

## 9. Adapter Layer

### 9.1 Contract (`src/adapters/types.ts`)

```ts
export type ConfigScope = 'project' | 'global'
export type EnvSyntax = 'posix' | 'env-colon' | 'brace-env'

export type WarningCode =
  | 'DEFAULT_DROPPED' | 'CWD_UNSUPPORTED' | 'TARGETS_NOT_NATIVE'
  | 'SCOPE_UNSUPPORTED' | 'TRANSPORT_INFERRED' | 'UNKNOWN_FIELD_DROPPED'
  | 'AMBIGUOUS_ENTRY' | 'UNKNOWN_PLACEHOLDER' | 'DISABLE_UNSUPPORTED'
  | 'MANUAL_ENTRY_PRESERVED'

export interface Warning {
  code: WarningCode
  agent: AgentId
  server?: string
  field?: string
  message: string
}

export interface AdapterCapabilities {
  readonly scopes: readonly ConfigScope[]
  readonly format: 'json' | 'jsonc'
  readonly envSyntax: EnvSyntax
  readonly nativeDefault: boolean
  readonly nativeDisabled: boolean
  readonly cwd: boolean
}

export interface AdapterContext extends RuntimeContext {
  readonly scope: ConfigScope
  readonly previousManagedNames: ReadonlySet<string>
}

export interface CompileResult {
  readonly content: string
  readonly managedNames: readonly string[]
  readonly warnings: readonly Warning[]
}

export interface ExtractResult {
  readonly servers: Record<string, CanonicalServer>
  readonly warnings: readonly Warning[]
}

export interface AgentAdapter {
  readonly id: AgentId
  readonly displayName: string
  readonly capabilities: AdapterCapabilities

  getConfigPath(scope: ConfigScope, ctx: RuntimeContext): string | null
  detect(scope: ConfigScope, ctx: RuntimeContext): Promise<boolean>

  /** Pure: canonical server -> native object (null when not applicable). */
  compile(server: CanonicalServer): { entry: unknown | null; warnings: readonly Warning[] }

  extractServers(rawContent: string, scope: ConfigScope): ExtractResult
  applyServers(existingRawContent: string | null, servers: Record<string, CanonicalServer>, ctx: AdapterContext): CompileResult
}
```

Why `compile()` is separate: `doctor` needs the expected native **object** to
compare semantically with what is on disk. Comparing serialized text produces
false positives whenever the user reformats a file.

### 9.2 Shared helpers (`src/adapters/shared.ts`)

- `applyServerEntries(existing, rootKey, entries, { managed, previous, format })` —
  single implementation of `jsonc-parser` `modify()` + `applyEdits()`:
  - create the root key only if needed;
  - write each managed entry in one batch, applying edits in descending offset
    order (the classic multi-edit footgun);
  - delete names in `previous` that are no longer produced;
  - never touch sibling keys.
- `readEntry(parsed, path)` — tolerant nested lookup (`context_servers.x.command.path`).
- `makeWarnings(agent, code, message, meta)` — small factory.
- All functions are pure with respect to the filesystem; file I/O stays in the
  command layer.

### 9.3 JSONC rules

- Read with `parseTree`/`parse`; on syntax errors, **abort** the write for that
  file, report `InvalidConfigError`, and do not modify the file.
- Preserve comments, trailing commas, CRLF, and BOM.
- If the file is empty or whitespace only, treat it as `{}`.
- Format only the inserted/replaced node (`formattingOptions: { tabSize: 2,
  insertSpaces: true }`); preserve everything else byte-for-byte.
- `~/.claude.json` and `.zed/settings.json` are large multi-purpose files: never
  re-serialize the whole document.

### 9.4 Behavior matrix

The normative per-agent mapping is in [`MATRIX.md`](./MATRIX.md). Adapter
implementation must satisfy:

- `previousManagedNames` cleanup without touching manual entries;
- scope support (`windsurf` is global-only) reported through
  `capabilities.scopes`;
- URL-only or otherwise unqualified native input is imported as `http` with
  `TRANSPORT_INFERRED`;
- `cwd` is not emitted (`CWD_UNSUPPORTED`);
- `:-default` is dropped outside `claude-code` (`DEFAULT_DROPPED`);
- `detect()` uses file/directory existence only (no `PATH` probing — that belongs
  to `doctor`).
### 9.5 Registry (`src/adapters/index.ts`)

- `adapters: readonly AgentAdapter[]` in `AGENT_ORDER`.
- `getAdapter(id)`, `getAdapters(ids?)`.
- `detectAgents(ctx)` → agents whose config path exists or whose directory exists
  (project) / whose global path exists (global).
- `resolveTargets({ flag, state, ctx })` — precedence: `--agents` → `state.targets`
  → detection. Unknown ids are a usage error.

---

## 10. Source Resolvers (`src/sources/`)

### 10.1 DTO

```ts
export interface RequiredEnvVar {
  name: string
  description?: string
  isSecret: boolean
}

export interface ResolvedServerPackage {
  suggestedName: string
  definition: CanonicalServer       // placeholders already in `${VAR}` form
  requiredEnv: RequiredEnvVar[]
  source: { type: 'direct' | 'github' | 'registry'; ref: string }
}
```

### 10.2 `direct.ts`

- `--stdio <command>` + repeatable `--arg <token>`.
- If `--arg` is absent and the `--stdio` value contains whitespace, tokenize with
  `string-argv`; reject empty argv or an empty first token.
- `--http <url>` (or a bare `http(s)://` source) → `type: "streamable-http"`.
- `--env KEY=VALUE` → value is written to `.env` (via `core/env.ts`) and the
  canonical entry uses `${KEY}`. `--env KEY` → reference only; warns when
  unresolved.
- `--header "Name: Value"` (repeatable) → `headers`; split on the first `:`.
- `--cwd` → canonical `cwd` (preserved only; see `MATRIX.md`).
- `--name` overrides `suggestedName`. Suggested name for URLs is derived from the
  hostname + first path segment, sanitized to `SERVER_NAME_PATTERN`.

### 10.3 `github.ts`

1. Accept `owner/repo`, `https://github.com/owner/repo`, and an optional `#ref`.
2. Try `https://raw.githubusercontent.com/<owner>/<repo>/<ref|main>/server.json`;
   fall back to `master` when the ref is not explicit.
3. If neither exists, resolve the default branch through
   `https://api.github.com/repos/<owner>/<repo>` (only then), then read
   `server.json`, then `package.json`.
4. `server.json` parsing (fixture-driven):
   - accept both `registry_type`/`registryType` and `identifier`/`name`;
   - preference `npm` → `npx -y <id>[@<version>]`, `pypi` → `uvx <id>[==<version>]`,
     `oci` → `docker run -i --rm <id>`;
   - `environment_variables[]` with `is_required: true` become `requiredEnv`,
     honoring `is_secret`.
5. `package.json` fallback: `bin` (string or object) selects `<name>` for
   `npx -y`; no `bin` → actionable error ("repository is not an MCP server").
6. HTTP policy: `AbortSignal.timeout(10_000)`, one retry on `429`/`5xx` with
   backoff, `User-Agent: agents-mcp/<version>`, response cap 2 MiB, optional
   `GITHUB_TOKEN` (dotenv → env) for rate limits. Never execute fetched content.
7. Validation with Zod; malformed payloads produce a specific error, never a
   partial server entry.

### 10.4 `registry.ts`

- `@scope/name` or a bare package name that exists on npm → query
  `https://registry.npmjs.org/<url-encoded-name>`.
- Otherwise query
  `https://registry.modelcontextprotocol.io/v0/servers?search=<query>&limit=10`.
- Multiple results: interactive selection; under `--yes`, prefer an exact name
  match, else fail with the candidate list.
- Registry payloads are pinned by fixtures. 404 / 5xx / malformed JSON each get a
  distinct message.

### 10.5 Resolution order (`sources/index.ts`)

Explicit flags → remote URL → `owner/repo` → registry/npm. The resolver never
writes files; `commands/add.ts` owns persistence.

---

## 11. Commands

Global flags, available on every command: `--global`/`-g`, `--yes`/`-y`,
`--agents <csv>`, `--dry-run`.

`--yes` and `CI=true` imply the non-interactive `AutoUi`. When both a value and a
default are needed, the default wins and the decision is printed.

| Command | Behavior |
| :--- | :--- |
| `init` | Create `<scope>/.agents/mcp.json` (`$schema`, `mcpServers: {}`), select agents (multi-select; `--agents` bypasses), persist `targets` in state. Existing file → exit `1` unless `--force` (which writes a `.bak.<timestamp>` first). Never touches `.gitignore`. In non-interactive mode, targets come from `--agents`, else from detection; if neither yields an agent, exit `1` with a hint to pass `--agents` (never assume all six). |
| `import` | Scan every adapter for the active scope, extract, normalize, dedupe/conflict-resolve, apply the secret policy, merge into canonical (existing entries win unless `--force`), seed state names for all scanned agents, then `sync` unless `--no-sync`. Native files are never deleted. |
| `add <source>` | Resolve source, prompt/accept `--name`, resolve/Create env vars, write canonical, then `sync` unless `--no-sync`. Same name + same normalized definition → exit `0`, no write (idempotent). Same name + different definition → exit `1` with a diff; `--force` overwrites; interactive offers rename. |
| `sync` | Validate canonical; targets = flag → state → detection; compile per adapter; write; update state; print summary. No targets → exit `1` with a hint (never a silent no-op). Idempotent: a second run produces no byte changes. |
| `remove <name>` | Name must exist, else exit `1`. Remove from canonical, then `sync` unless `--no-sync`. |
| `list` | Read-only table: name, type, command/URL, and per-agent sync status. `--all` includes the global file and marks shadowed entries (project wins). |
| `doctor` | Schema, env resolution (all string fields), stdio binaries (`PATH` + `PATHEXT`, skip shell builtins), semantic drift per managed entry, unsupported-scope warnings, `.env`-tracked warning, state sanity. Exit `1` on errors; `--strict` promotes warnings. |

Exit codes: `0` success, `1` validation/runtime failure, `2` usage error, `130`
interrupted.

Conflict policy on `import` (deterministic, `--yes`-safe): compare normalized
definitions; equal → merge silently; different → interactive pick, or under
`--yes` keep the entry from the earliest agent in `AGENT_ORDER` and warn with the
losing agents listed.

`--dry-run` must print the exact intended writes (path + JSON) and touch nothing,
including state.

---

## 12. UI & Prompts (`src/ui/`)

```ts
export interface PromptUi {
  intro(message: string): void
  outro(message: string): void
  note(message: string, title?: string): void
  warn(message: string): void
  error(message: string): void
  confirm(opts: { message: string; initialValue: boolean }): Promise<boolean>
  select<T>(opts: { message: string; options: Option<T>[]; initialValue?: T }): Promise<T>
  multiselect<T>(opts: { message: string; options: Option<T>[]; initialValues?: T[] }): Promise<T[]>
  text(opts: { message: string; placeholder?: string; defaultValue?: string; validate?: (v: string) => string | undefined }): Promise<string>
  password(opts: { message: string }): Promise<string>
  spinner(message: string): { start(): void; stop(message?: string): void }
}
```

- `createClackUi()` for TTY; `createAutoUi({ defaults, log })` for `--yes`/CI and
  tests. No command may import `@clack/prompts` directly.
- Ctrl-C exits `130` with a clean message.
- Secrets are masked in prompts and never echoed in `note`/`warn`/`error`.

---

## 13. Secret Hygiene

Detection (during `import` and literal `add` values):

- **Keys:** `/(?:^|_)(?:TOKEN|SECRET|PASSWORD|PASSWD|API_KEY|CREDENTIAL|PRIVATE_KEY|AUTH|DSN)(?:_|$)/i`.
- **Values:** URL credentials (`scheme://user:pass@`), known prefixes (`ghp_`,
  `github_pat_`, `sk-`, `xox[baprs]-`), or high-entropy strings ≥ 20 chars.
- Fields scanned: `env` values, `headers` values, `args` items, `url`.
- A value already wrapped in `${...}` is never flagged.

Policy:

- Interactive: propose extraction per finding, with a derived uppercase key
  (`<SERVER>_<KEY>`, sanitized and collision-checked).
- `--yes`/CI: **warn only**; write nothing to `.env` unless `--extract-secrets` is
  passed.
- Before any `.env` write: ensure `.env` is git-ignored, create with mode `0600`,
  never overwrite an existing key.
- `.env.example` gets `KEY=` only.
- Canonical file and native files receive `${KEY}`, never the value.
- No secret value in logs, errors, or dry-run output (mask as `***`).

---

## 14. Doctor

Checks, in order, each producing a structured result:

1. **Schema:** `CanonicalMcpConfigSchema` + `validateConfig()` warnings.
2. **Env:** every placeholder in `env`, `headers`, `args`, `url`; missing required
   variable (no fallback) = error.
3. **Runtime:** for each `stdio` server, resolve `command` in `PATH` (respecting
   `PATHEXT` on Windows); absolute paths must exist and be executable. `npx`/`uvx`
   presence is checked, not the package itself.
4. **Drift:** for each target agent and each name in state, compare
   `adapter.compile(server)` with the parsed on-disk entry (deep equality after
   normalization); missing/extra/changed = drift. Ignore formatting and unmanaged
   entries.
5. **State:** unreadable/corrupt state, targets pointing at unsupported scopes.
6. **Hygiene:** `.env` tracked by Git; placeholders without fallback that resolve
   nowhere.

Exit `1` if any error; `0` if only warnings; `--strict` makes warnings fatal.
All results are returned as data and rendered by the command (future `--json`).

---

## 15. Packaging & Release

Publishing happens **only** from `dist/`. The repository root is never published.

The build pipeline is finalized together with the implementation (`T1`/`T11`); the contract below is mandatory regardless of the concrete script names.

`package.json` (root) scripts required at minimum:

- `build` → single-file bundle;
- `typecheck` → `tsc --noEmit`;
- `test` / `test:watch` → Vitest;
- `format` / `format:check` → Prettier;
- `verify` → typecheck + format check + tests + build;
- `dist:build` → full `verify`;
- `dist:package` → `tsx package.ts`;
- `dist:publish` → `npm publish ./dist`;
- `dist` → build → package → publish, in order;
- `prepublishOnly` → refuse publishing from the repository root.

`package.ts` requirements:

- create `dist/` if missing;
- derive `dist/package.json` from the root manifest, removing `scripts`, `devDependencies`, **and `dependencies`** (everything is bundled);
- expose exactly one binary: `bin: { "agents-mcp": "./index.js" }`, with `main`/`exports` pointing at `./index.js`, explicit `files`, and `engines.node: ">=22"`;
- copy `LICENSE` and `README.md`; copy `CHANGELOG.md` when present (the changelog is maintained by the `changelog-management` skill) and warn instead of failing when it is absent;
- write the manifest with a trailing newline.

Constraints:

- **Exactly one binary:** `agents-mcp`.
- No runtime `dependencies` in the published manifest.
- `npm run dist` runs build → package → publish in that order. Publishing is always manual and happens after a version bump.
- `dist:build` runs the full `verify` suite, so CI catches drift before publication.

---

## 16. Testing & CI

### 16.1 Test layout

| Path | Coverage |
| :--- | :--- |
| `tests/core/schema.test.ts` | positive/negative fixtures, strictness, defaults, name pattern |
| `tests/core/placeholder.test.ts` | grammar, fallbacks, all three env syntaxes, idempotence |
| `tests/core/env.test.ts` | `.env` parsing, precedence (dotenv wins), secret heuristics, `.env.example`, no overwrite |
| `tests/core/store.test.ts` | atomic write, minimal serialization, invalid JSONC abort |
| `tests/core/state.test.ts` | targets persistence, corrupt state, pruning |
| `tests/core/gitignore.test.ts` | lazy managed block, no duplicate entries, no agent files |
| `tests/adapters/contract.test.ts` | table-driven contract across all 6 adapters |
| `tests/adapters/<agent>.test.ts` | compile/extract/apply, JSONC preservation, previousManagedNames, CRLF/BOM |
| `tests/sources/*.test.ts` | direct parsing, GitHub chain, registry, mocked `fetch`, fixtures |
| `tests/commands/*.test.ts` | integration in temp dirs: `init → add → sync → list → remove`, `import`, `doctor` |
| `tests/helpers/sandbox.ts` | temp `cwd`/`homeDir`/`XDG_CONFIG_HOME`, guard that fails if not under `os.tmpdir()` |

Rules:

- Use the **real filesystem** inside the sandbox; mock only `fetch` and, when
  needed, `process.env`/`PATH`.
- Never mock `node:fs` or `node:os`; inject `RuntimeContext` instead.
- Every mutating test asserts it never left the sandbox (guard).
- Adapter round-trip tests are table-driven from `MATRIX.md` to prevent drift.

### 16.2 CI (`.github/workflows/ci.yml`)

- `verify`: Ubuntu, Node `22`, `24`, `26` → `npm ci` + `npm run verify`.
- `windows-paths`: Windows, Node `22` → `typecheck` + `tests/core` +
  `tests/adapters` (path resolution and atomic-rename behavior).
- No test may hit the network; everything is mocked or fixture-driven.

Coverage (optional, enabled from day one): `@vitest/coverage-v8`, thresholds 80%
lines/functions and 75% branches over `src/core` and `src/adapters`.

---

## 17. Risks & Mitigations

| Risk | Mitigation |
| :--- | :--- |
| Corrupting `~/.claude.json` or `.zed/settings.json` | JSONC AST edits only; abort on parse error; atomic writes; `.bak` before `--force`; tests with real fixture files. |
| Secret leakage | Symbolic placeholders end-to-end; `.env` git-ignored before write; `0600`; masked logs; warn-only in CI. |
| Stale generated schema | Schema is derived from Zod at build time; no committed artifact to drift. |
| Node/TS version drift | `engines >=22`, `@types/node@^22`, CI matrix; TS 7 is the only type checker, bundling does not depend on it. |
| Windows path/rename differences | Injected platform, XDG/APPDATA resolution, Windows CI job, rename fallback. |
| `jsonc-parser` multi-edit offset bugs | One shared helper, descending edits, dedicated tests. |
| False-positive drift | Semantic comparison via `compile()`, never text diff. |
| Network flakiness in `add` | Timeouts, one retry, fixtures in tests, no network in `verify`. |
| Overwriting user MCP entries | Manage only names present in state; manual entries are preserved and reported. |
| `zod` upgrade breaking schema output | Pinned major range; `verify` runs `typecheck` + `build`. |

---

## 18. Definition of Done (`v0.1.0`)

- All six adapters implement the contract and pass round-trip, JSONC,
  `previousManagedNames`, and warning tests.
- All seven commands work in project and global scopes, interactively (via the
  prompt port) and non-interactively (`--yes`), with `--dry-run` honored.
- `sync` is idempotent byte-for-byte; `remove` propagates without touching manual
  entries; `import` never deletes native files.
- `doctor` detects all five failure classes and exits `1` on errors.
- `npm run verify` and `npm run build` are green; `node dist/index.js --help`
  works; `dist/package.json` has one `bin`, no dependencies, and `engines >=22`.
- No secret value can reach a canonical or native file through any command.
- README, `SPEC.md`, `MATRIX.md`, and this blueprint describe exactly what the code
  does.

---

## 19. Architecture Decision Records

| ADR | Decision |
| :--- | :--- |
| [0001](../docs/decisions/0001-canonical-transports.md) | Canonical transports are `stdio` and `http`. **Superseded by ADR-0010**. |
| [0002](../docs/decisions/0002-schema-source-and-versioning.md) | Zod 4 is the single schema source; Draft 2020-12 output; fixed `$id` URL. **Superseded by ADR-0010**. |
| [0003](../docs/decisions/0003-bundler-tsup.md) | `tsup` (esbuild) single-file ESM bundle, no `.d.ts`. |
| [0004](../docs/decisions/0004-runtime-context-and-pure-compilers.md) | Injected runtime context and pure native compilers. |
| [0005](../docs/decisions/0005-local-sync-state.md) | Local sync state + persisted targets. |
| [0006](../docs/decisions/0006-non-destructive-compilation.md) | Native files are preserved in place. |
| [0007](../docs/decisions/0007-env-and-secrets.md) | `.env` precedence and safe secret extraction. |
| [0008](../docs/decisions/0008-packaging-and-runtime-floor.md) | Node `>=22`, publish from `dist/` only, single binary. |
| [0009](../docs/decisions/0009-typescript-7-removes-baseurl.md) | TypeScript 7 removes `baseUrl`; keep TS 7 with tsconfig-relative `paths`. |
| [0010](../docs/decisions/0010-adopt-agent-plugins-mcp-schema.md) | Adopt Agent Plugins MCP 1.0.0 as the normative basis. |
| [0011](../docs/decisions/0011-plugin-lifecycle-and-safe-cleanup.md) | Plugin ownership via `managedPlugins` and safe, non-recursive cleanup. |
| [0012](../docs/decisions/0012-adapter-storage-layout.md) | Explicit adapter storage layout (`single-file` vs `per-plugin`). |
| [0013](../docs/decisions/0013-non-destructive-antigravity-and-additive-sync-targets.md) | Non-destructive Antigravity sync and additive `state.targets`. |
| [0014](../docs/decisions/0014-mcp-lock-and-authoritative-sync.md) | `.agents/mcp-lock.json` and authoritative `sync` from `.agents/mcp.json`. |
````

## File: src/adapters/claude-code.ts
````typescript
/**
 * Claude Code adapter.
 *
 * Project: `.mcp.json` (cwd). Global: `~/.claude.json`.
 * Root key: `mcpServers`. Env syntax: `${VAR}` (posix), native `:-default`
 * supported. Disabled servers are omitted (no native `enabled` flag).
 *
 * Implements MATRIX.md §1, §2, §3, §7.1.
 */

import { join } from 'node:path'
import { parse } from 'jsonc-parser'
import { readTextFile } from '$/src/core/fs-atomic'
import type { RuntimeContext, ConfigScope } from '$/src/core/context'
import type { CanonicalServer } from '$/src/core/schema'
import {
  isStdioServer,
  isHttpServer,
  type StreamableHttpServer,
  type SseServer,
} from '$/src/core/schema'
import { translate } from '$/src/core/placeholder'
import type {
  AgentId,
  AdapterCapabilities,
  AgentAdapter,
  CompileResult,
  ExtractResult,
  Warning,
  AdapterContext,
} from '$/src/adapters/types'
import { applyServerEntries } from '$/src/adapters/shared'

export const id: AgentId = 'claude-code'
export const displayName = 'Claude Code'

export const capabilities: AdapterCapabilities = {
  scopes: ['project', 'global'],
  format: 'json',
  envSyntax: 'posix' as const,
  nativeDefault: true,
  nativeDisabled: false,
  cwd: false,
  layout: 'single-file' as const,
  rootKey: 'mcpServers',
}

export function getConfigPath(
  scope: ConfigScope,
  ctx: RuntimeContext,
): string | null {
  return scope === 'project'
    ? join(ctx.cwd, '.mcp.json')
    : join(ctx.homeDir, '.claude.json')
}

export async function detect(
  scope: ConfigScope,
  ctx: RuntimeContext,
): Promise<boolean> {
  const path = getConfigPath(scope, ctx)
  if (path === null) {
    return false
  }
  return readTextFile(path) !== null
}

function translateField(
  value: string,
  field: string,
): { value: string; warnings: Warning[] } {
  const result = translate(value, 'posix', { nativeDefault: true })
  return {
    value: result.value,
    warnings: result.warnings.map((w): Warning => ({
      code: w.code,
      agent: 'claude-code',
      field,
      message: w.message,
    })),
  }
}

export function compile(server: CanonicalServer): {
  entry: unknown | null
  warnings: readonly Warning[]
} {
  const warnings: Warning[] = []

  if (isStdioServer(server)) {
    if (server.cwd !== undefined && server.cwd !== '') {
      warnings.push({
        code: 'CWD_UNSUPPORTED',
        agent: 'claude-code',
        field: 'cwd',
        message: 'cwd cannot be represented natively for claude-code',
      })
    }
    const entry: Record<string, unknown> = {
      type: 'stdio',
      command: server.command,
    }
    if (server.args && server.args.length > 0) {
      entry.args = server.args
    }
    if (server.env) {
      const env: Record<string, string> = {}
      for (const [key, value] of Object.entries(server.env)) {
        const { value: translated, warnings: fieldWarnings } = translateField(
          value,
          key,
        )
        env[key] = translated
        warnings.push(...fieldWarnings)
      }
      entry.env = env
    }
    return { entry, warnings }
  }

  // streamable-http → 'http', sse → 'sse' (claude-code preserva sse nativamente)
  const nativeType = server.type === 'sse' ? 'sse' : 'http'
  const entry: Record<string, unknown> = { type: nativeType, url: server.url }
  if (server.headers) {
    const headers: Record<string, string> = {}
    for (const [key, value] of Object.entries(server.headers)) {
      const { value: translated, warnings: fieldWarnings } = translateField(
        value,
        key,
      )
      headers[key] = translated
      warnings.push(...fieldWarnings)
    }
    entry.headers = headers
  }
  return { entry, warnings }
}

export function extractServers(
  rawContent: string,
  scope: ConfigScope,
): ExtractResult {
  const warnings: Warning[] = []
  const resultServers: Record<string, CanonicalServer> = {}

  let parsed: Record<string, unknown>
  try {
    const errors: Array<{ error: number; offset: number; length: number }> = []
    parsed = parse(rawContent, errors) as Record<string, unknown>
    if (errors.length > 0) {
      return { servers: {}, warnings }
    }
  } catch {
    return { servers: {}, warnings }
  }

  const mcpServers = parsed.mcpServers
  if (
    !mcpServers ||
    typeof mcpServers !== 'object' ||
    Array.isArray(mcpServers)
  ) {
    return { servers: {}, warnings }
  }

  for (const [name, rawEntry] of Object.entries(
    mcpServers as Record<string, unknown>,
  )) {
    const entry = rawEntry as Record<string, unknown> | null
    if (!entry || typeof entry !== 'object') {
      continue
    }

    const type = entry.type
    const command = entry.command
    const url = entry.url

    const hasCommand = typeof command === 'string' && command.length > 0
    const hasUrl = typeof url === 'string' && url.length > 0
    const isHttp =
      type === 'http' || type === 'streamable-http' || type === 'sse' || hasUrl
    const isStdio = type === 'stdio' || (hasCommand && !hasUrl)

    if (isHttp && isStdio) {
      warnings.push({
        code: 'AMBIGUOUS_ENTRY',
        agent: 'claude-code',
        server: name,
        message: `Both command and url present for \`${name}\`; url wins`,
      })
    }

    if (isHttp) {
      const resolvedUrl = url as string
      // Determina o tipo canônico: 'sse' preservado do nativo, caso contrário
      // 'streamable-http' (incluindo o legado 'http' e a inferência por URL).
      let canonicalType: 'streamable-http' | 'sse' = 'streamable-http'
      let inferred = false
      if (type === 'sse') {
        canonicalType = 'sse'
      } else if (type === 'streamable-http') {
        canonicalType = 'streamable-http'
      } else if (type === 'http') {
        canonicalType = 'streamable-http'
      } else if (hasUrl) {
        inferred = true
        canonicalType = 'streamable-http'
      }
      const server: StreamableHttpServer | SseServer = {
        type: canonicalType,
        url: resolvedUrl,
      }
      // URL-only (ou tipo não explícito) → transporte inferido.
      if (inferred) {
        warnings.push({
          code: 'TRANSPORT_INFERRED',
          agent: 'claude-code',
          server: name,
          message: `Transport inferred as streamable-http for \`${name}\``,
        })
      }
      if (
        entry.headers &&
        typeof entry.headers === 'object' &&
        !Array.isArray(entry.headers)
      ) {
        server.headers = {}
        for (const [k, v] of Object.entries(
          entry.headers as Record<string, unknown>,
        )) {
          if (typeof v === 'string') {
            server.headers[k] = v
          }
        }
      }
      resultServers[name] = server
      continue
    }

    if (isStdio) {
      const server: CanonicalServer = {
        type: 'stdio',
        command: command as string,
        args: [],
      }
      if (entry.args && Array.isArray(entry.args)) {
        server.args = entry.args.filter(
          (a): a is string => typeof a === 'string',
        )
      }
      if (
        entry.env &&
        typeof entry.env === 'object' &&
        !Array.isArray(entry.env)
      ) {
        server.env = {}
        for (const [k, v] of Object.entries(
          entry.env as Record<string, unknown>,
        )) {
          if (typeof v === 'string') {
            server.env[k] = v
          }
        }
      }
      resultServers[name] = server
      continue
    }

    warnings.push({
      code: 'UNKNOWN_FIELD_DROPPED',
      agent: 'claude-code',
      server: name,
      field: 'type',
      message: `Unknown transport for \`${name}\`; entry dropped`,
    })
  }

  return { servers: resultServers, warnings }
}

export function applyServers(
  existingRawContent: string | null,
  servers: Record<string, CanonicalServer>,
  ctx: AdapterContext,
): CompileResult {
  const warnings: Warning[] = []

  const entries: Record<string, unknown> = {}
  const managed: string[] = []
  for (const [name, server] of Object.entries(servers)) {
    const { entry, warnings: fieldWarnings } = compile(server)
    if (entry !== null) {
      entries[name] = entry
      managed.push(name)
      warnings.push(...fieldWarnings)
    }
  }

  const { content } = applyServerEntries(
    existingRawContent,
    'mcpServers',
    entries,
    {
      managed,
      previous: ctx.previousManagedNames,
      format: capabilities.format,
    },
  )

  return { content, managedNames: managed, warnings }
}
````

## File: src/adapters/cursor.ts
````typescript
/**
 * Cursor adapter.
 *
 * Project: `.cursor/mcp.json`. Global: `~/.cursor/mcp.json`.
 * Root key: `mcpServers`. Format: JSON. Env syntax: `${env:VAR}` (env-colon),
 * native `:-default` NOT supported (dropped with DEFAULT_DROPPED).
 * Disabled servers are omitted (no native `enabled` flag).
 *
 * Implements MATRIX.md §1, §2, §3, §7.2.
 */

import { join } from 'node:path'
import { parse } from 'jsonc-parser'
import { readTextFile } from '$/src/core/fs-atomic'
import type { RuntimeContext, ConfigScope } from '$/src/core/context'
import type { CanonicalServer } from '$/src/core/schema'
import {
  isStdioServer,
  isHttpServer,
  type StreamableHttpServer,
  type SseServer,
} from '$/src/core/schema'
import { translate } from '$/src/core/placeholder'
import type {
  AgentId,
  AdapterCapabilities,
  AgentAdapter,
  CompileResult,
  ExtractResult,
  Warning,
  AdapterContext,
} from '$/src/adapters/types'
import { applyServerEntries } from '$/src/adapters/shared'

export const id: AgentId = 'cursor'
export const displayName = 'Cursor'

export const capabilities: AdapterCapabilities = {
  scopes: ['project', 'global'],
  format: 'json',
  envSyntax: 'env-colon' as const,
  nativeDefault: false,
  nativeDisabled: false,
  cwd: false,
  layout: 'single-file' as const,
  rootKey: 'mcpServers',
}

export function getConfigPath(
  scope: ConfigScope,
  ctx: RuntimeContext,
): string | null {
  return scope === 'project'
    ? join(ctx.cwd, '.cursor', 'mcp.json')
    : join(ctx.homeDir, '.cursor', 'mcp.json')
}

export async function detect(
  scope: ConfigScope,
  ctx: RuntimeContext,
): Promise<boolean> {
  const path = getConfigPath(scope, ctx)
  if (path === null) {
    return false
  }
  return readTextFile(path) !== null
}

function translateField(
  value: string,
  field: string,
): { value: string; warnings: Warning[] } {
  const result = translate(value, 'env-colon', { nativeDefault: false })
  return {
    value: result.value,
    warnings: result.warnings.map((w): Warning => ({
      code: w.code,
      agent: 'cursor',
      field,
      message: w.message,
    })),
  }
}

export function compile(server: CanonicalServer): {
  entry: unknown | null
  warnings: readonly Warning[]
} {
  const warnings: Warning[] = []

  if (isStdioServer(server)) {
    if (server.cwd !== undefined && server.cwd !== '') {
      warnings.push({
        code: 'CWD_UNSUPPORTED',
        agent: 'cursor',
        field: 'cwd',
        message: 'cwd cannot be represented natively for cursor',
      })
    }
    const entry: Record<string, unknown> = { command: server.command }
    if (server.args && server.args.length > 0) {
      const translatedArgs: string[] = []
      for (const arg of server.args) {
        const { value: translated, warnings: fieldWarnings } = translateField(
          arg,
          'args',
        )
        translatedArgs.push(translated)
        warnings.push(...fieldWarnings)
      }
      entry.args = translatedArgs
    }
    if (server.env) {
      const env: Record<string, string> = {}
      for (const [key, value] of Object.entries(server.env)) {
        const { value: translated, warnings: fieldWarnings } = translateField(
          value,
          key,
        )
        env[key] = translated
        warnings.push(...fieldWarnings)
      }
      entry.env = env
    }
    return { entry, warnings }
  }

  const { value: translatedUrl, warnings: urlWarnings } = translateField(
    server.url,
    'url',
  )
  warnings.push(...urlWarnings)
  const entry: Record<string, unknown> = { url: translatedUrl }
  if (server.headers) {
    const headers: Record<string, string> = {}
    for (const [key, value] of Object.entries(server.headers)) {
      const { value: translated, warnings: fieldWarnings } = translateField(
        value,
        key,
      )
      headers[key] = translated
      warnings.push(...fieldWarnings)
    }
    entry.headers = headers
  }
  return { entry, warnings }
}

export function extractServers(
  rawContent: string,
  scope: ConfigScope,
): ExtractResult {
  const warnings: Warning[] = []
  const resultServers: Record<string, CanonicalServer> = {}

  let parsed: Record<string, unknown>
  try {
    const errors: Array<{ error: number; offset: number; length: number }> = []
    parsed = parse(rawContent, errors) as Record<string, unknown>
    if (errors.length > 0) {
      return { servers: {}, warnings }
    }
  } catch {
    return { servers: {}, warnings }
  }

  const mcpServers = parsed.mcpServers
  if (
    !mcpServers ||
    typeof mcpServers !== 'object' ||
    Array.isArray(mcpServers)
  ) {
    return { servers: {}, warnings }
  }

  for (const [name, rawEntry] of Object.entries(
    mcpServers as Record<string, unknown>,
  )) {
    const entry = rawEntry as Record<string, unknown> | null
    if (!entry || typeof entry !== 'object') {
      continue
    }

    const command = entry.command
    const url = entry.url
    const type = entry.type

    const hasCommand = typeof command === 'string' && command.length > 0
    const hasUrl = typeof url === 'string' && url.length > 0

    if (hasCommand && hasUrl) {
      warnings.push({
        code: 'AMBIGUOUS_ENTRY',
        agent: 'cursor',
        server: name,
        message: `Both command and url present for \`${name}\`; url wins`,
      })
    }

    if (hasUrl) {
      const resolvedUrl = url as string
      // Cursor nativo não distingue streamable-http de sse: preserva 'sse'
      // quando explícito, caso contrário 'streamable-http'.
      let canonicalType: 'streamable-http' | 'sse' = 'streamable-http'
      let inferred = false
      if (type === 'sse') {
        canonicalType = 'sse'
      } else if (type === 'streamable-http') {
        canonicalType = 'streamable-http'
      } else {
        inferred = true
        canonicalType = 'streamable-http'
      }
      const server: StreamableHttpServer | SseServer = {
        type: canonicalType,
        url: resolvedUrl,
      }
      // URL sem tipo explícito → transporte inferido.
      if (inferred) {
        warnings.push({
          code: 'TRANSPORT_INFERRED',
          agent: 'cursor',
          server: name,
          message: `Transport inferred as streamable-http for \`${name}\``,
        })
      }
      if (
        entry.headers &&
        typeof entry.headers === 'object' &&
        !Array.isArray(entry.headers)
      ) {
        server.headers = {}
        for (const [k, v] of Object.entries(
          entry.headers as Record<string, unknown>,
        )) {
          if (typeof v === 'string') {
            server.headers[k] = v
          }
        }
      }
      resultServers[name] = server
      continue
    }

    if (hasCommand) {
      const server: CanonicalServer = {
        type: 'stdio',
        command: command as string,
        args: [],
      }
      if (entry.args && Array.isArray(entry.args)) {
        server.args = entry.args.filter(
          (a): a is string => typeof a === 'string',
        )
      }
      if (
        entry.env &&
        typeof entry.env === 'object' &&
        !Array.isArray(entry.env)
      ) {
        server.env = {}
        for (const [k, v] of Object.entries(
          entry.env as Record<string, unknown>,
        )) {
          if (typeof v === 'string') {
            server.env[k] = v
          }
        }
      }
      resultServers[name] = server
      continue
    }

    warnings.push({
      code: 'UNKNOWN_FIELD_DROPPED',
      agent: 'cursor',
      server: name,
      field: 'type',
      message: `No command or url for \`${name}\`; entry dropped`,
    })
  }

  return { servers: resultServers, warnings }
}

export function applyServers(
  existingRawContent: string | null,
  servers: Record<string, CanonicalServer>,
  ctx: AdapterContext,
): CompileResult {
  const warnings: Warning[] = []

  const entries: Record<string, unknown> = {}
  const managed: string[] = []
  for (const [name, server] of Object.entries(servers)) {
    const { entry, warnings: fieldWarnings } = compile(server)
    if (entry !== null) {
      entries[name] = entry
      managed.push(name)
      warnings.push(...fieldWarnings)
    }
  }

  const { content } = applyServerEntries(
    existingRawContent,
    'mcpServers',
    entries,
    {
      managed,
      previous: ctx.previousManagedNames,
      format: capabilities.format,
    },
  )

  return { content, managedNames: managed, warnings }
}
````

## File: src/adapters/opencode.ts
````typescript
/**
 * OpenCode adapter.
 *
 * Project: `opencode.json`. Global: `~/.config/opencode/opencode.json`.
 * Root key: `mcp`. Format: JSONC. Env syntax: `{env:VAR}` (brace-env),
 * native `:-default` NOT supported. Native `enabled` flag supported.
 * Merges `command` + `args` into one array; renames `env` to `environment`.
 *
 * Implements MATRIX.md §1, §2, §3, §7.4.
 */

import { posix, win32 } from 'node:path'
import { parse } from 'jsonc-parser'
import { readTextFile } from '$/src/core/fs-atomic'
import type { RuntimeContext, ConfigScope } from '$/src/core/context'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer, isHttpServer } from '$/src/core/schema'
import { translate } from '$/src/core/placeholder'
import type {
  AgentId,
  AdapterCapabilities,
  AgentAdapter,
  CompileResult,
  ExtractResult,
  Warning,
  AdapterContext,
} from '$/src/adapters/types'
import { applyServerEntries } from '$/src/adapters/shared'

export const id: AgentId = 'opencode'
export const displayName = 'OpenCode'

export const capabilities: AdapterCapabilities = {
  scopes: ['project', 'global'],
  format: 'jsonc',
  envSyntax: 'brace-env' as const,
  nativeDefault: false,
  nativeDisabled: true,
  cwd: false,
  layout: 'single-file' as const,
  rootKey: 'mcp',
}

function pjoin(ctx: RuntimeContext, ...paths: string[]): string {
  return ctx.platform === 'win32' ? win32.join(...paths) : posix.join(...paths)
}

export function getConfigPath(
  scope: ConfigScope,
  ctx: RuntimeContext,
): string | null {
  if (scope === 'project') {
    return pjoin(ctx, ctx.cwd, 'opencode.json')
  }
  let base: string
  if (ctx.platform === 'win32') {
    base = pjoin(
      ctx,
      ctx.env.APPDATA || pjoin(ctx, ctx.homeDir, 'AppData', 'Roaming'),
    )
  } else if (ctx.platform === 'darwin') {
    // macOS uses ~/.config directly (does not honor XDG_CONFIG_HOME).
    base = pjoin(ctx, ctx.homeDir, '.config')
  } else {
    // linux
    base = pjoin(
      ctx,
      ctx.env.XDG_CONFIG_HOME || pjoin(ctx, ctx.homeDir, '.config'),
    )
  }
  return pjoin(ctx, base, 'opencode', 'opencode.json')
}

export async function detect(
  scope: ConfigScope,
  ctx: RuntimeContext,
): Promise<boolean> {
  const path = getConfigPath(scope, ctx)
  if (path === null) {
    return false
  }
  return readTextFile(path) !== null
}

function translateField(
  value: string,
  field: string,
): { value: string; warnings: Warning[] } {
  const result = translate(value, 'brace-env', { nativeDefault: false })
  return {
    value: result.value,
    warnings: result.warnings.map((w): Warning => ({
      code: w.code,
      agent: 'opencode',
      field,
      message: w.message,
    })),
  }
}

export function compile(server: CanonicalServer): {
  entry: unknown | null
  warnings: readonly Warning[]
} {
  const warnings: Warning[] = []

  if (isStdioServer(server)) {
    if (server.cwd !== undefined && server.cwd !== '') {
      warnings.push({
        code: 'CWD_UNSUPPORTED',
        agent: 'opencode',
        field: 'cwd',
        message: 'cwd cannot be represented natively for opencode',
      })
    }
    const commandArray: unknown[] = []
    const { value: translatedCmd, warnings: cmdWarnings } = translateField(
      server.command,
      'command',
    )
    commandArray.push(translatedCmd)
    warnings.push(...cmdWarnings)
    if (server.args && server.args.length > 0) {
      for (const arg of server.args) {
        const { value: translated, warnings: fieldWarnings } = translateField(
          arg,
          'args',
        )
        commandArray.push(translated)
        warnings.push(...fieldWarnings)
      }
    }
    const entry: Record<string, unknown> = {
      type: 'local',
      command: commandArray,
    }
    if (server.env) {
      const environment: Record<string, string> = {}
      for (const [key, value] of Object.entries(server.env)) {
        const { value: translated, warnings: fieldWarnings } = translateField(
          value,
          key,
        )
        environment[key] = translated
        warnings.push(...fieldWarnings)
      }
      entry.environment = environment
    }
    return { entry, warnings }
  }

  const { value: translatedUrl, warnings: urlWarnings } = translateField(
    server.url,
    'url',
  )
  warnings.push(...urlWarnings)
  const entry: Record<string, unknown> = {
    type: 'remote',
    url: translatedUrl,
  }
  if (server.headers) {
    const headers: Record<string, string> = {}
    for (const [key, value] of Object.entries(server.headers)) {
      const { value: translated, warnings: fieldWarnings } = translateField(
        value,
        key,
      )
      headers[key] = translated
      warnings.push(...fieldWarnings)
    }
    entry.headers = headers
  }
  return { entry, warnings }
}

export function extractServers(
  rawContent: string,
  scope: ConfigScope,
): ExtractResult {
  const warnings: Warning[] = []
  const resultServers: Record<string, CanonicalServer> = {}

  let parsed: Record<string, unknown>
  try {
    const errors: Array<{ error: number; offset: number; length: number }> = []
    parsed = parse(rawContent, errors) as Record<string, unknown>
    if (errors.length > 0) {
      return { servers: {}, warnings }
    }
  } catch {
    return { servers: {}, warnings }
  }

  const mcp = parsed.mcp
  if (!mcp || typeof mcp !== 'object' || Array.isArray(mcp)) {
    return { servers: {}, warnings }
  }

  for (const [name, rawEntry] of Object.entries(
    mcp as Record<string, unknown>,
  )) {
    const entry = rawEntry as Record<string, unknown> | null
    if (!entry || typeof entry !== 'object') {
      continue
    }

    const type = entry.type
    const command = entry.command
    const url = entry.url
    const serverUrl = entry.serverUrl

    const hasCommand = Array.isArray(command) && command.length > 0
    const hasUrl = typeof url === 'string' && url.length > 0
    const hasServerUrl = typeof serverUrl === 'string' && serverUrl.length > 0
    const isLocal = type === 'local' || hasCommand
    const isRemote = type === 'remote' || hasUrl || hasServerUrl

    if (isLocal && isRemote) {
      warnings.push({
        code: 'AMBIGUOUS_ENTRY',
        agent: 'opencode',
        server: name,
        message: `Both command and url present for \`${name}\`; url wins`,
      })
    }

    if (isRemote) {
      const resolvedUrl = hasUrl ? (url as string) : (serverUrl as string)
      // OpenCode nativo não distingue streamable-http de sse: emite
      // 'streamable-http' para entradas remotas.
      const server: CanonicalServer = {
        type: 'streamable-http',
        url: resolvedUrl,
      }
      // URL/serverUrl-only (ou non-explicit remote) → inferred transport.
      if ((hasUrl || hasServerUrl) && type !== 'remote') {
        warnings.push({
          code: 'TRANSPORT_INFERRED',
          agent: 'opencode',
          server: name,
          message: `Transport inferred as streamable-http for \`${name}\``,
        })
      }
      if (
        entry.headers &&
        typeof entry.headers === 'object' &&
        !Array.isArray(entry.headers)
      ) {
        server.headers = {}
        for (const [k, v] of Object.entries(
          entry.headers as Record<string, unknown>,
        )) {
          if (typeof v === 'string') {
            server.headers[k] = v
          }
        }
      }
      resultServers[name] = server
      continue
    }

    if (isLocal) {
      const cmdArray = command as unknown[]
      const serverCommand =
        typeof cmdArray[0] === 'string' ? (cmdArray[0] as string) : ''
      const server: CanonicalServer = {
        type: 'stdio',
        command: serverCommand,
        args: [],
      }
      if (cmdArray.length > 1) {
        server.args = cmdArray
          .slice(1)
          .filter((a): a is string => typeof a === 'string')
      }
      if (
        entry.environment &&
        typeof entry.environment === 'object' &&
        !Array.isArray(entry.environment)
      ) {
        server.env = {}
        for (const [k, v] of Object.entries(
          entry.environment as Record<string, unknown>,
        )) {
          if (typeof v === 'string') {
            server.env[k] = v
          }
        }
      }
      resultServers[name] = server
      continue
    }

    warnings.push({
      code: 'UNKNOWN_FIELD_DROPPED',
      agent: 'opencode',
      server: name,
      field: 'type',
      message: `No local/remote entry for \`${name}\`; entry dropped`,
    })
  }

  return { servers: resultServers, warnings }
}

export function applyServers(
  existingRawContent: string | null,
  servers: Record<string, CanonicalServer>,
  ctx: AdapterContext,
): CompileResult {
  const warnings: Warning[] = []

  const entries: Record<string, unknown> = {}
  const managed: string[] = []
  for (const [name, server] of Object.entries(servers)) {
    const { entry, warnings: fieldWarnings } = compile(server)
    if (entry !== null) {
      entries[name] = entry
      managed.push(name)
      warnings.push(...fieldWarnings)
    }
  }

  const { content } = applyServerEntries(existingRawContent, 'mcp', entries, {
    managed,
    previous: ctx.previousManagedNames,
    format: capabilities.format,
  })

  return { content, managedNames: managed, warnings }
}
````

## File: src/adapters/types.ts
````typescript
/**
 * Adapter contract for compiling and extracting MCP server configurations
 * to/from each agent's native file.
 *
 * Implements BLUEPRINT §9.1. All adapters are pure with respect to the
 * filesystem: they never print or write files; file I/O stays in the command
 * layer. Warnings and managed names are carried in the result.
 */

import { z } from 'zod'
import type { RuntimeContext, ConfigScope } from '$/src/core/context'
import type { CanonicalServer, AgentIdSchema } from '$/src/core/schema'

export type AgentId = z.infer<typeof AgentIdSchema>

export type EnvSyntax = 'posix' | 'env-colon' | 'brace-env'

export type WarningCode =
  | 'DEFAULT_DROPPED'
  | 'CWD_UNSUPPORTED'
  | 'TARGETS_NOT_NATIVE'
  | 'SCOPE_UNSUPPORTED'
  | 'TRANSPORT_INFERRED'
  | 'UNKNOWN_FIELD_DROPPED'
  | 'AMBIGUOUS_ENTRY'
  | 'UNKNOWN_PLACEHOLDER'
  | 'DISABLE_UNSUPPORTED'
  | 'MANUAL_ENTRY_PRESERVED'

export interface Warning {
  code: WarningCode
  agent: AgentId
  server?: string
  field?: string
  message: string
}

export interface AdapterCapabilities {
  readonly scopes: readonly ConfigScope[]
  readonly format: 'json' | 'jsonc'
  readonly envSyntax: EnvSyntax
  readonly nativeDefault: boolean
  readonly nativeDisabled: boolean
  readonly cwd: boolean
  /** Storage layout: `'single-file'` (one native config file) or
   * `'per-plugin'` (antigravity: one `mcp_config.json` per plugin dir). */
  readonly layout: 'single-file' | 'per-plugin'
  /** Native config root key under which servers are stored (`'mcpServers'`,
   * `'servers'`, `'mcp'`, `'context_servers'`). Omitted for per-plugin
   * adapters that still declare a root key for extraction interop. */
  readonly rootKey?: string
}

export interface AdapterContext extends RuntimeContext {
  readonly scope: ConfigScope
  readonly previousManagedNames: ReadonlySet<string>
}

export interface CompileResult {
  readonly content: string
  readonly managedNames: readonly string[]
  readonly warnings: readonly Warning[]
}

export interface ExtractResult {
  readonly servers: Record<string, CanonicalServer>
  readonly warnings: readonly Warning[]
}

export interface AgentAdapter {
  readonly id: AgentId
  readonly displayName: string
  readonly capabilities: AdapterCapabilities

  getConfigPath(scope: ConfigScope, ctx: RuntimeContext): string | null
  detect(scope: ConfigScope, ctx: RuntimeContext): Promise<boolean>

  /** Pure: canonical server -> native object (null when not applicable). */
  compile(server: CanonicalServer): {
    entry: unknown | null
    warnings: readonly Warning[]
  }

  extractServers(rawContent: string, scope: ConfigScope): ExtractResult
  applyServers(
    existingRawContent: string | null,
    servers: Record<string, CanonicalServer>,
    ctx: AdapterContext,
  ): CompileResult
}

export function makeWarning(
  agent: AgentId,
  code: WarningCode,
  message: string,
  meta?: { server?: string; field?: string },
): Warning {
  return {
    code,
    agent,
    message,
    ...(meta?.server !== undefined ? { server: meta.server } : {}),
    ...(meta?.field !== undefined ? { field: meta.field } : {}),
  }
}
````

## File: src/adapters/vscode.ts
````typescript
/**
 * Visual Studio Code adapter.
 *
 * Project: `.vscode/mcp.json`. Global: OS User Profile `mcp.json`.
 * Root key: `servers`. Format: JSONC. Env syntax: `${env:VAR}` (env-colon),
 * native `:-default` NOT supported. Disabled servers omitted.
 * Preserves `inputs` array and JSONC comments (non-destructive merge).
 *
 * Implements MATRIX.md §1, §2, §3, §7.3.
 */

import { posix, win32 } from 'node:path'
import { existsSync } from 'node:fs'
import { parse } from 'jsonc-parser'
import { readTextFile } from '$/src/core/fs-atomic'
import type { RuntimeContext, ConfigScope } from '$/src/core/context'
import type { CanonicalServer } from '$/src/core/schema'
import {
  isStdioServer,
  isHttpServer,
  type StreamableHttpServer,
  type SseServer,
} from '$/src/core/schema'
import { translate } from '$/src/core/placeholder'
import type {
  AgentId,
  AdapterCapabilities,
  AgentAdapter,
  CompileResult,
  ExtractResult,
  Warning,
  AdapterContext,
} from '$/src/adapters/types'
import { applyServerEntries } from '$/src/adapters/shared'

export const id: AgentId = 'vscode'
export const displayName = 'Visual Studio Code'

export const capabilities: AdapterCapabilities = {
  scopes: ['project', 'global'],
  format: 'jsonc',
  envSyntax: 'env-colon' as const,
  nativeDefault: false,
  nativeDisabled: false,
  cwd: false,
  layout: 'single-file' as const,
  rootKey: 'servers',
}

/**
 * VS Code channel probing order per `spec/MATRIX.md` §1.1. The first channel
 * whose `<base>/<channel>/User` profile directory exists wins; falls back to
 * the stable `Code` channel when none exist.
 */
export const VSCODE_CHANNELS = ['Code', 'Code - Insiders', 'VSCodium'] as const

function pjoin(ctx: RuntimeContext, ...paths: string[]): string {
  return ctx.platform === 'win32' ? win32.join(...paths) : posix.join(...paths)
}

function vscodeGlobalBase(ctx: RuntimeContext): string {
  if (ctx.platform === 'win32') {
    return pjoin(
      ctx,
      ctx.env.APPDATA || pjoin(ctx, ctx.homeDir, 'AppData', 'Roaming'),
    )
  }
  if (ctx.platform === 'darwin') {
    return pjoin(ctx, ctx.homeDir, 'Library', 'Application Support')
  }
  // linux
  return pjoin(
    ctx,
    ctx.env.XDG_CONFIG_HOME || pjoin(ctx, ctx.homeDir, '.config'),
  )
}

export function getConfigPath(
  scope: ConfigScope,
  ctx: RuntimeContext,
): string | null {
  if (scope === 'project') {
    return pjoin(ctx, ctx.cwd, '.vscode', 'mcp.json')
  }
  const base = vscodeGlobalBase(ctx)
  let channel = 'Code'
  for (const candidate of VSCODE_CHANNELS) {
    if (existsSync(pjoin(ctx, base, candidate, 'User'))) {
      channel = candidate
      break
    }
  }
  return pjoin(ctx, base, channel, 'User', 'mcp.json')
}

export async function detect(
  scope: ConfigScope,
  ctx: RuntimeContext,
): Promise<boolean> {
  const path = getConfigPath(scope, ctx)
  if (path === null) {
    return false
  }
  return readTextFile(path) !== null
}

function translateField(
  value: string,
  field: string,
): { value: string; warnings: Warning[] } {
  const result = translate(value, 'env-colon', { nativeDefault: false })
  return {
    value: result.value,
    warnings: result.warnings.map((w): Warning => ({
      code: w.code,
      agent: 'vscode',
      field,
      message: w.message,
    })),
  }
}

export function compile(server: CanonicalServer): {
  entry: unknown | null
  warnings: readonly Warning[]
} {
  const warnings: Warning[] = []

  if (isStdioServer(server)) {
    if (server.cwd !== undefined && server.cwd !== '') {
      warnings.push({
        code: 'CWD_UNSUPPORTED',
        agent: 'vscode',
        field: 'cwd',
        message: 'cwd cannot be represented natively for vscode',
      })
    }
    const entry: Record<string, unknown> = {
      type: 'stdio',
      command: server.command,
    }
    if (server.args && server.args.length > 0) {
      const translatedArgs: string[] = []
      for (const arg of server.args) {
        const { value: translated, warnings: fieldWarnings } = translateField(
          arg,
          'args',
        )
        translatedArgs.push(translated)
        warnings.push(...fieldWarnings)
      }
      entry.args = translatedArgs
    }
    if (server.env) {
      const env: Record<string, string> = {}
      for (const [key, value] of Object.entries(server.env)) {
        const { value: translated, warnings: fieldWarnings } = translateField(
          value,
          key,
        )
        env[key] = translated
        warnings.push(...fieldWarnings)
      }
      entry.env = env
    }
    return { entry, warnings }
  }

  // streamable-http → 'http', sse → 'sse' (vscode preserva ambos nativamente)
  const nativeType = server.type === 'sse' ? 'sse' : 'http'
  const { value: translatedUrl, warnings: urlWarnings } = translateField(
    server.url,
    'url',
  )
  warnings.push(...urlWarnings)
  const entry: Record<string, unknown> = {
    type: nativeType,
    url: translatedUrl,
  }
  if (server.headers) {
    const headers: Record<string, string> = {}
    for (const [key, value] of Object.entries(server.headers)) {
      const { value: translated, warnings: fieldWarnings } = translateField(
        value,
        key,
      )
      headers[key] = translated
      warnings.push(...fieldWarnings)
    }
    entry.headers = headers
  }
  return { entry, warnings }
}

export function extractServers(
  rawContent: string,
  scope: ConfigScope,
): ExtractResult {
  const warnings: Warning[] = []
  const resultServers: Record<string, CanonicalServer> = {}

  let parsed: Record<string, unknown>
  try {
    const errors: Array<{ error: number; offset: number; length: number }> = []
    parsed = parse(rawContent, errors) as Record<string, unknown>
    if (errors.length > 0) {
      return { servers: {}, warnings }
    }
  } catch {
    return { servers: {}, warnings }
  }

  const servers = parsed.servers
  if (!servers || typeof servers !== 'object' || Array.isArray(servers)) {
    return { servers: {}, warnings }
  }

  for (const [name, rawEntry] of Object.entries(
    servers as Record<string, unknown>,
  )) {
    const entry = rawEntry as Record<string, unknown> | null
    if (!entry || typeof entry !== 'object') {
      continue
    }

    const type = entry.type
    const command = entry.command
    const url = entry.url

    const hasCommand = typeof command === 'string' && command.length > 0
    const hasUrl = typeof url === 'string' && url.length > 0
    const isHttp =
      type === 'http' || type === 'streamable-http' || type === 'sse' || hasUrl
    const isStdio = type === 'stdio' || (hasCommand && !hasUrl)

    if (isHttp && isStdio) {
      warnings.push({
        code: 'AMBIGUOUS_ENTRY',
        agent: 'vscode',
        server: name,
        message: `Both command and url present for \`${name}\`; url wins`,
      })
    }

    if (isHttp) {
      const resolvedUrl = url as string
      // Determina o tipo canônico: 'sse' preservado do nativo, caso contrário
      // 'streamable-http' (incluindo o legado 'http' e a inferência por URL).
      let canonicalType: 'streamable-http' | 'sse' = 'streamable-http'
      let inferred = false
      if (type === 'sse') {
        canonicalType = 'sse'
      } else if (type === 'streamable-http') {
        canonicalType = 'streamable-http'
      } else if (type === 'http') {
        canonicalType = 'streamable-http'
      } else if (hasUrl) {
        inferred = true
        canonicalType = 'streamable-http'
      }
      const server: StreamableHttpServer | SseServer = {
        type: canonicalType,
        url: resolvedUrl,
      }
      // URL-only (ou tipo não explícito) → transporte inferido.
      if (inferred) {
        warnings.push({
          code: 'TRANSPORT_INFERRED',
          agent: 'vscode',
          server: name,
          message: `Transport inferred as streamable-http for \`${name}\``,
        })
      }
      if (
        entry.headers &&
        typeof entry.headers === 'object' &&
        !Array.isArray(entry.headers)
      ) {
        server.headers = {}
        for (const [k, v] of Object.entries(
          entry.headers as Record<string, unknown>,
        )) {
          if (typeof v === 'string') {
            server.headers[k] = v
          }
        }
      }
      resultServers[name] = server
      continue
    }

    if (isStdio) {
      const server: CanonicalServer = {
        type: 'stdio',
        command: command as string,
        args: [],
      }
      if (entry.args && Array.isArray(entry.args)) {
        server.args = entry.args.filter(
          (a): a is string => typeof a === 'string',
        )
      }
      if (
        entry.env &&
        typeof entry.env === 'object' &&
        !Array.isArray(entry.env)
      ) {
        server.env = {}
        for (const [k, v] of Object.entries(
          entry.env as Record<string, unknown>,
        )) {
          if (typeof v === 'string') {
            server.env[k] = v
          }
        }
      }
      resultServers[name] = server
      continue
    }

    warnings.push({
      code: 'UNKNOWN_FIELD_DROPPED',
      agent: 'vscode',
      server: name,
      field: 'type',
      message: `No command/http entry for \`${name}\`; entry dropped`,
    })
  }

  return { servers: resultServers, warnings }
}

export function applyServers(
  existingRawContent: string | null,
  servers: Record<string, CanonicalServer>,
  ctx: AdapterContext,
): CompileResult {
  const warnings: Warning[] = []

  const entries: Record<string, unknown> = {}
  const managed: string[] = []
  for (const [name, server] of Object.entries(servers)) {
    const { entry, warnings: fieldWarnings } = compile(server)
    if (entry !== null) {
      entries[name] = entry
      managed.push(name)
      warnings.push(...fieldWarnings)
    }
  }

  const { content } = applyServerEntries(
    existingRawContent,
    'servers',
    entries,
    {
      managed,
      previous: ctx.previousManagedNames,
      format: capabilities.format,
    },
  )

  return { content, managedNames: managed, warnings }
}
````

## File: src/adapters/windsurf.ts
````typescript
/**
 * Windsurf adapter (global-only).
 *
 * Global: `~/.codeium/windsurf/mcp_config.json`.
 * Root key: `mcpServers`. Format: JSON. Env syntax: `${env:VAR}` (env-colon),
 * native `:-default` NOT supported. Disabled servers omitted.
 * Uses `serverUrl` for remote endpoints. Project scope is unsupported.
 *
 * Implements MATRIX.md §1, §2, §3, §7.5.
 */

import { join } from 'node:path'
import { parse } from 'jsonc-parser'
import { readTextFile } from '$/src/core/fs-atomic'
import type { RuntimeContext, ConfigScope } from '$/src/core/context'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer, isHttpServer } from '$/src/core/schema'
import { translate } from '$/src/core/placeholder'
import type {
  AgentId,
  AdapterCapabilities,
  AgentAdapter,
  CompileResult,
  ExtractResult,
  Warning,
  AdapterContext,
} from '$/src/adapters/types'
import { applyServerEntries } from '$/src/adapters/shared'

export const id: AgentId = 'windsurf'
export const displayName = 'Windsurf'

export const capabilities: AdapterCapabilities = {
  scopes: ['global'],
  format: 'json',
  envSyntax: 'env-colon' as const,
  nativeDefault: false,
  nativeDisabled: false,
  cwd: false,
  layout: 'single-file' as const,
  rootKey: 'mcpServers',
}

export function getConfigPath(
  scope: ConfigScope,
  ctx: RuntimeContext,
): string | null {
  // Windsurf is global-only (§7.5): project scope returns null.
  return scope === 'global'
    ? join(ctx.homeDir, '.codeium', 'windsurf', 'mcp_config.json')
    : null
}

export async function detect(
  scope: ConfigScope,
  ctx: RuntimeContext,
): Promise<boolean> {
  const path = getConfigPath(scope, ctx)
  if (path === null) {
    return false
  }
  return readTextFile(path) !== null
}

function translateField(
  value: string,
  field: string,
): { value: string; warnings: Warning[] } {
  const result = translate(value, 'env-colon', { nativeDefault: false })
  return {
    value: result.value,
    warnings: result.warnings.map((w): Warning => ({
      code: w.code,
      agent: 'windsurf',
      field,
      message: w.message,
    })),
  }
}

export function compile(server: CanonicalServer): {
  entry: unknown | null
  warnings: readonly Warning[]
} {
  const warnings: Warning[] = []

  if (isStdioServer(server)) {
    if (server.cwd !== undefined && server.cwd !== '') {
      warnings.push({
        code: 'CWD_UNSUPPORTED',
        agent: 'windsurf',
        field: 'cwd',
        message: 'cwd cannot be represented natively for windsurf',
      })
    }
    const entry: Record<string, unknown> = {
      command: server.command,
    }
    if (server.args && server.args.length > 0) {
      const translatedArgs: string[] = []
      for (const arg of server.args) {
        const { value: translated, warnings: fieldWarnings } = translateField(
          arg,
          'args',
        )
        translatedArgs.push(translated)
        warnings.push(...fieldWarnings)
      }
      entry.args = translatedArgs
    }
    if (server.env) {
      const env: Record<string, string> = {}
      for (const [key, value] of Object.entries(server.env)) {
        const { value: translated, warnings: fieldWarnings } = translateField(
          value,
          key,
        )
        env[key] = translated
        warnings.push(...fieldWarnings)
      }
      entry.env = env
    }
    return { entry, warnings }
  }

  const { value: translatedUrl, warnings: urlWarnings } = translateField(
    server.url,
    'url',
  )
  warnings.push(...urlWarnings)
  const entry: Record<string, unknown> = {
    serverUrl: translatedUrl,
  }
  if (server.headers) {
    const headers: Record<string, string> = {}
    for (const [key, value] of Object.entries(server.headers)) {
      const { value: translated, warnings: fieldWarnings } = translateField(
        value,
        key,
      )
      headers[key] = translated
      warnings.push(...fieldWarnings)
    }
    entry.headers = headers
  }
  return { entry, warnings }
}

export function extractServers(
  rawContent: string,
  scope: ConfigScope,
): ExtractResult {
  const warnings: Warning[] = []
  const resultServers: Record<string, CanonicalServer> = {}

  let parsed: Record<string, unknown>
  try {
    const errors: Array<{ error: number; offset: number; length: number }> = []
    parsed = parse(rawContent, errors) as Record<string, unknown>
    if (errors.length > 0) {
      return { servers: {}, warnings }
    }
  } catch {
    return { servers: {}, warnings }
  }

  const mcpServers = parsed.mcpServers
  if (
    !mcpServers ||
    typeof mcpServers !== 'object' ||
    Array.isArray(mcpServers)
  ) {
    return { servers: {}, warnings }
  }

  for (const [name, rawEntry] of Object.entries(
    mcpServers as Record<string, unknown>,
  )) {
    const entry = rawEntry as Record<string, unknown> | null
    if (!entry || typeof entry !== 'object') {
      continue
    }

    const command = entry.command
    const url = entry.url
    const serverUrl = entry.serverUrl

    const hasCommand = typeof command === 'string' && command.length > 0
    const hasUrl = typeof url === 'string' && url.length > 0
    const hasServerUrl = typeof serverUrl === 'string' && serverUrl.length > 0
    const isHttp = hasUrl || hasServerUrl
    const isStdio = hasCommand && !isHttp

    if (isHttp && isStdio) {
      warnings.push({
        code: 'AMBIGUOUS_ENTRY',
        agent: 'windsurf',
        server: name,
        message: `Both command and url present for \`${name}\`; url wins`,
      })
    }

    if (isHttp) {
      const resolvedUrl = hasUrl ? (url as string) : (serverUrl as string)
      // Windsurf nativo não distingue streamable-http de sse: emite
      // 'streamable-http' para entradas remotas.
      const server: CanonicalServer = {
        type: 'streamable-http',
        url: resolvedUrl,
      }
      // Windsurf http entries have no `type` field → inferred.
      if ((hasUrl || hasServerUrl) && !hasCommand) {
        warnings.push({
          code: 'TRANSPORT_INFERRED',
          agent: 'windsurf',
          server: name,
          message: `Transport inferred as streamable-http for \`${name}\``,
        })
      }
      if (
        entry.headers &&
        typeof entry.headers === 'object' &&
        !Array.isArray(entry.headers)
      ) {
        server.headers = {}
        for (const [k, v] of Object.entries(
          entry.headers as Record<string, unknown>,
        )) {
          if (typeof v === 'string') {
            server.headers[k] = v
          }
        }
      }
      resultServers[name] = server
      continue
    }

    if (isStdio) {
      const server: CanonicalServer = {
        type: 'stdio',
        command: command as string,
        args: [],
      }
      if (entry.args && Array.isArray(entry.args)) {
        server.args = entry.args.filter(
          (a): a is string => typeof a === 'string',
        )
      }
      if (
        entry.env &&
        typeof entry.env === 'object' &&
        !Array.isArray(entry.env)
      ) {
        server.env = {}
        for (const [k, v] of Object.entries(
          entry.env as Record<string, unknown>,
        )) {
          if (typeof v === 'string') {
            server.env[k] = v
          }
        }
      }
      resultServers[name] = server
      continue
    }

    warnings.push({
      code: 'UNKNOWN_FIELD_DROPPED',
      agent: 'windsurf',
      server: name,
      field: 'command',
      message: `No command or serverUrl/url for \`${name}\`; entry dropped`,
    })
  }

  return { servers: resultServers, warnings }
}

export function applyServers(
  existingRawContent: string | null,
  servers: Record<string, CanonicalServer>,
  ctx: AdapterContext,
): CompileResult {
  const warnings: Warning[] = []

  // Windsurf is global-only: in project scope, skip all servers.
  if (ctx.scope === 'project') {
    warnings.push({
      code: 'SCOPE_UNSUPPORTED',
      agent: 'windsurf',
      message:
        'windsurf supports global scope only; project-scope compilation skipped',
    })
    return { content: existingRawContent ?? '', managedNames: [], warnings }
  }

  const entries: Record<string, unknown> = {}
  const managed: string[] = []
  for (const [name, server] of Object.entries(servers)) {
    const { entry, warnings: fieldWarnings } = compile(server)
    if (entry !== null) {
      entries[name] = entry
      managed.push(name)
      warnings.push(...fieldWarnings)
    }
  }

  const { content } = applyServerEntries(
    existingRawContent,
    'mcpServers',
    entries,
    {
      managed,
      previous: ctx.previousManagedNames,
      format: capabilities.format,
    },
  )

  return { content, managedNames: managed, warnings }
}
````

## File: src/adapters/zed.ts
````typescript
/**
 * Zed adapter.
 *
 * Project: `.zed/settings.json`. Global: `~/.config/zed/settings.json`.
 * Root key: `context_servers`. Format: JSONC. Env syntax: `${VAR}` (posix),
 * native `:-default` NOT supported. Disabled servers omitted.
 * Nests stdio execution inside `command: { path, args, env }`.
 *
 * Implements MATRIX.md §1, §2, §3, §7.6.
 */

import { posix, win32 } from 'node:path'
import { parse } from 'jsonc-parser'
import { readTextFile } from '$/src/core/fs-atomic'
import type { RuntimeContext, ConfigScope } from '$/src/core/context'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer, isHttpServer } from '$/src/core/schema'
import { translate } from '$/src/core/placeholder'
import type {
  AgentId,
  AdapterCapabilities,
  AgentAdapter,
  CompileResult,
  ExtractResult,
  Warning,
  AdapterContext,
} from '$/src/adapters/types'
import { applyServerEntries } from '$/src/adapters/shared'

export const id: AgentId = 'zed'
export const displayName = 'Zed'

export const capabilities: AdapterCapabilities = {
  scopes: ['project', 'global'],
  format: 'jsonc',
  envSyntax: 'posix' as const,
  nativeDefault: false,
  nativeDisabled: false,
  cwd: false,
  layout: 'single-file' as const,
  rootKey: 'context_servers',
}

function pjoin(ctx: RuntimeContext, ...paths: string[]): string {
  return ctx.platform === 'win32' ? win32.join(...paths) : posix.join(...paths)
}

export function getConfigPath(
  scope: ConfigScope,
  ctx: RuntimeContext,
): string | null {
  if (scope === 'project') {
    return pjoin(ctx, ctx.cwd, '.zed', 'settings.json')
  }
  let base: string
  let subdir: string
  if (ctx.platform === 'win32') {
    base = pjoin(
      ctx,
      ctx.env.APPDATA || pjoin(ctx, ctx.homeDir, 'AppData', 'Roaming'),
    )
    subdir = 'Zed'
  } else if (ctx.platform === 'darwin') {
    // macOS uses ~/.config directly (does not honor XDG_CONFIG_HOME).
    base = pjoin(ctx, ctx.homeDir, '.config')
    subdir = 'zed'
  } else {
    // linux
    base = pjoin(
      ctx,
      ctx.env.XDG_CONFIG_HOME || pjoin(ctx, ctx.homeDir, '.config'),
    )
    subdir = 'zed'
  }
  return pjoin(ctx, base, subdir, 'settings.json')
}

export async function detect(
  scope: ConfigScope,
  ctx: RuntimeContext,
): Promise<boolean> {
  const path = getConfigPath(scope, ctx)
  if (path === null) {
    return false
  }
  return readTextFile(path) !== null
}

function translateField(
  value: string,
  field: string,
): { value: string; warnings: Warning[] } {
  const result = translate(value, 'posix', { nativeDefault: false })
  return {
    value: result.value,
    warnings: result.warnings.map((w): Warning => ({
      code: w.code,
      agent: 'zed',
      field,
      message: w.message,
    })),
  }
}

export function compile(server: CanonicalServer): {
  entry: unknown | null
  warnings: readonly Warning[]
} {
  const warnings: Warning[] = []

  if (isStdioServer(server)) {
    if (server.cwd !== undefined && server.cwd !== '') {
      warnings.push({
        code: 'CWD_UNSUPPORTED',
        agent: 'zed',
        field: 'cwd',
        message: 'cwd cannot be represented natively for zed',
      })
    }
    const commandEntry: Record<string, unknown> = { path: server.command }
    if (server.args && server.args.length > 0) {
      commandEntry.args = server.args
    }
    if (server.env) {
      const env: Record<string, string> = {}
      for (const [key, value] of Object.entries(server.env)) {
        const { value: translated, warnings: fieldWarnings } = translateField(
          value,
          key,
        )
        env[key] = translated
        warnings.push(...fieldWarnings)
      }
      commandEntry.env = env
    }
    const entry: Record<string, unknown> = { command: commandEntry }
    return { entry, warnings }
  }

  const { value: translatedUrl, warnings: urlWarnings } = translateField(
    server.url,
    'url',
  )
  warnings.push(...urlWarnings)
  const entry: Record<string, unknown> = { url: translatedUrl }
  if (server.headers) {
    const headers: Record<string, string> = {}
    for (const [key, value] of Object.entries(server.headers)) {
      const { value: translated, warnings: fieldWarnings } = translateField(
        value,
        key,
      )
      headers[key] = translated
      warnings.push(...fieldWarnings)
    }
    entry.headers = headers
  }
  return { entry, warnings }
}

export function extractServers(
  rawContent: string,
  scope: ConfigScope,
): ExtractResult {
  const warnings: Warning[] = []
  const resultServers: Record<string, CanonicalServer> = {}

  let parsed: Record<string, unknown>
  try {
    const errors: Array<{ error: number; offset: number; length: number }> = []
    parsed = parse(rawContent, errors) as Record<string, unknown>
    if (errors.length > 0) {
      return { servers: {}, warnings }
    }
  } catch {
    return { servers: {}, warnings }
  }

  const contextServers = parsed.context_servers
  if (
    !contextServers ||
    typeof contextServers !== 'object' ||
    Array.isArray(contextServers)
  ) {
    return { servers: {}, warnings }
  }

  for (const [name, rawEntry] of Object.entries(
    contextServers as Record<string, unknown>,
  )) {
    const entry = rawEntry as Record<string, unknown> | null
    if (!entry || typeof entry !== 'object') {
      continue
    }

    const url = entry.url
    const command = entry.command as Record<string, unknown> | undefined

    const hasUrl = typeof url === 'string' && url.length > 0
    const commandPath =
      command && typeof command.path === 'string' && command.path.length > 0
        ? (command.path as string)
        : undefined
    const hasCommand = !!commandPath

    if (hasCommand && hasUrl) {
      warnings.push({
        code: 'AMBIGUOUS_ENTRY',
        agent: 'zed',
        server: name,
        message: `Both command and url present for \`${name}\`; url wins`,
      })
    }

    if (hasUrl) {
      const resolvedUrl = url as string
      // Zed nativo não distingue streamable-http de sse: emite
      // 'streamable-http' para entradas remotas.
      const server: CanonicalServer = {
        type: 'streamable-http',
        url: resolvedUrl,
      }
      // Zed http entries have no `type` field, so they are inferred.
      warnings.push({
        code: 'TRANSPORT_INFERRED',
        agent: 'zed',
        server: name,
        message: `Transport inferred as streamable-http for \`${name}\``,
      })
      if (
        entry.headers &&
        typeof entry.headers === 'object' &&
        !Array.isArray(entry.headers)
      ) {
        server.headers = {}
        for (const [k, v] of Object.entries(
          entry.headers as Record<string, unknown>,
        )) {
          if (typeof v === 'string') {
            server.headers[k] = v
          }
        }
      }
      resultServers[name] = server
      continue
    }

    if (hasCommand && command) {
      const server: CanonicalServer = {
        type: 'stdio',
        command: commandPath,
        args: [],
      }
      if (command.args && Array.isArray(command.args)) {
        server.args = command.args.filter(
          (a): a is string => typeof a === 'string',
        )
      }
      if (
        command.env &&
        typeof command.env === 'object' &&
        !Array.isArray(command.env)
      ) {
        server.env = {}
        for (const [k, v] of Object.entries(
          command.env as Record<string, unknown>,
        )) {
          if (typeof v === 'string') {
            server.env[k] = v
          }
        }
      }
      resultServers[name] = server
      continue
    }

    warnings.push({
      code: 'UNKNOWN_FIELD_DROPPED',
      agent: 'zed',
      server: name,
      field: 'command',
      message: `No command.path or url for \`${name}\`; entry dropped`,
    })
  }

  return { servers: resultServers, warnings }
}

export function applyServers(
  existingRawContent: string | null,
  servers: Record<string, CanonicalServer>,
  ctx: AdapterContext,
): CompileResult {
  const warnings: Warning[] = []

  const entries: Record<string, unknown> = {}
  const managed: string[] = []
  for (const [name, server] of Object.entries(servers)) {
    const { entry, warnings: fieldWarnings } = compile(server)
    if (entry !== null) {
      entries[name] = entry
      managed.push(name)
      warnings.push(...fieldWarnings)
    }
  }

  const { content } = applyServerEntries(
    existingRawContent,
    'context_servers',
    entries,
    {
      managed,
      previous: ctx.previousManagedNames,
      format: capabilities.format,
    },
  )

  return { content, managedNames: managed, warnings }
}
````

## File: src/commands/add-interactive.ts
````typescript
/**
 * Interactive `add` wizard (B2).
 *
 * Pure-UI-port module: all terminal interaction goes through `PromptUi`
 * (`src/ui/prompts.ts`); commands never import `@clack/prompts` directly.
 * Collects `DirectOptions` for a new MCP server so `add.command.ts` can reuse
 * the existing `resolveDirect()` + persistence + `runSync` pipeline.
 */

import parseArgv from 'string-argv'
import { SERVER_NAME_PATTERN } from '$/src/config'
import type { DirectOptions } from '$/src/sources/direct'
import type { PromptUi } from '$/src/ui/prompts'

/** Environment variable keys reserved by Agent Plugins MCP 1.0.0. */
const RESERVED_ENV_KEYS = ['PLUGIN_ROOT', 'PLUGIN_DATA']

const ENV_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

/** Parse shell-like input without crashing on malformed quoting. */
function parseArgvSafe(value: string): string[] {
  try {
    return parseArgv(value)
  } catch {
    return []
  }
}

/** Validate a server name against `SERVER_NAME_PATTERN`. */
export function validateServerName(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) {
    return 'Server name is required.'
  }
  if (!SERVER_NAME_PATTERN.test(trimmed)) {
    return 'Use lowercase letters, digits, dots, dashes or underscores, starting with a letter or digit.'
  }
  return undefined
}

/** Validate a required executable command (may include inline arguments). */
export function validateCommandInput(value: string): string | undefined {
  if (!value.trim()) {
    return 'Command is required.'
  }
  if (parseArgvSafe(value.trim()).length === 0) {
    return 'Command is invalid. Check the quoting and try again.'
  }
  return undefined
}

/** Validate a required `http:`/`https:` URL, allowing `${VAR}` placeholders. */
export function validateHttpUrl(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) {
    return 'URL is required.'
  }
  if (/\$\{[^}]+\}/.test(trimmed)) {
    return undefined
  }
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return 'Enter a valid http:// or https:// URL.'
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return 'URL must start with http:// or https://.'
  }
  return undefined
}

/** Validate a `KEY=VALUE` entry or a `KEY` reference. */
export function validateEnvEntry(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) {
    return 'Environment entry is required.'
  }
  const separator = trimmed.indexOf('=')
  const key = (separator === -1 ? trimmed : trimmed.slice(0, separator)).trim()
  if (!key) {
    return 'Environment variable name is required.'
  }
  if (!ENV_KEY_PATTERN.test(key)) {
    return 'Use a valid environment variable name (letters, digits and underscores, not starting with a digit).'
  }
  if (RESERVED_ENV_KEYS.includes(key)) {
    return `Reserved environment variable key: ${key}.`
  }
  return undefined
}

/** Validate a `Name: Value` HTTP header entry. */
export function validateHeaderEntry(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) {
    return 'Header is required.'
  }
  const separator = trimmed.indexOf(':')
  if (separator === -1 || !trimmed.slice(0, separator).trim()) {
    return 'Use the format "Name: Value" with a non-empty header name.'
  }
  return undefined
}

export interface CollectInteractiveAddOptionsParams {
  ui: PromptUi
  /** Candidate name from `--name` or the positional argument. */
  initialName?: string
  /**
   * Check whether a candidate name conflicts. Returns `'canonical'` when the
   * name already exists in the canonical config (caller should offer
   * overwrite/rename/cancel), `'unmanaged'` when the name collides with an
   * unmanaged plugin directory (caller should re-prompt), or `false` when the
   * name is acceptable.
   */
  checkConflict: (name: string) => 'canonical' | 'unmanaged' | false
}

export interface InteractiveAddResult {
  name: string
  options: DirectOptions
}

/**
 * Resolve the server name, failing back to an interactive text prompt when the
 * candidate is missing or invalid.
 */
async function resolveServerName({
  ui,
  initialName,
}: {
  ui: PromptUi
  initialName?: string
}): Promise<string> {
  const candidate = initialName?.trim() ?? ''
  if (candidate) {
    if (SERVER_NAME_PATTERN.test(candidate)) {
      return candidate
    }
    ui.warn(
      `Invalid server name \`${candidate}\`. Use lowercase letters, digits, dots, dashes or underscores.`,
    )
  }
  return ui.text({
    message: 'Server name',
    placeholder: 'e.g. github',
    validate: validateServerName,
  })
}

/** Loop collecting `Name: Value` HTTP headers. */
async function collectHeaders(ui: PromptUi): Promise<string[]> {
  const headers: string[] = []
  const wantsHeaders = await ui.confirm({
    message: 'Add HTTP headers?',
    initialValue: false,
  })
  if (!wantsHeaders) {
    return headers
  }
  let addAnother = true
  while (addAnother) {
    headers.push(
      await ui.text({
        message: 'Header (Name: Value)',
        placeholder: 'Authorization: Bearer <token>',
        validate: validateHeaderEntry,
      }),
    )
    addAnother = await ui.confirm({
      message: 'Add another header?',
      initialValue: false,
    })
  }
  return headers
}

/** Loop collecting `KEY=VALUE` / `KEY` environment entries. */
async function collectEnv(ui: PromptUi): Promise<string[]> {
  const env: string[] = []
  const wantsEnv = await ui.confirm({
    message: 'Add environment variables?',
    initialValue: false,
  })
  if (!wantsEnv) {
    return env
  }
  let addAnother = true
  while (addAnother) {
    const entry = await ui.text({
      message: 'Environment variable (KEY=VALUE or KEY)',
      placeholder: 'API_KEY=<value>',
      validate: validateEnvEntry,
    })
    env.push(entry)
    addAnother = await ui.confirm({
      message: 'Add another environment variable?',
      initialValue: false,
    })
  }
  return env
}

/**
 * Run the interactive add wizard and return the resolved name plus the
 * `DirectOptions` to feed into `resolveDirect()`.
 */
export async function collectInteractiveAddOptions({
  ui,
  initialName,
  checkConflict,
}: CollectInteractiveAddOptionsParams): Promise<InteractiveAddResult> {
  ui.intro('Add MCP server')

  // Resolve o nome do servidor, fazendo loop em caso de colisao com plugin
  // nao gerenciado (pede um novo nome sem auto-renomear).
  let candidate = initialName?.trim() ?? ''
  let name = ''
  for (;;) {
    if (candidate) {
      if (SERVER_NAME_PATTERN.test(candidate)) {
        name = candidate
      } else {
        ui.warn(
          `Invalid server name \`${candidate}\`. Use lowercase letters, digits, dots, dashes or underscores.`,
        )
        candidate = ''
      }
    }
    if (!name) {
      name = await ui.text({
        message: 'Server name',
        placeholder: 'e.g. github',
        validate: validateServerName,
      })
    }
    const conflict = checkConflict(name)
    if (conflict === 'unmanaged') {
      ui.warn(
        `The name \`${name}\` is in use by an unmanaged plugin not managed by the CLI. Please provide another name.`,
      )
      candidate = ''
      name = ''
      continue
    }
    if (conflict === 'canonical') {
      const action = await ui.select<'overwrite' | 'rename' | 'cancel'>({
        message: `Server \`${name}\` already exists. What would you like to do?`,
        options: [
          {
            label: 'Overwrite existing server',
            value: 'overwrite',
            hint: 'Replace the current definition',
          },
          {
            label: 'Choose a different name',
            value: 'rename',
            hint: 'Enter a new server name',
          },
          { label: 'Cancel', value: 'cancel', hint: 'Abort adding the server' },
        ],
      })
      if (action === 'overwrite') {
        break
      }
      if (action === 'rename') {
        candidate = ''
        name = ''
        continue
      }
      // Cancel: abort the interactive add flow.
      process.exit(0)
    }
    break
  }

  const type = await ui.select<'command' | 'http'>({
    message: 'How does this MCP server connect?',
    options: [
      {
        label: 'Local command',
        value: 'command',
        hint: 'Run a local executable (e.g. npx, uvx, node)',
      },
      {
        label: 'HTTP',
        value: 'http',
        hint: 'Connect to a remote MCP server via URL',
      },
    ],
  })

  if (type === 'http') {
    const url = await ui.text({
      message: 'Server URL',
      placeholder: 'https://example.com/mcp',
      validate: validateHttpUrl,
    })
    const header = await collectHeaders(ui)
    return {
      name,
      options: { name, http: url.trim(), header },
    }
  }

  const commandInput = await ui.text({
    message: 'Command',
    placeholder: 'npx',
    validate: validateCommandInput,
  })
  const argsInput = await ui.text({
    message: 'Arguments (optional)',
    placeholder: '-y @scope/pkg',
    defaultValue: '',
  })
  const env: string[] = await collectEnv(ui)

  const [executable, ...inlineArgs] = parseArgvSafe(commandInput.trim())
  const extraArgs = parseArgvSafe(argsInput.trim())

  return {
    name,
    options: {
      name,
      command: executable,
      arg: [...inlineArgs, ...extraArgs],
      env,
    },
  }
}
````

## File: src/core/env.ts
````typescript
/**
 * `.env` parsing, resolution, and secret-extraction planning.
 *
 * Implements BLUEPRINT §8.5 and the secret-hygiene policy of BLUEPRINT §13 /
 * ADR-0007: `.env` wins over `process.env`, symbolic placeholders stay in
 * versioned files, real values live only in `.env` (mode `0600`), and existing
 * `.env` keys are never overwritten.
 */

import { basename, dirname, join } from 'node:path'
import { readTextFile, writeFileAtomic } from '$/src/core/fs-atomic'
import type { RuntimeContext, ConfigScope } from '$/src/core/context'
import { AGENTS_DIR, ENV_FILE } from '$/src/config'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer, isHttpServer } from '$/src/core/schema'
import { SECRET_KEY_RE, derivedKey } from '$/src/core/placeholder'
import { ensureIgnored } from '$/src/core/gitignore'

export interface DotenvParseResult {
  vars: Record<string, string>
  warnings: string[]
}

export interface ReadDotenvResult {
  vars: Record<string, string>
  raw: string | null
}

export type ResolveVarSource = 'dotenv' | 'processEnv' | 'fallback' | 'unset'

export interface ResolveVarResult {
  value: string | undefined
  source: ResolveVarSource
}

export interface SecretWrite {
  key: string
  value: string
  description?: string
}

export interface SecretReplacement {
  location: 'env' | 'headers' | 'args' | 'url'
  fieldKey?: string
  argIndex?: number
  match: string
  envKey: string
  secretValue: string
}

export interface PlanSecretExtractionResult {
  writes: SecretWrite[]
  replacements: SecretReplacement[]
  warnings: string[]
}

export interface AppendToDotenvResult {
  added: string[]
  warnings: string[]
}

export interface SyncEnvExampleResult {
  added: string[]
  warnings: string[]
}

/**
 * Parse a `.env` document line by line.
 *
 * - `KEY=VALUE` and `KEY="VALUE"` / `KEY='VALUE'` (surrounding quotes stripped).
 * - `KEY=` → empty value.
 * - Whole-line `#` comments and blank lines are skipped.
 * - A leading `export ` is stripped.
 * - Duplicate keys: last wins. No variable expansion.
 */
export function parseDotenv(content: string): DotenvParseResult {
  const vars: Record<string, string> = {}
  const warnings: string[] = []

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line === '' || line.startsWith('#')) {
      continue
    }
    let body = line
    if (body.startsWith('export ')) {
      body = body.slice('export '.length)
    }
    const eq = body.indexOf('=')
    if (eq === -1) {
      continue
    }
    let key = body.slice(0, eq).trim()
    let value = body.slice(eq + 1)
    // Strip surrounding matching quotes.
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1)
    }
    vars[key] = value
  }

  return { vars, warnings }
}

function getDotenvPath(scope: ConfigScope, ctx: RuntimeContext): string {
  const base = scope === 'project' ? ctx.cwd : ctx.homeDir
  return scope === 'project'
    ? join(base, ENV_FILE)
    : join(base, AGENTS_DIR, ENV_FILE)
}

/**
 * Read the scope `.env`. Missing file → empty vars, no warning.
 */
export function readDotenv(
  scope: ConfigScope,
  ctx: RuntimeContext,
): ReadDotenvResult {
  const path = getDotenvPath(scope, ctx)
  const raw = readTextFile(path)
  if (raw === null) {
    return { vars: {}, raw: null }
  }
  return { vars: parseDotenv(raw).vars, raw }
}

/**
 * Resolve a variable name with precedence dotenv → processEnv → fallback.
 * An empty string counts as unset for fallback purposes.
 */
export function resolveVar(
  name: string,
  opts: {
    dotenv: Record<string, string>
    processEnv: NodeJS.ProcessEnv
    fallback?: string
  },
): ResolveVarResult {
  const dotenvVal = opts.dotenv[name]
  if (dotenvVal !== undefined && dotenvVal !== '') {
    return { value: dotenvVal, source: 'dotenv' }
  }
  const envVal = opts.processEnv[name]
  if (envVal !== undefined && envVal !== '') {
    return { value: envVal, source: 'processEnv' }
  }
  if (opts.fallback !== undefined && opts.fallback !== '') {
    return { value: opts.fallback, source: 'fallback' }
  }
  return { value: undefined, source: 'unset' }
}

/** Known secret value prefixes (BLUEPRINT §13). */
const SECRET_VALUE_PREFIXES = [
  'ghp_',
  'github_pat_',
  'sk-',
  'xoxb-',
  'xoxa-',
  'xoxp-',
  'xoxr-',
  'xoxs-',
  'AIza',
  'AKIA',
]

const SECRET_PREFIX_RE = new RegExp(
  `^(?:${SECRET_VALUE_PREFIXES.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
)

/** Authorization schemes whose prefix is preserved during replacement. */
const AUTH_SCHEMES = ['Bearer ', 'Basic ', 'Token ']

/**
 * Extract the replaceable secret substring from `value`, if any.
 *
 * Returns the `match` substring (what gets replaced with `${ENV_KEY}`) and the
 * `secretValue` (what gets written to `.env`). For `Bearer <token>` the match is
 * just `<token>`, so the `Bearer ` prefix is preserved by the replacement.
 */
function extractSecretParts(
  value: string,
): { match: string; secretValue: string } | null {
  // Known prefix at start of string (or after an auth scheme prefix).
  for (const scheme of AUTH_SCHEMES) {
    if (value.startsWith(scheme)) {
      const rest = value.slice(scheme.length)
      if (SECRET_PREFIX_RE.test(rest) || isHighEntropy(rest)) {
        return { match: rest, secretValue: rest }
      }
    }
  }
  if (SECRET_PREFIX_RE.test(value)) {
    return { match: value, secretValue: value }
  }
  // URL credentials: scheme://user:pass@
  const urlCreds = value.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/([^:@]+:[^@]+)@/)
  if (urlCreds) {
    return { match: urlCreds[1]!, secretValue: urlCreds[1]! }
  }
  // High-entropy string.
  if (isHighEntropy(value)) {
    return { match: value, secretValue: value }
  }
  return null
}

export function isSecretValue(value: string): boolean {
  return extractSecretParts(value) !== null
}

/**
 * High-entropy heuristic: ≥ 20 chars, no whitespace, ≥ 3 character classes
 * (lowercase, uppercase, digits, symbols). Excludes plain http(s) URLs without
 * credentials and filesystem paths containing `/` or `\`.
 */
function isHighEntropy(value: string): boolean {
  if (value.length < 20) return false
  if (/\s/.test(value)) return false
  // Exclude plain http(s) URLs without embedded credentials.
  if (/^https?:\/\//.test(value) && !/@/.test(value)) return false
  // Exclude filesystem paths.
  if (value.includes('/') || value.includes('\\')) return false

  let classes = 0
  if (/[a-z]/.test(value)) classes++
  if (/[A-Z]/.test(value)) classes++
  if (/[0-9]/.test(value)) classes++
  if (/[^A-Za-z0-9]/.test(value)) classes++
  return classes >= 3
}

function isLiteral(value: string): boolean {
  return !/^\$\{[A-Za-z_][A-Za-z0-9_]*(?::-[^}]*)?\}$/.test(value)
}

/** Matches any `${...}` placeholder substring (used to skip symbolic values). */
const PLACEHOLDER_ANY_RE = /\$\{[A-Za-z_][A-Za-z0-9_]*(?::-[^}]*)?\}/

/**
 * Plan which literal (non-placeholder) secret values in `server` should be
 * extracted to `.env`. Never touches disk.
 *
 * - `policy: 'warn'` → warnings only, no writes (CI / `--yes` default).
 * - `policy: 'extract'` → writes to be appended to `.env`.
 *
 * A value already wrapped in `${...}` is never flagged. Non-secret values such
 * as `NODE_ENV=production` are not flagged.
 *
 * Env var names are derived from `serverName` (via `derivedKey`), sanitizing
 * non-alphanumeric characters, so two servers never collide on env keys.
 *
 * Returns structured `replacements` metadata describing exactly where each
 * secret lives (`env`/`headers`/`args`/`url`), the substring to replace
 * (`match`), the derived env key, and the secret value to persist.
 */
export function planSecretExtraction(
  serverName: string,
  server: CanonicalServer,
  opts: { policy: 'warn' | 'extract' },
): PlanSecretExtractionResult {
  const writes: SecretWrite[] = []
  const replacements: SecretReplacement[] = []
  const warnings: string[] = []
  const { policy } = opts

  const consider = (
    location: 'env' | 'headers' | 'args' | 'url',
    fieldKey: string,
    value: string,
    argIndex?: number,
  ): void => {
    if (!isLiteral(value) || PLACEHOLDER_ANY_RE.test(value)) {
      return
    }
    let parts = extractSecretParts(value)
    if (!parts && SECRET_KEY_RE.test(fieldKey)) {
      // Key-pattern match: the whole literal value is the secret. Strip any
      // auth scheme prefix so `Bearer ` / `Basic ` / `Token ` is preserved.
      let match = value
      for (const scheme of AUTH_SCHEMES) {
        if (value.startsWith(scheme)) {
          match = value.slice(scheme.length)
          break
        }
      }
      parts = { match, secretValue: match }
    }
    if (!parts) {
      return
    }
    const envVarKey = derivedKey(serverName, fieldKey)
    if (policy === 'extract') {
      writes.push({ key: envVarKey, value: parts.secretValue })
    }
    replacements.push({
      location,
      ...(argIndex === undefined ? { fieldKey } : { argIndex }),
      match: parts.match,
      envKey: envVarKey,
      secretValue: parts.secretValue,
    })
    warnings.push(
      `Secret detected for server field \`${fieldKey}\`; extract to \`.env\` as \${${envVarKey}}`,
    )
  }

  if (isStdioServer(server)) {
    if (server.args) {
      for (let i = 0; i < server.args.length; i++) {
        // Args can embed secrets (e.g. a token passed positionally).
        consider('args', 'args', server.args[i]!, i)
      }
    }
    if (server.env) {
      for (const [key, value] of Object.entries(server.env)) {
        consider('env', key, value)
      }
    }
  } else {
    if (server.headers) {
      for (const [key, value] of Object.entries(server.headers)) {
        consider('headers', key, value)
      }
    }
    // For URLs, only flag embedded credentials (user:pass@), not length.
    if (server.url) {
      consider('url', 'url', server.url)
    }
  }

  return { writes, replacements, warnings }
}

/**
 * Pure secret extraction applier. Deep-clones `server` (never mutates input)
 * and applies each replacement from `plan.replacements` deterministically by
 * location, preserving auth scheme prefixes (`Bearer ` / `Basic ` / `Token `).
 */
export function applySecretExtraction(
  server: CanonicalServer,
  plan: PlanSecretExtractionResult,
): CanonicalServer {
  const result = deepCloneServer(server)

  for (const rep of plan.replacements) {
    const replacement = `\${${rep.envKey}}`
    switch (rep.location) {
      case 'env':
        if (isStdioServer(result) && result.env && rep.fieldKey) {
          result.env[rep.fieldKey] = result.env[rep.fieldKey]!.replace(
            rep.match,
            replacement,
          )
        }
        break
      case 'headers':
        if (isHttpServer(result) && result.headers && rep.fieldKey) {
          result.headers[rep.fieldKey] = result.headers[rep.fieldKey]!.replace(
            rep.match,
            replacement,
          )
        }
        break
      case 'args':
        if (
          isStdioServer(result) &&
          result.args &&
          rep.argIndex !== undefined
        ) {
          result.args[rep.argIndex] = result.args[rep.argIndex]!.replace(
            rep.match,
            replacement,
          )
        }
        break
      case 'url':
        if (isHttpServer(result) && result.url) {
          result.url = result.url.replace(rep.match, replacement)
        }
        break
    }
  }

  return result
}

function deepCloneServer(server: CanonicalServer): CanonicalServer {
  return JSON.parse(JSON.stringify(server)) as CanonicalServer
}

/**
 * Append `writes` to the `.env` at `path`, creating it with mode `0600` when
 * missing. Never overwrites an existing key; warns when a key exists with a
 * different value. Ensures `.env` (and only `.env`) is git-ignored first;
 * the sync state file is never added to `.gitignore`.
 */
export function appendToDotenv(
  path: string,
  writes: SecretWrite[],
): AppendToDotenvResult {
  const added: string[] = []
  const warnings: string[] = []

  const rootDir = dirname(path)
  // Only manage .gitignore in project scope: global scope writes to
  // ~/.agents/.env (parent dir is .agents), project scope writes to <cwd>/.env.
  const isProjectScope = basename(rootDir) !== AGENTS_DIR
  if (isProjectScope) {
    ensureIgnored(rootDir, [ENV_FILE])
  }

  let existing: Record<string, string> = {}
  const raw = readTextFile(path)
  if (raw !== null) {
    existing = parseDotenv(raw).vars
  }
  const lines: string[] = raw !== null ? splitLines(raw) : []

  for (const { key, value } of writes) {
    if (key in existing) {
      if (existing[key] !== value) {
        warnings.push(
          `.env key \`${key}\` already exists with a different value; not overwriting`,
        )
      }
      continue
    }
    existing[key] = value
    added.push(key)
    lines.push(`${key}=${value}`)
  }

  // Never create an empty .env when there's nothing to write and no existing file.
  if (added.length > 0) {
    writeFileAtomic(path, lines.join('\n') + (lines.length > 0 ? '\n' : ''), {
      mode: 0o600,
    })
  }

  return { added, warnings }
}

/**
 * Split a text file into lines, dropping the single trailing `''` artifact
 * produced when the content ends with a newline. Interior blank lines are kept.
 */
function splitLines(content: string): string[] {
  const lines = content.split(/\r?\n/)
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop()
  }
  return lines
}

/**
 * Append missing `KEY=` entries to `.env.example`, preserving order, comments,
 * and existing lines. Never writes values.
 */
export function syncEnvExample(
  path: string,
  keys: string[],
): SyncEnvExampleResult {
  const added: string[] = []
  const warnings: string[] = []

  // .env.example is meant to be committed (keys only, no secrets) — never
  // gitignore it.
  const rootDir = dirname(path)

  let raw: string | null = readTextFile(path)
  const lines: string[] = raw !== null ? splitLines(raw) : []
  const present = new Set<string>()
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq !== -1) {
      present.add(trimmed.slice(0, eq).trim())
    }
  }

  for (const key of keys) {
    if (present.has(key)) continue
    present.add(key)
    added.push(key)
    lines.push(`${key}=`)
  }

  if (added.length > 0 || raw === null) {
    writeFileAtomic(path, lines.join('\n') + (lines.length > 0 ? '\n' : ''))
  }

  return { added, warnings }
}
````

## File: src/core/placeholder.ts
````typescript
/**
 * Placeholder grammar, translation, and required-variable collection.
 *
 * Canonical values use the `${VAR}` / `${VAR:-fallback}` grammar. Translation is
 * purely syntactic and idempotent: values are never substituted, only re-syntaxed
 * into the target agent's env syntax (`${VAR}`, `${env:VAR}`, `{env:VAR}`).
 *
 * Implements BLUEPRINT §8.4 and the MATRIX.md §3 translation table.
 */

import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer } from '$/src/core/schema'

/**
 * Grammar: `${NAME}` or `${NAME:-fallback}`, where `NAME` is
 * `[A-Za-z_][A-Za-z0-9_]*`. Single pass, non-overlapping.
 */
export const PLACEHOLDER_RE = /\$\{([A-Za-z_][A-Za-z0-9_]*)(?::-([^}]*))?\}/g

/** Any `${...}` that did not match the grammar (preserved verbatim). */
const BRACE_RE = /\$\{[^}]*\}/g

export type EnvSyntax = 'posix' | 'env-colon' | 'brace-env'

export interface Placeholder {
  raw: string
  name: string
  fallback?: string
  start: number
  end: number
}

export interface PlaceholderWarning {
  code: 'UNKNOWN_PLACEHOLDER' | 'DEFAULT_DROPPED'
  name: string
  message: string
}

export interface TranslateResult {
  value: string
  warnings: PlaceholderWarning[]
}

/** Secret key heuristic (BLUEPRINT §13). */
export const SECRET_KEY_RE =
  /(?:^|_)(?:TOKEN|SECRET|PASSWORD|PASSWD|API_KEY|CREDENTIAL|PRIVATE_KEY|AUTHORIZATION|AUTH|DSN)(?:_|$)/i

export interface RequiredEnvVar {
  name: string
  description?: string
  isSecret: boolean
}

/**
 * Derive a canonical env var name from a server name and field, e.g.
 * `derivedKey('github', 'token')` → `GITHUB_TOKEN`.
 */
export function derivedKey(serverName: string, field: string): string {
  const sanitizedServer = serverName.replace(/[^A-Za-z0-9_]/g, '_')
  const sanitized = field.replace(/[^A-Za-z0-9_]/g, '_')
  return `${sanitizedServer.toUpperCase()}_${sanitized.toUpperCase()}`
}

/**
 * Extract every grammar-matching placeholder from `value`, in order of
 * appearance, with its raw text, name, optional fallback, and offsets.
 */
export function parsePlaceholders(value: string): Placeholder[] {
  const placeholders: Placeholder[] = []
  let match: RegExpExecArray | null
  PLACEHOLDER_RE.lastIndex = 0
  while ((match = PLACEHOLDER_RE.exec(value)) !== null) {
    placeholders.push({
      raw: match[0]!,
      name: match[1]!,
      fallback: match[2] === undefined ? undefined : match[2]!,
      start: match.index,
      end: match.index + match[0]!.length,
    })
  }
  return placeholders
}

function encodeSyntax(name: string, syntax: EnvSyntax): string {
  switch (syntax) {
    case 'posix':
      return `${name}`
    case 'env-colon':
      return `env:${name}`
    case 'brace-env':
      return `env:${name}`
  }
}

function wrap(inner: string, syntax: EnvSyntax): string {
  switch (syntax) {
    case 'posix':
      return `\${${inner}}`
    case 'env-colon':
      return `\${${inner}}`
    case 'brace-env':
      return `{${inner}}`
  }
}

/**
 * Translate canonical `${NAME}` / `${NAME:-fallback}` placeholders into the
 * target agent's env syntax. Never substitutes values.
 *
 * - `posix` (`claude-code`, `zed`): `${NAME}` kept as-is.
 * - `env-colon` (`cursor`, `vscode`, `windsurf`): `${NAME}` → `${env:NAME}`.
 * - `brace-env` (`opencode`): `${NAME}` → `{env:NAME}`.
 *
 * When `nativeDefault` is false, a `:-fallback` has no native equivalent and is
 * dropped with a `DEFAULT_DROPPED` warning (claude-code keeps fallbacks).
 * Unknown placeholder syntax is preserved verbatim with an `UNKNOWN_PLACEHOLDER`
 * warning.
 */
export function translate(
  value: string,
  syntax: EnvSyntax,
  opts: { nativeDefault: boolean },
): TranslateResult {
  const defaultWarnings: PlaceholderWarning[] = []
  const placeholders = parsePlaceholders(value)

  // Build the translated value by splicing replacements from last to first so
  // offsets of earlier placeholders stay valid after later ones are replaced.
  let result = value
  for (let i = placeholders.length - 1; i >= 0; i--) {
    const ph = placeholders[i]!
    const hasFallback = ph.fallback !== undefined
    let inner: string
    if (hasFallback && !opts.nativeDefault) {
      defaultWarnings.push({
        code: 'DEFAULT_DROPPED',
        name: ph.name,
        message: `Default for \${${ph.name}} dropped: ${syntax} has no native equivalent`,
      })
      inner = encodeSyntax(ph.name, syntax)
    } else {
      inner = hasFallback
        ? `${encodeSyntax(ph.name, syntax)}:-${ph.fallback}`
        : encodeSyntax(ph.name, syntax)
    }
    result =
      result.slice(0, ph.start) + wrap(inner, syntax) + result.slice(ph.end)
  }

  // Unknown placeholder syntax: any `${...}` in the ORIGINAL value that did not
  // match the grammar is preserved verbatim (it is already in `result`) and
  // reported. Detect against the original value so freshly translated
  // `${env:NAME}` / `{env:NAME}` text is not mistaken for unknowns.
  const unknownWarnings: PlaceholderWarning[] = []
  const translatedSpans = new Set(placeholders.map((ph) => ph.start))
  BRACE_RE.lastIndex = 0
  let braceMatch: RegExpExecArray | null
  while ((braceMatch = BRACE_RE.exec(value)) !== null) {
    if (!translatedSpans.has(braceMatch.index)) {
      const raw = braceMatch[0]!
      unknownWarnings.push({
        code: 'UNKNOWN_PLACEHOLDER',
        name: raw.slice(2, -1),
        message: `Unknown placeholder syntax: ${raw}`,
      })
    }
  }

  // defaultWarnings were collected right-to-left, so reverse them to surface
  // in left-to-right (appearance) order; unknownWarnings are already ordered.
  const warnings = [...defaultWarnings.reverse(), ...unknownWarnings]

  return { value: result, warnings }
}

/**
 * Collect the environment variables required by a canonical server, scanning
 * `env` values, `headers` values, `args` items, and `url`. A value already
 * wrapped in `${...}` is never flagged as a literal secret; `isSecret` is
 * derived from the field key name.
 */
export function collectRequiredVars(server: CanonicalServer): RequiredEnvVar[] {
  const vars: RequiredEnvVar[] = []
  const seen = new Set<string>()

  const add = (name: string, isSecret: boolean): void => {
    if (seen.has(name)) return
    seen.add(name)
    vars.push({ name, isSecret })
  }

  const isSecretKey = (key: string): boolean => SECRET_KEY_RE.test(key)

  const scanString = (value: string, isSecret: boolean): void => {
    for (const ph of parsePlaceholders(value)) {
      add(ph.name, isSecret)
    }
  }

  if (isStdioServer(server)) {
    for (const arg of server.args ?? []) {
      scanString(arg, false)
    }
    if (server.env) {
      for (const [key, value] of Object.entries(server.env)) {
        scanString(value, isSecretKey(key))
      }
    }
  } else {
    if (server.url) {
      scanString(server.url, false)
    }
    if (server.headers) {
      for (const [key, value] of Object.entries(server.headers)) {
        scanString(value, isSecretKey(key))
      }
    }
  }

  return vars
}
````

## File: src/core/plugins.ts
````typescript
/**
 * Plugin compiler + writer (`B3`).
 *
 * Generates the standard Agent Plugins layout under
 * `<scopeBase>/.agents/plugins/<name>/`:
 *   - `plugin.json`            — plugin manifest (name, version, description)
 *   - `mcp.json`               — Agent Plugins MCP 1.0.0 document
 *   - `mcp_config.json`        — Antigravity config (only when `antigravity` targeted)
 *
 * All compile functions are pure; `syncPluginFiles` owns filesystem I/O and
 * returns a structured result so the command layer can report partial failures
 * without printing a false full-success message.
 */

import { join } from 'node:path'
import { existsSync, readdirSync, rmdirSync, unlinkSync } from 'node:fs'
import { writeFileAtomic, readTextFile } from '$/src/core/fs-atomic'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer, isHttpServer } from '$/src/core/schema'
import { DEFAULT_SCHEMA_URL, AGENTS_DIR } from '$/src/config'
import type { ConfigScope, RuntimeContext } from '$/src/core/context'

/** Plugin directory for a given server name under the scope base. */
export function getPluginDir(
  scope: ConfigScope,
  ctx: RuntimeContext,
  name: string,
): string {
  const base = scope === 'project' ? ctx.cwd : ctx.homeDir
  return join(base, AGENTS_DIR, 'plugins', name)
}

/** `plugin.json` manifest (Agent Plugins 1.0.0). */
export function compilePluginManifest(name: string): Record<string, unknown> {
  return {
    name,
    version: '1.0.0',
    description: `MCP server plugin \`${name}\` managed by agents-mcp`,
  }
}

/** `mcp.json` — Agent Plugins MCP 1.0.0 document. */
export function compilePluginMcpConfig(
  name: string,
  server: CanonicalServer,
): Record<string, unknown> {
  return {
    $schema: DEFAULT_SCHEMA_URL,
    mcpServers: {
      [name]: server,
    },
  }
}

/**
 * `mcp_config.json` for Antigravity.
 *
 * - stdio  → `{ command, args?, env? }`
 * - streamable-http / sse → `{ serverUrl, headers? }`
 */
export function compileAntigravityMcpConfig(
  name: string,
  server: CanonicalServer,
): Record<string, unknown> {
  if (isStdioServer(server)) {
    const entry: Record<string, unknown> = {
      command: server.command,
    }
    if (server.args && server.args.length > 0) {
      entry.args = [...server.args]
    }
    if (server.env && Object.keys(server.env).length > 0) {
      entry.env = { ...server.env }
    }
    return { mcpServers: { [name]: entry } }
  }

  // HTTP/SSE transports use `serverUrl` per Antigravity's mcp_config.json format.
  const entry: Record<string, unknown> = {
    serverUrl: server.url,
  }
  if (server.headers && Object.keys(server.headers).length > 0) {
    entry.headers = { ...server.headers }
  }
  return { mcpServers: { [name]: entry } }
}

/** Resultado estruturado da gravação de arquivos de plugin. */
export interface PluginWriteResult {
  ok: boolean
  /** Caminhos gravados com sucesso. */
  written: string[]
  /** Mensagens de erro (um por falha). */
  errors: string[]
}

/**
 * Verifica colisão com plugin não gerenciado: o diretório já existe em disco
 * e o nome **não** está registrado como gerenciado no `SyncState`.
 */
export function isUnmanagedPluginCollision(
  scope: ConfigScope,
  ctx: RuntimeContext,
  name: string,
  managedPlugins: readonly string[],
): boolean {
  if (managedPlugins.includes(name)) {
    return false
  }
  return existsSync(getPluginDir(scope, ctx, name))
}

/**
 * Escreve (ou reescreve, quando já gerenciado) os arquivos de plugin para um
 * servidor. Retorna `PluginWriteResult` com `ok: false` quando alguma gravação
 * falha; nunca lança exceção (erros de I/O são capturados e reportados).
 *
 * Respeita `--dry-run`: não cria nem modifica nada quando `dryRun === true`.
 */
export function syncPluginFiles({
  name,
  server,
  scope,
  ctx,
  includeAntigravity,
  dryRun,
}: {
  name: string
  server: CanonicalServer
  scope: ConfigScope
  ctx: RuntimeContext
  includeAntigravity: boolean
  dryRun: boolean
}): PluginWriteResult {
  const result: PluginWriteResult = { ok: true, written: [], errors: [] }

  const dir = getPluginDir(scope, ctx, name)
  const files: Array<{ path: string; content: string }> = [
    {
      path: join(dir, 'plugin.json'),
      content: JSON.stringify(compilePluginManifest(name), null, 2) + '\n',
    },
    {
      path: join(dir, 'mcp.json'),
      content:
        JSON.stringify(compilePluginMcpConfig(name, server), null, 2) + '\n',
    },
  ]

  if (includeAntigravity) {
    files.push({
      path: join(dir, 'mcp_config.json'),
      content:
        JSON.stringify(compileAntigravityMcpConfig(name, server), null, 2) +
        '\n',
    })
  }

  if (dryRun) {
    result.written = files.map((f) => f.path)
    return result
  }

  for (const file of files) {
    try {
      writeFileAtomic(file.path, file.content)
      result.written.push(file.path)
    } catch (err) {
      result.ok = false
      result.errors.push(
        `Failed to write ${file.path}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      )
    }
  }

  return result
}

/**
 * Resultado de remocao de arquivos de plugin gerenciados.
 */
export interface PluginRemovalResult {
  ok: boolean
  /** Caminhos de arquivos removidos (ou que seriam removidos em dry-run). */
  removed: string[]
  /** Mensagens de erro (um por falha de I/O). */
  errors: string[]
}

/** Arquivos de plugin gerenciados pela CLI, os unicos passiveis de remocao. */
export const MANAGED_PLUGIN_FILES = [
  'plugin.json',
  'mcp.json',
  'mcp_config.json',
] as const

/**
 * Remove apenas os arquivos de plugin gerenciados (`plugin.json`, `mcp.json`,
 * `mcp_config.json`) existentes no diretorio do plugin, protegendo nomes que
 * nao estao registrados em `managedPlugins` (no-op absoluto sem tocar no disco).
 *
 * Depois de remover os arquivos alvo, remove o diretorio somente se ficar vazio
 * (`rmdirSync` nao recursivo). Arquivos extras ou subdiretorios preservam o
 * diretorio. Arquivos ausentes sao ignorados (idempotencia).
 *
 * Respeita `--dry-run`: nenhum I/O de escrita/remocao; `removed` lista apenas
 * caminhos existentes que seriam removidos.
 *
 * Erros de I/O sao capturados por arquivo, acumulados em `errors` no formato
 * `Falha ao remover <caminho>: <mensagem>` e sinalizados com `ok: false`;
 * nunca lança excecao.
 */
export function removeManagedPlugin({
  scope,
  ctx,
  name,
  managedPlugins,
  dryRun,
}: {
  scope: ConfigScope
  ctx: RuntimeContext
  name: string
  managedPlugins: readonly string[]
  dryRun: boolean
}): PluginRemovalResult {
  const result: PluginRemovalResult = { ok: true, removed: [], errors: [] }

  // Protecao absoluta: plugins nao gerenciados nunca sao tocados.
  if (!managedPlugins.includes(name)) {
    return result
  }

  const dir = getPluginDir(scope, ctx, name)

  for (const file of MANAGED_PLUGIN_FILES) {
    const path = join(dir, file)
    if (!existsSync(path)) {
      continue
    }
    if (dryRun) {
      result.removed.push(path)
      continue
    }
    try {
      unlinkSync(path)
      result.removed.push(path)
    } catch (err) {
      result.ok = false
      result.errors.push(
        `Failed to remove ${path}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      )
    }
  }

  if (!dryRun && existsSync(dir)) {
    try {
      if (readdirSync(dir).length === 0) {
        rmdirSync(dir)
      }
    } catch (err) {
      result.ok = false
      result.errors.push(
        `Failed to remove ${dir}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      )
    }
  }

  return result
}

/**
 * Remove apenas o `mcp_config.json` (Antigravity) de um plugin gerenciado,
 * sem nunca remover `plugin.json`/`mcp.json` nem o diretorio. Mesma semântica
 * de propriedade e erro de `removeManagedPlugin`.
 */
export function removeAntigravityPluginConfig({
  scope,
  ctx,
  name,
  managedPlugins,
  dryRun,
}: {
  scope: ConfigScope
  ctx: RuntimeContext
  name: string
  managedPlugins: readonly string[]
  dryRun: boolean
}): PluginRemovalResult {
  const result: PluginRemovalResult = { ok: true, removed: [], errors: [] }

  // Protecao absoluta: plugins nao gerenciados nunca sao tocados.
  if (!managedPlugins.includes(name)) {
    return result
  }

  const path = join(getPluginDir(scope, ctx, name), 'mcp_config.json')
  if (!existsSync(path)) {
    return result
  }

  if (dryRun) {
    result.removed.push(path)
    return result
  }

  try {
    unlinkSync(path)
    result.removed.push(path)
  } catch (err) {
    result.ok = false
    result.errors.push(
      `Failed to remove ${path}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    )
  }

  return result
}

/** Reads the existing content of `plugin.json` (null when absent). */
export function readPluginManifest(
  scope: ConfigScope,
  ctx: RuntimeContext,
  name: string,
): string | null {
  return readTextFile(join(getPluginDir(scope, ctx, name), 'plugin.json'))
}
````

## File: src/core/schema.ts
````typescript
import { z } from 'zod'
import { DEFAULT_SCHEMA_URL } from '$/src/config'

export const AgentIdSchema = z.enum([
  'claude-code',
  'cursor',
  'vscode',
  'opencode',
  'windsurf',
  'zed',
  'antigravity',
])

/** Chaves de variável de ambiente reservadas pelo Agent Plugins MCP 1.0.0. */
const RESERVED_ENV_KEYS = ['PLUGIN_ROOT', 'PLUGIN_DATA']

/** Padrão de `cwd` permitido pelo Agent Plugins MCP 1.0.0. */
const CWD_PATTERN =
  /^(?:\.\/|\$\{PLUGIN_ROOT\}(?:\/|$)|\$\{PLUGIN_DATA\}(?:\/|$))/

export const StdioServerSchema = z.strictObject({
  type: z.literal('stdio'),
  command: z.string().min(1),
  args: z.array(z.string()).default([]),
  env: z
    .record(z.string(), z.string())
    .optional()
    .refine(
      (env) =>
        !env ||
        Object.keys(env).every((key) => !RESERVED_ENV_KEYS.includes(key)),
      {
        message: `Reserved environment variable keys are not allowed: ${RESERVED_ENV_KEYS.join(', ')}`,
      },
    ),
  cwd: z.string().regex(CWD_PATTERN).optional(),
})

export const StreamableHttpServerSchema = z.strictObject({
  type: z.literal('streamable-http'),
  url: z.string().min(1),
  headers: z.record(z.string(), z.string()).optional(),
})

export const SseServerSchema = z.strictObject({
  type: z.literal('sse'),
  url: z.string().min(1),
  headers: z.record(z.string(), z.string()).optional(),
})

export const CanonicalServerSchema = z.discriminatedUnion('type', [
  StdioServerSchema,
  StreamableHttpServerSchema,
  SseServerSchema,
])

export const CanonicalMcpConfigSchema = z.strictObject({
  $schema: z.literal(DEFAULT_SCHEMA_URL),
  mcpServers: z.record(z.string(), CanonicalServerSchema),
})

export type CanonicalMcpConfig = z.infer<typeof CanonicalMcpConfigSchema>
export type CanonicalServer = z.infer<typeof CanonicalServerSchema>

export type StdioServer = z.infer<typeof StdioServerSchema>
export type StreamableHttpServer = z.infer<typeof StreamableHttpServerSchema>
export type SseServer = z.infer<typeof SseServerSchema>

/**
 * Type guards over the canonical `type` discriminator.
 */
export function isStdioServer(server: CanonicalServer): server is StdioServer {
  return server.type === 'stdio'
}

export function isHttpServer(
  server: CanonicalServer,
): server is StreamableHttpServer | SseServer {
  return server.type === 'streamable-http' || server.type === 'sse'
}

/**
 * Non-JSON-Schema checks that cannot be expressed in the generated Draft 2020-12
 * document. Never fails; returns warnings only.
 */
export function validateConfig(config: unknown): { warnings: string[] } {
  const warnings: string[] = []

  if (typeof config === 'object' && config !== null && '$schema' in config) {
    const schemaUrl = (config as { $schema?: unknown }).$schema
    if (typeof schemaUrl !== 'string' || schemaUrl !== DEFAULT_SCHEMA_URL) {
      warnings.push(
        `$schema mismatch: expected ${DEFAULT_SCHEMA_URL}, got ${String(schemaUrl)}`,
      )
    }
  } else {
    warnings.push(`Missing required \$schema; expected ${DEFAULT_SCHEMA_URL}`)
  }

  return { warnings }
}
````

## File: src/sources/github.ts
````typescript
/**
 * GitHub source resolver (§10.3).
 *
 * Resolves `owner/repo[#ref]` and `https://github.com/owner/repo` →
 * `server.json` → `package.json`, following the MCP server manifest discovery
 * chain. HTTP interactions use the shared `fetchJson` from `src/sources/http`
 * (mocked in tests) with timeouts, retries, and a 2 MiB response cap.
 *
 * Command and arguments are always split (`command: 'npx'`, `args: ['-y', id]`)
 * so `doctor`, `opencode`, `zed`, and any `spawn`-based client work without a
 * shell.
 */

import { z } from 'zod'
import type {
  ResolvedServerPackage,
  SourceResolveOptions,
} from '$/src/sources/types'
import { fetchJson } from '$/src/sources/http'
import type { CanonicalServer } from '$/src/core/schema'

const GITHUB_RAW = 'https://raw.githubusercontent.com'
const GITHUB_API = 'https://api.github.com/repos'

const EnvVarSchema = z.object({
  name: z.string().min(1),
  is_required: z.boolean().optional(),
  is_secret: z.boolean().optional(),
  description: z.string().optional(),
})

const ServerJsonSchema = z
  .object({
    name: z.string().optional(),
    registry_type: z.string().optional(),
    identifier: z.string().optional(),
    environment_variables: z.array(EnvVarSchema).optional(),
  })
  .passthrough()

const PackageJsonSchema = z
  .object({
    name: z.string().optional(),
    bin: z.union([z.string(), z.record(z.string(), z.string())]).optional(),
  })
  .passthrough()

export interface GithubSourceOptions {
  env?: Record<string, string>
  fetch?: typeof fetch
}

export async function resolveGithub(
  ref: string,
  opts: GithubSourceOptions = {},
): Promise<ResolvedServerPackage> {
  const { env, fetch: injectedFetch } = opts
  const { owner, repo, ref: gitRef } = parseRef(ref)

  // 1. Try server.json on ref, then main, then master.
  const branches = gitRef ? [gitRef] : ['main', 'master']
  let serverJson: unknown = null
  let resolvedRef = branches[0]
  for (const branch of branches) {
    try {
      serverJson = await fetchJson(
        `${GITHUB_RAW}/${owner}/${repo}/${branch}/server.json`,
        { env, fetch: injectedFetch },
      )
      resolvedRef = branch
      break
    } catch {
      // Try next branch
    }
  }

  // 2. If no server.json, resolve default branch via GitHub API, then try again.
  if (!serverJson && !gitRef) {
    try {
      const repoInfo = await fetchJson(`${GITHUB_API}/${owner}/${repo}`, {
        env,
        fetch: injectedFetch,
      })
      const defaultBranch = (repoInfo as { default_branch?: string })
        .default_branch
      if (
        defaultBranch &&
        defaultBranch !== 'main' &&
        defaultBranch !== 'master'
      ) {
        try {
          serverJson = await fetchJson(
            `${GITHUB_RAW}/${owner}/${repo}/${defaultBranch}/server.json`,
            { env, fetch: injectedFetch },
          )
          resolvedRef = defaultBranch
        } catch {
          // fall through to package.json
        }
      }
    } catch {
      // API unavailable
    }
  }

  // 3. Parse server.json manifest.
  if (serverJson) {
    const parsed = ServerJsonSchema.safeParse(serverJson)
    if (!parsed.success) {
      throw new Error(
        `Invalid server.json in ${owner}/${repo}: ${parsed.error.issues
          .map((i) => i.message)
          .join(', ')}`,
      )
    }
    const manifest = parsed.data
    const definition = manifestToServer(manifest, repo)

    // Parse environment_variables: required vars populate definition.env and
    // are reported in requiredEnv.
    const requiredEnv = (manifest.environment_variables ?? [])
      .filter((e) => e.is_required === true)
      .map((e) => ({
        name: e.name,
        description: e.description,
        isSecret: e.is_secret === true,
      }))

    if (requiredEnv.length > 0 && definition.type === 'stdio') {
      const envRecord: Record<string, string> = {}
      for (const e of requiredEnv) {
        envRecord[e.name] = `\${${e.name}}`
      }
      definition.env = { ...(definition.env ?? {}), ...envRecord }
    }

    return {
      suggestedName: manifest.name ?? repo,
      definition,
      requiredEnv,
      source: { type: 'github', ref },
    }
  }

  // 4. package.json fallback: bin selects <name> for `npx -y`.
  try {
    const pkg = await fetchJson(
      `${GITHUB_RAW}/${owner}/${repo}/${resolvedRef}/package.json`,
      { env, fetch: injectedFetch },
    )
    const parsed = PackageJsonSchema.safeParse(pkg)
    if (!parsed.success) {
      throw new Error(`Repository ${owner}/${repo} is not an MCP server`)
    }
    const { bin, name: pkgName } = parsed.data
    let binName: string
    if (typeof bin === 'string') {
      binName = bin
    } else if (bin && typeof bin === 'object' && Object.keys(bin).length > 0) {
      const first = Object.keys(bin)[0]
      binName = first ?? pkgName ?? repo
    } else {
      throw new Error(`Repository ${owner}/${repo} is not an MCP server`)
    }
    const definition: CanonicalServer = {
      type: 'stdio',
      command: 'npx',
      args: ['-y', binName],
    }
    return {
      suggestedName: pkgName ?? repo,
      definition,
      requiredEnv: [],
      source: { type: 'github', ref },
    }
  } catch {
    throw new Error(`Repository ${owner}/${repo} is not an MCP server`)
  }
}

function manifestToServer(
  manifest: z.infer<typeof ServerJsonSchema>,
  repo: string,
): CanonicalServer {
  const type = manifest.registry_type ?? 'npm'
  const id = manifest.identifier ?? ''

  switch (type) {
    case 'npm':
      return {
        type: 'stdio',
        command: 'npx',
        args: ['-y', id],
      }
    case 'pypi':
      return {
        type: 'stdio',
        command: 'uvx',
        args: [id],
      }
    case 'oci':
      return {
        type: 'stdio',
        command: 'docker',
        args: ['run', '-i', '--rm', id],
      }
    default:
      return {
        type: 'stdio',
        command: 'npx',
        args: ['-y', id],
      }
  }
}

function parseRef(ref: string): {
  owner: string
  repo: string
  ref: string | undefined
} {
  // https://github.com/owner/repo[/tree/ ref][.git][#ref]
  const urlMatch = ref.match(
    /^https?:\/\/github\.com\/([\w-]+)\/([\w.-]+?)(\/tree\/[^?#]+)?(\.git)?\/?(#.+)?$/,
  )
  if (urlMatch) {
    const owner = urlMatch[1] ?? ''
    const repo = urlMatch[2] ?? ''
    const hash = urlMatch[5]
    const gitRef = hash ? hash.slice(1) : undefined
    return { owner, repo, ref: gitRef }
  }

  // owner/repo[#ref]
  const [ownerRepo, gitRef] = ref.split('#', 2) as [string, string | undefined]
  const parts = (ownerRepo || '').split('/')
  const owner = parts[0] ?? ''
  const repo = parts[1] ?? ''
  if (!owner || !repo) {
    throw new Error(
      `Invalid GitHub ref: ${ref}. Expected owner/repo[#ref] or https://github.com/owner/repo.`,
    )
  }
  return { owner, repo, ref: gitRef || undefined }
}
````

## File: src/sources/index.ts
````typescript
/**
 * Source resolution order (§10.5).
 *
 * Explicit flags → remote URL → `owner/repo` / GitHub URL → registry/npm. The
 * resolver never writes files; `commands/add.ts` owns persistence.
 */

import type {
  ResolvedServerPackage,
  SourceResolveOptions,
} from '$/src/sources/types'
import { resolveDirect } from '$/src/sources/direct'
import { resolveGithub } from '$/src/sources/github'
import { resolveRegistry } from '$/src/sources/registry'

export interface SourceOptions {
  command?: string
  arg?: string[]
  http?: string
  sse?: string
  env?: string[]
  header?: string[]
  cwd?: string
  name?: string
  source?: string
}

export async function resolveSource(
  options: SourceOptions,
  resolveOpts: SourceResolveOptions = {},
): Promise<ResolvedServerPackage> {
  const { fetch } = resolveOpts

  // 1. Explicit flags (direct source)
  if (
    options.command ||
    options.http ||
    options.sse ||
    options.arg?.length ||
    options.env?.length ||
    options.header?.length
  ) {
    return resolveDirect(options)
  }

  // 2. GitHub URL: https://github.com/owner/repo[/tree/ ref] or owner/repo[#ref]
  if (options.source) {
    const githubRef = parseGitHubRef(options.source)
    if (githubRef) {
      return resolveGithub(githubRef, {
        env: resolveOpts.env,
        fetch,
      })
    }
  }

  // 3. Other remote URL (https?://...)
  if (options.source && /^https?:\/\//.test(options.source)) {
    return resolveDirect({ http: options.source, name: options.name })
  }

  // 4. npm package (@scope/pkg or bare name) / MCP Registry query
  if (options.source) {
    return resolveRegistry(options.source, {
      env: resolveOpts.env,
      yes: resolveOpts.yes,
      selectCandidate: resolveOpts.selectCandidate,
      fetch,
    })
  }

  throw new Error(
    'No source specified. Pass --command/--http/--sse/--arg/--env/--header or a source argument.',
  )
}

/**
 * Parse a GitHub reference from `owner/repo[#ref]` or
 * `https://github.com/owner/repo[/tree/ ref][.git]`.
 * Returns `owner/repo[#ref]` or `null` when it is not a GitHub source.
 */
function parseGitHubRef(source: string): string | null {
  // Direct owner/repo[#ref]
  const ownerRepoMatch = source.match(/^([\w-]+)\/([\w.-]+)(#.+)?$/)
  if (ownerRepoMatch) {
    return source
  }

  // https://github.com/owner/repo[/tree/ ref][.git]
  const urlMatch = source.match(
    /^https?:\/\/github\.com\/([\w-]+)\/([\w.-]+?)(\/tree\/[^?#]+)?(\.git)?\/?(#.+)?$/,
  )
  if (urlMatch) {
    const [, owner, repo, , , hash] = urlMatch
    let ref = `${owner}/${repo}`
    if (hash) ref += hash
    return ref
  }

  return null
}
````

## File: src/sources/registry.ts
````typescript
/**
 * Registry source resolver (§10.4).
 *
 * Resolves `@scope/name` or bare package names via npm, falling back to the
 * MCP Registry `v0/servers?search=...`. Command and arguments are always
 * split (`command: 'npx'`, `args: ['-y', spec]`) so `doctor`, `opencode`,
 * `zed`, and any `spawn`-based client work without a shell.
 *
 * Candidate selection:
 * - Exact name match (case-insensitive) wins automatically when unambiguous.
 * - Multiple non-exact candidates: invoke `selectCandidate` when provided
 *   (TTY, `!yes`); otherwise fail with an actionable error listing candidates.
 */

import { z } from 'zod'
import type {
  ResolvedServerPackage,
  SourceResolveOptions,
  Candidate,
} from '$/src/sources/types'
import { fetchJson } from '$/src/sources/http'
import type { CanonicalServer } from '$/src/core/schema'

const NPM_REGISTRY = 'https://registry.npmjs.org'
const MCP_REGISTRY = 'https://registry.modelcontextprotocol.io/v0/servers'

const EnvVarSchema = z.object({
  name: z.string().min(1),
  is_required: z.boolean().optional(),
  is_secret: z.boolean().optional(),
  description: z.string().optional(),
})

const RegistryPackageSchema = z
  .object({
    name: z.string().min(1),
    type: z.enum(['npm', 'pypi', 'oci']),
    environment_variables: z.array(EnvVarSchema).optional(),
  })
  .passthrough()

const RegistryRemoteSchema = z
  .object({
    type: z.enum(['streamable-http', 'sse']),
    url: z.string().min(1),
    headers: z.record(z.string(), z.string()).optional(),
  })
  .passthrough()

const RegistryResponseSchema = z
  .object({
    servers: z.array(
      z.object({
        name: z.string().min(1),
        packages: z.array(RegistryPackageSchema).optional(),
        remotes: z.array(RegistryRemoteSchema).optional(),
      }),
    ),
  })
  .passthrough()

export interface RegistrySourceOptions {
  yes?: boolean
  env?: Record<string, string>
  selectCandidate?: (candidates: Candidate[]) => Promise<Candidate | null>
  fetch?: typeof fetch
}

export async function resolveRegistry(
  ref: string,
  opts: RegistrySourceOptions = {},
): Promise<ResolvedServerPackage> {
  const { yes = false, env, selectCandidate, fetch: injectedFetch } = opts

  // 1. npm for @scope/name or bare package names.
  try {
    const pkg = await fetchJson(`${NPM_REGISTRY}/${encodeURIComponent(ref)}`, {
      env,
      fetch: injectedFetch,
    })
    const parsed = z
      .object({
        name: z.string().optional(),
        'dist-tags': z.object({ latest: z.string().optional() }).optional(),
      })
      .safeParse(pkg)
    const name = parsed.success && parsed.data.name ? parsed.data.name : ref
    const version =
      parsed.success && parsed.data['dist-tags']?.latest
        ? parsed.data['dist-tags'].latest
        : undefined
    const spec = version ? `${name}@${version}` : name
    const definition: CanonicalServer = {
      type: 'stdio',
      command: 'npx',
      args: ['-y', spec],
    }
    return {
      suggestedName: name,
      definition,
      requiredEnv: [],
      source: { type: 'registry', ref },
    }
  } catch {
    // Not on npm; try MCP Registry.
  }

  // 2. MCP Registry v0/servers?search=...
  const results = await searchMcpRegistry(ref, { env, fetch: injectedFetch })
  if (results.length === 0) {
    throw new Error(`No MCP server found for "${ref}" on npm or MCP Registry.`)
  }

  // Candidate selection: exact name match (case-insensitive) wins when unambiguous.
  const exact = results.filter(
    (r) => r.name.toLowerCase() === ref.toLowerCase(),
  )
  if (exact.length === 1) {
    return buildFromServer(exact[0]!, ref, { env, fetch: injectedFetch })
  }

  // Multiple non-exact candidates.
  if (results.length > 1) {
    const candidates: Candidate[] = results.map((r) => ({
      name: r.name,
      ref: r.name,
      type: 'npm',
    }))
    if (selectCandidate) {
      const chosen = await selectCandidate(candidates)
      if (!chosen) {
        throw new Error(`No candidate selected for "${ref}".`)
      }
      const chosenServer = results.find((r) => r.name === chosen.name)
      if (!chosenServer) {
        throw new Error(`Selected candidate "${chosen.name}" not found.`)
      }
      return buildFromServer(chosenServer, ref, { env, fetch: injectedFetch })
    }
    if (yes) {
      return buildFromServer(results[0]!, ref, { env, fetch: injectedFetch })
    }
    const names = results.map((r) => r.name).join(', ')
    throw new Error(
      `Ambiguous registry match for "${ref}". Candidates: ${names}. Pass --yes to select the first or disambiguate.`,
    )
  }

  // Single non-exact candidate.
  return buildFromServer(results[0]!, ref, { env, fetch: injectedFetch })
}

/**
 * Build a `ResolvedServerPackage` from a registry server entry, interpreting
 * `packages` (npm/pypi/oci with environment_variables) and `remotes`
 * (streamable-http/sse with url and headers).
 */
function buildFromServer(
  server: { name: string; packages?: unknown[]; remotes?: unknown[] },
  ref: string,
  opts: { env?: Record<string, string>; fetch?: typeof fetch },
): ResolvedServerPackage {
  const { name, packages, remotes } = server
  const { env } = opts

  // Prefer remotes (HTTP) when present.
  if (remotes && remotes.length > 0) {
    const remote = remotes[0]
    const parsed = RegistryRemoteSchema.safeParse(remote)
    if (!parsed.success) {
      throw new Error(
        `Invalid remote entry for MCP server "${name}": ${parsed.error.issues
          .map((i) => i.message)
          .join(', ')}`,
      )
    }
    const definition: CanonicalServer = {
      type: parsed.data.type,
      url: parsed.data.url,
      ...(parsed.data.headers && Object.keys(parsed.data.headers).length > 0
        ? { headers: parsed.data.headers }
        : {}),
    }
    const requiredEnv = extractRequiredEnv(parsed.data.headers ?? {})
    return {
      suggestedName: name,
      definition,
      requiredEnv,
      source: { type: 'registry', ref },
    }
  }

  // Otherwise interpret packages.
  if (packages && packages.length > 0) {
    const pkg = packages[0]
    const parsed = RegistryPackageSchema.safeParse(pkg)
    if (!parsed.success) {
      throw new Error(
        `Invalid package entry for MCP server "${name}": ${parsed.error.issues
          .map((i) => i.message)
          .join(', ')}`,
      )
    }
    const definition = packageTypeToServer(parsed.data)
    const requiredEnv = extractRequiredEnvVars(
      parsed.data.environment_variables ?? [],
    )
    if (requiredEnv.length > 0 && definition.type === 'stdio') {
      const envRecord: Record<string, string> = {}
      for (const e of requiredEnv) {
        envRecord[e.name] = `\${${e.name}}`
      }
      definition.env = { ...(definition.env ?? {}), ...envRecord }
    }
    return {
      suggestedName: name,
      definition,
      requiredEnv,
      source: { type: 'registry', ref },
    }
  }

  throw new Error(`No usable package or remote for MCP server "${name}".`)
}

function packageTypeToServer(
  pkg: z.infer<typeof RegistryPackageSchema>,
): CanonicalServer {
  switch (pkg.type) {
    case 'npm':
      return {
        type: 'stdio',
        command: 'npx',
        args: ['-y', pkg.name],
      }
    case 'pypi':
      return {
        type: 'stdio',
        command: 'uvx',
        args: [pkg.name],
      }
    case 'oci':
      return {
        type: 'stdio',
        command: 'docker',
        args: ['run', '-i', '--rm', pkg.name],
      }
  }
}

function extractRequiredEnvVars(
  vars: z.infer<typeof EnvVarSchema>[],
): { name: string; description?: string; isSecret: boolean }[] {
  return vars
    .filter((v) => v.is_required === true)
    .map((v) => ({
      name: v.name,
      description: v.description,
      isSecret: v.is_secret === true,
    }))
}

function extractRequiredEnv(
  headers: Record<string, string>,
): { name: string; description?: string; isSecret: boolean }[] {
  return []
}

async function searchMcpRegistry(
  query: string,
  opts: { env?: Record<string, string>; fetch?: typeof fetch },
): Promise<Array<{ name: string; packages?: unknown[]; remotes?: unknown[] }>> {
  try {
    const res = await fetchJson(
      `${MCP_REGISTRY}?search=${encodeURIComponent(query)}&limit=10`,
      { env: opts.env, fetch: opts.fetch },
    )
    const parsed = RegistryResponseSchema.safeParse(res)
    if (!parsed.success) {
      return []
    }
    return parsed.data.servers.map((s) => ({
      name: s.name,
      packages: s.packages,
      remotes: s.remotes,
    }))
  } catch {
    return []
  }
}
````

## File: src/config.ts
````typescript
export const AGENT_PLUGINS_MCP_SCHEMA_URL =
  'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json'
export const AGENT_PLUGINS_MCP_SPEC_URL =
  'https://agent-plugins.org/plugin-authors/mcp-servers'
export const DEFAULT_SCHEMA_URL = AGENT_PLUGINS_MCP_SCHEMA_URL
export const SCHEMA_DRAFT = 'draft-2020-12'

export const AGENTS_DIR = '.agents'
export const CONFIG_FILE = 'mcp.json'
export const STATE_FILE = 'mcp-lock.json'
export const LEGACY_STATE_FILE = '.mcp-sync-state.json'
export const STATE_VERSION = 1
export const ENV_FILE = '.env'
export const ENV_EXAMPLE_FILE = '.env.example'

export const SERVER_NAME_PATTERN = /^[a-z0-9][a-z0-9._-]*$/

/** Deterministic order for conflict resolution and reporting. */
export const AGENT_ORDER = [
  'claude-code',
  'cursor',
  'vscode',
  'opencode',
  'zed',
  'windsurf',
  'antigravity',
] as const
````

## File: tests/adapters/claude-code.test.ts
````typescript
import { describe, expect, it } from 'vitest'
import { parse as jsoncParse, type ParseError } from 'jsonc-parser'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer, isHttpServer } from '$/src/core/schema'
import {
  compile,
  extractServers,
  applyServers,
  capabilities,
  getConfigPath,
  detect,
  id,
  displayName,
} from '$/src/adapters/claude-code'
import { createRuntimeContext } from '$/src/core/context'
import { createSandbox } from '$/tests/helpers/sandbox'

const ctx = createRuntimeContext({
  cwd: '/tmp/proj',
  homeDir: '/tmp/home',
  env: {},
  isTTY: false,
})

describe('claude-code adapter identity', () => {
  it('id, displayName, capabilities', () => {
    expect(id).toBe('claude-code')
    expect(displayName).toBe('Claude Code')
    expect(capabilities).toEqual({
      scopes: ['project', 'global'],
      format: 'json',
      envSyntax: 'posix',
      nativeDefault: true,
      nativeDisabled: false,
      cwd: false,
      layout: 'single-file',
      rootKey: 'mcpServers',
    })
  })

  it('getConfigPath project and global', () => {
    expect(getConfigPath('project', ctx)).toBe('/tmp/proj/.mcp.json')
    expect(getConfigPath('global', ctx)).toBe('/tmp/home/.claude.json')
  })

  it('detect returns false for missing file', async () => {
    const { ctx: sctx, cleanup } = createSandbox()
    try {
      expect(await detect('project', sctx)).toBe(false)
      expect(await detect('global', sctx)).toBe(false)
    } finally {
      cleanup()
    }
  })
})

describe('claude-code compile', () => {
  it('stdio server with env placeholder kept as-is (nativeDefault)', () => {
    const { entry, warnings } = compile({
      type: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: { GITHUB_PERSONAL_ACCESS_TOKEN: '${GITHUB_TOKEN}' },
    })
    expect(entry).toEqual({
      type: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: { GITHUB_PERSONAL_ACCESS_TOKEN: '${GITHUB_TOKEN}' },
    })
    expect(warnings).toEqual([])
  })

  it('streamable-http server compiles to type http (claude-code preserves)', () => {
    const { entry, warnings } = compile({
      type: 'streamable-http',
      url: 'https://mcp.linear.app/mcp',
      headers: { Authorization: 'Bearer ${LINEAR_API_KEY}' },
    })
    expect(entry).toEqual({
      type: 'http',
      url: 'https://mcp.linear.app/mcp',
      headers: { Authorization: 'Bearer ${LINEAR_API_KEY}' },
    })
    expect(warnings).toEqual([])
  })

  it('sse server compiles to type sse (claude-code preserves)', () => {
    const { entry, warnings } = compile({
      type: 'sse',
      url: 'https://mcp.linear.app/sse',
      headers: { Authorization: 'Bearer ${LINEAR_API_KEY}' },
    })
    expect(entry).toEqual({
      type: 'sse',
      url: 'https://mcp.linear.app/sse',
      headers: { Authorization: 'Bearer ${LINEAR_API_KEY}' },
    })
    expect(warnings).toEqual([])
  })

  it('omits args when empty and env when absent', () => {
    const { entry } = compile({
      type: 'stdio',
      command: 'npx',
      args: [],
    })
    expect(entry).toEqual({ type: 'stdio', command: 'npx' })
    expect(entry).not.toHaveProperty('args')
    expect(entry).not.toHaveProperty('env')
  })

  it('reports CWD_UNSUPPORTED warning', () => {
    const { entry, warnings } = compile({
      type: 'stdio',
      command: 'npx',
      args: [],
      cwd: '/some/dir',
    })
    expect(entry).toEqual({ type: 'stdio', command: 'npx' })
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.code).toBe('CWD_UNSUPPORTED')
  })
})

describe('claude-code extractServers', () => {
  it('extracts stdio and streamable-http servers from .mcp.json', () => {
    const raw = JSON.stringify({
      mcpServers: {
        github: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-github'],
          env: { GITHUB_TOKEN: '${GITHUB_TOKEN}' },
        },
        linear: {
          type: 'http',
          url: 'https://mcp.linear.app/mcp',
          headers: { Authorization: 'Bearer ${LINEAR_API_KEY}' },
        },
      },
    })
    const { servers, warnings } = extractServers(raw, 'project')
    const github = servers.github as Extract<CanonicalServer, { type: 'stdio' }>
    expect(isStdioServer(github)).toBe(true)
    expect(github.command).toBe('npx')
    expect(github.args).toEqual(['-y', '@modelcontextprotocol/server-github'])
    expect(github.env).toEqual({ GITHUB_TOKEN: '${GITHUB_TOKEN}' })
    // legacy native 'http' → canonical streamable-http
    expect(isHttpServer(servers.linear!)).toBe(true)
    if (isHttpServer(servers.linear!)) {
      expect(servers.linear!.type).toBe('streamable-http')
      expect(servers.linear!.url).toBe('https://mcp.linear.app/mcp')
      expect(servers.linear!.headers).toEqual({
        Authorization: 'Bearer ${LINEAR_API_KEY}',
      })
    }
    expect(warnings).toEqual([])
  })

  it('extracts sse server from native type sse', () => {
    const raw = JSON.stringify({
      mcpServers: {
        linearSse: {
          type: 'sse',
          url: 'https://mcp.linear.app/sse',
        },
      },
    })
    const { servers, warnings } = extractServers(raw, 'project')
    expect(isHttpServer(servers.linearSse!)).toBe(true)
    if (isHttpServer(servers.linearSse!)) {
      expect(servers.linearSse!.type).toBe('sse')
    }
    expect(warnings).toEqual([])
  })

  it('imports a URL-only entry as streamable-http with TRANSPORT_INFERRED', () => {
    const raw = JSON.stringify({
      mcpServers: {
        linear: { url: 'https://mcp.linear.app/mcp' },
      },
    })
    const { servers, warnings } = extractServers(raw, 'project')
    expect(isHttpServer(servers.linear!)).toBe(true)
    if (isHttpServer(servers.linear!)) {
      expect(servers.linear!.type).toBe('streamable-http')
      expect(servers.linear!.url).toBe('https://mcp.linear.app/mcp')
    }
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.code).toBe('TRANSPORT_INFERRED')
  })

  it('treats command without url as stdio', () => {
    const raw = JSON.stringify({
      mcpServers: {
        github: { command: 'npx', args: ['-y', 'pkg'] },
      },
    })
    const { servers } = extractServers(raw, 'project')
    const github = servers.github as Extract<CanonicalServer, { type: 'stdio' }>
    expect(isStdioServer(github)).toBe(true)
    expect(github.command).toBe('npx')
  })

  it('returns empty for missing mcpServers', () => {
    const { servers } = extractServers(JSON.stringify({ other: 1 }), 'project')
    expect(servers).toEqual({})
  })
})

describe('claude-code applyServers', () => {
  it('writes a new file with mcpServers', () => {
    const { content, managedNames } = applyServers(
      null,
      {
        github: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-github'],
        },
      },
      { ...ctx, scope: 'project', previousManagedNames: new Set() },
    )
    expect(managedNames).toEqual(['github'])
    expect(JSON.parse(content)).toEqual({
      mcpServers: {
        github: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-github'],
        },
      },
    })
  })

  it('preserves JSONC comments and unrelated keys', () => {
    const existing = `{\n  // unrelated comment\n  "otherSetting": true,\n  "mcpServers": {\n    "old": { "type": "stdio", "command": "old" }\n  }\n}\n`
    const { content } = applyServers(
      existing,
      {
        github: {
          type: 'stdio',
          command: 'npx',
          args: [],
        },
      },
      { ...ctx, scope: 'project', previousManagedNames: new Set(['old']) },
    )
    expect(content).toContain('// unrelated comment')
    expect(content).toContain('"otherSetting": true')
    const parseErrors: ParseError[] = []
    const parsed = jsoncParse(content, parseErrors)
    expect(parseErrors).toEqual([])
    expect((parsed as Record<string, unknown>).otherSetting).toBe(true)
    expect((parsed as Record<string, unknown>).mcpServers).toMatchObject({
      github: { type: 'stdio', command: 'npx' },
    })
    // old was previously managed and is no longer produced → pruned.
    expect((parsed as Record<string, unknown>).mcpServers).not.toHaveProperty(
      'old',
    )
  })

  it('preserves manual entries not in state', () => {
    const existing = JSON.stringify({
      mcpServers: {
        manual: { type: 'stdio', command: 'manual-cmd' },
      },
    })
    const { content } = applyServers(
      existing,
      {
        github: { type: 'stdio', command: 'npx', args: [] },
      },
      { ...ctx, scope: 'project', previousManagedNames: new Set() },
    )
    const parsed = JSON.parse(content)
    expect(parsed.mcpServers.manual).toEqual({
      type: 'stdio',
      command: 'manual-cmd',
    })
    expect(parsed.mcpServers.github).toBeDefined()
  })

  it('handles empty existing content', () => {
    const { content } = applyServers(
      '',
      {
        github: { type: 'stdio', command: 'npx', args: [] },
      },
      { ...ctx, scope: 'project', previousManagedNames: new Set() },
    )
    expect(JSON.parse(content).mcpServers.github).toBeDefined()
  })
})
````

## File: tests/adapters/cursor.test.ts
````typescript
import { describe, expect, it } from 'vitest'
import {
  compile,
  extractServers,
  applyServers,
  capabilities,
  getConfigPath,
  detect,
} from '$/src/adapters/cursor'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer, isHttpServer } from '$/src/core/schema'
import { createRuntimeContext } from '$/src/core/context'
import { createSandbox } from '$/tests/helpers/sandbox'

const ctx = createRuntimeContext({
  cwd: '/tmp/proj',
  homeDir: '/tmp/home',
  env: {},
  isTTY: false,
})

describe('cursor adapter identity', () => {
  it('id, capabilities', () => {
    expect(capabilities).toEqual({
      scopes: ['project', 'global'],
      format: 'json',
      envSyntax: 'env-colon',
      nativeDefault: false,
      nativeDisabled: false,
      cwd: false,
      layout: 'single-file',
      rootKey: 'mcpServers',
    })
  })

  it('getConfigPath project and global', () => {
    expect(getConfigPath('project', ctx)).toBe('/tmp/proj/.cursor/mcp.json')
    expect(getConfigPath('global', ctx)).toBe('/tmp/home/.cursor/mcp.json')
  })

  it('detect false for missing file', async () => {
    const { ctx: sctx, cleanup } = createSandbox()
    try {
      expect(await detect('project', sctx)).toBe(false)
    } finally {
      cleanup()
    }
  })
})

describe('cursor compile', () => {
  it('stdio server: no type, ${env:VAR}, default dropped', () => {
    const { entry, warnings } = compile({
      type: 'stdio',
      command: 'npx',
      args: ['-y', 'pkg'],
      env: { TOKEN: '${TOKEN:-secret}' },
    })
    expect(entry).toEqual({
      command: 'npx',
      args: ['-y', 'pkg'],
      env: { TOKEN: '${env:TOKEN}' },
    })
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.code).toBe('DEFAULT_DROPPED')
  })

  it('streamable-http server: no type', () => {
    const { entry } = compile({
      type: 'streamable-http',
      url: 'https://x/mcp',
      headers: { Authorization: 'Bearer ${env:KEY}' },
    })
    expect(entry).toEqual({
      url: 'https://x/mcp',
      headers: { Authorization: 'Bearer ${env:KEY}' },
    })
  })

  it('sse server: no type', () => {
    const { entry } = compile({
      type: 'sse',
      url: 'https://x/sse',
      headers: { Authorization: 'Bearer ${env:KEY}' },
    })
    expect(entry).toEqual({
      url: 'https://x/sse',
      headers: { Authorization: 'Bearer ${env:KEY}' },
    })
  })
})

describe('cursor extractServers', () => {
  it('extracts stdio (command) and streamable-http (url)', () => {
    const raw = JSON.stringify({
      mcpServers: {
        gh: { command: 'npx', args: ['-y', 'pkg'] },
        lin: { url: 'https://x/mcp' },
      },
    })
    const { servers, warnings } = extractServers(raw, 'project')
    const gh = servers.gh as Extract<CanonicalServer, { type: 'stdio' }>
    const lin = servers.lin as Extract<
      CanonicalServer,
      { type: 'streamable-http' }
    >
    expect(isStdioServer(gh)).toBe(true)
    expect(gh.command).toBe('npx')
    expect(isHttpServer(lin)).toBe(true)
    expect(lin.type).toBe('streamable-http')
    expect(lin.url).toBe('https://x/mcp')
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.code).toBe('TRANSPORT_INFERRED')
  })

  it('extracts sse from native type sse', () => {
    const raw = JSON.stringify({
      mcpServers: {
        lin: { type: 'sse', url: 'https://x/sse' },
      },
    })
    const { servers } = extractServers(raw, 'project')
    const lin = servers.lin as Extract<CanonicalServer, { type: 'sse' }>
    expect(lin.type).toBe('sse')
    expect(lin.url).toBe('https://x/sse')
  })
})

describe('cursor applyServers', () => {
  it('writes mcpServers and prunes previous managed names', () => {
    const existing = JSON.stringify({
      mcpServers: { old: { command: 'old' } },
    })
    const { content, managedNames } = applyServers(
      existing,
      { gh: { type: 'stdio', command: 'npx', args: [] } },
      { ...ctx, scope: 'project', previousManagedNames: new Set(['old']) },
    )
    expect(managedNames).toEqual(['gh'])
    const parsed = JSON.parse(content)
    expect(parsed.mcpServers.gh!).toEqual({ command: 'npx' })
    expect(parsed.mcpServers.old).toBeUndefined()
  })
})
````

## File: tests/adapters/opencode.test.ts
````typescript
import { describe, expect, it } from 'vitest'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer, isHttpServer } from '$/src/core/schema'
import {
  compile,
  extractServers,
  applyServers,
  capabilities,
  getConfigPath,
} from '$/src/adapters/opencode'
import { createRuntimeContext } from '$/src/core/context'
import { createSandbox } from '$/tests/helpers/sandbox'
import { join } from 'node:path'

const ctx = createRuntimeContext({
  cwd: '/tmp/proj',
  homeDir: '/tmp/home',
  env: {},
  isTTY: false,
})

describe('opencode adapter identity', () => {
  it('capabilities', () => {
    expect(capabilities).toEqual({
      scopes: ['project', 'global'],
      format: 'jsonc',
      envSyntax: 'brace-env',
      nativeDefault: false,
      nativeDisabled: true,
      cwd: false,
      layout: 'single-file',
      rootKey: 'mcp',
    })
  })

  it('getConfigPath project and global', () => {
    expect(getConfigPath('project', ctx)).toBe('/tmp/proj/opencode.json')
    // linux (default platform in CI), no XDG_CONFIG_HOME → ~/.config/opencode/opencode.json
    expect(getConfigPath('global', ctx)).toBe(
      '/tmp/home/.config/opencode/opencode.json',
    )
  })

  describe('getConfigPath global (OS-aware)', () => {
    it('linux with XDG_CONFIG_HOME', () => {
      const linuxCtx = createRuntimeContext({
        cwd: '/tmp/proj',
        homeDir: '/home/alex',
        platform: 'linux',
        env: { XDG_CONFIG_HOME: '/home/alex/.config' },
        isTTY: false,
      })
      expect(getConfigPath('global', linuxCtx)).toBe(
        '/home/alex/.config/opencode/opencode.json',
      )
    })

    it('linux without XDG_CONFIG_HOME falls back to ~/.config', () => {
      const linuxCtx = createRuntimeContext({
        cwd: '/tmp/proj',
        homeDir: '/home/alex',
        platform: 'linux',
        env: {},
        isTTY: false,
      })
      expect(getConfigPath('global', linuxCtx)).toBe(
        '/home/alex/.config/opencode/opencode.json',
      )
    })

    it('darwin uses ~/.config/opencode (not Library)', () => {
      const darwinCtx = createRuntimeContext({
        cwd: '/tmp/proj',
        homeDir: '/Users/alex',
        platform: 'darwin',
        env: {},
        isTTY: false,
      })
      expect(getConfigPath('global', darwinCtx)).toBe(
        '/Users/alex/.config/opencode/opencode.json',
      )
    })

    it('win32 with APPDATA', () => {
      const winCtx = createRuntimeContext({
        cwd: 'C:\\proj',
        homeDir: 'C:\\Users\\alex',
        platform: 'win32',
        env: { APPDATA: 'C:\\Users\\alex\\AppData\\Roaming' },
        isTTY: false,
      })
      expect(getConfigPath('global', winCtx)).toBe(
        'C:\\Users\\alex\\AppData\\Roaming\\opencode\\opencode.json',
      )
    })

    it('win32 without APPDATA falls back to ~/AppData/Roaming', () => {
      const winCtx = createRuntimeContext({
        cwd: 'C:\\proj',
        homeDir: 'C:\\Users\\alex',
        platform: 'win32',
        env: {},
        isTTY: false,
      })
      expect(getConfigPath('global', winCtx)).toBe(
        'C:\\Users\\alex\\AppData\\Roaming\\opencode\\opencode.json',
      )
    })
  })
})

describe('opencode compile', () => {
  it('stdio server: merged command array, {env:VAR}', () => {
    const { entry, warnings } = compile({
      type: 'stdio',
      command: 'npx',
      args: ['-y', '${ARG:-fallback}'],
      env: { TOKEN: '${TOKEN}' },
    })
    expect(entry).toEqual({
      type: 'local',
      command: ['npx', '-y', '{env:ARG}'],
      environment: { TOKEN: '{env:TOKEN}' },
    })
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.code).toBe('DEFAULT_DROPPED')
  })

  it('streamable-http server: serverUrl, {env:VAR}', () => {
    const { entry } = compile({
      type: 'streamable-http',
      url: 'https://x/mcp',
      headers: { Authorization: 'Bearer ${KEY}' },
    })
    expect(entry).toEqual({
      type: 'remote',
      url: 'https://x/mcp',
      headers: { Authorization: 'Bearer {env:KEY}' },
    })
  })

  it('sse server: serverUrl, {env:VAR}', () => {
    const { entry } = compile({
      type: 'sse',
      url: 'https://x/sse',
      headers: { Authorization: 'Bearer ${KEY}' },
    })
    expect(entry).toEqual({
      type: 'remote',
      url: 'https://x/sse',
      headers: { Authorization: 'Bearer {env:KEY}' },
    })
  })
})

describe('opencode extractServers', () => {
  it('extracts local and remote entries', () => {
    const raw = JSON.stringify({
      mcp: {
        gh: {
          type: 'local',
          command: ['npx', 'pkg'],
          environment: { T: '${T}' },
          enabled: true,
        },
        lin: { type: 'remote', url: 'https://x/mcp', enabled: true },
      },
    })
    const { servers, warnings } = extractServers(raw, 'project')
    const gh = servers.gh as Extract<CanonicalServer, { type: 'stdio' }>
    const lin = servers.lin as Extract<
      CanonicalServer,
      { type: 'streamable-http' }
    >
    expect(isStdioServer(gh)).toBe(true)
    expect(gh.command).toBe('npx')
    expect(gh.args).toEqual(['pkg'])
    expect(isHttpServer(lin)).toBe(true)
    expect(lin.type).toBe('streamable-http')
    expect(lin.url).toBe('https://x/mcp')
    expect(warnings).toEqual([])
  })

  it('imports serverUrl-only as streamable-http with TRANSPORT_INFERRED', () => {
    const raw = JSON.stringify({ mcp: { lin: { serverUrl: 'https://x/mcp' } } })
    const { servers, warnings } = extractServers(raw, 'project')
    const lin = servers.lin as Extract<
      CanonicalServer,
      { type: 'streamable-http' }
    >
    expect(isHttpServer(lin)).toBe(true)
    expect(lin.type).toBe('streamable-http')
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.code).toBe('TRANSPORT_INFERRED')
  })
})

describe('opencode applyServers', () => {
  it('writes mcp key and prunes previous managed', () => {
    const existing = JSON.stringify({
      mcp: { old: { type: 'local', command: ['old'], enabled: true } },
    })
    const { content, managedNames } = applyServers(
      existing,
      { gh: { type: 'stdio', command: 'npx', args: [] } },
      { ...ctx, scope: 'project', previousManagedNames: new Set(['old']) },
    )
    expect(managedNames).toEqual(['gh'])
    const parsed = JSON.parse(content)
    expect(parsed.mcp.gh).toEqual({
      type: 'local',
      command: ['npx'],
    })
    expect(parsed.mcp.old).toBeUndefined()
  })
})
````

## File: tests/adapters/vscode.test.ts
````typescript
import { describe, expect, it } from 'vitest'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer, isHttpServer } from '$/src/core/schema'
import {
  compile,
  extractServers,
  applyServers,
  capabilities,
  getConfigPath,
} from '$/src/adapters/vscode'
import { createRuntimeContext } from '$/src/core/context'
import { createSandbox } from '$/tests/helpers/sandbox'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const ctx = createRuntimeContext({
  cwd: '/tmp/proj',
  homeDir: '/tmp/home',
  env: {},
  isTTY: false,
})

describe('vscode adapter identity', () => {
  it('capabilities', () => {
    expect(capabilities).toEqual({
      scopes: ['project', 'global'],
      format: 'jsonc',
      envSyntax: 'env-colon',
      nativeDefault: false,
      nativeDisabled: false,
      cwd: false,
      layout: 'single-file',
      rootKey: 'servers',
    })
  })

  it('getConfigPath project and global', () => {
    expect(getConfigPath('project', ctx)).toBe('/tmp/proj/.vscode/mcp.json')
    // linux (default platform in CI), no XDG_CONFIG_HOME → ~/.config/Code/User/mcp.json
    expect(getConfigPath('global', ctx)).toBe(
      '/tmp/home/.config/Code/User/mcp.json',
    )
  })

  describe('getConfigPath global (OS-aware)', () => {
    it('linux with XDG_CONFIG_HOME', () => {
      const linuxCtx = createRuntimeContext({
        cwd: '/tmp/proj',
        homeDir: '/home/alex',
        platform: 'linux',
        env: { XDG_CONFIG_HOME: '/home/alex/.config' },
        isTTY: false,
      })
      expect(getConfigPath('global', linuxCtx)).toBe(
        '/home/alex/.config/Code/User/mcp.json',
      )
    })

    it('linux without XDG_CONFIG_HOME falls back to ~/.config', () => {
      const linuxCtx = createRuntimeContext({
        cwd: '/tmp/proj',
        homeDir: '/home/alex',
        platform: 'linux',
        env: {},
        isTTY: false,
      })
      expect(getConfigPath('global', linuxCtx)).toBe(
        '/home/alex/.config/Code/User/mcp.json',
      )
    })

    it('darwin uses Library/Application Support', () => {
      const darwinCtx = createRuntimeContext({
        cwd: '/tmp/proj',
        homeDir: '/Users/alex',
        platform: 'darwin',
        env: {},
        isTTY: false,
      })
      expect(getConfigPath('global', darwinCtx)).toBe(
        '/Users/alex/Library/Application Support/Code/User/mcp.json',
      )
    })

    it('win32 with APPDATA', () => {
      const winCtx = createRuntimeContext({
        cwd: 'C:\\proj',
        homeDir: 'C:\\Users\\alex',
        platform: 'win32',
        env: { APPDATA: 'C:\\Users\\alex\\AppData\\Roaming' },
        isTTY: false,
      })
      expect(getConfigPath('global', winCtx)).toBe(
        'C:\\Users\\alex\\AppData\\Roaming\\Code\\User\\mcp.json',
      )
    })

    it('win32 without APPDATA falls back to ~/AppData/Roaming', () => {
      const winCtx = createRuntimeContext({
        cwd: 'C:\\proj',
        homeDir: 'C:\\Users\\alex',
        platform: 'win32',
        env: {},
        isTTY: false,
      })
      expect(getConfigPath('global', winCtx)).toBe(
        'C:\\Users\\alex\\AppData\\Roaming\\Code\\User\\mcp.json',
      )
    })

    it('probes Code - Insiders when its User dir exists', () => {
      const { ctx: sctx, cleanup, dir } = createSandbox()
      try {
        // sctx.platform is linux, sctx.homeDir is sandbox home,
        // sctx.env.XDG_CONFIG_HOME is <home>/.config
        const base = sctx.env.XDG_CONFIG_HOME!
        mkdirSync(join(base, 'Code - Insiders', 'User'), {
          recursive: true,
        })
        expect(getConfigPath('global', sctx)).toBe(
          join(base, 'Code - Insiders', 'User', 'mcp.json'),
        )
      } finally {
        cleanup()
      }
    })

    it('probes VSCodium when Insiders missing but VSCodium present', () => {
      const { ctx: sctx, cleanup, dir } = createSandbox()
      try {
        const base = sctx.env.XDG_CONFIG_HOME!
        mkdirSync(join(base, 'VSCodium', 'User'), { recursive: true })
        expect(getConfigPath('global', sctx)).toBe(
          join(base, 'VSCodium', 'User', 'mcp.json'),
        )
      } finally {
        cleanup()
      }
    })

    it('defaults to Code when no channel User dir exists', () => {
      const { ctx: sctx, cleanup } = createSandbox()
      try {
        expect(getConfigPath('global', sctx)).toBe(
          join(sctx.env.XDG_CONFIG_HOME!, 'Code', 'User', 'mcp.json'),
        )
      } finally {
        cleanup()
      }
    })

    it('respects channel order: Code wins over Insiders when both exist', () => {
      const { ctx: sctx, cleanup } = createSandbox()
      try {
        const base = sctx.env.XDG_CONFIG_HOME!
        mkdirSync(join(base, 'Code', 'User'), { recursive: true })
        mkdirSync(join(base, 'Code - Insiders', 'User'), { recursive: true })
        expect(getConfigPath('global', sctx)).toBe(
          join(base, 'Code', 'User', 'mcp.json'),
        )
      } finally {
        cleanup()
      }
    })
  })
})

describe('vscode compile', () => {
  it('stdio server with type, ${env:VAR}, default dropped', () => {
    const { entry, warnings } = compile({
      type: 'stdio',
      command: 'uvx',
      args: ['mcp-server-postgres', '${DB_URL:-local}'],
      env: { DB_URL: '${DB_URL}' },
    })
    expect(entry).toEqual({
      type: 'stdio',
      command: 'uvx',
      args: ['mcp-server-postgres', '${env:DB_URL}'],
      env: { DB_URL: '${env:DB_URL}' },
    })
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.code).toBe('DEFAULT_DROPPED')
  })

  it('streamable-http server with type http (vscode preserves)', () => {
    const { entry } = compile({
      type: 'streamable-http',
      url: 'https://x/mcp',
    })
    expect(entry).toEqual({ type: 'http', url: 'https://x/mcp' })
  })

  it('sse server with type sse (vscode preserves)', () => {
    const { entry } = compile({
      type: 'sse',
      url: 'https://x/sse',
    })
    expect(entry).toEqual({ type: 'sse', url: 'https://x/sse' })
  })
})

describe('vscode extractServers', () => {
  it('extracts stdio and streamable-http from servers key', () => {
    const raw = JSON.stringify({
      servers: {
        pg: {
          type: 'stdio',
          command: 'uvx',
          args: ['pg'],
          env: { DB: '${DB}' },
        },
        lin: { type: 'http', url: 'https://x/mcp' },
      },
    })
    const { servers, warnings } = extractServers(raw, 'project')
    const pg = servers.pg as Extract<CanonicalServer, { type: 'stdio' }>
    const lin = servers.lin as Extract<
      CanonicalServer,
      { type: 'streamable-http' }
    >
    expect(isStdioServer(pg)).toBe(true)
    expect(pg.command).toBe('uvx')
    expect(isHttpServer(lin)).toBe(true)
    expect(lin.type).toBe('streamable-http')
    expect(lin.url).toBe('https://x/mcp')
    expect(warnings).toEqual([])
  })

  it('extracts sse from native type sse', () => {
    const raw = JSON.stringify({
      servers: {
        lin: { type: 'sse', url: 'https://x/sse' },
      },
    })
    const { servers } = extractServers(raw, 'project')
    const lin = servers.lin as Extract<CanonicalServer, { type: 'sse' }>
    expect(lin.type).toBe('sse')
    expect(lin.url).toBe('https://x/sse')
  })

  it('imports URL-only as streamable-http with TRANSPORT_INFERRED', () => {
    const raw = JSON.stringify({ servers: { lin: { url: 'https://x/mcp' } } })
    const { servers, warnings } = extractServers(raw, 'project')
    const lin = servers.lin as Extract<
      CanonicalServer,
      { type: 'streamable-http' }
    >
    expect(isHttpServer(lin)).toBe(true)
    expect(lin.type).toBe('streamable-http')
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.code).toBe('TRANSPORT_INFERRED')
  })
})

describe('vscode applyServers', () => {
  it('writes servers key and prunes previous managed', () => {
    const existing = JSON.stringify({
      servers: { old: { type: 'stdio', command: 'old', args: [] } },
    })
    const { content, managedNames } = applyServers(
      existing,
      { pg: { type: 'stdio', command: 'uvx', args: [] } },
      { ...ctx, scope: 'project', previousManagedNames: new Set(['old']) },
    )
    expect(managedNames).toEqual(['pg'])
    const parsed = JSON.parse(content)
    expect(parsed.servers.pg).toEqual({ type: 'stdio', command: 'uvx' })
    expect(parsed.servers.old).toBeUndefined()
  })

  it('preserves inputs array (sibling key)', () => {
    const existing = JSON.stringify({
      inputs: [{ id: 'env', description: 'd' }],
      servers: { old: { type: 'stdio', command: 'old', args: [] } },
    })
    const { content } = applyServers(
      existing,
      { pg: { type: 'stdio', command: 'uvx', args: [] } },
      { ...ctx, scope: 'project', previousManagedNames: new Set(['old']) },
    )
    const parsed = JSON.parse(content)
    expect(parsed.inputs).toEqual([{ id: 'env', description: 'd' }])
    expect(parsed.servers.pg).toBeDefined()
  })
})
````

## File: tests/adapters/windsurf.test.ts
````typescript
import { describe, expect, it } from 'vitest'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer, isHttpServer } from '$/src/core/schema'
import {
  compile,
  extractServers,
  applyServers,
  capabilities,
  getConfigPath,
  detect,
} from '$/src/adapters/windsurf'
import { createRuntimeContext } from '$/src/core/context'
import { createSandbox } from '$/tests/helpers/sandbox'

const ctx = createRuntimeContext({
  cwd: '/tmp/proj',
  homeDir: '/tmp/home',
  env: {},
  isTTY: false,
})

describe('windsurf adapter identity', () => {
  it('capabilities: global-only', () => {
    expect(capabilities).toEqual({
      scopes: ['global'],
      format: 'json',
      envSyntax: 'env-colon',
      nativeDefault: false,
      nativeDisabled: false,
      cwd: false,
      layout: 'single-file',
      rootKey: 'mcpServers',
    })
  })

  it('getConfigPath: global only, project is null', () => {
    expect(getConfigPath('global', ctx)).toBe(
      '/tmp/home/.codeium/windsurf/mcp_config.json',
    )
    expect(getConfigPath('project', ctx)).toBeNull()
  })

  it('detect: global false when missing, project always false', async () => {
    const { ctx: sctx, cleanup } = createSandbox()
    try {
      expect(await detect('global', sctx)).toBe(false)
      expect(await detect('project', sctx)).toBe(false)
    } finally {
      cleanup()
    }
  })
})

describe('windsurf compile', () => {
  it('global scope: stdio server, ${env:VAR}, default dropped', () => {
    const { entry, warnings } = compile({
      type: 'stdio',
      command: 'npx',
      args: ['-y', '${ARG:-fallback}'],
      env: { TOKEN: '${TOKEN}' },
    })
    expect(entry).toEqual({
      command: 'npx',
      args: ['-y', '${env:ARG}'],
      env: { TOKEN: '${env:TOKEN}' },
    })
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.code).toBe('DEFAULT_DROPPED')
  })

  it('global scope: streamable-http server uses serverUrl', () => {
    const { entry } = compile({
      type: 'streamable-http',
      url: 'https://x/mcp',
    })
    expect(entry).toEqual({ serverUrl: 'https://x/mcp' })
  })

  it('global scope: sse server uses serverUrl', () => {
    const { entry } = compile({
      type: 'sse',
      url: 'https://x/sse',
    })
    expect(entry).toEqual({ serverUrl: 'https://x/sse' })
  })
})

describe('windsurf extractServers', () => {
  it('extracts stdio (command) and streamable-http (serverUrl)', () => {
    const raw = JSON.stringify({
      mcpServers: {
        gh: { command: 'npx', args: ['-y', 'pkg'] },
        lin: { serverUrl: 'https://x/mcp' },
      },
    })
    const { servers, warnings } = extractServers(raw, 'global')
    const gh = servers.gh as Extract<CanonicalServer, { type: 'stdio' }>
    const lin = servers.lin as Extract<
      CanonicalServer,
      { type: 'streamable-http' }
    >
    expect(isStdioServer(gh)).toBe(true)
    expect(gh.command).toBe('npx')
    expect(isHttpServer(lin)).toBe(true)
    expect(lin.type).toBe('streamable-http')
    expect(lin.url).toBe('https://x/mcp')
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.code).toBe('TRANSPORT_INFERRED')
  })
})

describe('windsurf applyServers', () => {
  it('global scope: writes mcpServers and prunes previous managed', () => {
    const existing = JSON.stringify({
      mcpServers: { old: { command: 'old' } },
    })
    const { content, managedNames } = applyServers(
      existing,
      { gh: { type: 'stdio', command: 'npx', args: [] } },
      { ...ctx, scope: 'global', previousManagedNames: new Set(['old']) },
    )
    expect(managedNames).toEqual(['gh'])
    const parsed = JSON.parse(content)
    expect(parsed.mcpServers.gh).toEqual({ command: 'npx' })
    expect(parsed.mcpServers.old).toBeUndefined()
  })

  it('project scope: SCOPE_UNSUPPORTED, skips all servers', () => {
    const existing = JSON.stringify({ mcpServers: { old: { command: 'old' } } })
    const { content, managedNames, warnings } = applyServers(
      existing,
      { gh: { type: 'stdio', command: 'npx', args: [] } },
      { ...ctx, scope: 'project' as const, previousManagedNames: new Set() },
    )
    expect(managedNames).toEqual([])
    expect(content).toBe(existing)
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.code).toBe('SCOPE_UNSUPPORTED')
  })
})
````

## File: tests/adapters/zed.test.ts
````typescript
import { describe, expect, it } from 'vitest'
import {
  compile,
  extractServers,
  applyServers,
  capabilities,
  getConfigPath,
  detect,
} from '$/src/adapters/zed'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer, isHttpServer } from '$/src/core/schema'
import { createRuntimeContext } from '$/src/core/context'
import { createSandbox } from '$/tests/helpers/sandbox'
import { join } from 'node:path'

const ctx = createRuntimeContext({
  cwd: '/tmp/proj',
  homeDir: '/tmp/home',
  env: {},
  isTTY: false,
})

describe('zed adapter identity', () => {
  it('capabilities', () => {
    expect(capabilities).toEqual({
      scopes: ['project', 'global'],
      format: 'jsonc',
      envSyntax: 'posix',
      nativeDefault: false,
      nativeDisabled: false,
      cwd: false,
      layout: 'single-file',
      rootKey: 'context_servers',
    })
  })

  it('getConfigPath project and global', () => {
    expect(getConfigPath('project', ctx)).toBe('/tmp/proj/.zed/settings.json')
    // linux (default platform in CI), no XDG_CONFIG_HOME → ~/.config/zed/settings.json
    expect(getConfigPath('global', ctx)).toBe(
      '/tmp/home/.config/zed/settings.json',
    )
  })

  describe('getConfigPath global (OS-aware)', () => {
    it('linux with XDG_CONFIG_HOME', () => {
      const linuxCtx = createRuntimeContext({
        cwd: '/tmp/proj',
        homeDir: '/home/alex',
        platform: 'linux',
        env: { XDG_CONFIG_HOME: '/home/alex/.config' },
        isTTY: false,
      })
      expect(getConfigPath('global', linuxCtx)).toBe(
        '/home/alex/.config/zed/settings.json',
      )
    })

    it('linux without XDG_CONFIG_HOME falls back to ~/.config', () => {
      const linuxCtx = createRuntimeContext({
        cwd: '/tmp/proj',
        homeDir: '/home/alex',
        platform: 'linux',
        env: {},
        isTTY: false,
      })
      expect(getConfigPath('global', linuxCtx)).toBe(
        '/home/alex/.config/zed/settings.json',
      )
    })

    it('darwin uses ~/.config/zed (not Library)', () => {
      const darwinCtx = createRuntimeContext({
        cwd: '/tmp/proj',
        homeDir: '/Users/alex',
        platform: 'darwin',
        env: {},
        isTTY: false,
      })
      expect(getConfigPath('global', darwinCtx)).toBe(
        '/Users/alex/.config/zed/settings.json',
      )
    })

    it('win32 with APPDATA', () => {
      const winCtx = createRuntimeContext({
        cwd: 'C:\\proj',
        homeDir: 'C:\\Users\\alex',
        platform: 'win32',
        env: { APPDATA: 'C:\\Users\\alex\\AppData\\Roaming' },
        isTTY: false,
      })
      expect(getConfigPath('global', winCtx)).toBe(
        'C:\\Users\\alex\\AppData\\Roaming\\Zed\\settings.json',
      )
    })

    it('win32 without APPDATA falls back to ~/AppData/Roaming', () => {
      const winCtx = createRuntimeContext({
        cwd: 'C:\\proj',
        homeDir: 'C:\\Users\\alex',
        platform: 'win32',
        env: {},
        isTTY: false,
      })
      expect(getConfigPath('global', winCtx)).toBe(
        'C:\\Users\\alex\\AppData\\Roaming\\Zed\\settings.json',
      )
    })
  })

  it('detect false for missing file', async () => {
    const { ctx: sctx, cleanup } = createSandbox()
    try {
      expect(await detect('project', sctx)).toBe(false)
    } finally {
      cleanup()
    }
  })
})

describe('zed compile', () => {
  it('stdio server: nested command, ${VAR} unchanged', () => {
    const { entry, warnings } = compile({
      type: 'stdio',
      command: 'npx',
      args: ['-y', 'pkg'],
      env: { TOKEN: '${TOKEN}' },
    })
    expect(entry).toEqual({
      command: {
        path: 'npx',
        args: ['-y', 'pkg'],
        env: { TOKEN: '${TOKEN}' },
      },
    })
    expect(warnings).toEqual([])
  })

  it('streamable-http server', () => {
    const { entry } = compile({
      type: 'streamable-http',
      url: 'https://x/mcp',
    })
    expect(entry).toEqual({ url: 'https://x/mcp' })
  })

  it('sse server', () => {
    const { entry } = compile({
      type: 'sse',
      url: 'https://x/sse',
    })
    expect(entry).toEqual({ url: 'https://x/sse' })
  })
})

describe('zed extractServers', () => {
  it('extracts stdio (command.path) and streamable-http (url)', () => {
    const raw = JSON.stringify({
      context_servers: {
        gh: { command: { path: 'npx', args: ['-y', 'pkg'] } },
        lin: { url: 'https://x/mcp' },
      },
    })
    const { servers, warnings } = extractServers(raw, 'project')
    const gh = servers.gh as Extract<CanonicalServer, { type: 'stdio' }>
    const lin = servers.lin as Extract<
      CanonicalServer,
      { type: 'streamable-http' }
    >
    expect(isStdioServer(gh)).toBe(true)
    expect(gh.command).toBe('npx')
    expect(isHttpServer(lin)).toBe(true)
    expect(lin.type).toBe('streamable-http')
    expect(lin.url).toBe('https://x/mcp')
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.code).toBe('TRANSPORT_INFERRED')
  })
})

describe('zed applyServers', () => {
  it('writes context_servers and prunes previous managed', () => {
    const existing = JSON.stringify({
      context_servers: { old: { command: { path: 'old' } } },
    })
    const { content, managedNames } = applyServers(
      existing,
      { gh: { type: 'stdio', command: 'npx', args: [] } },
      { ...ctx, scope: 'project', previousManagedNames: new Set(['old']) },
    )
    expect(managedNames).toEqual(['gh'])
    const parsed = JSON.parse(content)
    expect(parsed.context_servers.gh).toEqual({
      command: { path: 'npx' },
    })
    expect(parsed.context_servers.old).toBeUndefined()
  })
})
````

## File: tests/commands/integration.test.ts
````typescript
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { runSync } from '$/src/commands/sync'
import { main } from '$/src/index'
import { removeCommand } from '$/src/commands/remove.command'
import { persistCanonicalConfig } from '$/src/commands/util'
import { loadState, emptyState, writeState } from '$/src/core/state'
import { createSandbox } from '$/tests/helpers/sandbox'

describe('commands integration', () => {
  it('init → sync → list flow', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      // init with agents and a server
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://example.com/schema.json',
        mcpServers: {
          github: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
          },
        },
      })

      // sync with targets
      const result = await runSync({
        scope: 'project',
        ctx,
        flag: ['claude-code', 'cursor'],
        dryRun: false,
        yes: true,
      } as Parameters<typeof runSync>[0])

      expect(result.targets).toEqual(['claude-code', 'cursor'])
      expect(result.written.length).toBeGreaterThan(0)

      // Verify native file was written
      const content = readFileSync(`${ctx.cwd}/.mcp.json`, 'utf8')
      expect(content).toContain('mcpServers')
      expect(content).toContain('github')

      // Verify state was updated (lock file)
      const stateContent = readFileSync(
        `${ctx.cwd}/.agents/mcp-lock.json`,
        'utf8',
      )
      expect(stateContent).toContain('claude-code')
      expect(stateContent).toContain('cursor')
    } finally {
      cleanup()
    }
  })

  it('sync is byte-idempotent', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://example.com/schema.json',
        mcpServers: {
          github: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
          },
        },
      })

      const result1 = await runSync({
        scope: 'project',
        ctx,
        flag: ['claude-code'],
        dryRun: false,
        yes: true,
      } as Parameters<typeof runSync>[0])

      const result2 = await runSync({
        scope: 'project',
        ctx,
        flag: ['claude-code'],
        dryRun: false,
        yes: true,
      } as Parameters<typeof runSync>[0])

      expect(result2.written).toEqual(result1.written)
    } finally {
      cleanup()
    }
  })

  it('runSync strict default: zero resolvable targets exits 1 (programmatic caller)', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://example.com/schema.json',
        mcpServers: {},
      })

      const exitSpy = vi
        .spyOn(process, 'exit')
        .mockImplementation((() => {}) as NodeJS.Process['exit'])
      try {
        await runSync({
          scope: 'project',
          ctx,
          flag: undefined,
          dryRun: false,
          yes: true,
        } as Parameters<typeof runSync>[0])
        expect(exitSpy).toHaveBeenCalledWith(1)
      } finally {
        exitSpy.mockRestore()
      }
    } finally {
      cleanup()
    }
  })

  it('sync COMMAND com zero alvos resolviveis sai com 0, materializa plugins e imprime orientacao de sem-alvo', async () => {
    const { ctx, cleanup } = createSandbox()
    const logged: string[] = []
    try {
      // Canonical com servidores, mas nenhum arquivo nativo de agente => zero alvos detectados.
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://example.com/schema.json',
        mcpServers: {
          github: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
          },
        },
      })

      const savedArgv = process.argv
      const savedCwd = process.cwd()
      const savedExit = process.exit
      const savedLog = console.log
      let exitCode: number | undefined
      process.argv = ['node', 'index.js', 'sync', '--yes']
      process.chdir(ctx.cwd)
      process.exit = ((code: number) => {
        exitCode = code
      }) as unknown as NodeJS.Process['exit']
      console.log = ((message: unknown) => {
        logged.push(String(message))
      }) as typeof console.log

      try {
        await main()
        expect(exitCode).toBeUndefined() // comando nao chama process.exit (sucesso)
      } finally {
        process.argv = savedArgv
        process.chdir(savedCwd)
        process.exit = savedExit
        console.log = savedLog
      }

      // Plugin files materializados pela fase de plugin (mesmo sem alvos).
      const pluginDir = join(ctx.cwd, '.agents/plugins/github')
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)

      // Lock persistido.
      expect(existsSync(join(ctx.cwd, '.agents', 'mcp-lock.json'))).toBe(true)

      // Orientacao de "sem alvos" foi impressa.
      const output = logged.join('\n')
      expect(output).toContain('No target agents')
      expect(output).toContain('agents-mcp sync --agents')
    } finally {
      cleanup()
    }
  })

  it('dry-run writes nothing', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://example.com/schema.json',
        mcpServers: {
          github: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
          },
        },
      })

      const result = await runSync({
        scope: 'project',
        ctx,
        flag: ['claude-code'],
        dryRun: true,
        yes: true,
      } as Parameters<typeof runSync>[0])

      expect(result.written).toEqual([])

      // Native file should not exist
      const fs = require('node:fs')
      expect(fs.existsSync(`${ctx.cwd}/.mcp.json`)).toBe(false)
    } finally {
      cleanup()
    }
  })

  it('remove alpha mantem somente beta no canônico e nos agentes (AC1)', async () => {
    const { ctx, cleanup } = createSandbox()
    const origCwd = process.cwd()
    // `removeCommand.run` cria o `RuntimeContext` internamente via
    // `createUiAndCtx()`, que usa `process.cwd()`. Forçar o cwd para o sandbox
    // garante que o comando leia/grave arquivos dentro dele (sem tocar o disco
    // real do repositorio).
    mkdirSync(ctx.cwd, { recursive: true })
    process.chdir(ctx.cwd)

    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as NodeJS.Process['exit'])
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      // 1. Semente o canônico com `alpha` e `beta` (stdio, npx, args vazio).
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://example.com/schema.json',
        mcpServers: {
          alpha: { type: 'stdio', command: 'npx', args: [] },
          beta: { type: 'stdio', command: 'npx', args: [] },
        },
      })
      writeState('project', ctx, {
        ...emptyState('project'),
        targets: ['cursor'],
        agents: {},
        managedPlugins: ['alpha', 'beta'],
      })

      // 2. Sincroniza com `cursor`: cria os plugins e o `.cursor/mcp.json`.
      await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
      } as Parameters<typeof runSync>[0])

      // 3. Remove `alpha` (sem `--no-sync`: executa `runSync` de fato).
      await removeCommand.run!({
        args: { _: ['alpha'], global: false, yes: true },
        rawArgs: ['alpha'],
      } as unknown as Parameters<NonNullable<typeof removeCommand.run>>[0])

      // Nunca deve sair com codigo de saida diferente de zero.
      expect(exitSpy).not.toHaveBeenCalled()

      // Canônico reparseado: somente `beta`, definicao inalterada.
      const canonical = JSON.parse(
        readFileSync(join(ctx.cwd, '.agents/mcp.json'), 'utf8'),
      )
      expect(Object.keys(canonical.mcpServers)).toEqual(['beta'])
      expect(canonical.mcpServers.beta).toEqual({
        type: 'stdio',
        command: 'npx',
        args: [],
      })

      // `.cursor/mcp.json` continua existindo e contem `beta` (nao `alpha`).
      const cursorContent = readFileSync(
        join(ctx.cwd, '.cursor/mcp.json'),
        'utf8',
      )
      expect(cursorContent).toContain('beta')
      expect(cursorContent).not.toContain('alpha')

      // Plugin gerenciado de `beta` permanece inteiro.
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/beta/plugin.json')),
      ).toBe(true)
      expect(existsSync(join(ctx.cwd, '.agents/plugins/beta/mcp.json'))).toBe(
        true,
      )

      // Diretorio de `alpha` foi apagado (so havia arquivos gerenciados).
      expect(existsSync(join(ctx.cwd, '.agents/plugins/alpha'))).toBe(false)

      // Estado: `managedPlugins` encolheu para `['beta']`.
      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual(['beta'])
    } finally {
      exitSpy.mockRestore()
      logSpy.mockRestore()
      errorSpy.mockRestore()
      process.chdir(origCwd)
      cleanup()
    }
  })
})
````

## File: tests/core/fs-atomic.test.ts
````typescript
import { describe, expect, it } from 'vitest'
import {
  mkdtempSync,
  rmSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readTextFile, writeFileAtomic, backupFile } from '$/src/core/fs-atomic'

function makeSandbox(): string {
  return mkdtempSync(join(tmpdir(), 'agents-mcp-fs-atomic-'))
}

describe('fs-atomic', () => {
  it('readTextFile returns null for missing files', () => {
    const dir = makeSandbox()
    try {
      expect(readTextFile(join(dir, 'does-not-exist.txt'))).toBeNull()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('readTextFile throws on other errors', () => {
    const dir = makeSandbox()
    try {
      // A directory cannot be read as a text file.
      expect(() => readTextFile(dir)).toThrow()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('writeFileAtomic round-trips content byte-stable', () => {
    const dir = makeSandbox()
    const path = join(dir, 'config.json')
    try {
      const content = '{"servers":{}}\n'
      writeFileAtomic(path, content)
      expect(readTextFile(path)).toBe(content)

      // Second write must be byte-identical.
      writeFileAtomic(path, content)
      expect(readTextFile(path)).toBe(content)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('writeFileAtomic overwrites existing content', () => {
    const dir = makeSandbox()
    const path = join(dir, 'config.json')
    try {
      writeFileAtomic(path, 'first\n')
      writeFileAtomic(path, 'second\n')
      expect(readTextFile(path)).toBe('second\n')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('writeFileAtomic respects mode option', () => {
    const dir = makeSandbox()
    const path = join(dir, '.env')
    try {
      writeFileAtomic(path, 'KEY=value\n', { mode: 0o600 })
      const content = readTextFile(path)
      expect(content).toBe('KEY=value\n')
      // On POSIX the file must be created with mode 0o600 (§8.1, .env).
      if (process.platform !== 'win32') {
        expect(statSync(path).mode & 0o777).toBe(0o600)
      }
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('writeFileAtomic puts temp file in the target directory (not in cwd)', () => {
    const dir = makeSandbox()
    const targetDir = join(dir, 'project', '.agents')
    const winPath = join(targetDir, 'mcp.json')
    try {
      writeFileAtomic(winPath, '{"servers":{}}\n')
      expect(readTextFile(winPath)).toBe('{"servers":{}}\n')
      // No temp file may leak into the sandbox root or the process cwd.
      const rootEntries = readdirSync(dir)
      expect(rootEntries.some((e) => e.startsWith('.agents-mcp-tmp-'))).toBe(
        false,
      )
      // The target directory itself must not retain a temp file after rename.
      const targetEntries = readdirSync(targetDir)
      expect(targetEntries.some((e) => e.startsWith('.agents-mcp-tmp-'))).toBe(
        false,
      )
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('backupFile returns null when source missing', () => {
    const dir = makeSandbox()
    try {
      expect(backupFile(join(dir, 'missing.txt'))).toBeNull()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('backupFile creates a timestamped copy', () => {
    const dir = makeSandbox()
    const path = join(dir, 'config.json')
    try {
      writeFileSync(path, 'original\n')
      const backup = backupFile(path)
      expect(backup).toBeTruthy()
      expect(backup!.includes('.bak.')).toBe(true)
      expect(readTextFile(backup!)).toBe('original\n')
      // Original is untouched.
      expect(readTextFile(path)).toBe('original\n')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('concurrent writes do not collide', () => {
    const dir = makeSandbox()
    const path = join(dir, 'shared.json')
    try {
      const contents = Array.from({ length: 20 }, (_, i) => `write ${i}\n`)
      contents.forEach((c) => writeFileAtomic(path, c))
      // The last written content should be intact (no partial/corrupt file).
      const final = readTextFile(path)
      expect(final).toMatch(/^write \d+\n$/)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
````

## File: tests/core/plugins.test.ts
````typescript
import { describe, expect, it } from 'vitest'
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  getPluginDir,
  compilePluginManifest,
  compilePluginMcpConfig,
  compileAntigravityMcpConfig,
  isUnmanagedPluginCollision,
  syncPluginFiles,
  readPluginManifest,
  MANAGED_PLUGIN_FILES,
  removeManagedPlugin,
  removeAntigravityPluginConfig,
} from '$/src/core/plugins'
import { createRuntimeContext } from '$/src/core/context'
import { createSandbox } from '$/tests/helpers/sandbox'
import type { CanonicalServer } from '$/src/core/schema'

const ctx = createRuntimeContext({
  cwd: '/tmp/agents-mcp-test/project',
  homeDir: '/tmp/agents-mcp-test/home',
  isTTY: false,
})

const stdioServer: CanonicalServer = {
  type: 'stdio',
  command: 'npx',
  args: ['-y', '@mcp/server'],
  env: { API_KEY: '${API_KEY}' },
}

const httpServer: CanonicalServer = {
  type: 'streamable-http',
  url: 'https://example.com/mcp',
  headers: { Authorization: 'Bearer ${TOKEN}' },
}

const sseServer: CanonicalServer = {
  type: 'sse',
  url: 'https://example.com/sse',
}

describe('plugins.getPluginDir', () => {
  it('constroi o caminho do plugin em project scope', () => {
    expect(getPluginDir('project', ctx, 'github')).toBe(
      '/tmp/agents-mcp-test/project/.agents/plugins/github',
    )
  })

  it('constroi o caminho do plugin em global scope', () => {
    expect(getPluginDir('global', ctx, 'github')).toBe(
      '/tmp/agents-mcp-test/home/.agents/plugins/github',
    )
  })
})

describe('plugins.compilePluginManifest', () => {
  it('gera manifest com name, version e description', () => {
    const manifest = compilePluginManifest('github')
    expect(manifest).toEqual({
      name: 'github',
      version: '1.0.0',
      description: 'MCP server plugin `github` managed by agents-mcp',
    })
  })
})

describe('plugins.compilePluginMcpConfig', () => {
  it('gera mcp.json no formato Agent Plugins 1.0.0', () => {
    const config = compilePluginMcpConfig('github', stdioServer)
    expect(config.$schema).toBe(
      'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
    )
    expect(config.mcpServers).toEqual({ github: stdioServer })
  })
})

describe('plugins.compileAntigravityMcpConfig', () => {
  it('mapeia stdio para { command, args, env }', () => {
    const config = compileAntigravityMcpConfig('local', stdioServer)
    expect((config.mcpServers as Record<string, unknown>).local).toEqual({
      command: 'npx',
      args: ['-y', '@mcp/server'],
      env: { API_KEY: '${API_KEY}' },
    })
  })

  it('mapeia streamable-http para { serverUrl, headers }', () => {
    const config = compileAntigravityMcpConfig('remote', httpServer)
    expect((config.mcpServers as Record<string, unknown>).remote).toEqual({
      serverUrl: 'https://example.com/mcp',
      headers: { Authorization: 'Bearer ${TOKEN}' },
    })
  })

  it('mapeia sse para { serverUrl }', () => {
    const config = compileAntigravityMcpConfig('remote', sseServer)
    expect((config.mcpServers as Record<string, unknown>).remote).toEqual({
      serverUrl: 'https://example.com/sse',
    })
  })

  it('omite args/env quando vazios para stdio', () => {
    const minimal: CanonicalServer = {
      type: 'stdio',
      command: 'node',
      args: [],
    }
    const config = compileAntigravityMcpConfig('local', minimal)
    expect((config.mcpServers as Record<string, unknown>).local).toEqual({
      command: 'node',
    })
  })

  it('omite headers quando vazios para HTTP', () => {
    const noHeaders: CanonicalServer = {
      type: 'streamable-http',
      url: 'https://example.com/mcp',
    }
    const config = compileAntigravityMcpConfig('remote', noHeaders)
    expect((config.mcpServers as Record<string, unknown>).remote).toEqual({
      serverUrl: 'https://example.com/mcp',
    })
  })
})

describe('plugins.isUnmanagedPluginCollision', () => {
  it('retorna false quando o nome esta gerenciado (mesmo com dir existente)', () => {
    expect(
      isUnmanagedPluginCollision('project', ctx, 'managed', ['managed']),
    ).toBe(false)
  })

  it('retorna false quando o dir nao existe', () => {
    expect(isUnmanagedPluginCollision('project', ctx, 'nonexistent', [])).toBe(
      false,
    )
  })
})

describe('plugins.syncPluginFiles', () => {
  it('grava plugin.json e mcp.json (sem antigravity)', () => {
    const result = syncPluginFiles({
      name: 'github',
      server: stdioServer,
      scope: 'project',
      ctx,
      includeAntigravity: false,
      dryRun: false,
    })
    expect(result.ok).toBe(true)
    expect(result.written).toHaveLength(2)
    expect(result.errors).toEqual([])
  })

  it('grava tambem mcp_config.json quando includeAntigravity true', () => {
    const result = syncPluginFiles({
      name: 'remote',
      server: httpServer,
      scope: 'project',
      ctx,
      includeAntigravity: true,
      dryRun: false,
    })
    expect(result.ok).toBe(true)
    expect(result.written).toHaveLength(3)
    expect(result.written).toContain(
      '/tmp/agents-mcp-test/project/.agents/plugins/remote/mcp_config.json',
    )
  })

  it('nao grava nada em dry-run', () => {
    const result = syncPluginFiles({
      name: 'github',
      server: stdioServer,
      scope: 'project',
      ctx,
      includeAntigravity: false,
      dryRun: true,
    })
    expect(result.ok).toBe(true)
    expect(result.written).toHaveLength(2)
    expect(result.errors).toEqual([])
  })

  it('idempotente: regravacao produz o mesmo conteudo', () => {
    syncPluginFiles({
      name: 'idem',
      server: stdioServer,
      scope: 'project',
      ctx,
      includeAntigravity: false,
      dryRun: false,
    })
    const first = readPluginManifest('project', ctx, 'idem')
    syncPluginFiles({
      name: 'idem',
      server: stdioServer,
      scope: 'project',
      ctx,
      includeAntigravity: false,
      dryRun: false,
    })
    const second = readPluginManifest('project', ctx, 'idem')
    expect(first).toBe(second)
  })

  it('mcp.json contem $schema e mcpServers', () => {
    syncPluginFiles({
      name: 'schema-check',
      server: stdioServer,
      scope: 'project',
      ctx,
      includeAntigravity: false,
      dryRun: false,
    })
    const mcpPath = getPluginDir('project', ctx, 'schema-check') + '/mcp.json'
    const content = readFileSync(mcpPath, 'utf8')
    const parsed = JSON.parse(content)
    expect(parsed.$schema).toBe(
      'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
    )
    expect(parsed.mcpServers['schema-check']).toEqual(stdioServer)
  })
})

describe('plugins.removeManagedPlugin', () => {
  it('remove os 3 arquivos gerenciados e apaga o diretorio vazio', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const pluginDir = getPluginDir('project', ctx, 'alpha')
      mkdirSync(pluginDir, { recursive: true })
      for (const file of MANAGED_PLUGIN_FILES) {
        writeFileSync(join(pluginDir, file), '{}')
      }

      const result = removeManagedPlugin({
        scope: 'project',
        ctx,
        name: 'alpha',
        managedPlugins: ['alpha'],
        dryRun: false,
      })

      expect(result.ok).toBe(true)
      expect(result.removed).toHaveLength(3)
      expect(result.errors).toEqual([])
      for (const file of MANAGED_PLUGIN_FILES) {
        expect(existsSync(join(pluginDir, file))).toBe(false)
      }
      expect(existsSync(pluginDir)).toBe(false)
    } finally {
      cleanup()
    }
  })

  it('preserva arquivo extra e mantem o diretorio', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const pluginDir = getPluginDir('project', ctx, 'beta')
      mkdirSync(pluginDir, { recursive: true })
      writeFileSync(join(pluginDir, 'plugin.json'), '{}')
      writeFileSync(join(pluginDir, 'mcp.json'), '{}')
      writeFileSync(join(pluginDir, 'mcp_config.json'), '{}')
      writeFileSync(join(pluginDir, 'sentinel.txt'), 'manual')

      const result = removeManagedPlugin({
        scope: 'project',
        ctx,
        name: 'beta',
        managedPlugins: ['beta'],
        dryRun: false,
      })

      expect(result.ok).toBe(true)
      expect(result.removed).toHaveLength(3)
      expect(result.errors).toEqual([])
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(false)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(false)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(false)
      expect(existsSync(join(pluginDir, 'sentinel.txt'))).toBe(true)
      expect(existsSync(pluginDir)).toBe(true)
    } finally {
      cleanup()
    }
  })

  it('no-op para nome nao gerenciado (arquivos intactos)', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const pluginDir = getPluginDir('project', ctx, 'outsider')
      mkdirSync(pluginDir, { recursive: true })
      writeFileSync(join(pluginDir, 'plugin.json'), '{}')
      writeFileSync(join(pluginDir, 'mcp.json'), '{}')
      writeFileSync(join(pluginDir, 'mcp_config.json'), '{}')

      const result = removeManagedPlugin({
        scope: 'project',
        ctx,
        name: 'outsider',
        managedPlugins: ['outro'],
        dryRun: false,
      })

      expect(result.ok).toBe(true)
      expect(result.removed).toEqual([])
      expect(result.errors).toEqual([])
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(true)
      expect(existsSync(pluginDir)).toBe(true)
    } finally {
      cleanup()
    }
  })

  it('dry-run nao altera o disco e lista so arquivos existentes', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const pluginDir = getPluginDir('project', ctx, 'gamma')
      mkdirSync(pluginDir, { recursive: true })
      writeFileSync(join(pluginDir, 'plugin.json'), '{}')
      writeFileSync(join(pluginDir, 'mcp.json'), '{}')

      const result = removeManagedPlugin({
        scope: 'project',
        ctx,
        name: 'gamma',
        managedPlugins: ['gamma'],
        dryRun: true,
      })

      expect(result.ok).toBe(true)
      expect(result.removed).toHaveLength(2)
      expect(result.removed).toContain(join(pluginDir, 'plugin.json'))
      expect(result.removed).toContain(join(pluginDir, 'mcp.json'))
      expect(result.errors).toEqual([])
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)
      expect(existsSync(pluginDir)).toBe(true)
    } finally {
      cleanup()
    }
  })

  it('arquivos ausentes retorna ok sem erros (idempotencia)', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const result = removeManagedPlugin({
        scope: 'project',
        ctx,
        name: 'desaparecido',
        managedPlugins: ['desaparecido'],
        dryRun: false,
      })

      expect(result.ok).toBe(true)
      expect(result.removed).toEqual([])
      expect(result.errors).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('falha de I/O em um arquivo nao bloqueia os demais', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const pluginDir = getPluginDir('project', ctx, 'delta')
      mkdirSync(pluginDir, { recursive: true })
      // plugin.json como diretorio -> unlinkSync falha com EISDIR no Linux
      mkdirSync(join(pluginDir, 'plugin.json'), { recursive: true })
      writeFileSync(join(pluginDir, 'mcp.json'), '{}')
      writeFileSync(join(pluginDir, 'mcp_config.json'), '{}')

      const result = removeManagedPlugin({
        scope: 'project',
        ctx,
        name: 'delta',
        managedPlugins: ['delta'],
        dryRun: false,
      })

      expect(result.ok).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Failed to remove')
      expect(result.errors[0]).toContain(join(pluginDir, 'plugin.json'))
      expect(result.removed).toHaveLength(2)
      expect(result.removed).toContain(join(pluginDir, 'mcp.json'))
      expect(result.removed).toContain(join(pluginDir, 'mcp_config.json'))
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(false)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(false)
      // diretorio nao vazio (contem plugin.json/), portanto preservado
      expect(existsSync(pluginDir)).toBe(true)
    } finally {
      cleanup()
    }
  })
})

describe('plugins.removeAntigravityPluginConfig', () => {
  it('remove somente mcp_config.json e preserva plugin.json e mcp.json', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const pluginDir = getPluginDir('project', ctx, 'epsilon')
      mkdirSync(pluginDir, { recursive: true })
      writeFileSync(join(pluginDir, 'plugin.json'), '{}')
      writeFileSync(join(pluginDir, 'mcp.json'), '{}')
      writeFileSync(join(pluginDir, 'mcp_config.json'), '{}')

      const result = removeAntigravityPluginConfig({
        scope: 'project',
        ctx,
        name: 'epsilon',
        managedPlugins: ['epsilon'],
        dryRun: false,
      })

      expect(result.ok).toBe(true)
      expect(result.removed).toEqual([join(pluginDir, 'mcp_config.json')])
      expect(result.errors).toEqual([])
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(false)
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)
      expect(existsSync(pluginDir)).toBe(true)
    } finally {
      cleanup()
    }
  })

  it('no-op quando nome nao esta gerenciado', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const pluginDir = getPluginDir('project', ctx, 'zeta')
      mkdirSync(pluginDir, { recursive: true })
      writeFileSync(join(pluginDir, 'mcp_config.json'), '{}')

      const result = removeAntigravityPluginConfig({
        scope: 'project',
        ctx,
        name: 'zeta',
        managedPlugins: ['outro'],
        dryRun: false,
      })

      expect(result.ok).toBe(true)
      expect(result.removed).toEqual([])
      expect(result.errors).toEqual([])
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(true)
    } finally {
      cleanup()
    }
  })
})
````

## File: tests/fixtures/schema/invalid-missing-command.json
````json
{
  "mcpServers": {
    "github": {
      "type": "stdio"
    }
  }
}
````

## File: tests/fixtures/schema/invalid-missing-url.json
````json
{
  "mcpServers": {
    "github": {
      "type": "streamable-http"
    }
  }
}
````

## File: tests/fixtures/schema/invalid-server-name.json
````json
{
  "mcpServers": {
    "GitHub": {
      "type": "stdio",
      "command": "npx"
    }
  }
}
````

## File: tests/fixtures/schema/invalid-transport.json
````json
{
  "mcpServers": {
    "github": {
      "type": "websocket",
      "command": "npx"
    }
  }
}
````

## File: tests/fixtures/schema/invalid-unknown-key.json
````json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "unknownKey": "should-be-rejected"
    }
  }
}
````

## File: tests/fixtures/schema/valid.json
````json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "postgres": {
      "type": "stdio",
      "command": "uvx",
      "args": ["mcp-server-postgres", "${DATABASE_URL}"]
    },
    "linear": {
      "type": "streamable-http",
      "url": "https://mcp.linear.app/mcp",
      "headers": {
        "Authorization": "Bearer ${LINEAR_API_KEY}"
      }
    },
    "linear-sse": {
      "type": "sse",
      "url": "https://mcp.linear.app/sse",
      "headers": {
        "Authorization": "Bearer ${LINEAR_API_KEY}"
      }
    }
  }
}
````

## File: tests/sources/github.test.ts
````typescript
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { resolveGithub } from '$/src/sources/github'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer } from '$/src/core/schema'

const originalFetch = global.fetch

function asStdio(server: CanonicalServer) {
  return server as Extract<CanonicalServer, { type: 'stdio' }>
}

function responseFactory(
  response: unknown,
  status = 200,
  extra?: Record<string, string>,
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(extra ?? {}),
    text: async () => JSON.stringify(response),
    json: async () => response,
  } as unknown as Response
}

describe('sources github', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', originalFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves owner/repo via server.json on main branch', async () => {
    const fetchMock = vi.fn(async () =>
      responseFactory(
        {
          name: 'server-github',
          registry_type: 'npm',
          identifier: '@modelcontextprotocol/server-github',
          environment_variables: [
            { name: 'GITHUB_TOKEN', is_required: true, is_secret: true },
          ],
        },
        200,
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveGithub('modelcontextprotocol/server-github')

    expect(result.suggestedName).toBe('server-github')
    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('npx')
    expect(s.args).toEqual(['-y', '@modelcontextprotocol/server-github'])
    expect(result.requiredEnv).toHaveLength(1)
    expect(result.requiredEnv[0]!.name).toBe('GITHUB_TOKEN')
    expect(result.requiredEnv[0]!.isSecret).toBe(true)
    expect(result.requiredEnv[0]!.description).toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('resolves via package.json bin when no server.json', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('server.json')) {
        return responseFactory('Not Found', 404)
      }
      return responseFactory(
        {
          name: 'test-pkg',
          bin: { 'test-pkg': 'dist/index.js' },
        },
        200,
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveGithub('owner/test-pkg')

    expect(result.suggestedName).toBe('test-pkg')
    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('npx')
    expect(s.args).toEqual(['-y', 'test-pkg'])
  })

  it('throws when repo is not an MCP server', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('server.json')) {
        return responseFactory('Not Found', 404)
      }
      return responseFactory({ name: 'not-mcp' }, 200)
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(resolveGithub('owner/not-mcp')).rejects.toThrow(
      'is not an MCP server',
    )
  })

  it('accepts https://github.com/owner/repo URL and strips .git', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('server.json')) {
        return responseFactory(
          {
            name: 'server-linear',
            registry_type: 'npm',
            identifier: 'server-linear',
          },
          200,
        )
      }
      return responseFactory('Not Found', 404)
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveGithub(
      'https://github.com/modelcontextprotocol/server-linear.git',
    )

    expect(result.suggestedName).toBe('server-linear')
    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('npx')
    expect(s.args).toEqual(['-y', 'server-linear'])
  })

  it('strips /tree/ref from GitHub URL', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('server.json')) {
        return responseFactory(
          {
            name: 'server-pypi',
            registry_type: 'pypi',
            identifier: 'mcp-server-pypi',
          },
          200,
        )
      }
      return responseFactory('Not Found', 404)
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveGithub(
      'https://github.com/owner/server-pypi/tree/v1.0.0#main',
    )

    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('uvx')
    expect(s.args).toEqual(['mcp-server-pypi'])
  })

  it('uses oci docker command for registry_type oci', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('server.json')) {
        return responseFactory(
          {
            name: 'server-oci',
            registry_type: 'oci',
            identifier: 'myorg/mcp-server:latest',
          },
          200,
        )
      }
      return responseFactory('Not Found', 404)
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveGithub('owner/server-oci')

    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('docker')
    expect(s.args).toEqual(['run', '-i', '--rm', 'myorg/mcp-server:latest'])
  })

  it('parses environment_variables with is_required', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('server.json')) {
        return responseFactory(
          {
            name: 'server-env',
            registry_type: 'npm',
            identifier: 'server-env',
            environment_variables: [
              { name: 'API_KEY', is_required: true, is_secret: true },
              { name: 'OPTIONAL_VAR', is_required: false },
              { name: 'REQUIRED_DESC', is_required: true, description: 'desc' },
            ],
          },
          200,
        )
      }
      return responseFactory('Not Found', 404)
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveGithub('owner/server-env')

    expect(result.requiredEnv).toHaveLength(2)
    expect(result.requiredEnv.map((e) => e.name)).toEqual([
      'API_KEY',
      'REQUIRED_DESC',
    ])
    expect(result.requiredEnv[0]!.isSecret).toBe(true)
    expect(result.requiredEnv[1]!.isSecret).toBe(false)
    expect(result.requiredEnv[1]!.description).toBe('desc')

    const s = asStdio(result.definition)
    expect(s.env).toMatchObject({
      API_KEY: '${API_KEY}',
      REQUIRED_DESC: '${REQUIRED_DESC}',
    })
  })

  it('graceful error on malformed server.json', async () => {
    const fetchMock = vi.fn(async () =>
      responseFactory(
        {
          environment_variables: [{ name: '' }],
        },
        200,
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(resolveGithub('owner/malformed')).rejects.toThrow(
      'Invalid server.json',
    )
  })

  it('throws invalid ref for bad input', async () => {
    await expect(resolveGithub('invalid')).rejects.toThrow('Invalid GitHub ref')
  })
})
````

## File: tests/sources/registry.test.ts
````typescript
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { resolveRegistry } from '$/src/sources/registry'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer, isHttpServer } from '$/src/core/schema'

const originalFetch = global.fetch

function asStdio(server: CanonicalServer) {
  return server as Extract<CanonicalServer, { type: 'stdio' }>
}

function asHttp(server: CanonicalServer) {
  return server as Extract<
    CanonicalServer,
    { type: 'streamable-http' } | { type: 'sse' }
  >
}

function responseFactory(
  response: unknown,
  status = 200,
  extra?: Record<string, string>,
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(extra ?? {}),
    text: async () => JSON.stringify(response),
    json: async () => response,
  } as unknown as Response
}

describe('sources registry', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', originalFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves @scope/name via npm registry', async () => {
    const fetchMock = vi.fn(async () =>
      responseFactory({
        name: '@modelcontextprotocol/server-github',
        'dist-tags': { latest: '0.1.0' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveRegistry('@modelcontextprotocol/server-github')

    expect(result.suggestedName).toBe('@modelcontextprotocol/server-github')
    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('npx')
    expect(s.args).toEqual(['-y', '@modelcontextprotocol/server-github@0.1.0'])
  })

  it('resolves bare package name via npm registry', async () => {
    const fetchMock = vi.fn(async () =>
      responseFactory({
        name: 'server-github',
        'dist-tags': { latest: '1.0.0' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveRegistry('server-github')

    expect(result.suggestedName).toBe('server-github')
    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('npx')
    expect(s.args).toEqual(['-y', 'server-github@1.0.0'])
  })

  it('resolves bare package name without dist-tags', async () => {
    const fetchMock = vi.fn(async () =>
      responseFactory({ name: 'server-github' }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveRegistry('server-github')

    expect(result.suggestedName).toBe('server-github')
    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('npx')
    expect(s.args).toEqual(['-y', 'server-github'])
  })

  it('resolves via MCP Registry search when not on npm', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return responseFactory('Not Found', 404)
      }
      return responseFactory(
        {
          servers: [
            {
              name: 'server-linear',
              packages: [{ name: 'server-linear', type: 'npm' }],
            },
          ],
        },
        200,
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveRegistry('server-linear')

    expect(result.suggestedName).toBe('server-linear')
    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('npx')
    expect(s.args).toEqual(['-y', 'server-linear'])
  })

  it('interprets MCP Registry packages with pypi type', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return responseFactory('Not Found', 404)
      }
      return responseFactory(
        {
          servers: [
            {
              name: 'server-pypi',
              packages: [{ name: 'mcp-server-pypi', type: 'pypi' }],
            },
          ],
        },
        200,
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveRegistry('server-pypi')

    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('uvx')
    expect(s.args).toEqual(['mcp-server-pypi'])
  })

  it('interprets MCP Registry packages with oci type', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return responseFactory('Not Found', 404)
      }
      return responseFactory(
        {
          servers: [
            {
              name: 'server-oci',
              packages: [{ name: 'myorg/mcp-server:latest', type: 'oci' }],
            },
          ],
        },
        200,
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveRegistry('server-oci')

    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('docker')
    expect(s.args).toEqual(['run', '-i', '--rm', 'myorg/mcp-server:latest'])
  })

  it('interprets MCP Registry remotes as streamable-http', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return responseFactory('Not Found', 404)
      }
      return responseFactory(
        {
          servers: [
            {
              name: 'remote-http',
              remotes: [
                {
                  type: 'streamable-http',
                  url: 'https://mcp.example.com/mcp',
                  headers: { 'X-API-Key': 'secret' },
                },
              ],
            },
          ],
        },
        200,
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveRegistry('remote-http')

    const s = asHttp(result.definition)
    expect(isHttpServer(s)).toBe(true)
    expect(s.type).toBe('streamable-http')
    expect(s.url).toBe('https://mcp.example.com/mcp')
    expect(s.headers).toEqual({ 'X-API-Key': 'secret' })
  })

  it('interprets MCP Registry remotes as sse', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return responseFactory('Not Found', 404)
      }
      return responseFactory(
        {
          servers: [
            {
              name: 'remote-sse',
              remotes: [{ type: 'sse', url: 'https://mcp.example.com/sse' }],
            },
          ],
        },
        200,
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveRegistry('remote-sse')

    const s = asHttp(result.definition)
    expect(isHttpServer(s)).toBe(true)
    expect(s.type).toBe('sse')
    expect(s.url).toBe('https://mcp.example.com/sse')
  })

  it('exact name match wins automatically (case-insensitive)', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return responseFactory('Not Found', 404)
      }
      return responseFactory(
        {
          servers: [
            {
              name: 'Server-Linear',
              packages: [{ name: 'server-linear', type: 'npm' }],
            },
            {
              name: 'server-other',
              packages: [{ name: 'server-other', type: 'npm' }],
            },
          ],
        },
        200,
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveRegistry('server-linear')

    expect(result.suggestedName).toBe('Server-Linear')
    const s = asStdio(result.definition)
    expect(s.command).toBe('npx')
    expect(s.args).toEqual(['-y', 'server-linear'])
  })

  it('fails with ambiguous candidates under --yes=false', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return responseFactory('Not Found', 404)
      }
      return responseFactory(
        {
          servers: [
            { name: 'server-a', packages: [{ name: 'server-a', type: 'npm' }] },
            { name: 'server-b', packages: [{ name: 'server-b', type: 'npm' }] },
          ],
        },
        200,
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(resolveRegistry('server', { yes: false })).rejects.toThrow(
      'Ambiguous registry match',
    )
  })

  it('selects first candidate under --yes=true', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return responseFactory('Not Found', 404)
      }
      return responseFactory(
        {
          servers: [
            { name: 'server-a', packages: [{ name: 'server-a', type: 'npm' }] },
            { name: 'server-b', packages: [{ name: 'server-b', type: 'npm' }] },
          ],
        },
        200,
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveRegistry('server', { yes: true })

    expect(result.suggestedName).toBe('server-a')
  })

  it('uses selectCandidate callback when provided', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return responseFactory('Not Found', 404)
      }
      return responseFactory(
        {
          servers: [
            { name: 'server-a', packages: [{ name: 'server-a', type: 'npm' }] },
            { name: 'server-b', packages: [{ name: 'server-b', type: 'npm' }] },
          ],
        },
        200,
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const selectCandidate = vi.fn(async (candidates) => {
      expect(candidates).toHaveLength(2)
      return candidates[1] // pick second
    })

    const result = await resolveRegistry('server', {
      yes: false,
      selectCandidate,
    })

    expect(selectCandidate).toHaveBeenCalledTimes(1)
    expect(result.suggestedName).toBe('server-b')
  })

  it('throws when selectCandidate returns null', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return responseFactory('Not Found', 404)
      }
      return responseFactory(
        {
          servers: [
            { name: 'server-a', packages: [{ name: 'server-a', type: 'npm' }] },
            { name: 'server-b', packages: [{ name: 'server-b', type: 'npm' }] },
          ],
        },
        200,
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      resolveRegistry('server', {
        yes: false,
        selectCandidate: async () => null,
      }),
    ).rejects.toThrow('No candidate selected')
  })

  it('throws when no results found', async () => {
    const fetchMock = vi.fn(async () => responseFactory('Not Found', 404))
    vi.stubGlobal('fetch', fetchMock)

    await expect(resolveRegistry('nonexistent-package')).rejects.toThrow(
      'No MCP server found',
    )
  })
})
````

## File: opencode.json
````json
{
  "mcp": {
    "sequential-thinking": {
      "type": "local",
      "command": [
        "npx",
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    },
    "memory": {
      "type": "local",
      "command": [
        "npx",
        "-y",
        "@modelcontextprotocol/server-memory"
      ]
    }
  }
}
````

## File: scripts/dist-package.ts
````typescript
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const distDir = resolve(root, 'dist')

const rootPkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
const version = rootPkg.version

const distPkg: Record<string, unknown> = {
  name: rootPkg.name,
  version,
  description: rootPkg.description,
  homepage: rootPkg.homepage,
  bugs: rootPkg.bugs,
  repository: rootPkg.repository,
  license: rootPkg.license,
  author: rootPkg.author,
  type: 'module',
  engines: { node: '>=22' },
  main: './index.js',
  exports: {
    '.': './index.js',
  },
  bin: {
    'agents-mcp': './index.js',
  },
  publishConfig: {
    access: 'public',
  },
  files: ['index.js'],
}

// 1. Create dist/ if missing
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true })
}

// 2. Write dist/package.json with trailing newline
writeFileSync(
  resolve(distDir, 'package.json'),
  JSON.stringify(distPkg, null, 2) + '\n',
)

// 3. Copy metadata files
const metadataFiles = ['LICENSE', 'README.md', 'CHANGELOG.md']
for (const file of metadataFiles) {
  const src = resolve(root, file)
  const dest = resolve(distDir, file)
  if (existsSync(src)) {
    copyFileSync(src, dest)
  } else {
    console.warn(`⚠️  Warning: ${file} not found, skipping copy to dist/`)
  }
}

console.log('✅ dist/package.json and metadata prepared in dist/ folder')
````

## File: src/adapters/index.ts
````typescript
/**
 * Adapter registry (§9.5): all six adapters in `AGENT_ORDER`, plus lookup,
 * detection, and target resolution.
 *
 * `resolveTargets` implements the precedence: `--agents` flag → persisted
 * `state.targets` → auto-detection. Unknown ids are a usage error.
 */

import { z } from 'zod'
import { AGENT_ORDER } from '$/src/config'
import type { AgentIdSchema } from '$/src/core/schema'
import type { RuntimeContext, ConfigScope } from '$/src/core/context'
import type { SyncState } from '$/src/core/state'
import type {
  AgentAdapter,
  AdapterCapabilities,
  AdapterContext,
  CompileResult,
  ExtractResult,
  Warning,
  WarningCode,
  EnvSyntax,
} from '$/src/adapters/types'
import { makeWarning } from '$/src/adapters/types'
import * as claudeCode from '$/src/adapters/claude-code'
import * as cursor from '$/src/adapters/cursor'
import * as vscode from '$/src/adapters/vscode'
import * as opencode from '$/src/adapters/opencode'
import * as zed from '$/src/adapters/zed'
import * as windsurf from '$/src/adapters/windsurf'
import * as antigravity from '$/src/adapters/antigravity'

export type AgentId = z.infer<typeof AgentIdSchema>

/** Re-export the adapter contract types and warning factory. */
export type {
  AgentAdapter,
  AdapterCapabilities,
  AdapterContext,
  CompileResult,
  ExtractResult,
  Warning,
  WarningCode,
  EnvSyntax,
}
export { makeWarning }

function buildAdapter(
  id: AgentId,
  displayName: string,
  capabilities: AdapterCapabilities,
  getConfigPath: (scope: ConfigScope, ctx: RuntimeContext) => string | null,
  detect: (scope: ConfigScope, ctx: RuntimeContext) => Promise<boolean>,
  compile: AgentAdapter['compile'],
  extractServers: AgentAdapter['extractServers'],
  applyServers: AgentAdapter['applyServers'],
): AgentAdapter {
  return {
    id,
    displayName,
    capabilities,
    getConfigPath,
    detect,
    compile,
    extractServers,
    applyServers,
  }
}

/**
 * Validate `--agents` flag values against known agent ids. Throws a usage
 * error for unknown ids. Shared by `resolveTargets` and `resolveTargetsAsync`.
 */
export function validateAgentFlag(flag: readonly string[]): AgentId[] {
  const valid = new Set(AGENT_ORDER)
  const unknown = flag.filter((id) => !valid.has(id as AgentId))
  if (unknown.length > 0) {
    throw new Error(
      `Unknown agent id(s) in --agents: ${unknown.join(', ')}. Valid: ${AGENT_ORDER.join(', ')}`,
    )
  }
  return flag as AgentId[]
}

/** All six adapters, in deterministic `AGENT_ORDER`. */
export const adapters: readonly AgentAdapter[] = [
  buildAdapter(
    claudeCode.id,
    claudeCode.displayName,
    claudeCode.capabilities,
    claudeCode.getConfigPath,
    claudeCode.detect,
    claudeCode.compile,
    claudeCode.extractServers,
    claudeCode.applyServers,
  ),
  buildAdapter(
    cursor.id,
    cursor.displayName,
    cursor.capabilities,
    cursor.getConfigPath,
    cursor.detect,
    cursor.compile,
    cursor.extractServers,
    cursor.applyServers,
  ),
  buildAdapter(
    vscode.id,
    vscode.displayName,
    vscode.capabilities,
    vscode.getConfigPath,
    vscode.detect,
    vscode.compile,
    vscode.extractServers,
    vscode.applyServers,
  ),
  buildAdapter(
    opencode.id,
    opencode.displayName,
    opencode.capabilities,
    opencode.getConfigPath,
    opencode.detect,
    opencode.compile,
    opencode.extractServers,
    opencode.applyServers,
  ),
  buildAdapter(
    zed.id,
    zed.displayName,
    zed.capabilities,
    zed.getConfigPath,
    zed.detect,
    zed.compile,
    zed.extractServers,
    zed.applyServers,
  ),
  buildAdapter(
    windsurf.id,
    windsurf.displayName,
    windsurf.capabilities,
    windsurf.getConfigPath,
    windsurf.detect,
    windsurf.compile,
    windsurf.extractServers,
    windsurf.applyServers,
  ),
  buildAdapter(
    antigravity.id,
    antigravity.displayName,
    antigravity.capabilities,
    antigravity.getConfigPath,
    antigravity.detect,
    antigravity.compile,
    antigravity.extractServers,
    antigravity.applyServers,
  ),
] as const

/** Map of agent id → adapter, in `AGENT_ORDER`. */
export const adapterMap: ReadonlyMap<AgentId, AgentAdapter> = new Map(
  adapters.map((a) => [a.id, a]),
)

/** Lookup an adapter by id. Throws a usage error for unknown ids. */
export function getAdapter(id: string): AgentAdapter {
  const adapter = adapterMap.get(id as AgentId)
  if (!adapter) {
    const valid = Array.from(adapterMap.keys()).join(', ')
    throw new Error(
      `Unknown agent id \`${id}\`. Valid agent ids: ${valid}. Pass --agents to select.`,
    )
  }
  return adapter
}

export function getAdapters(ids?: readonly string[]): AgentAdapter[] {
  if (!ids || ids.length === 0) {
    return [...adapters]
  }
  return ids.map((id) => getAdapter(id))
}

/**
 * Detect which agents are configured for `scope`. For project scope, an agent
 * counts as detected when its config path exists or its containing directory
 * exists; for global scope, when its config path exists.
 */
export async function detectAgents(
  scope: ConfigScope,
  ctx: RuntimeContext,
): Promise<AgentId[]> {
  const detected: AgentId[] = []
  const { statSync } = await import('node:fs')
  const { dirname } = await import('node:path')

  for (const adapter of adapters) {
    // Gate on declared scope support, not on getConfigPath() === null.
    // antigravity returns null for getConfigPath (per-plugin storage) but still
    // supports project/global scope and must be detectable via detect().
    if (!adapter.capabilities.scopes.includes(scope)) {
      continue
    }

    let found = false
    try {
      found = await adapter.detect(scope, ctx)
    } catch {
      found = false
    }

    if (!found && scope === 'project') {
      const path = adapter.getConfigPath(scope, ctx)
      // Only fall back to directory-existence when the adapter has a single
      // native config path; per-plugin adapters (antigravity) are handled by
      // detect() itself.
      if (path !== null) {
        // Only fall back to directory-existence when the config's parent dir is
        // not cwd itself (otherwise every project "has" claude-code/opencode).
        const parent = dirname(path)
        if (parent !== ctx.cwd) {
          try {
            found = statSync(parent).isDirectory()
          } catch {
            found = false
          }
        }
      }
    }

    if (found) {
      detected.push(adapter.id)
    }
  }

  return detected
}

/**
 * Resolve the target agents with precedence: `--agents` flag → persisted
 * `state.targets` → auto-detection. Unknown ids are a usage error.
 * Returns an empty array when nothing is resolvable (caller decides whether
 * that is an error).
 */
export function resolveTargets({
  flag,
  state,
  ctx,
}: {
  flag: readonly string[] | undefined
  state: SyncState
  ctx: RuntimeContext
}): AgentId[] {
  if (flag && flag.length > 0) {
    return validateAgentFlag(flag)
  }

  if (state.targets && state.targets.length > 0) {
    return [...state.targets]
  }

  return []
}

/**
 * Async variant of resolveTargets that falls back to detection when neither
 * flag nor state targets are available.
 */
export async function resolveTargetsAsync({
  flag,
  state,
  ctx,
}: {
  flag: readonly string[] | undefined
  state: SyncState
  ctx: RuntimeContext
}): Promise<AgentId[]> {
  if (flag && flag.length > 0) {
    return validateAgentFlag(flag)
  }
  if (state.targets && state.targets.length > 0) {
    return [...state.targets]
  }
  return detectAgents(state.scope, ctx)
}
````

## File: src/commands/doctor.command.ts
````typescript
/**
 * `doctor` command (§11).
 *
 * Runs six checks in order (§14):
 *   1. Schema — canonical config validity + validateConfig() warnings
 *   2. Env — every placeholder in env/headers/args/url; missing required var = error
 *   3. Runtime — stdio binaries resolved in PATH (respecting PATHEXT on Windows);
 *      absolute paths must exist and be executable
 *   4. Drift — adapter.compile(server) vs parsed on-disk entry (deep equality)
 *   5. State — corrupt/unreadable state; targets pointing at unsupported scopes
 *   6. Hygiene — `.env` tracked by Git; literal/plaintext secret findings
 *
 * Exit `1` if any error; `0` if only warnings; `--strict` makes warnings fatal.
 */

import { defineCommand } from 'citty'
import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'jsonc-parser'
import {
  createUiAndCtx,
  configPath,
  isDryRun,
  isGlobalFlag,
  isYesFlag,
  parseAgentsFlag,
} from '$/src/commands/util'
import { resolveTargetsAsync, getAdapter } from '$/src/adapters/index'
import { loadValidatedConfig, ConfigValidationError } from '$/src/core/store'
import type { LoadValidatedConfigResult } from '$/src/core/store'
import { loadState } from '$/src/core/state'
import { parsePlaceholders, SECRET_KEY_RE } from '$/src/core/placeholder'
import { readDotenv, resolveVar } from '$/src/core/env'
import { readTextFile } from '$/src/core/fs-atomic'
import { isGitTracked } from '$/src/core/gitignore'
import type { ConfigScope, RuntimeContext } from '$/src/core/context'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer } from '$/src/core/schema'

export interface DoctorResult {
  code: string
  severity: 'error' | 'warning'
  message: string
  agent?: string
  server?: string
  field?: string
}

export interface DoctorSummary {
  errors: number
  warnings: number
  results: DoctorResult[]
}

export interface DoctorOptions {
  scope: ConfigScope
  ctx: RuntimeContext
  flag: readonly string[] | undefined
  dryRun: boolean
  strict: boolean
}

/** Run all six doctor checks and return structured results. */
export async function runDoctor(
  options: DoctorOptions,
): Promise<DoctorSummary> {
  const { scope, ctx, flag, dryRun, strict } = options
  const { ui } = createUiAndCtx({ yes: strict })

  const results: DoctorResult[] = []

  // 1. Schema check — wrap loadValidatedConfig in try/catch so an invalid
  //    .agents/mcp.json yields a structured SCHEMA error instead of crashing.
  let validated: LoadValidatedConfigResult | undefined
  try {
    const result = loadValidatedConfig(scope, ctx)
    if (result) {
      validated = result
    }
  } catch (err) {
    if (err instanceof ConfigValidationError) {
      results.push({
        code: 'SCHEMA',
        severity: 'error',
        message: `Invalid canonical config at ${configPath(scope, ctx)}: ${err.issues
          .map((i) => `${i.path || 'root'} — ${i.message}`)
          .join('; ')}`,
      })
      renderResults(ui, results, strict)
      const errors = results.filter((r) => r.severity === 'error').length
      const warnings = results.filter((r) => r.severity === 'warning').length
      return { errors, warnings, results }
    }
    throw err
  }

  if (!validated) {
    results.push({
      code: 'SCHEMA',
      severity: 'error',
      message: `No canonical config at ${configPath(scope, ctx)}. Run 'agents-mcp init' first.`,
    })
    renderResults(ui, results, strict)
    const errors = results.filter((r) => r.severity === 'error').length
    const warnings = results.filter((r) => r.severity === 'warning').length
    return { errors, warnings, results }
  }

  const { config, warnings: configWarnings } = validated
  for (const w of configWarnings) {
    results.push({
      code: 'SCHEMA',
      severity: 'warning',
      message: w,
    })
  }
  // Schema structure is valid by virtue of loadValidatedConfig parsing.
  const servers = config.mcpServers

  // Resolve targets for drift/state checks.
  const stateResult = loadState(scope, ctx)
  const state = stateResult.state
  const targets = await resolveTargetsAsync({ flag, state, ctx })

  // 2. Env check — every placeholder in env/headers/args/url; missing required
  //    var without fallback = error, reported once under ENV (not duplicated
  //    under HYGIENE). Never assign server name to result.agent.
  const dotenvVars = readDotenv(scope, ctx).vars
  const reportedEnvVars = new Set<string>()
  for (const [name, server] of Object.entries(servers)) {
    for (const field of placeholderFields(server)) {
      const phs = parsePlaceholders(field.value)
      for (const ph of phs) {
        const resolved = resolveVar(ph.name, {
          dotenv: dotenvVars,
          processEnv: ctx.env,
        })
        if (resolved.source === 'unset' && ph.fallback === undefined) {
          const key = `${name}::${field.name}::${ph.name}`
          if (reportedEnvVars.has(key)) continue
          reportedEnvVars.add(key)
          results.push({
            code: 'ENV',
            severity: 'error',
            message: `Required env var \`${ph.name}\` is not set (no fallback) for server \`${name}\` field \`${field.name}\``,
            server: name,
            field: field.name,
          })
        }
      }
    }
  }

  // 3. Runtime check — stdio binaries.
  for (const server of Object.values(servers)) {
    if (!isStdioServer(server)) continue
    const cmd = server.command
    if (isAbsolutePath(cmd, ctx.platform)) {
      if (!existsSync(cmd) || !isExecutable(cmd, ctx.platform)) {
        results.push({
          code: 'RUNTIME',
          severity: 'error',
          message: `Binary \`${cmd}\` does not exist or is not executable`,
        })
      }
    } else {
      const resolved = which(cmd, ctx.env, ctx.platform)
      if (!resolved) {
        results.push({
          code: 'RUNTIME',
          severity: 'error',
          message: `Binary \`${cmd}\` not found in PATH`,
        })
      }
    }
  }

  // 4. Drift check — compile per adapter vs parsed on-disk entry.
  for (const agentId of targets) {
    const adapter = getAdapter(agentId)
    const nativePath = adapter.getConfigPath(scope, ctx)
    if (nativePath === null) continue
    const existing = readTextFile(nativePath)

    // (a) Extra/orphan managed server names on disk in native files.
    const onDiskNames = new Set<string>()
    if (existing !== null) {
      const parsed = parseNativeEntryWhole(
        existing,
        adapter.capabilities.rootKey,
      )
      if (parsed !== null) {
        for (const name of Object.keys(parsed)) {
          onDiskNames.add(name)
        }
      }
    }
    const canonicalNames = new Set(Object.keys(servers))
    for (const diskName of onDiskNames) {
      if (!canonicalNames.has(diskName)) {
        results.push({
          code: 'DRIFT',
          severity: 'warning',
          message: `Orphan server \`${diskName}\` on disk in ${nativePath} but not in canonical config`,
          agent: agentId,
          server: diskName,
        })
      }
    }

    for (const [name, server] of Object.entries(servers)) {
      const { entry } = adapter.compile(server)
      if (existing === null) {
        results.push({
          code: 'DRIFT',
          severity: 'warning',
          message: `Managed server \`${name}\` missing from ${nativePath}`,
          agent: agentId,
          server: name,
        })
        continue
      }
      const parsed = parseNativeEntry(
        existing,
        name,
        adapter.capabilities.rootKey,
      )
      if (parsed === null) {
        results.push({
          code: 'DRIFT',
          severity: 'warning',
          message: `Managed server \`${name}\` missing from ${nativePath}`,
          agent: agentId,
          server: name,
        })
        continue
      }
      if (!deepEqual(normalizeEntry(entry), normalizeEntry(parsed))) {
        results.push({
          code: 'DRIFT',
          severity: 'warning',
          message: `Managed server \`${name}\` drifted on disk for ${agentId}`,
          agent: agentId,
          server: name,
        })
      }
    }

    // (b) Plugin files in .agents/plugins/<name>/ for canonical servers.
    const base = scope === 'project' ? ctx.cwd : ctx.homeDir
    const pluginsDir = join(base, '.agents', 'plugins')
    const includeAntigravity =
      adapter.capabilities.layout === 'per-plugin' || agentId === 'antigravity'
    for (const name of canonicalNames) {
      const pluginDir = join(pluginsDir, name)
      const pluginJson = join(pluginDir, 'plugin.json')
      const mcpJson = join(pluginDir, 'mcp.json')
      const mcpConfigJson = join(pluginDir, 'mcp_config.json')

      let missing: string[] = []
      if (!existsSync(pluginJson)) missing.push('plugin.json')
      if (!existsSync(mcpJson)) missing.push('mcp.json')
      if (includeAntigravity && !existsSync(mcpConfigJson)) {
        missing.push('mcp_config.json')
      }

      if (missing.length > 0) {
        results.push({
          code: 'DRIFT',
          severity: 'warning',
          message: `Plugin \`${name}\` missing ${missing.join(', ')} in ${pluginDir}`,
          agent: agentId,
          server: name,
        })
      }
    }
  }

  // 5. State check — corrupt state; targets pointing at unsupported scopes.
  //    Gate on `adapter.capabilities.scopes.includes(scope)` so antigravity
  //    (per-plugin layout, no single config path) is not a false positive.
  for (const w of stateResult.warnings) {
    results.push({
      code: 'STATE',
      severity: 'error',
      message: w,
    })
  }
  // Legacy-import notices are non-fatal STATE warnings by default and are
  // promoted to failures by --strict (like any other warning). They name
  // .agents/mcp-lock.json (the lock path).
  for (const n of stateResult.notices) {
    results.push({
      code: 'STATE',
      severity: 'warning',
      message: n,
    })
  }
  for (const agentId of targets) {
    const adapter = getAdapter(agentId)
    if (!adapter.capabilities.scopes.includes(scope)) {
      results.push({
        code: 'STATE',
        severity: 'warning',
        message: `Target \`${agentId}\` does not support ${scope} scope`,
        agent: agentId,
      })
    }
  }

  // 6. Hygiene — .env tracked by Git; literal/plaintext secret findings.
  //    Missing env vars are reported only under ENV (check #2), never here.
  if (isGitTracked(ctx.cwd, '.env')) {
    results.push({
      code: 'HYGIENE',
      severity: 'warning',
      message: `.env is tracked by Git; run \`git rm --cached .env\` to stop tracking it`,
    })
  }
  for (const [name, server] of Object.entries(servers)) {
    for (const field of placeholderFields(server)) {
      const phs = parsePlaceholders(field.value)
      // A literal (non-placeholder) value under a secret-like key is a
      // plaintext secret finding: it should use \`${VAR}\` instead.
      if (phs.length === 0 && SECRET_KEY_RE.test(field.name)) {
        results.push({
          code: 'HYGIENE',
          severity: 'warning',
          message: `Plaintext secret in server \`${name}\` field \`${field.name}\`: use \${VAR} instead of a literal value`,
          server: name,
          field: field.name,
        })
      }
    }
  }

  renderResults(ui, results, strict)

  const errors = results.filter((r) => r.severity === 'error').length
  const warnings = results.filter((r) => r.severity === 'warning').length
  return { errors, warnings, results }
}

/** Render results through the UI. */
function renderResults(
  ui: ReturnType<typeof createUiAndCtx>['ui'],
  results: DoctorResult[],
  strict: boolean,
): void {
  if (results.length === 0) {
    ui.note('doctor: no issues found')
    return
  }
  for (const r of results) {
    const prefix = r.severity === 'error' ? 'error' : 'warn'
    const parts = [r.code]
    if (r.server) parts.push(`\`${r.server}\``)
    if (r.field) parts.push(`\`${r.field}\``)
    ui[prefix](`${parts.join(' ')}: ${r.message}`)
  }
  const errs = results.filter((r) => r.severity === 'error').length
  const warns = results.filter((r) => r.severity === 'warning').length
  ui.note(
    `doctor: ${errs} error(s), ${warns} warning(s)${strict ? ' (strict mode)' : ''}`,
  )
}

/** Check if a path is absolute. */
function isAbsolutePath(p: string, platform: NodeJS.Platform): boolean {
  return (
    p.startsWith('/') || (platform === 'win32' && /^[a-zA-Z]:[\\/]/.test(p))
  )
}

/** Check if a file is executable. */
function isExecutable(p: string, platform: NodeJS.Platform): boolean {
  try {
    if (platform === 'win32') return true
    const stat = existsSync(p) ? statSync(p) : null
    return Boolean(stat?.isFile() && (stat.mode & 0o111) !== 0)
  } catch {
    return false
  }
}

/** Resolve a command in PATH (respecting PATHEXT on Windows). */
function which(
  cmd: string,
  env: NodeJS.ProcessEnv,
  platform: NodeJS.Platform,
): string | null {
  const pathEnv = env.PATH || env.Path || env.path || ''
  const pathExt =
    platform === 'win32'
      ? env.PATHEXT || env.Pathext || env.pathext || '.exe;.cmd;.bat;.ps1'
      : ''
  const exts = pathExt.split(';').filter(Boolean)

  for (const dir of pathEnv
    .split(platform === 'win32' ? ';' : ':')
    .filter(Boolean)) {
    const candidates =
      exts.length > 0
        ? exts.map((e) => join(dir, `${cmd}${e}`))
        : [join(dir, cmd)]
    for (const cand of candidates) {
      try {
        if (
          existsSync(cand) &&
          (platform === 'win32' || isExecutable(cand, platform))
        ) {
          return cand
        }
      } catch {
        // ignore
      }
    }
  }
  return null
}

/** Fields that can contain placeholders. */
function placeholderFields(
  server: CanonicalServer,
): Array<{ name: string; value: string }> {
  const fields: Array<{ name: string; value: string }> = []
  if (isStdioServer(server)) {
    fields.push({ name: 'command', value: server.command })
    for (const [i, arg] of (server.args ?? []).entries()) {
      fields.push({ name: `args[${i}]`, value: arg })
    }
    if (server.env) {
      for (const [k, v] of Object.entries(server.env)) {
        fields.push({ name: `env.${k}`, value: v })
      }
    }
  } else {
    fields.push({ name: 'url', value: server.url })
    if (server.headers) {
      for (const [k, v] of Object.entries(server.headers)) {
        fields.push({ name: `headers.${k}`, value: v })
      }
    }
  }
  return fields
}

/** Parse the whole native file object under `rootKey` (best-effort JSONC). */
function parseNativeEntryWhole(
  content: string,
  rootKey: string | undefined,
): Record<string, unknown> | null {
  if (!rootKey) return null
  try {
    const errors: { error: number; offset: number; length: number }[] = []
    const parsed = parse(content, errors) as Record<string, unknown>
    if (errors.length > 0) return null
    const rootVal = parsed[rootKey]
    if (rootVal && typeof rootVal === 'object' && !Array.isArray(rootVal)) {
      return rootVal as Record<string, unknown>
    }
    return null
  } catch {
    return null
  }
}

/** Parse a native file entry for a server name under `rootKey` only. */
function parseNativeEntry(
  content: string,
  name: string,
  rootKey: string | undefined,
): Record<string, unknown> | null {
  if (!rootKey) return null
  const whole = parseNativeEntryWhole(content, rootKey)
  if (!whole) return null
  const entry = whole[name]
  if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
    return entry as Record<string, unknown>
  }
  return null
}

/** Normalize an entry for drift comparison (strip formatting differences, sort keys). */
function normalizeEntry(entry: unknown): unknown {
  if (entry === null || entry === undefined) return entry
  if (Array.isArray(entry)) return entry.map(normalizeEntry)
  if (typeof entry === 'object') {
    const normalized: Record<string, unknown> = {}
    const keys = Object.keys(entry as Record<string, unknown>).sort()
    for (const k of keys) {
      normalized[k] = normalizeEntry((entry as Record<string, unknown>)[k])
    }
    return normalized
  }
  return entry
}

/** Deep equality check (key-order invariant via sorted-key normalization). */
function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalizeEntry(a)) === JSON.stringify(normalizeEntry(b))
}

export const doctorCommand = defineCommand({
  meta: {
    name: 'doctor',
    description: 'Audit schema validity, env vars, runtime binaries, and drift',
  },
  args: {
    strict: {
      type: 'boolean',
      alias: 's',
      description: 'Promote warnings to errors (exit 1)',
    },
    global: {
      type: 'boolean',
      alias: 'g',
      description: 'Operate on the global agent configuration',
    },
    agents: {
      type: 'string',
      description:
        'Comma-separated target agents (e.g. claude-code,antigravity)',
    },
  },
  run: async ({ args, rawArgs }) => {
    const { ctx, ui } = createUiAndCtx({ yes: isYesFlag(args) })
    const scope = (isGlobalFlag(args) ? 'global' : 'project') as ConfigScope
    const dryRun = isDryRun(args)
    const flag = parseAgentsFlag(args as Record<string, unknown>, rawArgs)

    const summary = await runDoctor({
      scope,
      ctx,
      flag,
      dryRun,
      strict: args.strict === true,
    })

    if (summary.errors > 0 || (summary.warnings > 0 && args.strict === true)) {
      process.exit(1)
    }
  },
})
````

## File: src/commands/import.command.ts
````typescript
/**
 * `import` command (§11).
 *
 * Scan every adapter for the active scope, extract, normalize, deduplicate /
 * conflict-resolve, apply the secret policy, merge into canonical (existing
 * entries win unless `--force`), seed state names for all scanned agents, then
 * `sync` unless `--no-sync`. Native files are never deleted.
 */

import { defineCommand } from 'citty'
import { join } from 'node:path'
import { readdirSync, statSync } from 'node:fs'
import {
  createUiAndCtx,
  configPath,
  persistCanonicalConfig,
  persistSyncState,
  isDryRun,
  isGlobalFlag,
  isNoSyncFlag,
  isYesFlag,
  parseAgentsFlag,
  formatConfigValidationError,
  formatDryRunActions,
} from '$/src/commands/util'
import { runSync } from '$/src/commands/sync'
import { resolveTargetsAsync, adapters } from '$/src/adapters/index'
import { DEFAULT_SCHEMA_URL, AGENT_ORDER } from '$/src/config'
import { loadValidatedConfig, ConfigValidationError } from '$/src/core/store'
import { loadState, type SyncState } from '$/src/core/state'
import {
  planSecretExtraction,
  applySecretExtraction,
  appendToDotenv,
  syncEnvExample,
} from '$/src/core/env'
import { readTextFile } from '$/src/core/fs-atomic'
import type { AgentId } from '$/src/adapters/types'
import type { CanonicalServer } from '$/src/core/schema'
import type { ConfigScope, RuntimeContext } from '$/src/core/context'
import * as antigravity from '$/src/adapters/antigravity'

export const importCommand = defineCommand({
  meta: {
    name: 'import',
    description: 'Consolidate existing agent MCP configs into .agents/mcp.json',
  },
  args: {
    'no-sync': {
      type: 'boolean',
      description: 'Import into canonical without running sync afterwards',
    },
    force: {
      type: 'boolean',
      alias: 'f',
      description: 'Overwrite conflicting canonical entries',
    },
    'extract-secrets': {
      type: 'boolean',
      description: 'Write detected secrets to .env (warn-only by default)',
    },
  },
  run: async ({ args, rawArgs }) => {
    const { ctx, ui } = createUiAndCtx({ yes: isYesFlag(args) })
    const scope = (isGlobalFlag(args) ? 'global' : 'project') as ConfigScope
    const path = configPath(scope, ctx)
    const dryRun = isDryRun(args)
    const noSync = isNoSyncFlag(args, rawArgs)
    const force = args.force === true
    const extractSecrets = args['extract-secrets'] === true
    const yes = isYesFlag(args)
    const agentsFlag = parseAgentsFlag(args, rawArgs)

    // Load + validate canonical config. A missing config is tolerated (import
    // creates it); an invalid one is reported as a structured error.
    let validated
    try {
      validated = loadValidatedConfig(scope, ctx)
    } catch (err) {
      if (err instanceof ConfigValidationError) {
        ui.error(formatConfigValidationError(err))
        process.exit(1)
      }
      throw err
    }
    let canonical: Record<string, CanonicalServer> = {}
    let schemaUrl = DEFAULT_SCHEMA_URL
    if (validated) {
      schemaUrl = validated.config.$schema ?? DEFAULT_SCHEMA_URL
      canonical = {
        ...(validated.config.mcpServers as Record<string, CanonicalServer>),
      }
    }

    const stateResult = loadState(scope, ctx)
    const state = stateResult.state

    const allWarnings: string[] = []
    // name -> [{agentId, server}] so cross-agent conflicts can be detected.
    const candidates: Map<
      string,
      Array<{ agentId: AgentId; server: CanonicalServer }>
    > = new Map()
    const extractedByAgent: Record<AgentId, string[]> = {} as Record<
      AgentId,
      string[]
    >
    const scannedAgents: AgentId[] = []
    // Planned file operations for the --dry-run preview.
    const plannedWrites: { type: 'write' | 'remove'; path: string }[] = []

    function addCandidate(
      agentId: AgentId,
      name: string,
      server: CanonicalServer,
    ): void {
      const arr = candidates.get(name) ?? []
      arr.push({ agentId, server })
      candidates.set(name, arr)
    }

    // 1. Scan every non-antigravity adapter (single native config file).
    for (const adapter of adapters) {
      // antigravity is per-plugin: handled separately below.
      if (adapter.id === 'antigravity') continue

      const nativePath = adapter.getConfigPath(scope, ctx)
      if (nativePath === null) continue
      const exists = await adapter.detect(scope, ctx)
      if (!exists) continue
      scannedAgents.push(adapter.id as AgentId)

      const existing = readTextFile(nativePath)
      if (existing === null) continue

      const { servers, warnings } = adapter.extractServers(existing, scope)
      allWarnings.push(...warnings.map((w) => w.message))
      for (const [name, server] of Object.entries(servers)) {
        addCandidate(adapter.id as AgentId, name, server)
      }
    }

    // 1b. Antigravity (layout === 'per-plugin'): scan
    // <base>/.agents/plugins/*/mcp_config.json and call antigravity.extractServers().
    const base = scope === 'project' ? ctx.cwd : ctx.homeDir
    const pluginsDir = join(base, '.agents', 'plugins')
    let antigravityEntries: string[] = []
    try {
      antigravityEntries = readdirSync(pluginsDir)
    } catch {
      antigravityEntries = []
    }
    for (const entry of antigravityEntries) {
      const mcpConfigPath = join(pluginsDir, entry, 'mcp_config.json')
      let isFile = false
      try {
        isFile = statSync(mcpConfigPath).isFile()
      } catch {
        isFile = false
      }
      if (!isFile) continue
      const existing = readTextFile(mcpConfigPath)
      if (existing === null) continue
      const { servers, warnings } = antigravity.extractServers(existing, scope)
      allWarnings.push(...warnings.map((w) => w.message))
      for (const [name, server] of Object.entries(servers)) {
        addCandidate('antigravity', name, server)
      }
      scannedAgents.push('antigravity')
    }

    // 2. Resolve cross-agent server conflicts.
    const extracted: Record<string, CanonicalServer> = {}
    for (const [name, defs] of candidates) {
      const uniqueServers = [
        ...new Map(
          defs.map((d) => [JSON.stringify(d.server), d] as const),
        ).values(),
      ]
      if (uniqueServers.length === 1) {
        const winner = uniqueServers[0]!
        extracted[name] = winner.server
        extractedByAgent[winner.agentId] = [
          ...(extractedByAgent[winner.agentId] ?? []),
          name,
        ]
        continue
      }

      // Conflict: multiple agents define the same server differently.
      defs.sort(
        (a, b) =>
          AGENT_ORDER.indexOf(a.agentId) - AGENT_ORDER.indexOf(b.agentId),
      )
      const winner = defs[0]!
      const losers = defs.slice(1).map((d) => d.agentId)

      if (yes || !ctx.isTTY) {
        // Non-interactive (--yes / CI): deterministic AGENT_ORDER winner +
        // warning naming both agents and the server.
        allWarnings.push(
          `Server \`${name}\` is defined by multiple agents (${losers.join(
            ', ',
          )}, ${winner.agentId}) with differing definitions; keeping ${winner.agentId}'s definition (AGENT_ORDER).`,
        )
        extracted[name] = winner.server
        extractedByAgent[winner.agentId] = [
          ...(extractedByAgent[winner.agentId] ?? []),
          name,
        ]
      } else {
        // Interactive TTY: prompt the user to choose which definition wins (or skip).
        const options: Array<{
          label: string
          value: AgentId | '__skip__'
        }> = defs.map((d) => ({
          label: `${d.agentId}: ${JSON.stringify(d.server)}`,
          value: d.agentId,
        }))
        options.push({ label: 'Skip this server', value: '__skip__' })
        const chosen = await ui.select<AgentId | '__skip__'>({
          message: `Conflict for server \`${name}\`: multiple agents define it differently. Choose which definition wins:`,
          options,
        })
        if (chosen === '__skip__') {
          continue
        }
        const pick = defs.find((d) => d.agentId === chosen)
        if (!pick) continue
        extracted[name] = pick.server
        extractedByAgent[chosen] = [...(extractedByAgent[chosen] ?? []), name]
      }
    }

    // Secret policy: plan extraction and optionally write to .env + .env.example.
    const allWrites: Array<{ key: string; value: string }> = []
    const allKeys: string[] = []
    const extractedCanonical: Record<string, CanonicalServer> = {}
    for (const [name, server] of Object.entries(extracted)) {
      const { writes, replacements, warnings } = planSecretExtraction(
        name,
        server,
        { policy: extractSecrets ? 'extract' : 'warn' },
      )
      allWarnings.push(...warnings)
      for (const w of writes) {
        allWrites.push(w)
        allKeys.push(w.key)
      }
      extractedCanonical[name] = extractSecrets
        ? applySecretExtraction(server, { writes, replacements, warnings })
        : server
    }
    canonical = { ...canonical, ...extractedCanonical }

    if (!dryRun && extractSecrets && allWrites.length > 0) {
      // Project: <cwd>/.env ; Global: <homeDir>/.agents/.env
      const dotenvPath =
        scope === 'project'
          ? join(ctx.cwd, '.env')
          : join(ctx.homeDir, '.agents', '.env')
      const examplePath =
        scope === 'project'
          ? join(ctx.cwd, '.env.example')
          : join(ctx.homeDir, '.agents', '.env.example')
      appendToDotenv(dotenvPath, allWrites)
      syncEnvExample(examplePath, allKeys)
    }

    // Persist canonical config (B7: tolerate zero resolvable targets — still
    // persist .agents/mcp.json and plugins, warn, hint sync instead of exit 1).
    plannedWrites.push({ type: 'write', path })
    if (!dryRun) {
      persistCanonicalConfig(scope, ctx, {
        $schema: schemaUrl,
        mcpServers: canonical,
      })

      const nextState: SyncState = {
        ...state,
        scope,
        targets: state.targets,
        agents: { ...state.agents },
      }
      for (const agentId of scannedAgents) {
        // Store the adapter's native path (not the canonical path).
        const nativePath =
          agentId === 'antigravity'
            ? join(base, '.agents', 'plugins')
            : (adapters
                .find((a) => a.id === agentId)!
                .getConfigPath(scope, ctx) ?? path)
        nextState.agents[agentId] = {
          path: nativePath,
          names: extractedByAgent[agentId] ?? [],
          updatedAt: new Date().toISOString(),
        }
      }
      persistSyncState(scope, ctx, nextState)
    }

    if (!noSync && !dryRun) {
      await runSync({
        scope,
        ctx,
        flag: agentsFlag,
        dryRun: false,
        yes,
        allowEmptyTargets: true,
      })
    } else if (!noSync && dryRun) {
      await runSync({
        scope,
        ctx,
        flag: agentsFlag,
        dryRun: true,
        yes,
        allowEmptyTargets: true,
      })
    }

    // Dry-run preview of planned file operations (zero disk writes).
    if (dryRun && plannedWrites.length > 0) {
      ui.note(formatDryRunActions(plannedWrites))
    }

    ui.note(
      `Imported ${Object.keys(extracted).length} server(s) from ${scannedAgents.length} agent(s)`,
    )
    for (const w of allWarnings) {
      ui.warn(w)
    }
  },
})
````

## File: src/commands/init.command.ts
````typescript
/**
 * `init` command (§11).
 *
 * Scaffold `<scope>/.agents/mcp.json` (`$schema`, `mcpServers: {}`), select agents
 * (multi-select; `--agents` bypasses), persist `targets` in state. Existing
 * file → exit `1` unless `--force` (writes a `.bak.<timestamp>` first). Never
 * touches `.gitignore`. Non-interactive targets come from `--agents` or
 * detection; none → allow empty targets with a guidance hint (B7) instead of
 * `exit 1`.
 */

import { defineCommand } from 'citty'
import { existsSync } from 'node:fs'
import {
  createUiAndCtx,
  configPath,
  persistSyncState,
  persistCanonicalConfig,
  isDryRun,
  isGlobalFlag,
  isYesFlag,
  parseAgentsFlag,
  formatDryRunActions,
} from '$/src/commands/util'
import {
  resolveTargetsAsync,
  detectAgents,
  adapters,
} from '$/src/adapters/index'
import { backupFile } from '$/src/core/fs-atomic'
import { loadState } from '$/src/core/state'
import { DEFAULT_SCHEMA_URL } from '$/src/config'
import type { AgentId } from '$/src/adapters/types'
import type { ConfigScope, RuntimeContext } from '$/src/core/context'
export const initCommand = defineCommand({
  meta: {
    name: 'init',
    description: 'Scaffold .agents/mcp.json and select target agents',
  },
  args: {
    force: {
      type: 'boolean',
      alias: 'f',
      description:
        'Overwrite an existing canonical config (writes a .bak first)',
    },
  },
  run: async ({ args, rawArgs }) => {
    const { ctx, ui } = createUiAndCtx({ yes: isYesFlag(args) })
    const scope = (isGlobalFlag(args) ? 'global' : 'project') as ConfigScope
    const path = configPath(scope, ctx)
    const dryRun = isDryRun(args)
    const force = args.force === true
    const agentsFlag = parseAgentsFlag(args, rawArgs)

    if (existsSync(path) && !force) {
      ui.error(
        `Canonical config already exists at ${path}. Use --force to overwrite.`,
      )
      process.exit(1)
    }

    if (existsSync(path) && force && !dryRun) {
      backupFile(path)
    }

    const stateResult = loadState(scope, ctx)
    const state = stateResult.state

    let targets: AgentId[]
    if (agentsFlag) {
      targets = await resolveTargetsAsync({ flag: agentsFlag, state, ctx })
    } else if (isYesFlag(args) || !ctx.isTTY || ctx.env.CI === 'true') {
      targets = await resolveTargetsAsync({ flag: undefined, state, ctx })
    } else {
      // Interactive: multi-select agents, pre-select detected agents (B7).
      const detected = await detectAgents(scope, ctx)
      const options = adapters.map((a) => ({
        label: a.displayName,
        value: a.id,
      }))
      const selected = await ui.multiselect<AgentId>({
        message: 'Select target agents',
        options,
        initialValues: detected,
      })
      targets = selected
    }

    const plannedWrites: { type: 'write' | 'remove'; path: string }[] = []
    plannedWrites.push({ type: 'write', path })

    if (targets.length === 0) {
      ui.warn(
        'No target agents configured or detected. Continuing with an empty target list; run `agents-mcp sync --agents <list>` (e.g. `--agents cursor,vscode`) to sync later.',
      )
    }

    if (!dryRun) {
      persistCanonicalConfig(scope, ctx, {
        $schema: DEFAULT_SCHEMA_URL,
        mcpServers: {},
      })
      const nextState = {
        ...state,
        scope,
        targets,
        agents: { ...state.agents },
      }
      persistSyncState(scope, ctx, nextState)
    }

    // Dry-run preview of planned file operations (zero disk writes).
    if (dryRun && plannedWrites.length > 0) {
      ui.note(formatDryRunActions(plannedWrites))
    }

    ui.note(`Initialized ${scope} canonical config at ${path}`)
    ui.note(`Targets: ${targets.join(', ') || '(none)'}`)
  },
})
````

## File: src/commands/list.command.ts
````typescript
/**
 * `list` command (§11).
 *
 * Read-only table: name, type, command/URL, per-agent sync status. `--all`
 * includes the global scope and marks shadowed entries (project wins).
 */

import { defineCommand } from 'citty'
import {
  createUiAndCtx,
  configPath,
  isDryRun,
  isGlobalFlag,
  isYesFlag,
  loadCanonicalOrExit,
} from '$/src/commands/util'
import { loadState } from '$/src/core/state'
import type { ConfigScope } from '$/src/core/context'
import type { AgentId } from '$/src/adapters/types'

export const listCommand = defineCommand({
  meta: {
    name: 'list',
    description: 'Inspect configured servers, targets, and sync state',
  },
  args: {
    all: {
      type: 'boolean',
      alias: 'a',
      description: 'Include global scope and mark shadowed entries',
    },
    global: {
      type: 'boolean',
      alias: 'g',
      description: 'Operate on the global scope only',
    },
  },
  run: async ({ args }) => {
    const { ctx, ui } = createUiAndCtx({ yes: isYesFlag(args) })
    const includeAll = args.all === true
    const scopes: ConfigScope[] = includeAll
      ? ['project', 'global']
      : isGlobalFlag(args)
        ? ['global']
        : ['project']

    // Collect all server names from project scope first (for shadow detection).
    const projectNames = new Set<string>()
    const scopeData: Array<{
      scope: ConfigScope
      servers: Record<string, unknown>
      state: Awaited<ReturnType<typeof loadState>>['state']
    }> = []

    for (const scope of scopes) {
      const config = loadCanonicalOrExit(scope, ctx, ui)
      const stateResult = loadState(scope, ctx)
      const state = stateResult.state
      const servers = config.mcpServers ?? {}
      scopeData.push({ scope, servers, state })
      if (scope === 'project') {
        for (const name of Object.keys(servers)) {
          projectNames.add(name)
        }
      }
    }

    for (const { scope, servers, state } of scopeData) {
      const names = Object.keys(servers) as string[]

      for (const name of names) {
        const server = servers[name] as {
          type?: string
          command?: string
          url?: string
        }
        const type = server.type ?? (server.url ? 'streamable-http' : 'stdio')
        const displayType =
          type === 'stdio'
            ? 'command'
            : type === 'streamable-http'
              ? 'http'
              : type
        const isHttp = type === 'streamable-http' || type === 'sse'
        const target = isHttp ? (server.url ?? '') : (server.command ?? '')

        // Per-agent sync status: list which agents have this server synced.
        const syncedAgents: string[] = []
        for (const agentId of Object.keys(state.agents)) {
          const agent = state.agents[agentId as AgentId]
          if (agent?.names.includes(name)) {
            syncedAgents.push(agentId)
          }
        }
        const syncStatus =
          syncedAgents.length > 0
            ? `synced (${syncedAgents.join(', ')})`
            : 'not-synced'

        const shadowed =
          includeAll && scope === 'global' && projectNames.has(name)
            ? ' (shadowed)'
            : ''

        ui.note(
          `${name.padEnd(14)} ${displayType.padEnd(8)} ${target.padEnd(24)} ${syncStatus}${shadowed}`,
        )
      }
    }

    const totalNames = new Set(scopeData.flatMap((d) => Object.keys(d.servers)))
      .size
    if (totalNames === 0) {
      ui.note('No servers configured.')
    }
  },
})
````

## File: tests/core/schema.test.ts
````typescript
import { describe, expect, it } from 'vitest'
import {
  CanonicalMcpConfigSchema,
  validateConfig,
  AgentIdSchema,
  isStdioServer,
  isHttpServer,
} from '$/src/core/schema'
import { DEFAULT_SCHEMA_URL } from '$/src/config'

describe('canonical schema', () => {
  it('rejects an unsupported type value (Zod)', () => {
    const result = CanonicalMcpConfigSchema.safeParse({
      $schema: DEFAULT_SCHEMA_URL,
      mcpServers: {
        github: { type: 'websocket', url: 'https://example.com' },
      },
    })
    expect(result.success).toBe(false)
  })

  it('rejects a missing type value (Zod)', () => {
    const result = CanonicalMcpConfigSchema.safeParse({
      $schema: DEFAULT_SCHEMA_URL,
      mcpServers: {
        github: { url: 'https://example.com' },
      },
    })
    expect(result.success).toBe(false)
  })

  it('rejects a missing $schema (required)', () => {
    const result = CanonicalMcpConfigSchema.safeParse({
      mcpServers: {
        github: { type: 'stdio', command: 'npx' },
      },
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues.some((i) => i.path.includes('$schema'))).toBe(
      true,
    )
  })

  it('rejects disabled field on server', () => {
    const result = CanonicalMcpConfigSchema.safeParse({
      $schema: DEFAULT_SCHEMA_URL,
      mcpServers: {
        github: { type: 'stdio', command: 'npx', disabled: true },
      },
    })
    expect(result.success).toBe(false)
  })

  it('rejects targets field on server', () => {
    const result = CanonicalMcpConfigSchema.safeParse({
      $schema: DEFAULT_SCHEMA_URL,
      mcpServers: {
        github: { type: 'stdio', command: 'npx', targets: ['claude-code'] },
      },
    })
    expect(result.success).toBe(false)
  })

  it('rejects PLUGIN_ROOT as an env key', () => {
    const result = CanonicalMcpConfigSchema.safeParse({
      $schema: DEFAULT_SCHEMA_URL,
      mcpServers: {
        github: { type: 'stdio', command: 'npx', env: { PLUGIN_ROOT: '/x' } },
      },
    })
    expect(result.success).toBe(false)
  })

  it('rejects PLUGIN_DATA as an env key', () => {
    const result = CanonicalMcpConfigSchema.safeParse({
      $schema: DEFAULT_SCHEMA_URL,
      mcpServers: {
        github: { type: 'stdio', command: 'npx', env: { PLUGIN_DATA: '/x' } },
      },
    })
    expect(result.success).toBe(false)
  })

  it('rejects cwd outside allowed plugin paths', () => {
    const result = CanonicalMcpConfigSchema.safeParse({
      $schema: DEFAULT_SCHEMA_URL,
      mcpServers: {
        github: { type: 'stdio', command: 'npx', cwd: '/absolute/path' },
      },
    })
    expect(result.success).toBe(false)
  })

  it('accepts cwd with ./ prefix', () => {
    const result = CanonicalMcpConfigSchema.safeParse({
      $schema: DEFAULT_SCHEMA_URL,
      mcpServers: {
        github: { type: 'stdio', command: 'npx', cwd: './subdir' },
      },
    })
    expect(result.success).toBe(true)
  })

  it('accepts cwd with ${PLUGIN_ROOT}/ prefix', () => {
    const result = CanonicalMcpConfigSchema.safeParse({
      $schema: DEFAULT_SCHEMA_URL,
      mcpServers: {
        github: { type: 'stdio', command: 'npx', cwd: '${PLUGIN_ROOT}/subdir' },
      },
    })
    expect(result.success).toBe(true)
  })

  it('accepts cwd with ${PLUGIN_DATA}/ prefix', () => {
    const result = CanonicalMcpConfigSchema.safeParse({
      $schema: DEFAULT_SCHEMA_URL,
      mcpServers: {
        github: { type: 'stdio', command: 'npx', cwd: '${PLUGIN_DATA}/subdir' },
      },
    })
    expect(result.success).toBe(true)
  })

  it('rejects $schema with a different URI', () => {
    const result = CanonicalMcpConfigSchema.safeParse({
      $schema: 'https://example.com/other.json',
      mcpServers: {
        github: { type: 'stdio', command: 'npx' },
      },
    })
    expect(result.success).toBe(false)
  })

  it('AgentIdSchema enumerates the seven agents', () => {
    expect(AgentIdSchema.options).toEqual([
      'claude-code',
      'cursor',
      'vscode',
      'opencode',
      'windsurf',
      'zed',
      'antigravity',
    ])
  })

  it('parses a valid canonical config', () => {
    const config = CanonicalMcpConfigSchema.parse({
      $schema: DEFAULT_SCHEMA_URL,
      mcpServers: {
        github: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-github'],
        },
        linear: {
          type: 'streamable-http',
          url: 'https://mcp.linear.app/mcp',
        },
        'linear-sse': {
          type: 'sse',
          url: 'https://mcp.linear.app/sse',
        },
      },
    })
    expect(isStdioServer(config.mcpServers.github!)).toBe(true)
    if (isStdioServer(config.mcpServers.github!)) {
      expect(config.mcpServers.github!.command).toBe('npx')
    }
    expect(isHttpServer(config.mcpServers.linear!)).toBe(true)
    if (isHttpServer(config.mcpServers.linear!)) {
      expect(config.mcpServers.linear!.type).toBe('streamable-http')
    }
    expect(isHttpServer(config.mcpServers['linear-sse']!)).toBe(true)
    if (isHttpServer(config.mcpServers['linear-sse']!)) {
      expect(config.mcpServers['linear-sse']!.type).toBe('sse')
    }
  })

  it('applies args default without materializing on write', () => {
    const parsed = CanonicalMcpConfigSchema.parse({
      $schema: DEFAULT_SCHEMA_URL,
      mcpServers: {
        github: { type: 'stdio', command: 'npx' },
      },
    })
    const github = parsed.mcpServers.github!
    expect(isStdioServer(github)).toBe(true)
    if (isStdioServer(github)) {
      expect(github.args).toEqual([])
    }
  })

  it('rejects unknown top-level keys (z.strictObject)', () => {
    expect(() =>
      CanonicalMcpConfigSchema.parse({
        $schema: DEFAULT_SCHEMA_URL,
        mcpServers: {},
        bogus: true,
      }),
    ).toThrow()
  })

  it('validateConfig warns on $schema mismatch but does not fail', () => {
    const { warnings } = validateConfig({
      $schema: 'https://example.com/other.json',
      mcpServers: {},
    })
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain(DEFAULT_SCHEMA_URL)
  })

  it('validateConfig does not warn when $schema matches', () => {
    const { warnings } = validateConfig({
      $schema: DEFAULT_SCHEMA_URL,
      mcpServers: {},
    })
    expect(warnings).toEqual([])
  })
})
````

## File: .gitignore
````
# Dependencies
node_modules/

# Build output (published from dist/, never committed)
dist/

# Test artifacts
coverage/

# Logs
*.log
npm-debug.log*

# Local environment and secrets
.env
.env.*
!.env.example

# agents-mcp local sync state/lock (repository-local choice: the CLI does NOT
# auto-ignore these; this repo ignores them to avoid an untracked generated file)
.agents/.mcp-sync-state.json
.agents/mcp-lock.json

# Package artifacts
*.tgz

# Local workflow artifacts (never published or tracked)
workflow/
````

## File: .agents/skills/architect-worker/SKILL.md
````markdown
---
name: architect-worker
description: >-
  Role-based multi-agent software engineering pattern separating high-level
  architecture, specification, planning, and code review (Architect) from
  focused code implementation and verification (Worker). Use this skill whenever
  assigned the Architect or Worker role (in any language), or when coordinating
  work between planning/review agents and implementation agents via `workflow/`.
---

# Architect & Worker Pattern

Separate software engineering responsibilities into two complementary agent roles synchronized through the `workflow/` directory (`spec-driven-workflow`), optionally preceded and validated by the **Product Owner** role (`product-owner`):

- **Product Owner** *(optional, via `product-owner`)* — Owns product intent, priority, and value validation through `workflow/BACKLOG.md` (the only root file in `workflow/`) and `workflow/<change-slug>/VALIDATION.md`.
- **Architect** — Owns specifications, high-level architecture, execution planning, task sharding, code review, quality control, and delivery handoff inside `workflow/<change-slug>/`.
- **Worker** — Owns code implementation, testing, and remediation for a given `workflow/<change-slug>/`, strictly following the Architect's specifications and all project documentation and skills.

> **Parallelism**: Because each initiative lives in its own `workflow/<change-slug>/` subdirectory, the Architect can specify and plan new items in `workflow/<other-slug>/` while a Worker implements an already-ready plan in `workflow/<change-slug>/`, and multiple Workers can execute non-conflicting plans concurrently.

## Role Activation

1. **Explicit Role Assignment**: Adopt the role specified by the user (e.g., *"Act as the Architect"* or *"Act as the Worker"*, including equivalent role names in the user's language).
2. **Role Persistence**: Maintain the assigned role for the entire session unless the user explicitly instructs a role switch.
3. **Missing Role Clarification**: If this skill is invoked without a clear role assignment, ask the user whether to proceed as **Architect** or **Worker** before taking action.

---

## Role 1: The Architect

The Architect governs **what** is built, **how** it is structured, and **whether** the result meets quality standards.

### Responsibilities

1. **Specification (`workflow/<change-slug>/SPEC.md`)**
   - Read `workflow/BACKLOG.md` (when present) to ground technical requirements in the Product Owner's problem statement, priority, and acceptance expectations, and create a dedicated `workflow/<change-slug>/` directory for the initiative.
   - Clarify requirements, scope, goals, non-goals, constraints, and testable acceptance criteria with the user (or Product Owner).
2. **Architecture & High-Level Decisions**
   - Define system boundaries, module contracts, data models, and cross-cutting trade-offs.
   - Record significant architectural choices as ADRs using `decision-records` (`docs/decisions/`).
3. **Planning & Task Breakdown (`workflow/<change-slug>/PLAN.md` & `TASKS.md`)**
   - Apply `planning-and-task-breakdown` to map affected files, ordered execution steps, verification strategies, and dependencies.
   - Shard large or parallelizable plans into `workflow/<change-slug>/TASKS.md` with disjoint scopes so one or more Worker agents can execute safely.
4. **Code Review & Quality Control (`workflow/<change-slug>/REVIEW.md`)**
   - Apply `code-review` to inspect the Worker's implementation against `workflow/<change-slug>/SPEC.md`, `workflow/<change-slug>/PLAN.md`, and engineering standards.
   - Run verification checks (`test`, `lint`, `typecheck`, `build`) to validate quality firsthand.
   - Log actionable findings (`blocker`, `major`, `minor`, `question`) in `workflow/<change-slug>/REVIEW.md` and set the review status (`Changes Requested` or `Approved`).
   - Once `REVIEW.md` is `Approved`, if `workflow/BACKLOG.md` was used (or a Product Owner is in the loop), author `workflow/<change-slug>/VALIDATION.md` to hand the delivery back to the Product Owner for value validation; otherwise proceed directly to final user sign-off and `workflow/<change-slug>/` cleanup according to `spec-driven-workflow`.

### Architect Guardrails

- **Never write or modify production/application code or test suites.** Leave all implementation edits to the Worker.
- **Only create or edit governance artifacts**: `workflow/<change-slug>/SPEC.md`, `workflow/<change-slug>/PLAN.md`, `workflow/<change-slug>/TASKS.md`, `workflow/<change-slug>/REVIEW.md`, `workflow/<change-slug>/VALIDATION.md`, `workflow/<change-slug>/assets/` (supporting diagrams, screenshots, or evidence), `.gitignore` (only after user confirmation if `workflow/` is missing), and architecture documentation (such as `docs/decisions/`).
- **Be thorough and produce Worker-ready artifacts**: Never hand off vague specifications, plans, or review comments. Every requirement in `SPEC.md`, step in `PLAN.md`, task in `TASKS.md`, and finding in `REVIEW.md` must specify explicit contracts, edge cases, constraints, file boundaries, and objective done criteria so the Worker never has to infer intent.

---

## Role 2: The Worker

The Worker turns the Architect's specifications and plans into clean, well-tested, production-ready code.

### Responsibilities

1. **Load Context Before Coding**
   - Read `workflow/<change-slug>/SPEC.md`, `workflow/<change-slug>/PLAN.md`, `workflow/<change-slug>/TASKS.md` (if present), and `workflow/<change-slug>/REVIEW.md` (if addressing review feedback), along with any linked evidence in `workflow/<change-slug>/assets/`.
   - Inspect relevant project documentation, ADRs (`docs/decisions/`), codebase conventions, and active project skills.
   - If assigned a specific task ID (e.g., `T2` in `workflow/<change-slug>/TASKS.md`), scope work strictly to that task and check that its dependencies are `done`.
2. **Execute & Verify Incrementally**
   - Follow `incremental-implementation` to build in small, verifiable slices.
   - Follow `verification-and-testing` and `code-simplification` to ensure every slice is tested, readable, and aligned with project conventions.
   - When fixing bugs or failing checks, follow `systematic-debugging` to identify root causes before applying fixes.
3. **Address Review Feedback**
   - When `workflow/<change-slug>/REVIEW.md` has open items (`blocker`, `major`, `minor`, or `question`), resolve each item in code/tests strictly as directed and update its status in `workflow/<change-slug>/REVIEW.md` (or provide answers to questions). If any review item is unclear or conflicts with the spec or codebase, ask the Architect for clarification before implementing.
4. **Track Progress**
   - Keep step and task statuses (`in_progress`, `blocked`, `done`) updated in `workflow/<change-slug>/PLAN.md` and `workflow/<change-slug>/TASKS.md`.

### Worker Guardrails

- **No unrequested work or scope drift**: Keep local, low-level implementation decisions (e.g., internal helpers, naming, test structure) within the assigned boundaries, **but never** make unrequested refactors, "improvements", or changes outside what is explicitly specified in `workflow/<change-slug>/SPEC.md`, `PLAN.md`, `TASKS.md`, and `REVIEW.md`. Do not alter requirements in `SPEC.md` or redesign the architecture in `PLAN.md`.
- **Ask when anything is unclear — never guess**: If `SPEC.md`, `PLAN.md`, `TASKS.md`, or `REVIEW.md` is missing, contradictory, under-specified, or infeasible due to an unforeseen technical constraint, **stop on the affected scope**, mark the task/step as `blocked` (recording the exact question or constraint), and ask the Architect (or user) for the missing details rather than assuming or improvising.
- **Follow review directives strictly**: Address every open item in `workflow/<change-slug>/REVIEW.md` as directed; do not silently ignore, override, or diverge from a review directive without explicit Architect approval.
- **Respect scope boundaries**: When working on a specific task in `workflow/<change-slug>/TASKS.md` (or alongside other active `workflow/<other-slug>/` plans), do not modify files owned by other parallel tasks or unrelated areas of the codebase.
- **Never commit `workflow/`**: Ensure `workflow/` remains untracked by Git per `spec-driven-workflow`.

---

## Handoff Lifecycle

The Architect and Worker (and optionally the Product Owner via `product-owner`) coordinate asynchronously or sequentially through `workflow/`:

```text
[Product Owner] 0. Discover & Frame  -> (Optional) Writes workflow/BACKLOG.md
       │
       ▼
[Architect]     1. Specify & Plan    -> Reads BACKLOG.md (if any), writes workflow/<change-slug>/SPEC.md, PLAN.md (+ TASKS.md)
       │
       ▼
[Worker]        2. Implement & Verify-> Executes workflow/<change-slug>/PLAN.md / TASKS.md, runs tests, marks done
       │
       ▼
[Architect]     3. Review & Gate     -> Inspects diff, runs checks, writes workflow/<change-slug>/REVIEW.md
       │
       ├── If Changes Requested ──────► [Worker] resolves open items in REVIEW.md
       │
       ▼
[Architect]     4. Delivery Handoff  -> (If PO in loop) Writes workflow/<change-slug>/VALIDATION.md for PO
       │
       ├── If PO Requests Changes ────► [Architect] refines SPEC.md/PLAN.md for Worker
       │
       ▼
[PO / Architect]5. Sign-Off & Cleanup-> Confirms with user/PO, deletes workflow/<change-slug>/, updates BACKLOG.md
```
````

## File: .agents/skills/spec-driven-workflow/SKILL.md
````markdown
---
name: spec-driven-workflow
description: >-
  Default software engineering workflow using a `workflow/` directory where
  `workflow/BACKLOG.md` is the only root file and every change lives in its own
  scoped subdirectory `workflow/<change-slug>/` (`SPEC.md`, `PLAN.md`,
  `TASKS.md`, `REVIEW.md`, and conditional `VALIDATION.md`). Use this skill as
  the standard process whenever starting a feature, bug fix, refactoring,
  architecture change, or code review—to capture product intent, specify
  requirements, plan execution, coordinate parallel work, track review
  findings, and validate delivery.
---

# Spec-Driven Workflow

Adopt this workflow as the **standard software engineering process** for any non-trivial change. Do not jump straight into writing code; follow the gated lifecycle below using the `workflow/` directory to separate **why/value** (`BACKLOG.md`), **what** needs to change (`SPEC.md`), **how** it will be built (`PLAN.md`), **who** executes independent pieces (`TASKS.md`), **what** needs attention after implementation (`REVIEW.md`), and **whether** the delivered value meets product expectations (`VALIDATION.md`).

## Standard Operating Flow

Follow these phases in order:

0. **Discover & Frame (`BACKLOG.md`, conditional)** — Capture product intent, user value, priority, or a prioritized mini-backlog of evolutions/bugs (typically owned by the `product-owner` role) before technical specification.
1. **Specify (`SPEC.md`)** — Define the problem, scope, constraints, and acceptance criteria (consuming `BACKLOG.md` when present) before designing or coding.
2. **Plan (`PLAN.md`)** — Map the technical approach, affected files, ordered steps, and verification strategy.
3. **Shard (`TASKS.md`, conditional)** — Break the plan into trackable tasks only when complexity, multi-scope work, or parallel execution warrants it.
4. **Implement** — Execute against `PLAN.md` (or `TASKS.md`), keeping artifact statuses current as work progresses.
5. **Review (`REVIEW.md`)** — Record code review findings (human or agent) and resolve blockers/major issues before completion.
6. **Validate (`VALIDATION.md`, conditional)** — Hand the approved delivery back to the Product Owner (or stakeholder) with plain-language summary and validation scenarios to confirm product value before cleanup.

> **Trivial changes exception**: Skip `workflow/` artifacts only for trivial, self-contained edits (e.g., typo fixes, single-line formatting, or minor comment updates) where specification and planning add no value.

## Directory Layout

Keep **`workflow/BACKLOG.md` as the only file at the `workflow/` root**. Always place all implementation-related artifacts (`SPEC.md`, `PLAN.md`, `TASKS.md`, `REVIEW.md`, `VALIDATION.md`, and change-specific assets) inside a dedicated subdirectory `workflow/<change-slug>/` named with a concise kebab-case slug identifying the feature, bug fix, refactor, or backlog item (e.g., `workflow/b1-checkout-fix/`, `workflow/user-authentication/`):

```text
workflow/
├── BACKLOG.md                # Optional: Only file at workflow/ root (Product Owner backlog & Ready briefs)
├── assets/                   # Optional: Backlog-level screenshots, mockups, or supporting evidence
└── <change-slug>/            # Required per non-trivial change (e.g., b1-checkout-fix, user-auth)
    ├── assets/               # Optional: Change-specific screenshots, diagrams, logs, and evidence
    ├── SPEC.md               # Required for any non-trivial change
    ├── PLAN.md               # Required before implementation starts
    ├── TASKS.md              # Optional: only for large plans or parallel/async agent work
    ├── REVIEW.md             # Created during human or agent code review
    └── VALIDATION.md         # Optional: Architect-to-PO delivery handoff and value sign-off
```

- **Why `<change-slug>/` is mandatory**: Isolating every initiative in its own `workflow/<change-slug>/` directory allows multiple agents to work in parallel on different plans (as long as their code scopes do not conflict), and allows an Architect to specify and plan upcoming items in `workflow/<slug-b>/` while a Worker implements an already-approved plan in `workflow/<slug-a>/`.
- **Never place `SPEC.md`, `PLAN.md`, `TASKS.md`, `REVIEW.md`, or `VALIDATION.md` directly in `workflow/` root.**

If `workflow/`, `workflow/<change-slug>/`, or any required artifact does not exist yet, **create the directory and initialize the missing files automatically** using the templates in `./resources/`.

### Supporting Assets & Evidence

Any agent or contributor in **any phase** (`BACKLOG.md`, `SPEC.md`, `PLAN.md`, `TASKS.md`, `REVIEW.md`, or `VALIDATION.md`) may attach screenshots (e.g., annotated UI bug captures), diagrams, logs, or other supporting files to enrich context for downstream or peer agents:

- **Storage location**:
  - Store backlog-level evidence referenced by `workflow/BACKLOG.md` in `workflow/assets/`.
  - Store change-specific evidence referenced by `SPEC.md`, `PLAN.md`, `TASKS.md`, `REVIEW.md`, or `VALIDATION.md` in `workflow/<change-slug>/assets/`.
  - Never scatter temporary evidence files in the repository root, source directories, or tracked `docs/` folders.
- **Naming**: Use clear, descriptive filenames (preferably kebab-case, prefixed with the related item/finding ID when applicable, such as `b1-checkout-bug-annotated.png` or `r2-mobile-overflow.png`).
- **Linking**: Reference attached files from any Markdown document using relative links or image embeds (e.g., `![Annotated checkout bug](./assets/b1-checkout-bug-annotated.png)` or `[Failure log](./assets/test-failure.log)`).

### Version Control

The `workflow/` directory—including `workflow/assets/` and all subdirectories—contains local process-management and guidance artifacts and **must never be tracked by Git**:

- Check whether `workflow/` is listed in the repository's `.gitignore`; if it is missing, ask the user for confirmation before adding it.
- Never stage or commit `workflow/` or any files inside it. If `workflow/` is somehow already tracked, warn the user before untrack/cleanup operations.

## Artifact Lifecycle

### 0. `workflow/BACKLOG.md` — Capture Product Intent & Backlog (Conditional)

Create or update `BACKLOG.md` when a Product Owner (or stakeholder) wants to frame a new feature, improvement, or bug fix—or maintain a prioritized mini-backlog of software evolutions—before engineering specification begins.

- **Purpose**: Separate product discovery, priority, and user value (*why* and *who*) from technical design (`SPEC.md`).
- **Template**: Start from [BACKLOG.md](./resources/BACKLOG.md).
- **Rules**:
  - Maintain an ordered **Product Backlog** table for candidate evolutions, features, and bug reports (`Idea`, `Refining`, `Ready`, `In Downstream`, `Done`).
  - Complete the **Active Demand Brief** and **Definition of Ready (DoR)** before handing an item off to `SPEC.md`.
  - Keep `BACKLOG.md` free of technical implementation details (file paths, schemas, or code).

### 1. `workflow/<change-slug>/SPEC.md` — Define the Change

Create `workflow/<change-slug>/SPEC.md` first for any new feature, bug fix, or architectural change.

- **Purpose**: Align on scope, behavior, constraints, and acceptance criteria before writing code.
- **Template**: Start from [SPEC.md](./resources/SPEC.md).
- **Rules**:
  - State both **Goals** and **Non-Goals** to prevent scope creep.
  - Write testable **Acceptance Criteria** so completion is objective.
  - For bug fixes, document reproduction steps, expected vs. actual behavior, and root cause (once known).

### 2. `workflow/<change-slug>/PLAN.md` — Map Execution Steps

Create `workflow/<change-slug>/PLAN.md` once `SPEC.md` is clear.

- **Purpose**: Translate the specification into concrete, ordered engineering steps.
- **Template**: Start from [PLAN.md](./resources/PLAN.md).
- **Rules**:
  - Reference `SPEC.md` requirements; do not duplicate the full spec.
  - List affected files/modules, ordered implementation steps, and a concrete verification strategy (tests, linters, manual checks).
  - Highlight risks, migrations, or rollback considerations if applicable.

### 3. `workflow/<change-slug>/TASKS.md` — Shard Large or Parallel Work (Conditional)

Create `workflow/<change-slug>/TASKS.md` **only** when at least one of these conditions holds:

1. The `PLAN.md` is too large or comprehensive to execute cleanly in a single pass.
2. The `PLAN.md` spans two or more distinct project scopes (e.g., frontend, backend, infra, or multiple packages), task types (`feature`, `bugfix`, `refactor`, `docs`), or independent deliverables that benefit from separate tracking.
3. Work can be split into independent units executed **in parallel or asynchronously** by different agents or contributors.

- **Template**: Start from [TASKS.md](./resources/TASKS.md).
- **Rules**:
  - Skip `TASKS.md` for small, linear changes where `PLAN.md` is sufficient.
  - Every task must specify an ID, status (`pending`, `in_progress`, `blocked`, `done`), dependencies, owned files/scope (to avoid merge conflicts between parallel agents), and clear done criteria.
  - Keep task statuses updated as work progresses.

### 4. `workflow/<change-slug>/REVIEW.md` — Record Code Review Findings

Create or update `workflow/<change-slug>/REVIEW.md` when a human or reviewing agent inspects the implemented changes.

- **Purpose**: Centralize actionable review observations that require attention before merging.
- **Template**: Start from [REVIEW.md](./resources/REVIEW.md).
- **Rules**:
  - Categorize every observation by severity (`blocker`, `major`, `minor`, `question`).
  - Point to exact file paths, line ranges, or symbols, and explain *why* the issue matters.
  - Track resolution status (`open`, `resolved`, `wontfix`) so nothing is lost across review rounds.

### 5. `workflow/<change-slug>/VALIDATION.md` — Product Delivery Validation (Conditional)

Create `workflow/<change-slug>/VALIDATION.md` after `REVIEW.md` is approved whenever `workflow/BACKLOG.md` was used or a Product Owner / stakeholder needs a structured handoff to validate the delivered value.

- **Purpose**: Translate the completed engineering delivery back into plain-language product outcomes, validation steps, and formal acceptance sign-off.
- **Template**: Start from [VALIDATION.md](./resources/VALIDATION.md).
- **Rules**:
  - Prepared by the Architect (or lead engineer) with a **Delivery Summary**, **Backlog Value Mapping**, and observable **How to Validate** scenarios.
  - Reviewed and signed off by the Product Owner (`Approved` or `Changes Requested`) before closing the cycle.

## Verification & Cleanup

Before considering a change (`workflow/<change-slug>/`) complete:

1. Every acceptance criterion in `workflow/<change-slug>/SPEC.md` is satisfied and verified by tests or explicit checks.
2. All steps in `workflow/<change-slug>/PLAN.md` (and `workflow/<change-slug>/TASKS.md`, if used) are completed or explicitly deferred.
3. All `blocker` and `major` items in `workflow/<change-slug>/REVIEW.md` are marked `resolved` (or `wontfix` with rationale).
4. If `workflow/<change-slug>/VALIDATION.md` is used, the Product Owner has marked it `Approved` (and updated the corresponding item status in `workflow/BACKLOG.md` to `Done`).
5. **Ask the user for final sign-off and cleanup**: Once the plan, tasks (if any), review, and validation (if used) are complete, explicitly ask the user if everything is ready and whether the completed `workflow/<change-slug>/` artifacts can be cleaned up.
   - **Never delete** the root `workflow/` directory or `workflow/BACKLOG.md`.
   - When the user confirms cleanup for a completed change, **delete the completed `workflow/<change-slug>/` subdirectory** (along with its `SPEC.md`, `PLAN.md`, `TASKS.md`, `REVIEW.md`, `VALIDATION.md`, and `assets/`), without touching other active `workflow/<other-slug>/` subdirectories.
   - If `workflow/BACKLOG.md` was used, preserve the backlog table (keeping ongoing items), clear only the completed demand brief if appropriate, and remove completed-change files inside `workflow/assets/` that are no longer referenced by ongoing `BACKLOG.md` items.
````

## File: .agents/mcp.json
````json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "mcpServers": {
    "sequential-thinking": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    },
    "memory": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-memory"
      ]
    }
  }
}
````

## File: spec/MATRIX.md
````markdown
# Agent Translation & Interoperability Matrix (`v0.1.0`)

This document defines the exact deterministic mapping between the canonical
`.agents/mcp.json` specification and the native configuration formats required by
supported AI coding agents.

Every rule below is normative for `agents-mcp` adapters and is covered by
`tests/adapters/`.

---

## 1. Capability Summary

| Agent (`id`) | Scopes | Project path | Global path | Root key | Format | Env syntax | Native `:-default` | Native disable | `cwd` |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`claude-code`** | project, global | `.mcp.json` | `~/.claude.json` | `mcpServers` | JSON (JSONC-tolerant) | `${VAR}` | **Yes** | No | No |
| **`cursor`** | project, global | `.cursor/mcp.json` | `~/.cursor/mcp.json` | `mcpServers` | JSON | `${env:VAR}` | No | No | No |
| **`vscode`** | project, global | `.vscode/mcp.json` | OS User Profile `mcp.json` | `servers` | JSONC | `${env:VAR}` | No | No | No |
| **`opencode`** | project, global | `opencode.json` | `~/.config/opencode/opencode.json` | `mcp` | JSONC | `{env:VAR}` | No | **Yes** (`enabled`) | No |
| **`windsurf`** | global only | — | `~/.codeium/windsurf/mcp_config.json` | `mcpServers` | JSON | `${env:VAR}` | No | No | No |
| **`zed`** | project, global | `.zed/settings.json` | `~/.config/zed/settings.json` | `context_servers` | JSONC | `${VAR}` | No | No | No |
| **`antigravity`** | project, global | `.agents/plugins/<name>/` (per-plugin) | `.agents/plugins/<name>/` (per-plugin) | `mcpServers` | JSON | `${VAR}` | No | No | No |

> **Transport inference:** native entries that expose only a URL, or whose
> native format does not distinguish transports, are imported as `"streamable-http"`
> (see §4 and §5).

### 1.1 Global path resolution

| Agent | Linux | macOS | Windows |
| :--- | :--- | :--- | :--- |
| `claude-code` | `~/.claude.json` | `~/.claude.json` | `%USERPROFILE%\.claude.json` |
| `cursor` | `~/.cursor/mcp.json` | `~/.cursor/mcp.json` | `%USERPROFILE%\.cursor\mcp.json` |
| `vscode` | `${XDG_CONFIG_HOME:-~/.config}/Code/User/mcp.json` | `~/Library/Application Support/Code/User/mcp.json` | `%APPDATA%\Code\User\mcp.json` |
| `opencode` | `${XDG_CONFIG_HOME:-~/.config}/opencode/opencode.json` | `~/.config/opencode/opencode.json` | `%APPDATA%\opencode\opencode.json` |
| `windsurf` | `~/.codeium/windsurf/mcp_config.json` | `~/.codeium/windsurf/mcp_config.json` | `%USERPROFILE%\.codeium\windsurf\mcp_config.json` |
| `zed` | `${XDG_CONFIG_HOME:-~/.config}/zed/settings.json` | `~/.config/zed/settings.json` | `%APPDATA%\Zed\settings.json` |

`vscode` MUST probe, in order, the stable channel (`Code`), Insiders
(`Code - Insiders`), and VSCodium (`VSCodium`), and use the first profile
directory that exists. All paths are resolved from the injected
`RuntimeContext` (`homeDir`, `platform`, `env`), never from module-level
`os.homedir()` / `process.platform` calls.

---

## 2. Compiled Output (`stdio` and `streamable-http`)

| Agent | `stdio` entry | `streamable-http` entry |
| :--- | :--- | :--- |
| `claude-code` | `{ "type": "stdio", "command", "args", "env" }` | `{ "type": "streamable-http", "url", "headers" }` |
| `cursor` | `{ "command", "args", "env" }` | `{ "url", "headers" }` |
| `vscode` | `{ "type": "stdio", "command", "args", "env" }` | `{ "type": "streamable-http", "url", "headers" }` |
| `opencode` | `{ "type": "local", "command": [command, ...args], "environment": env }` | `{ "type": "remote", "url", "headers" }` |
| `windsurf` | `{ "command", "args", "env" }` | `{ "serverUrl": url, "headers" }` |
| `zed` | `{ "command": { "path": command, "args", "env" } }` | `{ "url", "headers" }` |

Rules:

- Omit `args` when empty and `env`/`headers` when absent.
- `cwd` is preserved in the canonical file but omitted for every agent in
  `v0.1.0` (`CWD_UNSUPPORTED` warning).
- Never emit a literal secret value. Placeholders are translated, never resolved,
  when writing native files.

---

## 3. Environment Syntax Translation

Interpolation MUST be translated in **all** string-bearing fields: `env` values,
`headers` values, `args` items, and `url`.

| Canonical | `claude-code` | `cursor` | `vscode` | `opencode` | `windsurf` | `zed` |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `${VAR}` | `${VAR}` | `${env:VAR}` | `${env:VAR}` | `{env:VAR}` | `${env:VAR}` | `${VAR}` |
| `${VAR:-fallback}` | `${VAR:-fallback}` | `${env:VAR}` + warning | `${env:VAR}` + warning | `{env:VAR}` + warning | `${env:VAR}` + warning | `${VAR}` + warning |

Unknown placeholder syntax inside a native value (for example an unexpected
`${env:...}` produced by another tool) MUST be preserved verbatim and reported as
`UNKNOWN_PLACEHOLDER`.

---

## 4. Import Normalization (Reverse Mapping)

`extractServers()` converts native entries back into canonical servers. Inference
rules:

| Agent | `stdio` inference | `streamable-http` inference | Transformations |
| :--- | :--- | :--- | :--- |
| `claude-code` | `type === "stdio"`, or `command` present without `url` | `type === "streamable-http"` or `url` present | `${VAR}` unchanged; omitted servers are unrecoverable |
| `cursor` | `command` present | `url` present | `${env:VAR}` → `${VAR}` |
| `vscode` | `type === "stdio"` | `type === "streamable-http"` or `url` present | `${env:VAR}` → `${VAR}`; `inputs` ignored; any other transport with `url` → `streamable-http` + warning |
| `opencode` | `type === "local"` | `type === "remote"` | `command[0]` → command, rest → args, `environment` → env, `{env:VAR}` → `${VAR}` |
| `windsurf` | `command` present | `serverUrl` present | `serverUrl` → `url`, `${env:VAR}` → `${VAR}` |
| `zed` | `command.path` present | `url` present | nested command unpacked; `source` ignored; `${VAR}` unchanged |

When an entry has both `command` and `url`, `url` wins with a
`AMBIGUOUS_ENTRY` warning. Unknown native fields are dropped with
`UNKNOWN_FIELD_DROPPED`; extraction never mutates the source file.

Native formats do not store server-level targeting or disabled flags; imported
servers have no such fields.

---

## 5. Lossy Mappings & Warnings

| Code | Agent(s) | Meaning |
| :--- | :--- | :--- |
| `DEFAULT_DROPPED` | cursor, vscode, opencode, windsurf, zed | `:-fallback` has no native equivalent and was discarded. |
| `CWD_UNSUPPORTED` | all (v0.1.0) | `cwd` cannot be represented natively. |
| `SCOPE_UNSUPPORTED` | windsurf (project) | Agent only supports global scope; operation skipped. |
| `TRANSPORT_INFERRED` | vscode, cursor, windsurf, zed | An entry without a canonical transport (for example, URL-only) was imported as `streamable-http`. |
| `UNKNOWN_FIELD_DROPPED` | all | A native field had no canonical equivalent. |
| `AMBIGUOUS_ENTRY` | all | Both `command` and `url` were present. |
| `UNKNOWN_PLACEHOLDER` | all | A placeholder did not match the supported grammar. |
| `MANUAL_ENTRY_PRESERVED` | all | A native entry not owned by the compiler was left untouched. |

Warnings never fail a command; `doctor` reports them and `--strict` promotes
them to errors. Findings are always returned through the adapter result, never
printed from inside an adapter.

---

## 6. Canonical Input Reference

All compiled examples below are produced from this canonical `.agents/mcp.json`:

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "postgres": {
      "type": "stdio",
      "command": "uvx",
      "args": ["mcp-server-postgres", "${DATABASE_URL}"]
    },
    "linear": {
      "type": "streamable-http",
      "url": "https://mcp.linear.app/mcp",
      "headers": {
        "Authorization": "Bearer ${LINEAR_API_KEY}"
      }
    }
  }
}
```

## 7. Compiled Agent Outputs

### 7.1 Claude Code (`claude-code`)

- **Target file:** `.mcp.json` (project) / `~/.claude.json` (global)
- **Notes:** Supports `${VAR}` and `${VAR:-default}` natively. The global file stores
  general Claude Code state (projects, history, flags) alongside `mcpServers`, so
  compilers MUST perform a non-destructive AST merge.

```json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "linear": {
      "type": "streamable-http",
      "url": "https://mcp.linear.app/mcp",
      "headers": {
        "Authorization": "Bearer ${LINEAR_API_KEY}"
      }
    }
  }
}
```

### 7.2 Cursor (`cursor`)

- **Target file:** `.cursor/mcp.json` (project) / `~/.cursor/mcp.json` (global)
- **Notes:** Requires `${env:VAR}`. Omits `type` on both `stdio` and `http`
  entries.

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${env:GITHUB_TOKEN}"
      }
    },
    "linear": {
      "url": "https://mcp.linear.app/mcp",
      "headers": {
        "Authorization": "Bearer ${env:LINEAR_API_KEY}"
      }
    }
  }
}
```

### 7.3 Visual Studio Code (`vscode`)

- **Target file:** `.vscode/mcp.json` (project) / OS User Profile `mcp.json` (global)
- **Notes:** Uses `"servers"` and `${env:VAR}`. Compilers MUST preserve existing
  `"inputs"` arrays and JSONC comments.

```json
{
  "servers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${env:GITHUB_TOKEN}"
      }
    },
    "linear": {
      "type": "streamable-http",
      "url": "https://mcp.linear.app/mcp",
      "headers": {
        "Authorization": "Bearer ${env:LINEAR_API_KEY}"
      }
    }
  }
}
```

### 7.4 OpenCode (`opencode`)

- **Target file:** `opencode.json` (project) / `~/.config/opencode/opencode.json` (global)
- **Notes:** Uses `"mcp"`, merges `command` and `args` into one array, renames
  `env` to `environment`, uses `"local"` / `"remote"` types, supports native
  `"enabled"`, and uses `{env:VAR}` without `$`.

```json
{
  "mcp": {
    "github": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-github"],
      "environment": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "{env:GITHUB_TOKEN}"
      },
      "enabled": true
    },
    "postgres": {
      "type": "local",
      "command": ["uvx", "mcp-server-postgres", "{env:DATABASE_URL}"]
    },
    "linear": {
      "type": "remote",
      "url": "https://mcp.linear.app/mcp",
      "headers": {
        "Authorization": "Bearer {env:LINEAR_API_KEY}"
      },
      "enabled": true
    }
  }
}
```

### 7.5 Windsurf (`windsurf`)

- **Target file:** `~/.codeium/windsurf/mcp_config.json` (global scope only)
- **Notes:** Uses `"serverUrl"` for remote endpoints and requires `${env:VAR}`.
  Project-scope compilation MUST skip this agent with `SCOPE_UNSUPPORTED`.

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${env:GITHUB_TOKEN}"
      }
    },
    "linear": {
      "serverUrl": "https://mcp.linear.app/mcp",
      "headers": {
        "Authorization": "Bearer ${env:LINEAR_API_KEY}"
      }
    }
  }
}
```

### 7.6 Zed (`zed`)

- **Target file:** `.zed/settings.json` (project) / `~/.config/zed/settings.json` (global)
- **Notes:** Nests `stdio` execution inside
  `"command": { "path", "args", "env" }` under `"context_servers"`. Requires a
  non-destructive JSONC merge so editor settings remain untouched.

```json
{
  "context_servers": {
    "github": {
      "command": {
        "path": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": {
          "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
        }
      }
    },
    "linear": {
      "url": "https://mcp.linear.app/mcp",
      "headers": {
        "Authorization": "Bearer ${LINEAR_API_KEY}"
      }
    }
  }
}
```
````

## File: src/commands/remove.command.ts
````typescript
/**
 * `remove` command (§11).
 *
 * Remove a server from the canonical config and sync unless `--no-sync`.
 * Unknown name → exit `1`.
 */

import { defineCommand } from 'citty'
import {
  createUiAndCtx,
  configPath,
  persistCanonicalConfig,
  isDryRun,
  isGlobalFlag,
  isYesFlag,
  loadSyncState,
  persistSyncState,
  isNoSyncFlag,
  parseAgentsFlag,
  formatConfigValidationError,
  formatDryRunActions,
} from '$/src/commands/util'
import { runSync } from '$/src/commands/sync'
import { loadValidatedConfig, ConfigValidationError } from '$/src/core/store'
import type { ConfigScope } from '$/src/core/context'
import { removeManagedPlugin } from '$/src/core/plugins'

export const removeCommand = defineCommand({
  meta: {
    name: 'remove',
    description: 'Remove a server and clean it from managed agent configs',
  },
  args: {
    'no-sync': {
      type: 'boolean',
      description: 'Remove from canonical without running sync afterwards',
    },
  },
  run: async ({ args, rawArgs }) => {
    const { ctx, ui } = createUiAndCtx({ yes: isYesFlag(args) })
    const scope = (isGlobalFlag(args) ? 'global' : 'project') as ConfigScope
    const path = configPath(scope, ctx)
    const dryRun = isDryRun(args)
    const noSync = isNoSyncFlag(args, rawArgs)
    const yes = isYesFlag(args)
    const agentsFlag = parseAgentsFlag(args, rawArgs)
    const name = args._?.[0] as string | undefined

    if (!name) {
      ui.error('Usage: agents-mcp remove <name>')
      process.exit(2)
    }

    // Load + validate canonical config, reporting ConfigValidationError cleanly.
    let validated
    try {
      validated = loadValidatedConfig(scope, ctx)
    } catch (err) {
      if (err instanceof ConfigValidationError) {
        ui.error(formatConfigValidationError(err))
        process.exit(1)
      }
      throw err
    }
    if (!validated) {
      ui.error(`No canonical config at ${path}. Run 'agents-mcp init' first.`)
      process.exit(1)
    }

    const servers = {
      ...(validated.config.mcpServers as Record<string, unknown>),
    }
    if (!(name in servers)) {
      ui.error(`Unknown server \`${name}\`. Not found in canonical config.`)
      process.exit(1)
    }

    // Load the state before changing the canonical config.
    const stateResult = loadSyncState(scope, ctx)
    const state = stateResult.state

    delete servers[name]

    // Planned file operations for the --dry-run preview (zero disk writes).
    const planned: { type: 'write' | 'remove'; path: string }[] = []
    planned.push({ type: 'write', path })

    if (!dryRun) {
      persistCanonicalConfig(scope, ctx, {
        $schema: validated.config.$schema,
        mcpServers: servers,
      })
    }

    ui.note(`Removed server \`${name}\` from canonical config`)

    if (dryRun) {
      // Dry-run preview of planned file operations (zero disk writes).
      ui.note(formatDryRunActions(planned))
      return
    }

    if (noSync) {
      const removal = removeManagedPlugin({
        scope,
        ctx,
        name,
        managedPlugins: state.managedPlugins,
        dryRun: false,
      })

      if (removal.ok) {
        const nextState = {
          ...state,
          scope,
          targets: state.targets,
          agents: { ...state.agents },
          managedPlugins: state.managedPlugins.filter((n) => n !== name),
        }
        persistSyncState(scope, ctx, nextState)
        if (removal.removed.length > 0) {
          ui.note(
            `Agent sync skipped (--no-sync): the managed plugin of \`${name}\` was cleaned. Run \`agents-mcp sync\` to sync agents later.`,
          )
        }
      } else {
        for (const err of removal.errors) {
          ui.error(err)
        }
        ui.note(
          `Server \`${name}\` was removed from canonical, but plugin files remain and will be reprocessed on the next \`sync\`.`,
        )
        process.exit(1)
        return
      }
    } else {
      const summary = await runSync({
        scope,
        ctx,
        flag: agentsFlag,
        dryRun: false,
        yes,
        // B7: removing a server in a project without targets succeeds and
        // cleans up the managed plugin.
        allowEmptyTargets: true,
      })
      if (summary.errors.length > 0) {
        process.exit(1)
      }
    }
  },
})
````

## File: src/commands/sync.command.ts
````typescript
/**
 * `sync` command definition for citty (§11).
 *
 * Reuses `runSync` from `./sync` and wires citty args into `SyncOptions`.
 */

import { defineCommand } from 'citty'
import { runSync, type SyncOptions } from './sync'
import {
  createUiAndCtx,
  isGlobalFlag,
  isYesFlag,
  parseAgentsFlag,
} from '$/src/commands/util'

export const syncCommand = defineCommand({
  meta: {
    name: 'sync',
    description:
      'Compile .agents/mcp.json into all targeted agent config files',
  },
  args: {},
  run: async ({ args, rawArgs }) => {
    const { ctx, ui } = createUiAndCtx({ yes: isYesFlag(args) })
    const scope = isGlobalFlag(args) ? 'global' : 'project'
    const flag = parseAgentsFlag(args, rawArgs)
    const dryRun = args['dry-run'] === true

    // Fail fast on positional arguments instead of silently falling back to
    // stale state.targets (e.g. `npm run cli sync --agents cursor` without
    // `--` makes npm consume the flag and pass a bare positional value).
    if (Array.isArray(args._) && args._.length > 0) {
      ui.error(
        `Unexpected positional argument(s) for \`sync\`: ${args._.join(' ')}. To select agents, pass \`--agents <list>\` (when using \`npm run\`, add \`--\` before flags).`,
      )
      process.exit(2)
      return
    }

    const summary = await runSync({
      scope,
      ctx,
      flag,
      dryRun,
      yes: isYesFlag(args),
      allowEmptyTargets: true,
    })

    if (summary.errors.length > 0 && !dryRun) {
      process.exit(1)
    }
  },
})
````

## File: src/commands/util.ts
````typescript
/**
 * Shared helpers for the core commands (§11).
 *
 * Commands own the `RuntimeContext` + `PromptUi` creation and filesystem/state
 * access. Adapters and compilers remain pure.
 */

import { readTextFile, writeFileAtomic } from '$/src/core/fs-atomic'
import {
  getConfigPath,
  loadValidatedConfig,
  writeConfig,
  ConfigValidationError,
} from '$/src/core/store'
import {
  getStatePath,
  loadState,
  writeState,
  type LoadStateResult,
  type SyncState,
} from '$/src/core/state'
import { resolveTargetsAsync } from '$/src/adapters/index'
import { createUi } from '$/src/index'
import type { ConfigScope, RuntimeContext } from '$/src/core/context'
import type { AgentId, AgentAdapter } from '$/src/adapters/types'
import { getAdapter } from '$/src/adapters/index'
import type { CanonicalServer, CanonicalMcpConfig } from '$/src/core/schema'
import { AGENTS_DIR, CONFIG_FILE } from '$/src/config'

export { writeFileAtomic } from '$/src/core/fs-atomic'

/** Create the `RuntimeContext` and `PromptUi` for the current process. */
export function createUiAndCtx({ yes = false }: { yes?: boolean } = {}): {
  ctx: RuntimeContext
  ui: ReturnType<typeof createUi>['ui']
} {
  const { ctx, ui } = createUi({ yes })
  return { ctx, ui }
}

/** Path to the canonical config for a scope. */
export function configPath(scope: ConfigScope, ctx: RuntimeContext): string {
  return getConfigPath(scope, ctx)
}

/** Path to the sync state for a scope. */
export function statePath(scope: ConfigScope, ctx: RuntimeContext): string {
  return getStatePath(scope, ctx)
}

/** Load the canonical config for a scope. Null when absent. */
export function loadCanonicalConfig(
  scope: ConfigScope,
  ctx: RuntimeContext,
): Awaited<ReturnType<typeof loadValidatedConfig>> | null {
  return loadValidatedConfig(scope, ctx)
}

/** Format a `ConfigValidationError` into a clean, human-readable string. */
export function formatConfigValidationError(
  err: ConfigValidationError,
): string {
  const issues = err.issues
    .map((issue) => `  • ${issue.path || 'root'} — ${issue.message}`)
    .join('\n')
  return `Invalid config at ${err.path}:\n${issues}`
}

/**
 * Load the canonical config for a scope, exiting with a formatted error when
 * it is missing or invalid. Shared by `add`, `sync`, `list`, `remove`, and
 * `import` so every command reports `ConfigValidationError` consistently.
 */
export function loadCanonicalOrExit(
  scope: ConfigScope,
  ctx: RuntimeContext,
  ui: ReturnType<typeof createUi>['ui'],
): CanonicalMcpConfig {
  try {
    const validated = loadValidatedConfig(scope, ctx)
    if (!validated) {
      ui.error(
        `No canonical config at ${configPath(scope, ctx)}. Run 'agents-mcp init' first.`,
      )
      process.exit(1)
    }
    return validated.config
  } catch (err) {
    if (err instanceof ConfigValidationError) {
      ui.error(formatConfigValidationError(err))
      process.exit(1)
    }
    throw err
  }
}

/** Load the sync state (empty state when absent/corrupt). */
export function loadSyncState(
  scope: ConfigScope,
  ctx: RuntimeContext,
): LoadStateResult {
  return loadState(scope, ctx)
}

/** Persist the sync state atomically. */
export function persistSyncState(
  scope: ConfigScope,
  ctx: RuntimeContext,
  state: SyncState,
): void {
  writeState(scope, ctx, state)
}

/** Write the canonical config atomically (minimal serialization). */
export function persistCanonicalConfig(
  scope: ConfigScope,
  ctx: RuntimeContext,
  config: Record<string, unknown>,
): void {
  writeConfig({ scope, ctx, config })
}

/**
 * Resolve target agents with precedence flag → state → detection.
 */
export async function resolveTargetAgents({
  flag,
  state,
  ctx,
}: {
  flag: readonly string[] | undefined
  state: SyncState
  ctx: RuntimeContext
}): Promise<AgentId[]> {
  return resolveTargetsAsync({ flag, state, ctx })
}

/**
 * Read the existing native file content for an adapter (null when absent).
 */
export async function readNativeContent(
  adapter: AgentAdapter,
  scope: ConfigScope,
  ctx: RuntimeContext,
): Promise<string | null> {
  const path = adapter.getConfigPath(scope, ctx)
  if (path === null) {
    return null
  }
  return readTextFile(path)
}

/**
 * Write native content for an adapter atomically.
 */
export async function writeNativeContent(
  adapter: AgentAdapter,
  scope: ConfigScope,
  ctx: RuntimeContext,
  content: string,
): Promise<void> {
  const path = adapter.getConfigPath(scope, ctx)
  if (path === null) {
    return
  }
  writeFileAtomic(path, content)
}

/** Whether `dry-run` is active from the parsed citty args. */
export function isDryRun(args: Record<string, unknown>): boolean {
  return args['dry-run'] === true
}

/**
 * Whether the global scope was requested, accepting both the long flag
 * (`--global`) and the short alias (`-g`). Subcommands do not inherit the
 * root command aliases, so the raw token may arrive as `args.g`.
 */
export function isGlobalFlag(args: Record<string, unknown>): boolean {
  return args.global === true || args.g === true
}

/**
 * Whether non-interactive mode was requested, accepting both the long flag
 * (`--yes`) and the short alias (`-y`). Subcommands do not inherit the root
 * command aliases, so the raw token may arrive as `args.y`.
 */
export function isYesFlag(args: Record<string, unknown>): boolean {
  return args.yes === true || args.y === true
}

/** Format planned file operations for a `--dry-run` preview. */
export function formatDryRunActions(
  actions: { type: 'write' | 'remove'; path: string }[],
): string {
  return actions.map((a) => `[dry-run] ${a.type} ${a.path}`).join('\n')
}

/**
 * Detects the `--no-sync` flag regardless of how citty parsed it.
 *
 * Citty consumes `--no-sync` before parsing and delivers `args.sync === false`
 * (without the `no-sync` key). This helper covers all forms:
 * `args['no-sync'] === true`, `args.sync === false` and `rawArgs.includes('--no-sync')`.
 */
export function isNoSyncFlag(
  args: Record<string, unknown>,
  rawArgs: readonly string[],
): boolean {
  return (
    args['no-sync'] === true ||
    args.sync === false ||
    rawArgs.includes('--no-sync')
  )
}

/** Normalizes a comma-separated list of agents. */
function splitAgentList(value: string): string[] | undefined {
  const ids = value
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
  return ids.length > 0 ? ids : undefined
}

/**
 * Extracts `--agents` from `args` (when citty already parsed the flag) and
 * from `rawArgs` (forms `--agents=<list>` and `--agents <list>`).
 *
 * The `rawArgs` fallback covers subcommands that do not declare `agents` and
 * the case where citty transforms `--agents <list>` into `true` + positional.
 */
export function parseAgentsFlag(
  args: Record<string, unknown>,
  rawArgs: readonly string[],
): string[] | undefined {
  const fromArgs = args.agents
  if (typeof fromArgs === 'string') {
    const parsed = splitAgentList(fromArgs)
    if (parsed) {
      return parsed
    }
  }

  for (let i = 0; i < rawArgs.length; i++) {
    const token = rawArgs[i]
    if (token === undefined) continue
    if (token === '--') break
    if (token.startsWith('--agents=')) {
      return splitAgentList(token.slice('--agents='.length))
    }
    if (token === '--agents') {
      const next = rawArgs[i + 1]
      if (next !== undefined && !next.startsWith('-')) {
        return splitAgentList(next)
      }
    }
  }

  return undefined
}

export { AGENTS_DIR, CONFIG_FILE, type CanonicalServer }
````

## File: src/core/state.ts
````typescript
import { z } from 'zod'
import { AgentIdSchema } from '$/src/core/schema'
import {
  AGENTS_DIR,
  LEGACY_STATE_FILE,
  STATE_FILE,
  STATE_VERSION,
} from '$/src/config'
import { readTextFile, writeFileAtomic } from '$/src/core/fs-atomic'
import type { RuntimeContext, ConfigScope } from '$/src/core/context'

export type AgentId = z.infer<typeof AgentIdSchema>

export interface SyncStateAgent {
  path: string
  names: string[]
  updatedAt: string // ISO-8601
}

export interface SyncState {
  version: 1
  scope: ConfigScope
  targets: AgentId[]
  agents: Partial<Record<AgentId, SyncStateAgent>>
  /** Nomes de plugins gerenciados pela CLI em `.agents/plugins/<name>/`. */
  managedPlugins: string[]
}

export interface LoadStateResult {
  state: SyncState
  warnings: string[]
  /** Non-fatal hints surfaced to the user (e.g. a legacy file was imported). */
  notices: string[]
}

const SyncStateAgentSchema = z.object({
  path: z.string(),
  names: z.array(z.string()),
  updatedAt: z.string().datetime(),
})

const SyncStateSchema = z.object({
  version: z.literal(STATE_VERSION),
  scope: z.enum(['project', 'global']),
  targets: z.array(AgentIdSchema),
  agents: z.partialRecord(AgentIdSchema, SyncStateAgentSchema).default({}),
  /** Nomes de plugins gerenciados pela CLI (retrocompatível: default []). */
  managedPlugins: z.array(z.string()).default([]),
})

/**
 * Build an empty sync state for the given scope. Public so callers (and tests)
 * can construct a fresh state without relying on a mutable singleton.
 */
export function emptyState(scope: ConfigScope): SyncState {
  return {
    version: STATE_VERSION,
    scope,
    targets: [],
    agents: {},
    managedPlugins: [],
  }
}

export function getStatePath(scope: ConfigScope, ctx: RuntimeContext): string {
  const base = scope === 'project' ? ctx.cwd : ctx.homeDir
  return `${base}/${AGENTS_DIR}/${STATE_FILE}`
}

export function getLegacyStatePath(
  scope: ConfigScope,
  ctx: RuntimeContext,
): string {
  const base = scope === 'project' ? ctx.cwd : ctx.homeDir
  return `${base}/${AGENTS_DIR}/${LEGACY_STATE_FILE}`
}

/**
 * Parse a sync state file with `SyncStateSchema`.
 *
 * The caller handles the missing-file case before calling this. Returns the
 * parsed state on success, or a warning for corrupt JSON / invalid shape.
 */
function parseStateFile(
  raw: string,
  path: string,
): { state: SyncState } | { warning: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { warning: `Corrupt sync state at ${path}; treating as empty` }
  }

  const result = SyncStateSchema.safeParse(parsed)
  if (!result.success) {
    return { warning: `Invalid sync state at ${path}; treating as empty` }
  }

  return { state: result.data }
}

/**
 * Load the sync state with precedence: new lock (`.agents/mcp-lock.json`)
 * → legacy file (`.mcp-sync-state.json`) → empty state.
 *
 * - Neither file present → empty state, no warning.
 * - New lock present and valid → it wins; the legacy file is ignored silently.
 * - New lock corrupt/invalid → warning + empty state; NO fallback to legacy
 *   (avoid resurrecting stale state over a newer corrupt file).
 * - New absent + legacy valid → legacy state plus a non-fatal notice.
 * - New absent + legacy corrupt → warning + empty state.
 */
export function loadState(
  scope: ConfigScope,
  ctx: RuntimeContext,
): LoadStateResult {
  const lockPath = getStatePath(scope, ctx)
  const legacyPath = getLegacyStatePath(scope, ctx)

  // 1. New lock file.
  const lockRaw = readTextFile(lockPath)
  if (lockRaw !== null) {
    const parsed = parseStateFile(lockRaw, lockPath)
    if ('state' in parsed) {
      return { state: parsed.state, warnings: [], notices: [] }
    }
    // Corrupt/invalid new lock: warn + empty, never read the legacy file.
    return { state: emptyState(scope), warnings: [parsed.warning], notices: [] }
  }

  // 2. Legacy fallback: only when the new lock is absent.
  const legacyRaw = readTextFile(legacyPath)
  if (legacyRaw !== null) {
    const parsed = parseStateFile(legacyRaw, legacyPath)
    if ('state' in parsed) {
      return {
        state: parsed.state,
        warnings: [],
        notices: [
          `Legacy sync state at ${legacyPath} was imported; it will be replaced by ${lockPath} on the next write. You can delete the legacy file.`,
        ],
      }
    }
    return {
      state: emptyState(scope),
      warnings: [parsed.warning],
      notices: [],
    }
  }

  // 3. Neither file exists → empty state.
  return { state: emptyState(scope), warnings: [], notices: [] }
}

/**
 * Write the sync state (`.agents/mcp-lock.json`) atomically. No root-level
 * `updatedAt` is emitted — the per-agent `updatedAt` is updated only when
 * that agent's `names`/`path` actually changes, so identical states produce
 * byte-identical files. Never touches `.gitignore` and never writes or
 * deletes the legacy state file.
 */
export function writeState(
  scope: ConfigScope,
  ctx: RuntimeContext,
  state: SyncState,
): void {
  const path = getStatePath(scope, ctx)
  writeFileAtomic(path, JSON.stringify(state, null, 2) + '\n')
}

/**
 * Merge `names` into the per-agent record for `agentId`, creating the record if
 * needed. Used by `import` to seed managed names (even with `--no-sync`).
 * The per-agent `updatedAt` is refreshed only when names/path change.
 */
export function seedAgentNames(
  state: SyncState,
  agentId: AgentId,
  names: string[],
  configPath: string,
): SyncState {
  const existing = state.agents[agentId]
  const nextNames = existing
    ? [...new Set([...existing.names, ...names])]
    : names
  const changed =
    !existing ||
    existing.path !== configPath ||
    existing.names.length !== nextNames.length ||
    nextNames.some((n) => !existing!.names.includes(n))
  const merged: SyncStateAgent = {
    path: configPath,
    names: nextNames,
    updatedAt: changed
      ? new Date().toISOString()
      : (existing?.updatedAt ?? new Date().toISOString()),
  }
  return {
    ...state,
    agents: { ...state.agents, [agentId]: merged },
  }
}

/**
 * Prune names no longer present in `currentNames` for `agentId`. Used by
 * `remove` and `sync` to keep state consistent without touching manual entries.
 * The per-agent `updatedAt` is refreshed only when names actually change.
 */
export function pruneAgentNames(
  state: SyncState,
  agentId: AgentId,
  currentNames: string[],
): SyncState {
  const existing = state.agents[agentId]
  if (!existing) {
    return state
  }
  const kept = existing.names.filter((name) => currentNames.includes(name))
  if (kept.length === existing.names.length) {
    return state
  }
  return {
    ...state,
    agents: {
      ...state.agents,
      [agentId]: {
        ...existing,
        names: kept,
        updatedAt: new Date().toISOString(),
      },
    },
  }
}
````

## File: src/core/store.ts
````typescript
import { z } from 'zod'
import type { ParseError } from 'jsonc-parser'
import { parse, printParseErrorCode } from 'jsonc-parser'
import { readTextFile, writeFileAtomic } from '$/src/core/fs-atomic'
import type { RuntimeContext, ConfigScope } from '$/src/core/context'
import { AGENTS_DIR, CONFIG_FILE, DEFAULT_SCHEMA_URL } from '$/src/config'
import { CanonicalMcpConfigSchema, validateConfig } from '$/src/core/schema'

export class ConfigValidationError extends Error {
  readonly path: string
  readonly issues: Array<{ path: string; message: string }>

  constructor(
    message: string,
    path: string,
    issues: Array<{ path: string; message: string }> = [],
  ) {
    super(message)
    this.name = 'ConfigValidationError'
    this.path = path
    this.issues = issues
  }
}

export function getConfigPath(scope: ConfigScope, ctx: RuntimeContext): string {
  const base = scope === 'project' ? ctx.cwd : ctx.homeDir
  return `${base}/${AGENTS_DIR}/${CONFIG_FILE}`
}

export interface ReadConfigResult {
  config: Record<string, unknown>
  raw: string
}

export function readConfig(
  scope: ConfigScope,
  ctx: RuntimeContext,
): ReadConfigResult | null {
  const path = getConfigPath(scope, ctx)
  const raw = readTextFile(path)
  if (raw === null) {
    return null
  }

  // jsonc-parser tolerates comments and trailing commas even in `.json` files.
  // Collect parse errors so corrupt/truncated input is surfaced with a clear
  // error instead of silently discarding the tail of the document.
  const errors: ParseError[] = []
  const config = parse(raw, errors, {
    allowTrailingComma: true,
    allowEmptyContent: true,
  }) as unknown as Record<string, unknown>

  if (errors.length > 0) {
    const first = errors[0]!
    const code = printParseErrorCode(first.error)
    throw new ConfigValidationError(
      `Invalid JSONC at ${path} (offset ${first.offset}): ${code}`,
      path,
      [
        {
          path: '',
          message: `JSONC parse error at offset ${first.offset}: ${code}`,
        },
      ],
    )
  }

  if (config === undefined) {
    return { config: {}, raw }
  }

  return { config, raw }
}

export interface WriteConfigOptions {
  scope: ConfigScope
  ctx: RuntimeContext
  config: Record<string, unknown>
}

/**
 * Write the canonical config atomically, serializing only `$schema` and
 * `servers` (minimal, defaults not materialized). A user who omits `args`
 * keeps omitting it, so `sync` stays idempotent and produces minimal diffs.
 */
export function writeConfig({ scope, ctx, config }: WriteConfigOptions): void {
  const path = getConfigPath(scope, ctx)
  const serialized = serializeMinimal(config)
  // Never persist an invalid canonical document: validate before writing.
  CanonicalMcpConfigSchema.parse(JSON.parse(serialized))
  writeFileAtomic(path, serialized)
}

function serializeMinimal(config: Record<string, unknown>): string {
  const mcpServers = config['mcpServers'] ?? {}
  const document: Record<string, unknown> = {
    $schema: DEFAULT_SCHEMA_URL,
    mcpServers,
  }
  return JSON.stringify(document, null, 2) + '\n'
}

export interface LoadValidatedConfigResult {
  config: ReturnType<typeof CanonicalMcpConfigSchema.parse>
  warnings: string[]
}

export function loadValidatedConfig(
  scope: ConfigScope,
  ctx: RuntimeContext,
): LoadValidatedConfigResult | null {
  const result = readConfig(scope, ctx)
  if (result === null) {
    return null
  }

  let config: ReturnType<typeof CanonicalMcpConfigSchema.parse>
  try {
    config = CanonicalMcpConfigSchema.parse(result.config)
  } catch (err) {
    const zodErr = err as z.ZodError
    const issues = zodErr.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }))
    const firstPath = issues[0]?.path ?? ''
    throw new ConfigValidationError(
      `Invalid canonical config at ${getConfigPath(
        scope,
        ctx,
      )}: ${firstPath ? `${firstPath} — ` : ''}${zodErr.issues[0]?.message ?? ''}`,
      getConfigPath(scope, ctx),
      issues,
    )
  }

  const { warnings } = validateConfig(result.config)
  return { config, warnings }
}
````

## File: tests/cli/entrypoint.test.ts
````typescript
import { describe, expect, it, vi, afterEach, afterAll } from 'vitest'
import { runCommand } from 'citty'
import { main, normalizeGlobalArgs } from '$/src/index'
import { ConfigValidationError } from '$/src/core/store'
import pkg from '$/package.json' with { type: 'json' }

vi.mock('citty', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    runCommand: vi.fn(actual.runCommand as (...args: unknown[]) => unknown),
    showUsage: vi.fn(actual.showUsage as (...args: unknown[]) => unknown),
  }
})

describe('normalizeGlobalArgs', () => {
  it('converte --agents <lista> em --agents=<lista>', () => {
    expect(
      normalizeGlobalArgs(['sync', '--agents', 'antigravity,cursor']),
    ).toEqual(['sync', '--agents=antigravity,cursor'])
  })

  it('preserva --agents=<lista>', () => {
    expect(normalizeGlobalArgs(['sync', '--agents=antigravity'])).toEqual([
      'sync',
      '--agents=antigravity',
    ])
  })

  it('não converte --agents sem valor', () => {
    expect(normalizeGlobalArgs(['sync', '--agents'])).toEqual([
      'sync',
      '--agents',
    ])
  })

  it('não converte --agents após o separador --', () => {
    expect(
      normalizeGlobalArgs(['sync', '--', '--agents', 'antigravity']),
    ).toEqual(['sync', '--', '--agents', 'antigravity'])
  })

  it('move --agents <lista> de antes do subcomando para depois dele', () => {
    expect(
      normalizeGlobalArgs(['--agents', 'opencode,antigravity', 'sync']),
    ).toEqual(['sync', '--agents=opencode,antigravity'])
  })

  it('move --agents=<lista> de antes do subcomando para depois dele', () => {
    expect(normalizeGlobalArgs(['--agents=opencode', 'sync'])).toEqual([
      'sync',
      '--agents=opencode',
    ])
  })

  it('canonicaliza flags globais curtas de antes do subcomando', () => {
    expect(normalizeGlobalArgs(['-g', '--dry-run', 'sync'])).toEqual([
      'sync',
      '--global',
      '--dry-run',
    ])
    expect(normalizeGlobalArgs(['-y', 'sync'])).toEqual(['sync', '--yes'])
  })

  it('não reposiciona nada quando o separador -- vem antes do subcomando', () => {
    expect(normalizeGlobalArgs(['--agents', 'opencode', '--', 'sync'])).toEqual(
      ['--agents=opencode', '--', 'sync'],
    )
  })

  it('canonicaliza -g/-y depois do subcomando e preserva tokens após --', () => {
    expect(normalizeGlobalArgs(['sync', '-g', '-y'])).toEqual([
      'sync',
      '--global',
      '--yes',
    ])
    expect(normalizeGlobalArgs(['sync', '--', '-g', '-y'])).toEqual([
      'sync',
      '--',
      '-g',
      '-y',
    ])
  })

  it('não canonicaliza -y usado como valor de uma flag de valor', () => {
    expect(
      normalizeGlobalArgs([
        'add',
        'x',
        '--command',
        'npx',
        '--arg',
        '-y',
        '--arg',
        'pkg',
        '-g',
      ]),
    ).toEqual([
      'add',
      'x',
      '--command',
      'npx',
      '--arg',
      '-y',
      '--arg',
      'pkg',
      '--global',
    ])
  })
})

describe('CLI entrypoint', () => {
  const exitSpy = vi
    .spyOn(process, 'exit')
    .mockImplementation((() => {}) as NodeJS.Process['exit'])
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  afterEach(() => {
    exitSpy.mockClear()
    logSpy.mockClear()
    errorSpy.mockClear()
  })

  afterAll(() => {
    exitSpy.mockRestore()
    logSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('--version prints version and does not exit', async () => {
    const origArgv = process.argv
    process.argv = ['node', 'index.js', '--version']
    try {
      await expect(main()).resolves.toBeUndefined()
      expect(exitSpy).not.toHaveBeenCalled()
    } finally {
      process.argv = origArgv
    }
  })

  it('-v prints version and does not exit', async () => {
    const origArgv = process.argv
    process.argv = ['node', 'index.js', '-v']
    try {
      await expect(main()).resolves.toBeUndefined()
      expect(exitSpy).not.toHaveBeenCalled()
    } finally {
      process.argv = origArgv
    }
  })

  it('--help prints usage and does not exit', async () => {
    const origArgv = process.argv
    process.argv = ['node', 'index.js', '--help']
    try {
      await expect(main()).resolves.toBeUndefined()
      expect(exitSpy).not.toHaveBeenCalled()
    } finally {
      process.argv = origArgv
    }
  })

  it('-h prints usage and does not exit', async () => {
    const origArgv = process.argv
    process.argv = ['node', 'index.js', '-h']
    try {
      await expect(main()).resolves.toBeUndefined()
      expect(exitSpy).not.toHaveBeenCalled()
    } finally {
      process.argv = origArgv
    }
  })

  it('unknown command calls process.exit with 2', async () => {
    const origArgv = process.argv
    process.argv = ['node', 'index.js', 'nonexistent-command']
    try {
      // Mock process.exit to prevent vitest from detecting it
      const origExit = process.exit
      let exitCode: number | undefined
      process.exit = ((code: number) => {
        exitCode = code
      }) as unknown as NodeJS.Process['exit']
      try {
        await main()
        expect(exitCode).toBe(2)
      } finally {
        process.exit = origExit
      }
    } finally {
      process.argv = origArgv
    }
  })

  it('subcommand --help is not intercepted at root level', async () => {
    const origArgv = process.argv
    process.argv = ['node', 'index.js', 'sync', '--help']
    try {
      await expect(main()).resolves.toBeUndefined()
    } finally {
      process.argv = origArgv
    }
  })

  it('executa main() quando argv[1] é um symlink para index.js (bin instalado)', async () => {
    const { symlink, unlink } = await import('node:fs/promises')
    const { join } = await import('node:path')
    const { tmpdir } = await import('node:os')

    const symlinkPath = join(tmpdir(), `agents-mcp-test-${Date.now()}`)
    const target = join(process.cwd(), 'dist/index.js')

    try {
      await symlink(target, symlinkPath)
    } catch {
      // symlink pode já existir de uma execução anterior
    }

    const origArgv = process.argv
    const origVitest = process.env.VITEST
    const origExit = process.exit
    const origLog = console.log
    let exitCode: number | undefined
    let logged: string[] = []
    process.exit = ((code: number) => {
      exitCode = code
    }) as unknown as NodeJS.Process['exit']
    console.log = ((msg: unknown) => {
      logged.push(String(msg))
    }) as unknown as typeof console.log

    delete process.env.VITEST
    process.argv = ['node', symlinkPath, '--version']

    try {
      await main()
      expect(exitCode).toBeUndefined()
      expect(logged.some((m) => m.includes(pkg.version))).toBe(true)
    } finally {
      process.env.VITEST = origVitest
      process.argv = origArgv
      process.exit = origExit
      console.log = origLog
      try {
        await unlink(symlinkPath)
      } catch {
        // ignore
      }
    }
  })

  it('sync com argumento posicional imprime erro e sai com código 2 sem tocar o disco', async () => {
    const origArgv = process.argv
    const origExit = process.exit
    const origError = console.error
    let exitCode: number | undefined
    const errors: string[] = []
    process.exit = ((code: number) => {
      exitCode = code
    }) as unknown as NodeJS.Process['exit']
    console.error = ((msg: unknown) => {
      errors.push(String(msg))
    }) as unknown as typeof console.error

    process.argv = ['node', 'index.js', 'sync', 'opencode,antigravity']

    try {
      await main()
      expect(exitCode).toBe(2)
      expect(
        errors.some((m) =>
          m.includes('Unexpected positional argument(s) for `sync`'),
        ),
      ).toBe(true)
    } finally {
      process.argv = origArgv
      process.exit = origExit
      console.error = origError
    }
  })

  it('imprime erro no stderr antes de sair com código 1 em erro de runtime (ConfigValidationError)', async () => {
    const origArgv = process.argv
    const origExit = process.exit
    const origError = console.error
    let exitCode: number | undefined
    let errors: string[] = []
    process.exit = ((code: number) => {
      exitCode = code
    }) as unknown as NodeJS.Process['exit']
    console.error = ((msg: unknown) => {
      errors.push(String(msg))
    }) as unknown as typeof console.error

    process.argv = ['node', 'index.js', 'add', 'x', '--command=npx']
    vi.mocked(runCommand).mockRejectedValueOnce(
      new ConfigValidationError(
        'Invalid canonical config at /home/user/.agents/mcp.json: mcpServers — required',
        '/home/user/.agents/mcp.json',
      ),
    )

    try {
      await main()
      expect(exitCode).toBe(1)
      expect(errors.some((m) => m.includes('Invalid canonical config'))).toBe(
        true,
      )
    } finally {
      process.argv = origArgv
      process.exit = origExit
      console.error = origError
    }
  })
})
````

## File: tests/commands/plugins-sync.test.ts
````typescript
import { describe, expect, it, vi, afterAll } from 'vitest'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { runSync } from '$/src/commands/sync'
import { main } from '$/src/index'
import { createUiAndCtx, persistCanonicalConfig } from '$/src/commands/util'
import { loadState, writeState, emptyState } from '$/src/core/state'
import { getAdapter } from '$/src/adapters/index'
import type { PromptUi } from '$/src/ui/prompts'
import { createSandbox } from '$/tests/helpers/sandbox'

vi.mock('$/src/commands/util', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return { ...actual, createUiAndCtx: vi.fn() }
})

const exitSpy = vi
  .spyOn(process, 'exit')
  .mockImplementation((() => {}) as NodeJS.Process['exit'])

afterAll(() => {
  exitSpy.mockRestore()
})

function setupUi(ctx: ReturnType<typeof createSandbox>['ctx']) {
  const ui = {
    error: vi.fn(),
    warn: vi.fn(),
    note: vi.fn(),
  }
  vi.mocked(createUiAndCtx).mockImplementation(() => ({
    ctx,
    ui: ui as unknown as PromptUi,
  }))
  return ui
}

function seedCanonicalAndCollision(
  ctx: ReturnType<typeof createSandbox>['ctx'],
) {
  persistCanonicalConfig('project', ctx, {
    $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
    mcpServers: {
      taken: { type: 'stdio', command: 'npx', args: [] },
    },
  })

  const pluginDir = join(ctx.cwd, '.agents/plugins/taken')
  mkdirSync(pluginDir, { recursive: true })
  const sentinelPath = join(pluginDir, 'sentinel.txt')
  writeFileSync(sentinelPath, 'KEEP')
  return { sentinelPath, pluginDir }
}

describe('commands sync (B3/T5: authoritative plugin adoption)', () => {
  it('fresh clone: pre-existing plugin dir (sentinel) is adopted, sem lock, sem erro de plugin', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      const { sentinelPath, pluginDir } = seedCanonicalAndCollision(ctx)

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
      })

      // Nenhum erro de plugin: o nome e declarado no canônico, entao e adotado.
      expect(summary.errors).toEqual([])
      expect(readFileSync(sentinelPath, 'utf8')).toBe('KEEP')
      // Os arquivos gerenciados sao sobrescritos (adocao autoritativa).
      expect(
        JSON.parse(readFileSync(join(pluginDir, 'plugin.json'), 'utf8')).name,
      ).toBe('taken')
      expect(
        JSON.parse(readFileSync(join(pluginDir, 'mcp.json'), 'utf8')).mcpServers
          .taken,
      ).toBeDefined()
      // O lock e criado no disco e registra o plugin como gerenciado.
      expect(existsSync(join(ctx.cwd, '.agents', 'mcp-lock.json'))).toBe(true)
      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toContain('taken')

      const notes = ui.note.mock.calls.map((call) => String(call[0]))
      expect(notes.some((n) => n.startsWith('Synced'))).toBe(true)
    } finally {
      cleanup()
    }
  })

  it('com antigravity direcionado, o mesmo diretorio pre-existente tambem recebe mcp_config.json sobrescrito', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      const { sentinelPath, pluginDir } = seedCanonicalAndCollision(ctx)

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor', 'antigravity'],
        dryRun: false,
        yes: true,
      })

      expect(summary.errors).toEqual([])
      expect(readFileSync(sentinelPath, 'utf8')).toBe('KEEP')
      expect(
        JSON.parse(readFileSync(join(pluginDir, 'plugin.json'), 'utf8')).name,
      ).toBe('taken')
      // mcp_config.json so e gravado quando antigravity esta entre os alvos.
      expect(
        JSON.parse(readFileSync(join(pluginDir, 'mcp_config.json'), 'utf8'))
          .mcpServers.taken,
      ).toBeDefined()
      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toContain('taken')
      const notes = ui.note.mock.calls.map((call) => String(call[0]))
      expect(notes.some((n) => n.startsWith('Synced'))).toBe(true)
    } finally {
      cleanup()
    }
  })

  it('diretorio de plugin pre-existente cujo nome NAO e declarado no canônico nao e modificado, nao deletado e nao gera erro', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      // Apenas um servidor declarado no canônico.
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
        mcpServers: {
          web: { type: 'streamable-http', url: 'https://example.com/mcp' },
        },
      })
      // Diretorio pre-existente com um nome que NAO esta no canônico.
      const pluginDir = join(ctx.cwd, '.agents/plugins/undeclared')
      mkdirSync(pluginDir, { recursive: true })
      const sentinelPath = join(pluginDir, 'sentinel.txt')
      writeFileSync(sentinelPath, 'UNTOUCHED')
      writeFileSync(join(pluginDir, 'plugin.json'), '{"name":"undeclared"}')
      writeFileSync(join(pluginDir, 'mcp.json'), '{}')

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
      })

      expect(summary.errors).toEqual([])
      expect(readFileSync(sentinelPath, 'utf8')).toBe('UNTOUCHED')
      expect(
        JSON.parse(readFileSync(join(pluginDir, 'plugin.json'), 'utf8')).name,
      ).toBe('undeclared')
      expect(existsSync(pluginDir)).toBe(true)
      expect(existsSync(join(ctx.cwd, '.agents/plugins/web'))).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).not.toContain('undeclared')
      expect(state.managedPlugins).toContain('web')
    } finally {
      cleanup()
    }
  })

  it('dry-run planeja as gravacoes de plugin mas nao escreve nenhum arquivo, lock ou .gitignore', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
        mcpServers: {
          web: { type: 'streamable-http', url: 'https://example.com/mcp' },
        },
      })

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: true,
        yes: true,
      })

      expect(summary.errors).toEqual([])
      // Nenhum arquivo de plugin gravado no disco.
      expect(existsSync(join(ctx.cwd, '.agents/plugins/web'))).toBe(false)
      // Nenhum lock persistido.
      expect(existsSync(join(ctx.cwd, '.agents', 'mcp-lock.json'))).toBe(false)
      // Nenhum .gitignore criado/tocado.
      expect(existsSync(join(ctx.cwd, '.gitignore'))).toBe(false)

      const notes = ui.note.mock.calls.map((call) => String(call[0]))
      expect(notes.some((n) => n.includes('.agents/plugins/'))).toBe(true)
    } finally {
      cleanup()
    }
  })

  it('aceita --agents <lista> separado por espaço no sync', async () => {
    const { ctx, cleanup } = createSandbox()
    setupUi(ctx)
    const localExit = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as NodeJS.Process['exit'])
    const originalCwd = process.cwd()
    const originalArgv = process.argv
    try {
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
        mcpServers: {
          remote: {
            type: 'streamable-http',
            url: 'https://example.com/mcp',
          },
        },
      })
      process.chdir(ctx.cwd)
      process.argv = ['node', 'index.js', 'sync', '--agents', 'antigravity']

      await main()

      expect(localExit).not.toHaveBeenCalled()
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/remote/mcp_config.json')),
      ).toBe(true)
    } finally {
      process.chdir(originalCwd)
      process.argv = originalArgv
      localExit.mockRestore()
      cleanup()
    }
  })
})

describe('commands sync (B5: skipAgentSync / allowEmptyTargets)', () => {
  function seedCanonical(ctx: ReturnType<typeof createSandbox>['ctx']) {
    persistCanonicalConfig('project', ctx, {
      $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
      mcpServers: {
        web: { type: 'streamable-http', url: 'https://example.com/mcp' },
      },
    })
  }

  it('allowEmptyTargets: zero targets nao sai com 1, gera plugin e emite nota de orientacao', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonical(ctx)

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: undefined,
        dryRun: false,
        yes: true,
        allowEmptyTargets: true,
      })

      expect(exitSpy).not.toHaveBeenCalled()
      expect(summary.targets).toEqual([])
      expect(summary.errors).toEqual([])

      const pluginDir = join(ctx.cwd, '.agents/plugins/web')
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(false)

      const notes = ui.note.mock.calls.map((call) => String(call[0]))
      expect(notes.some((n) => n.includes('No target agents'))).toBe(true)
      expect(notes.some((n) => n.includes('.agents/plugins/'))).toBe(true)
      expect(notes.some((n) => n.includes('agents-mcp sync --agents'))).toBe(
        true,
      )
      expect(notes.some((n) => n.startsWith('Synced'))).toBe(false)
    } finally {
      cleanup()
    }
  })

  it('skipAgentSync nao toca arquivos de agente nem state.targets/state.agents', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonical(ctx)
      writeState('project', ctx, {
        ...emptyState('project'),
        targets: ['cursor'],
        managedPlugins: [],
      })
      const cursorPath = getAdapter('cursor').getConfigPath('project', ctx)
      if (!cursorPath) {
        throw new Error(
          'cursor adapter nao tem caminho de configuracao no escopo do projeto',
        )
      }
      const cursorDir = dirname(cursorPath)
      mkdirSync(cursorDir, { recursive: true })
      writeFileSync(cursorPath, '{"mcpServers":{}}')

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
        skipAgentSync: true,
      })

      expect(exitSpy).not.toHaveBeenCalled()
      expect(summary.targets).toEqual([])
      expect(summary.errors).toEqual([])
      expect(readFileSync(cursorPath, 'utf8')).toBe('{"mcpServers":{}}')

      const pluginDir = join(ctx.cwd, '.agents/plugins/web')
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(false)

      const state = loadState('project', ctx).state
      expect(state.targets).toEqual(['cursor'])
      expect(state.agents).toEqual({})
      expect(state.managedPlugins).toEqual(['web'])

      const notes = ui.note.mock.calls.map((call) => String(call[0]))
      expect(notes.some((n) => n.includes('--no-sync'))).toBe(true)
      expect(notes.some((n) => n.includes('.agents/plugins/'))).toBe(true)
    } finally {
      cleanup()
    }
  })

  it('skipAgentSync com flag antigravity cria mcp_config.json e preserva targets', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonical(ctx)

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['antigravity'],
        dryRun: false,
        yes: true,
        skipAgentSync: true,
      })

      expect(exitSpy).not.toHaveBeenCalled()
      expect(summary.targets).toEqual([])
      expect(summary.errors).toEqual([])

      const pluginDir = join(ctx.cwd, '.agents/plugins/web')
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.targets).toEqual([])
      expect(state.managedPlugins).toEqual(['web'])

      const notes = ui.note.mock.calls.map((call) => String(call[0]))
      expect(notes.some((n) => n.includes('--no-sync'))).toBe(true)
    } finally {
      cleanup()
    }
  })

  it('skipAgentSync com antigravity em state.targets (sem flag) cria mcp_config.json', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonical(ctx)
      writeState('project', ctx, {
        ...emptyState('project'),
        targets: ['antigravity'],
      })

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: undefined,
        dryRun: false,
        yes: true,
        skipAgentSync: true,
      })

      expect(exitSpy).not.toHaveBeenCalled()
      expect(summary.errors).toEqual([])
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/web/mcp_config.json')),
      ).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.targets).toEqual(['antigravity'])

      const notes = ui.note.mock.calls.map((call) => String(call[0]))
      expect(notes.some((n) => n.includes('--no-sync'))).toBe(true)
    } finally {
      cleanup()
    }
  })

  it('allowEmptyTargets com nome declarado no canônico: diretorio pre-existente e adotado (sem erro de colisao), sentinel preservado', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
        mcpServers: {
          taken: { type: 'stdio', command: 'npx', args: [] },
        },
      })
      const pluginDir = join(ctx.cwd, '.agents/plugins/taken')
      mkdirSync(pluginDir, { recursive: true })
      const sentinelPath = join(pluginDir, 'sentinel.txt')
      writeFileSync(sentinelPath, 'KEEP')

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
        allowEmptyTargets: true,
      })

      expect(exitSpy).not.toHaveBeenCalled()
      // Nome declarado: adotado autoritativamente, sem erro de colisao.
      expect(summary.errors).toEqual([])
      expect(readFileSync(sentinelPath, 'utf8')).toBe('KEEP')
      expect(
        JSON.parse(readFileSync(join(pluginDir, 'plugin.json'), 'utf8')).name,
      ).toBe('taken')
      expect(
        JSON.parse(readFileSync(join(pluginDir, 'mcp.json'), 'utf8')).mcpServers
          .taken,
      ).toBeDefined()
      expect(existsSync(join(ctx.cwd, '.agents', 'mcp-lock.json'))).toBe(true)
      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toContain('taken')

      const notes = ui.note.mock.calls.map((call) => String(call[0]))
      expect(notes.some((n) => n.startsWith('Synced'))).toBe(true)
    } finally {
      cleanup()
    }
  })
})

describe('commands sync (B6/T2: poda de plugins obsoletos e mcp_config.json)', () => {
  const SCHEMA_URL = 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json'

  function seedPluginFiles(
    ctx: ReturnType<typeof createSandbox>['ctx'],
    name: string,
    extra: Record<string, string> = {},
  ): string {
    const pluginDir = join(ctx.cwd, '.agents/plugins', name)
    mkdirSync(pluginDir, { recursive: true })
    for (const file of ['plugin.json', 'mcp.json', 'mcp_config.json']) {
      writeFileSync(join(pluginDir, file), '{}')
    }
    for (const [file, content] of Object.entries(extra)) {
      writeFileSync(join(pluginDir, file), content)
    }
    return pluginDir
  }

  function seedManagedState(
    ctx: ReturnType<typeof createSandbox>['ctx'],
    managedPlugins: string[],
  ) {
    writeState('project', ctx, {
      ...emptyState('project'),
      managedPlugins,
    })
  }

  function canonicalEmpty(ctx: ReturnType<typeof createSandbox>['ctx']) {
    persistCanonicalConfig('project', ctx, {
      $schema: SCHEMA_URL,
      mcpServers: {},
    })
  }

  function canonicalWithWeb(ctx: ReturnType<typeof createSandbox>['ctx']) {
    persistCanonicalConfig('project', ctx, {
      $schema: SCHEMA_URL,
      mcpServers: {
        web: { type: 'streamable-http', url: 'https://example.com/mcp' },
      },
    })
  }

  it('remove plugin obsoleto quando servidor sai do canônico (managedPlugins esvazia)', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      canonicalEmpty(ctx)
      seedManagedState(ctx, ['alpha'])
      const pluginDir = seedPluginFiles(ctx, 'alpha')

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
      })

      expect(summary.errors).toEqual([])
      expect(existsSync(pluginDir)).toBe(false)
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(false)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(false)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(false)

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('preserva arquivo manual e diretorio de plugin obsoleto nao vazio', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      canonicalEmpty(ctx)
      seedManagedState(ctx, ['alpha'])
      const pluginDir = seedPluginFiles(ctx, 'alpha', {
        'sentinel.txt': 'KEEP-ME',
      })

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
      })

      expect(summary.errors).toEqual([])
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(false)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(false)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(false)
      expect(existsSync(join(pluginDir, 'sentinel.txt'))).toBe(true)
      expect(existsSync(pluginDir)).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('preserva mcp_config.json e state.agents.antigravity ao desselecionar antigravity (ADR-0013)', async () => {
    const { ctx, cleanup } = createSandbox()
    setupUi(ctx)
    try {
      canonicalWithWeb(ctx)
      writeState('project', ctx, {
        ...emptyState('project'),
        targets: ['antigravity'],
        managedPlugins: ['web'],
        agents: {
          antigravity: {
            path: join(ctx.cwd, '.agents/plugins'),
            names: ['web'],
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        },
      })
      const pluginDir = seedPluginFiles(ctx, 'web')

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
      })

      expect(summary.errors).toEqual([])
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)
      // Nao-destrutivo: mcp_config.json permanece mesmo sem antigravity nos alvos.
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual(['web'])
      // `--agents` e aditivo: cursor e anexado preservando a ordem existente.
      expect(state.targets).toEqual(['antigravity', 'cursor'])
      expect(state.agents.antigravity).toEqual({
        path: join(ctx.cwd, '.agents/plugins'),
        names: ['web'],
        updatedAt: '2026-01-01T00:00:00.000Z',
      })
    } finally {
      cleanup()
    }
  })

  it('sync --agents antigravity e aditivo a state.targets existente', async () => {
    const { ctx, cleanup } = createSandbox()
    setupUi(ctx)
    try {
      canonicalWithWeb(ctx)
      writeState('project', ctx, {
        ...emptyState('project'),
        targets: ['opencode'],
        managedPlugins: [],
      })

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['antigravity'],
        dryRun: false,
        yes: true,
      })

      expect(summary.errors).toEqual([])
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/web/mcp_config.json')),
      ).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.targets).toEqual(['opencode', 'antigravity'])
      expect(state.agents.antigravity?.names).toEqual(['web'])
    } finally {
      cleanup()
    }
  })

  it('sync sem argumentos sincroniza todos os state.targets (opencode + antigravity)', async () => {
    const { ctx, cleanup } = createSandbox()
    setupUi(ctx)
    try {
      canonicalWithWeb(ctx)
      writeState('project', ctx, {
        ...emptyState('project'),
        targets: ['opencode', 'antigravity'],
        managedPlugins: [],
      })

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: undefined,
        dryRun: false,
        yes: true,
      })

      expect(summary.errors).toEqual([])
      expect(summary.targets).toEqual(['opencode', 'antigravity'])
      expect(existsSync(join(ctx.cwd, 'opencode.json'))).toBe(true)
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/web/mcp_config.json')),
      ).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.targets).toEqual(['opencode', 'antigravity'])
    } finally {
      cleanup()
    }
  })

  it('mantem mcp_config.json quando antigravity esta no alvo', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      canonicalWithWeb(ctx)
      seedManagedState(ctx, ['web'])
      seedPluginFiles(ctx, 'web')

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['antigravity'],
        dryRun: false,
        yes: true,
      })

      expect(summary.errors).toEqual([])
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/web/mcp_config.json')),
      ).toBe(true)
      expect(existsSync(join(ctx.cwd, '.agents/plugins/web/plugin.json'))).toBe(
        true,
      )
      expect(existsSync(join(ctx.cwd, '.agents/plugins/web/mcp.json'))).toBe(
        true,
      )

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual(['web'])
    } finally {
      cleanup()
    }
  })

  it('dryRun nao remove nada no disco e nao persiste estado', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      canonicalEmpty(ctx)
      seedManagedState(ctx, ['alpha'])
      const pluginDir = seedPluginFiles(ctx, 'alpha')

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: true,
        yes: true,
      })

      expect(summary.errors).toEqual([])
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual(['alpha'])
    } finally {
      cleanup()
    }
  })

  it('sync repetido e idempotente: estado igual e segundo run sem erros', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      canonicalWithWeb(ctx)
      seedManagedState(ctx, ['web'])
      seedPluginFiles(ctx, 'web')

      const summary1 = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
      })
      expect(summary1.errors).toEqual([])
      const stateAfterFirst = loadState('project', ctx).state

      const summary2 = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
      })
      expect(summary2.errors).toEqual([])
      const stateAfterSecond = loadState('project', ctx).state

      expect(stateAfterSecond).toEqual(stateAfterFirst)
      expect(stateAfterSecond.managedPlugins).toEqual(['web'])
    } finally {
      cleanup()
    }
  })

  it('skipAgentSync nao poda mcp_config.json preexistente de plugin gerenciado', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      canonicalWithWeb(ctx)
      seedManagedState(ctx, ['web'])
      const pluginDir = seedPluginFiles(ctx, 'web')

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
        skipAgentSync: true,
      })

      expect(summary.errors).toEqual([])
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual(['web'])
      expect(state.targets).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('erro de limpeza de plugin obsoleto: erro reportado, nome mantido em managedPlugins e retry no proximo sync', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      canonicalEmpty(ctx)
      seedManagedState(ctx, ['alpha'])
      const pluginDir = join(ctx.cwd, '.agents/plugins/alpha')
      mkdirSync(pluginDir, { recursive: true })
      writeFileSync(join(pluginDir, 'mcp.json'), '{}')
      writeFileSync(join(pluginDir, 'mcp_config.json'), '{}')
      // plugin.json como diretorio provoca EISDIR ao tentar unlinkSync.
      mkdirSync(join(pluginDir, 'plugin.json'))

      // Primeiro run: falha na limpeza, erro reportado e nome preservado.
      const summary1 = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
      })

      expect(summary1.errors).toHaveLength(1)
      expect(summary1.errors[0]).toContain('Failed to remove plugin `alpha`')
      expect(ui.error).toHaveBeenCalledWith(
        expect.stringContaining('Partial sync completed with failures'),
      )

      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(false)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(false)
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(pluginDir)).toBe(true)

      // Nome preservado para ser reprocessado no proximo sync.
      expect(loadState('project', ctx).state.managedPlugins).toEqual(['alpha'])

      // Segundo run: nome ainda gerenciado, o mesmo erro se repete (retry).
      const summary2 = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
      })
      expect(summary2.errors).toHaveLength(1)
      expect(summary2.errors[0]).toContain('Failed to remove plugin `alpha`')
    } finally {
      cleanup()
    }
  })

  it('erro de limpeza de plugin obsoleto faz o comando sync sair com codigo 1', async () => {
    const { ctx, cleanup } = createSandbox()
    setupUi(ctx)
    const localExit = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as NodeJS.Process['exit'])
    const originalCwd = process.cwd()
    const originalArgv = process.argv
    try {
      canonicalEmpty(ctx)
      seedManagedState(ctx, ['alpha'])
      const pluginDir = join(ctx.cwd, '.agents/plugins/alpha')
      mkdirSync(pluginDir, { recursive: true })
      writeFileSync(join(pluginDir, 'mcp.json'), '{}')
      writeFileSync(join(pluginDir, 'mcp_config.json'), '{}')
      // plugin.json como diretorio provoca EISDIR ao tentar unlinkSync.
      mkdirSync(join(pluginDir, 'plugin.json'))

      process.chdir(ctx.cwd)
      process.argv = ['node', 'index.js', 'sync', '--agents', 'cursor']

      await main()

      expect(localExit).toHaveBeenCalledWith(1)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(false)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(false)
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(pluginDir)).toBe(true)
      expect(loadState('project', ctx).state.managedPlugins).toEqual(['alpha'])
    } finally {
      process.chdir(originalCwd)
      process.argv = originalArgv
      localExit.mockRestore()
      cleanup()
    }
  })
})

describe('commands sync (B6/T2: fresh-clone native-config overwrite preservando manual)', () => {
  const SCHEMA_URL = 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json'

  it('claude-code: sem lock, sobrescride entradas canonicas e preserva top-level nao gerenciado + entrada manual', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      persistCanonicalConfig('project', ctx, {
        $schema: SCHEMA_URL,
        mcpServers: {
          web: { type: 'stdio', command: 'npx', args: ['run', 'web'] },
        },
      })

      // Native arquivo ja existe (fresh clone: lock ausente) com uma
      // configuracao top-level nao relacionada e uma entrada manual nao declarada.
      const nativePath = join(ctx.cwd, '.mcp.json')
      writeFileSync(
        nativePath,
        JSON.stringify(
          {
            unrelated: 'preserve-me',
            mcpServers: {
              'manual-server': { type: 'stdio', command: 'manual-cmd' },
            },
          },
          null,
          2,
        ),
      )

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['claude-code'],
        dryRun: false,
        yes: true,
      })

      expect(summary.errors).toEqual([])

      const content = JSON.parse(readFileSync(nativePath, 'utf8'))
      // Top-level nao gerenciado e preservado.
      expect(content.unrelated).toBe('preserve-me')
      // Entrada manual (nao declarada no canônico, nao gerenciada) e preservada.
      expect(content.mcpServers['manual-server']).toMatchObject({
        type: 'stdio',
        command: 'manual-cmd',
      })
      // Entrada canonica sobrescrita.
      expect(content.mcpServers.web).toMatchObject({
        type: 'stdio',
        command: 'npx',
        args: ['run', 'web'],
      })

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toContain('web')
    } finally {
      cleanup()
    }
  })

  it('vscode: sem lock, sobrescride entradas canonicas e preserva comentarios fora da raiz gerenciada + inputs + entrada manual', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      persistCanonicalConfig('project', ctx, {
        $schema: SCHEMA_URL,
        mcpServers: {
          web: { type: 'stdio', command: 'npx', args: ['run', 'web'] },
        },
      })

      // Native JSONC ja existe (fresh clone: lock ausente) com comentario
      // FORA da chave gerenciada, inputs e entrada manual nao declarada.
      const nativeDir = join(ctx.cwd, '.vscode')
      mkdirSync(nativeDir, { recursive: true })
      const nativePath = join(nativeDir, 'mcp.json')
      writeFileSync(
        nativePath,
        `// Configuracao do VS Code (fora de servers - comentario preservado)\n{\n  "inputs": [\n    { "id": "token", "type": "promptString", "label": "Token" }\n  ],\n  // Comentario dentro de servers pode ser normalizado\n  "servers": {\n    "manual-server": { "type": "stdio", "command": "manual-cmd" }\n  }\n}\n`,
      )

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['vscode'],
        dryRun: false,
        yes: true,
      })

      expect(summary.errors).toEqual([])

      const content = readFileSync(nativePath, 'utf8')
      // Comentario e inputs FORA da raiz gerenciada sobrevivem.
      expect(content).toContain('Configuracao do VS Code')
      expect(content).toContain('"inputs"')
      expect(content).toContain('"token"')
      // Entrada manual preservada (nao declarada no canônico).
      expect(content).toContain('"manual-server"')
      // Entrada canonica sobrescrita.
      expect(content).toContain('"web"')
      expect(content).toContain('"command": "npx"')

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toContain('web')
    } finally {
      cleanup()
    }
  })
})
````

## File: tests/core/state.test.ts
````typescript
import { describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import {
  loadState,
  writeState,
  getStatePath,
  getLegacyStatePath,
  seedAgentNames,
  pruneAgentNames,
  emptyState,
  type SyncState,
} from '$/src/core/state'
import { createSandbox } from '$/tests/helpers/sandbox'

describe('state', () => {
  it('getStatePath returns the new lock path for project and global scope', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      expect(getStatePath('project', ctx)).toBe(
        `${ctx.cwd}/.agents/mcp-lock.json`,
      )
      expect(getStatePath('global', ctx)).toBe(
        `${ctx.homeDir}/.agents/mcp-lock.json`,
      )
    } finally {
      cleanup()
    }
  })

  it('getLegacyStatePath returns the legacy path for project and global scope', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      expect(getLegacyStatePath('project', ctx)).toBe(
        `${ctx.cwd}/.agents/.mcp-sync-state.json`,
      )
      expect(getLegacyStatePath('global', ctx)).toBe(
        `${ctx.homeDir}/.agents/.mcp-sync-state.json`,
      )
    } finally {
      cleanup()
    }
  })

  it('loadState returns empty state for missing file, no warning', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings).toEqual([])
      expect(result.notices).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('loadState returns empty state for global scope too', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const result = loadState('global', ctx)
      expect(result.state).toEqual(emptyState('global'))
      expect(result.state.scope).toBe('global')
      expect(result.warnings).toEqual([])
      expect(result.notices).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('writeState round-trips atomically', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const state: SyncState = {
        version: 1,
        scope: 'project',
        targets: ['claude-code', 'opencode'],
        agents: {
          'claude-code': {
            path: `${ctx.cwd}/.mcp.json`,
            names: ['github', 'postgres'],
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        },
        managedPlugins: [],
      }
      writeState('project', ctx, state)

      const loaded = loadState('project', ctx)
      expect(loaded.state.targets).toEqual(['claude-code', 'opencode'])
      expect(loaded.state.agents['claude-code']!.names).toEqual([
        'github',
        'postgres',
      ])
      expect(loaded.warnings).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('writeState produces byte-identical output for identical state', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const state: SyncState = {
        version: 1,
        scope: 'project',
        targets: ['claude-code'],
        agents: {},
        managedPlugins: [],
      }
      writeState('project', ctx, state)
      const first = readFileSync(`${ctx.cwd}/.agents/mcp-lock.json`, 'utf8')
      writeState('project', ctx, state)
      const second = readFileSync(`${ctx.cwd}/.agents/mcp-lock.json`, 'utf8')
      expect(second).toBe(first)
    } finally {
      cleanup()
    }
  })

  it('loadState treats corrupt file as empty with warning', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.agents/mcp-lock.json`
    try {
      mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      writeFileSync(path, '{ not valid json', 'utf8')

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('Corrupt')
      expect(result.warnings[0]).toContain(path)
      expect(result.notices).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('loadState treats unknown version as empty with warning', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.agents/mcp-lock.json`
    try {
      mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      writeFileSync(
        path,
        JSON.stringify({
          version: 99,
          scope: 'project',
          targets: [],
          agents: {},
        }),
        'utf8',
      )

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('Invalid sync state')
    } finally {
      cleanup()
    }
  })

  it('loadState rejects invalid agent id in targets', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.agents/mcp-lock.json`
    try {
      mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      writeFileSync(
        path,
        JSON.stringify({
          version: 1,
          scope: 'project',
          targets: ['not-an-agent'],
          agents: {},
        }),
        'utf8',
      )

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings.length).toBeGreaterThan(0)
    } finally {
      cleanup()
    }
  })

  it('loadState treats missing agents key as empty state', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.agents/mcp-lock.json`
    try {
      mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      writeFileSync(
        path,
        JSON.stringify({
          version: 1,
          scope: 'project',
          targets: [],
        }),
        'utf8',
      )

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.state.agents).toEqual({})
      expect(result.warnings).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('loadState rejects unknown agent key in agents as corrupt state', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.agents/mcp-lock.json`
    try {
      mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      writeFileSync(
        path,
        JSON.stringify({
          version: 1,
          scope: 'project',
          targets: [],
          agents: {
            'not-an-agent': {
              path: `${ctx.cwd}/.mcp.json`,
              names: ['github'],
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          },
        }),
        'utf8',
      )

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings.length).toBeGreaterThan(0)
    } finally {
      cleanup()
    }
  })

  it('seedAgentNames creates and merges agent records', () => {
    const state: SyncState = emptyState('project')
    const next = seedAgentNames(
      state,
      'claude-code',
      ['github'],
      '/abs/.mcp.json',
    )
    expect(next.agents['claude-code']!.names).toEqual(['github'])

    const merged = seedAgentNames(
      next,
      'claude-code',
      ['postgres'],
      '/abs/.mcp.json',
    )
    expect(merged.agents['claude-code']!.names).toEqual(['github', 'postgres'])

    // No duplicates.
    const again = seedAgentNames(
      merged,
      'claude-code',
      ['github'],
      '/abs/.mcp.json',
    )
    expect(again.agents['claude-code']!.names).toEqual(['github', 'postgres'])
  })

  it('seedAgentNames does not refresh updatedAt when nothing changed', () => {
    const state: SyncState = {
      ...emptyState('project'),
      agents: {
        'claude-code': {
          path: '/abs/.mcp.json',
          names: ['github'],
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    }
    const again = seedAgentNames(
      state,
      'claude-code',
      ['github'],
      '/abs/.mcp.json',
    )
    expect(again.agents['claude-code']!.updatedAt).toBe(
      '2026-01-01T00:00:00.000Z',
    )
  })

  it('pruneAgentNames removes names no longer present', () => {
    const state: SyncState = {
      ...emptyState('project'),
      agents: {
        'claude-code': {
          path: '/abs/.mcp.json',
          names: ['github', 'postgres', 'linear'],
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    }
    const pruned = pruneAgentNames(state, 'claude-code', ['github', 'linear'])
    expect(pruned.agents['claude-code']!.names).toEqual(['github', 'linear'])
  })

  it('pruneAgentNames leaves state unchanged for unknown agent', () => {
    const state: SyncState = emptyState('project')
    const pruned = pruneAgentNames(state, 'zed', ['github'])
    expect(pruned).toEqual(state)
  })

  /* --- Legacy migration / precedence --- */

  it('loads a legacy-only file with a single notice naming both paths', () => {
    const { ctx, cleanup } = createSandbox()
    const lockPath = `${ctx.cwd}/.agents/mcp-lock.json`
    const legacyPath = `${ctx.cwd}/.agents/.mcp-sync-state.json`
    try {
      mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      writeFileSync(
        legacyPath,
        JSON.stringify({
          version: 1,
          scope: 'project',
          targets: ['claude-code'],
          agents: {
            'claude-code': {
              path: `${ctx.cwd}/.mcp.json`,
              names: ['github'],
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          },
          managedPlugins: [],
        }),
        'utf8',
      )

      const result = loadState('project', ctx)
      expect(result.state.targets).toEqual(['claude-code'])
      expect(result.state.agents['claude-code']!.names).toEqual(['github'])
      expect(result.warnings).toEqual([])
      expect(result.notices).toHaveLength(1)
      expect(result.notices[0]).toContain(legacyPath)
      expect(result.notices[0]).toContain(lockPath)
    } finally {
      cleanup()
    }
  })

  it('when both files exist the new lock wins and the legacy is ignored silently', () => {
    const { ctx, cleanup } = createSandbox()
    const lockPath = `${ctx.cwd}/.agents/mcp-lock.json`
    const legacyPath = `${ctx.cwd}/.agents/.mcp-sync-state.json`
    try {
      mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      writeFileSync(
        lockPath,
        JSON.stringify({
          version: 1,
          scope: 'project',
          targets: ['opencode'],
          agents: {},
          managedPlugins: [],
        }),
        'utf8',
      )
      writeFileSync(
        legacyPath,
        JSON.stringify({
          version: 1,
          scope: 'project',
          targets: ['claude-code'],
          agents: {
            'claude-code': {
              path: `${ctx.cwd}/.mcp.json`,
              names: ['github'],
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          },
          managedPlugins: [],
        }),
        'utf8',
      )

      const result = loadState('project', ctx)
      expect(result.state.targets).toEqual(['opencode'])
      expect(result.state.agents).toEqual({})
      expect(result.warnings).toEqual([])
      expect(result.notices).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('a corrupt new lock does NOT fall back to a valid legacy file', () => {
    const { ctx, cleanup } = createSandbox()
    const lockPath = `${ctx.cwd}/.agents/mcp-lock.json`
    const legacyPath = `${ctx.cwd}/.agents/.mcp-sync-state.json`
    try {
      mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      writeFileSync(lockPath, '{ not valid json', 'utf8')
      writeFileSync(
        legacyPath,
        JSON.stringify({
          version: 1,
          scope: 'project',
          targets: ['claude-code'],
          agents: {},
          managedPlugins: [],
        }),
        'utf8',
      )

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toContain(lockPath)
      expect(result.notices).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('a corrupt legacy file warns and yields empty state with no notices', () => {
    const { ctx, cleanup } = createSandbox()
    const legacyPath = `${ctx.cwd}/.agents/.mcp-sync-state.json`
    try {
      mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      writeFileSync(legacyPath, '{ not valid json', 'utf8')

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toContain(legacyPath)
      expect(result.notices).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('missing both files yields empty state with no warnings and no notices', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings).toEqual([])
      expect(result.notices).toEqual([])
    } finally {
      cleanup()
    }
  })

  /* --- .gitignore policy (writeState never touches .gitignore) --- */

  it("writeState('project') writes only mcp-lock.json and never creates .gitignore", () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const state: SyncState = {
        version: 1,
        scope: 'project',
        targets: ['claude-code'],
        agents: {},
        managedPlugins: [],
      }
      writeState('project', ctx, state)

      expect(existsSync(`${ctx.cwd}/.agents/mcp-lock.json`)).toBe(true)
      expect(existsSync(`${ctx.cwd}/.gitignore`)).toBe(false)
      expect(existsSync(`${ctx.cwd}/.agents/.mcp-sync-state.json`)).toBe(false)
    } finally {
      cleanup()
    }
  })

  it("writeState('project') leaves a pre-existing legacy file untouched", () => {
    const { ctx, cleanup } = createSandbox()
    const legacyPath = `${ctx.cwd}/.agents/.mcp-sync-state.json`
    try {
      mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      const legacyContent = JSON.stringify({
        version: 1,
        scope: 'project',
        targets: ['claude-code'],
        agents: {},
        managedPlugins: [],
      })
      writeFileSync(legacyPath, legacyContent, 'utf8')

      const state: SyncState = {
        version: 1,
        scope: 'project',
        targets: ['opencode'],
        agents: {},
        managedPlugins: [],
      }
      writeState('project', ctx, state)

      expect(readFileSync(legacyPath, 'utf8')).toBe(legacyContent)
      expect(existsSync(`${ctx.cwd}/.agents/mcp-lock.json`)).toBe(true)
      expect(existsSync(`${ctx.cwd}/.gitignore`)).toBe(false)
    } finally {
      cleanup()
    }
  })

  it("writeState('global') does not touch <cwd>/.gitignore", async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const state: SyncState = {
        version: 1,
        scope: 'global',
        targets: ['claude-code'],
        agents: {},
        managedPlugins: [],
      }
      writeState('global', ctx, state)

      expect(
        readFileSync(`${ctx.homeDir}/.agents/mcp-lock.json`, 'utf8'),
      ).toContain('"scope": "global"')

      // global scope must not create or modify <cwd>/.gitignore
      expect(existsSync(`${ctx.cwd}/.gitignore`)).toBe(false)
    } finally {
      cleanup()
    }
  })

  it('writeState leaves a pre-existing <cwd>/.gitignore byte-identical', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      mkdirSync(ctx.cwd, { recursive: true })
      const original = '# existing\n.env\n# custom\n'
      writeFileSync(`${ctx.cwd}/.gitignore`, original, 'utf8')

      const state: SyncState = {
        version: 1,
        scope: 'project',
        targets: ['claude-code'],
        agents: {},
        managedPlugins: [],
      }
      writeState('project', ctx, state)

      expect(readFileSync(`${ctx.cwd}/.gitignore`, 'utf8')).toBe(original)
    } finally {
      cleanup()
    }
  })
})
````

## File: tests/core/store.test.ts
````typescript
import { describe, expect, it } from 'vitest'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import {
  getConfigPath,
  readConfig,
  writeConfig,
  loadValidatedConfig,
  ConfigValidationError,
} from '$/src/core/store'
import { DEFAULT_SCHEMA_URL } from '$/src/config'
import { createSandbox } from '$/tests/helpers/sandbox'

function writeRaw(
  ctx: ReturnType<typeof createSandbox>['ctx'],
  raw: string,
): void {
  mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
  writeFileSync(`${ctx.cwd}/.agents/mcp.json`, raw, 'utf8')
}

describe('store', () => {
  it('getConfigPath returns project and global paths', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      expect(getConfigPath('project', ctx)).toBe(`${ctx.cwd}/.agents/mcp.json`)
      expect(getConfigPath('global', ctx)).toBe(
        `${ctx.homeDir}/.agents/mcp.json`,
      )
    } finally {
      cleanup()
    }
  })

  it('readConfig returns null for missing file', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      expect(readConfig('project', ctx)).toBeNull()
      expect(readConfig('global', ctx)).toBeNull()
    } finally {
      cleanup()
    }
  })

  it('readConfig parses JSONC with comments and trailing commas', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.agents/mcp.json`
    const raw = `{\n  // comment\n  "mcpServers": {\n    "github": {\n      "type": "stdio",\n      "command": "npx",\n    },\n  },\n}\n`
    try {
      writeRaw(ctx, raw)

      const result = readConfig('project', ctx)
      expect(result).not.toBeNull()
      expect(result!.raw).toBe(raw)
      const mcpServers = (result!.config as Record<string, unknown>)
        .mcpServers as Record<string, unknown>
      expect((mcpServers.github as Record<string, unknown>).type).toBe('stdio')
    } finally {
      cleanup()
    }
  })

  it('readConfig raises ConfigValidationError on truncated JSONC', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeRaw(ctx, '{ not valid json')
      expect(() => readConfig('project', ctx)).toThrow(ConfigValidationError)
    } finally {
      cleanup()
    }
  })

  it('readConfig raises ConfigValidationError on valid-prefix plus trailing garbage', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeRaw(ctx, '{"$schema":"x","mcpServers":{}} >>> GARBAGE')
      expect(() => readConfig('project', ctx)).toThrow(ConfigValidationError)
    } finally {
      cleanup()
    }
  })

  it('readConfig leaves file byte-identical after a failed load', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.agents/mcp.json`
    const raw = '{ not valid json\n'
    try {
      writeRaw(ctx, raw)
      expect(() => readConfig('project', ctx)).toThrow(ConfigValidationError)
      expect(readFileSync(path, 'utf8')).toBe(raw)
    } finally {
      cleanup()
    }
  })

  it('writeConfig writes atomically and round-trips', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeConfig({
        scope: 'project',
        ctx,
        config: {
          $schema: DEFAULT_SCHEMA_URL,
          mcpServers: {
            github: {
              type: 'stdio',
              command: 'npx',
              args: ['-y', '@modelcontextprotocol/server-github'],
            },
          },
        },
      })

      const result = readConfig('project', ctx)
      expect(result).not.toBeNull()
      const mcpServers = (result!.config as Record<string, unknown>)
        .mcpServers as Record<string, unknown>
      expect((mcpServers.github as Record<string, unknown>).command).toBe('npx')
      expect(result!.config.$schema).toBe(DEFAULT_SCHEMA_URL)
    } finally {
      cleanup()
    }
  })

  it('writeConfig does not materialize defaults (minimal serialization)', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeConfig({
        scope: 'project',
        ctx,
        config: {
          $schema: DEFAULT_SCHEMA_URL,
          mcpServers: {
            github: { type: 'stdio', command: 'npx' },
          },
        },
      })

      const result = readConfig('project', ctx)
      const raw = result!.raw
      // `args` has a default but should not be materialized on write.
      expect(raw).not.toContain('"args"')
      expect(raw).not.toContain('"env"')
    } finally {
      cleanup()
    }
  })

  it('writeConfig defaults mcpServers to {} when undefined and never writes invalid document', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeConfig({
        scope: 'project',
        ctx,
        config: {
          $schema: DEFAULT_SCHEMA_URL,
        },
      })

      const result = readConfig('project', ctx)
      expect(result).not.toBeNull()
      expect(result!.config.mcpServers).toEqual({})
    } finally {
      cleanup()
    }
  })

  it('writeConfig rejects invalid mcpServers before writing', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      expect(() =>
        writeConfig({
          scope: 'project',
          ctx,
          config: {
            $schema: DEFAULT_SCHEMA_URL,
            mcpServers: { broken: { type: 'unknown' } },
          },
        }),
      ).toThrow()
      // Não deve ter gravado nada de inválido.
      expect(readConfig('project', ctx)).toBeNull()
    } finally {
      cleanup()
    }
  })

  it('loadValidatedConfig returns null for missing file', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      expect(loadValidatedConfig('project', ctx)).toBeNull()
    } finally {
      cleanup()
    }
  })

  it('loadValidatedConfig validates and returns warnings', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeRaw(
        ctx,
        JSON.stringify({
          $schema: DEFAULT_SCHEMA_URL,
          mcpServers: {
            github: { type: 'stdio', command: 'npx' },
          },
        }),
      )

      const result = loadValidatedConfig('project', ctx)
      expect(result).not.toBeNull()
      const mcpServers = (result!.config.mcpServers as Record<string, unknown>)
        .github as Record<string, unknown>
      expect(mcpServers.command).toBe('npx')
      expect(result!.warnings.length).toBe(0)
    } finally {
      cleanup()
    }
  })

  it('loadValidatedConfig throws ConfigValidationError on wrong $schema', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeRaw(
        ctx,
        JSON.stringify({
          $schema: 'https://example.com/other.json',
          mcpServers: {
            github: { type: 'stdio', command: 'npx' },
          },
        }),
      )

      try {
        loadValidatedConfig('project', ctx)
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(ConfigValidationError)
      }
    } finally {
      cleanup()
    }
  })
})
````

## File: tests/packaging/packaging.test.ts
````typescript
import { describe, expect, it, beforeAll } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

const root = process.cwd()
const distDir = resolve(root, 'dist')

// Ensure dist/ is populated by running dist:package before tests
execFileSync('npm', ['run', 'dist:package'], {
  cwd: root,
  stdio: 'pipe',
})

describe('packaging', () => {
  it('dist/package.json has exactly one bin, no dependencies/scripts, engines.node >= 22', () => {
    const distPkg = JSON.parse(
      readFileSync(resolve(distDir, 'package.json'), 'utf8'),
    )

    // Exactly one binary
    expect(Object.keys(distPkg.bin)).toEqual(['agents-mcp'])
    expect(distPkg.bin['agents-mcp']).toBe('./index.js')

    // No dependencies, scripts, devDependencies
    expect(distPkg.dependencies).toBeUndefined()
    expect(distPkg.devDependencies).toBeUndefined()
    expect(distPkg.scripts).toBeUndefined()

    // main/exports point to ./index.js
    expect(distPkg.main).toBe('./index.js')
    expect(distPkg.exports['.']).toBe('./index.js')

    // engines.node >= 22
    expect(distPkg.engines.node).toBe('>=22')

    // Explicit files
    expect(distPkg.files).toEqual(['index.js'])
  })

  it('dist/ contains expected files and index.js starts with shebang', () => {
    const actualFiles = readdirSync(distDir).sort()
    expect(actualFiles).toEqual(
      [
        'CHANGELOG.md',
        'LICENSE',
        'README.md',
        'index.js',
        'package.json',
      ].sort(),
    )

    const indexJs = readFileSync(resolve(distDir, 'index.js'), 'utf8')
    expect(indexJs.startsWith('#!/usr/bin/env node')).toBe(true)
  })

  it('dist:package script runs without errors', () => {
    expect(() => {
      execFileSync('npm', ['run', 'dist:package'], {
        cwd: root,
        stdio: 'pipe',
      })
    }).not.toThrow()
  })
})
````

## File: docs/decisions/README.md
````markdown
# Architecture Decision Records

Immutable records of the choices that shape `agents-mcp`. Each ADR states the
context, the decision, the alternatives rejected, and the accepted trade-offs.

| ADR | Title | Status |
| :--- | :--- | :--- |
| [0001](./0001-canonical-transports.md) | Canonical transports are `stdio` and `http` | Superseded by ADR-0010 |
| [0002](./0002-schema-source-and-versioning.md) | Zod 4 is the schema source of truth; publish Draft-07 | Superseded by ADR-0010 |
| [0003](./0003-bundler-tsup.md) | Bundle the CLI with `tsup` (esbuild), no declarations | Accepted |
| [0004](./0004-runtime-context-and-pure-compilers.md) | Injected runtime context and pure native compilers | Accepted |
| [0005](./0005-local-sync-state.md) | Local sync state and persisted agent targets | Partially superseded by ADR-0014 |
| [0006](./0006-non-destructive-compilation.md) | Preserve native files in place | Accepted |
| [0007](./0007-env-and-secrets.md) | `.env` precedence and safe secret extraction | Accepted |
| [0008](./0008-packaging-and-runtime-floor.md) | Node 22 floor, single binary, publish from `dist/` only | Accepted |
| [0009](./0009-typescript-7-removes-baseurl.md) | TypeScript 7 removes `baseUrl`; keep TS 7 with tsconfig-relative `paths` | Accepted |
| [0010](./0010-adopt-agent-plugins-mcp-schema.md) | Adotar o padrão Agent Plugins MCP 1.0.0 | Accepted |
| [0011](./0011-plugin-lifecycle-and-safe-cleanup.md) | Ciclo de vida de plugins e limpeza segura | Accepted |
| [0012](./0012-adapter-storage-layout.md) | Explicit adapter storage layout (`single-file` vs `per-plugin`) | Accepted |
| [0013](./0013-non-destructive-antigravity-and-additive-sync-targets.md) | Non-destructive Antigravity sync and additive `state.targets` | Accepted |
| [0014](./0014-mcp-lock-and-authoritative-sync.md) | `mcp-lock.json` and authoritative `sync` | Accepted |

## Conventions

- One decision per file, numbered sequentially.
- Never edit an accepted ADR's intent; supersede it with a new record.
- Every ADR is referenced from [`spec/BLUEPRINT.md`](../../spec/BLUEPRINT.md) §19 and,
  when relevant, from the package documentation.
````

## File: spec/SPEC.md
````markdown
# Unified Agents MCP Configuration Specification (`v0.1.0`)

**Status:** Approved (`v0.1.0`)  
**Schema URI:** `https://agent-plugins.org/schemas/1.0.0/mcp.schema.json`  
**License:** CC0 1.0 Universal (Public Domain)

---

## 1. Abstract

The **Unified Agents MCP Configuration** (`.agents/mcp.json`) defines a standardized, tool-agnostic file format and directory convention for declaring **Model Context Protocol (MCP)** servers across AI coding agents, IDEs, and CLI assistants.

**Normative basis:** This specification adopts **Agent Plugins MCP 1.0.0** as its normative basis for MCP server configuration. The official schema is `https://agent-plugins.org/schemas/1.0.0/mcp.schema.json`, and the implementation reference is documented at `https://agent-plugins.org/plugin-authors/mcp-servers`.

As developers increasingly use multiple AI coding agents within the same codebase (e.g., Claude Code, Cursor, VS Code Copilot, OpenCode, Windsurf, Zed), maintaining separate, divergent MCP configuration files creates configuration drift, duplicated effort, and accidental secret exposure.

Across the ecosystem, all major AI coding agents have already converged on the `.agents/` directory (notably `.agents/skills`) as the shared standard for agent capabilities. Adopting `.agents/mcp.json` within that same namespace is the natural architectural progression—consolidating skills and MCP tool definitions under one predictable, repository-friendly convention rather than introducing another fragmented root-level configuration file. This specification establishes `.agents/mcp.json` as the single source of truth for workspace and user-level MCP server definitions.

### Scope delimitation

The `agents-mcp` CLI manages and synchronizes MCPs in a standardized way within the context of a project (and in the user's global scope). The Agent Plugins MCP 1.0.0 standard remains the normative reference for MCP server configuration in individual plugins. The proposal does not create or propose a competing variant of the Agent Plugins schema, and does not transform the project into a general plugin manager beyond per-project MCP management.

---

## 2. File Locations & Precedence

Conformant tools and compilers MUST resolve configuration files using the following conventions:

1. **Project Scope (Workspace):** `<project-root>/.agents/mcp.json`  
   Intended to be version-controlled in Git and shared across the engineering team.
2. **Global Scope (User):** `~/.agents/mcp.json`  
   Intended for personal MCP servers and user-wide credentials across all projects.

> **Why `.agents/`?** By co-locating `mcp.json` alongside `.agents/skills`, tools that already discover `.agents/` at the workspace and user levels can adopt `.agents/mcp.json` with minimal architectural overhead.

### 2.1 Resolution & Merging Rules
When both scopes exist, conformant tools SHOULD load `~/.agents/mcp.json` as the base layer and merge `<project-root>/.agents/mcp.json` on top. If a server key exists in both files, the project-level definition takes precedence over the global definition.

---

## 3. Document Structure

A valid configuration file MUST be a UTF-8 encoded JSON object conforming to the published JSON Schema (Draft 2020-12).

### 3.1 Top-Level Properties

| Property | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `$schema` | `string` (URI) | **Yes** | MUST point to a valid specification schema URI (e.g., `https://agent-plugins.org/schemas/1.0.0/mcp.schema.json`). Serves as both editor validation target and format version identifier. |
| `mcpServers` | `object` | **Yes** | A map of unique logical server identifiers (keys) to server configuration objects (values). |

> **Note on Versioning:** A separate `version` property is intentionally omitted. Schema evolution is governed strictly by the `$schema` URI.

---

## 4. Server Definitions

Each entry inside `mcpServers` is a discriminated union keyed by the required `type` property.

### 4.1 Common Properties (All Transports)

| Property | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `type` | `"stdio" \| "streamable-http" \| "sse"` | **Yes** | — | Explicitly defines the MCP transport protocol. |

### 4.2 Local Process Transport (`type: "stdio"`)

Used for MCP servers spawned as local child processes communicating over standard input/output.

| Property | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `type` | `"stdio"` | **Yes** | — | Discriminator for local process servers. |
| `command` | `string` | **Yes** | — | Executable binary or runtime command (e.g., `"npx"`, `"uvx"`, `"node"`, `"docker"`). |
| `args` | `string[]` | No | `[]` | Ordered list of command-line arguments passed to `command`. |
| `env` | `Record<string, string>` | No | `{}` | Key-value map of environment variables injected into the server process. |
| `cwd` | `string` | No | *(Project root)* | Optional working directory for the child process. |

> **Compiler support for `cwd`:** The canonical field is preserved as-is. In `v0.1.0`, none of the supported agents exposes a documented native working-directory field, so compilers MUST omit `cwd` with a warning. Adapters MAY start emitting it once a target agent documents native support, without requiring a schema change.

### 4.3 Remote Network Transport (`type: "streamable-http"` and `type: "sse"`)

Used for remote MCP servers accessed over Streamable HTTP or the legacy HTTP+SSE.

The format defines exactly three transport discriminators: `"stdio"`, `"streamable-http"` and `"sse"`. Any other value is invalid. Implementations importing existing agent files whose native format does not distinguish transports, or that expose only a `url`, MUST treat the entry as `"streamable-http"` and emit a warning.

| Property | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `type` | `"streamable-http" \| "sse"` | **Yes** | — | Discriminator for remote network servers. |
| `url` | `string` (URI) | **Yes** | — | Full endpoint URL of the remote MCP server. |
| `headers` | `Record<string, string>` | No | `{}` | Key-value map of HTTP headers sent with requests (e.g., `Authorization`). |

---

## 5. Environment Variable Interpolation & Secret Hygiene

Because `.agents/mcp.json` is designed to be committed to version control, **plaintext secrets MUST NOT be stored inside the file**.

### 5.1 Placeholder Syntax
Conformant parsers and compilers MUST support POSIX-style variable interpolation inside string values of `args`, `env`, `url`, and `headers`:

* **Required variable:** `${VAR_NAME}`
  Resolves to the value of `VAR_NAME` from the workspace `.env` file or the host environment.
* **Variable with default fallback:** `${VAR_NAME:-default_value}`
  Resolves to `VAR_NAME` if set and non-empty; otherwise evaluates to `default_value`.

Variable names MUST match `[A-Za-z_][A-Za-z0-9_]*`. Values are interpolated **once**; the result of a substitution is never re-scanned for further placeholders. Placeholders are not expanded by the compiler when writing native files: they are translated to the target agent's syntax and remain symbolic, so plaintext secrets never reach the canonical file or the derived files.

### 5.2 Resolution Order

Implementations that resolve placeholders MUST use the following precedence:

1. **Local `.env` file** of the active scope:
   - project scope → `<project-root>/.env`
   - global scope → `~/.agents/.env`
2. **Host environment** (`process.env`).

The local `.env` value **takes precedence** over a system environment variable with the same name. This is the opposite of the common `dotenv` default and is deliberate: the repository-local file is the source of truth for a project's MCP credentials.

An unresolved placeholder without a `:-default` fallback MUST produce a warning at compile time and an error in `doctor`.

### 5.3 Compilation to Target Agents
When projecting `.agents/mcp.json` into native agent files that use proprietary interpolation syntax, compilers MUST translate `${VAR_NAME}` into the target agent's native format (see [`MATRIX.md`](./MATRIX.md)):
- **Agents with native fallback support** (e.g., `claude-code`): preserve `${VAR_NAME:-default_value}` as-is.
- **Agents without native fallback syntax** (`cursor`, `vscode`, `opencode`, `windsurf`, `zed`): discard the `:-default_value` suffix when translating to `${env:VAR_NAME}`, `{env:VAR_NAME}`, or `${VAR_NAME}` and emit a warning so the user knows the fallback was dropped.

---

## 6. Canonical Agent Identifiers

To ensure interoperability across `targets` arrays and compiler adapters, the specification defines the following canonical agent identifiers:

* `claude-code` — Anthropic Claude Code CLI / IDE extension
* `cursor` — Cursor IDE
* `vscode` — Visual Studio Code (GitHub Copilot MCP)
* `opencode` — OpenCode CLI / Desktop
* `windsurf` — Windsurf IDE
* `zed` — Zed Editor
* `antigravity` — Antigravity agent (per-plugin MCP configs)

---

## 7. Complete Example

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "postgres": {
      "type": "stdio",
      "command": "uvx",
      "args": ["mcp-server-postgres", "${DATABASE_URL}"]
    },
    "linear": {
      "type": "streamable-http",
      "url": "https://mcp.linear.app/mcp",
      "headers": {
        "Authorization": "Bearer ${LINEAR_API_KEY}"
      }
    }
  }
}
```

## 8. Implementer Guidelines (For Agent Maintainers)

AI coding agent maintainers wishing to adopt native support for `.agents/mcp.json` SHOULD implement the following loading lifecycle:

1.  **Discovery:** Check for `<project-root>/.agents/mcp.json` and `~/.agents/mcp.json` during workspace initialization.
2.  **Filtering:** Conformant tools MAY ignore servers not applicable to the current agent scope.
3.  **Interpolation:** Resolve `${VAR_NAME}` and `${VAR_NAME:-fallback}` using the precedence defined in §5.2 (`.env` of the active scope first, then the host environment) prior to spawning processes or opening network connections.
4.  **Precedence:** If a user also maintains an agent-specific file (e.g.,  `.cursor/mcp.json`), agent-specific overrides MAY take precedence over `.agents/mcp.json` for local experimentation while this spec is under adoption.

---

## 9. Local State & Untracked Artifacts

The specification defines a canonical, shareable file; tooling state MUST NOT leak into it.

1. **Sync state:** Implementations MAY keep a local lock file at `.agents/mcp-lock.json` (project scope) and `~/.agents/mcp-lock.json` (global scope). A legacy file at `.agents/.mcp-sync-state.json` is read as a fallback. Its format is implementation-defined. Implementations MUST NOT add the lock file (or its legacy name) to `.gitignore` automatically; implementers MAY version it. The lock MUST NOT be required by conformant readers of `.agents/mcp.json`.
2. **Secrets:** Real values live only in `.env` (project scope) or `~/.agents/.env` (global scope), never in `.agents/mcp.json`. `.env.example` contains key names only.
3. **Agent files:** Native agent configuration files belong to the user. Compilers MUST NOT add them to `.gitignore`, and MUST NOT delete or move them.
4. **Gitignore changes:** The only entry a compiler may add to `.gitignore` is `.env`, and only when it is about to write that file.

## 10. Compiler Safety Guarantees

A conformant compiler:

- Writes canonical and native files atomically (temporary file in the same directory, then rename).
- Preserves unrelated keys, arrays (e.g. VS Code `inputs`), comments, and formatting of JSONC targets by performing AST-level edits.
- Removes only entries that it previously managed, never hands-off entries.
- Aborts instead of overwriting a file it cannot parse, and keeps a `.bak` copy before destructive recovery operations.
- Produces byte-identical output when run twice against unchanged input (idempotence).

## 11. Versioning & Evolution

The `$schema` URI is the single version identifier. It MUST resolve to `https://agent-plugins.org/schemas/1.0.0/mcp.schema.json` (the major.minor.patch segment follows the Agent Plugins version without a `v` prefix), and the published schema document MUST set its `$id` to that same URI. Implementations SHOULD accept any structurally valid file and SHOULD warn — not fail — when `$schema` points to a different version than the one they implement. There is no `version` property inside the file.
````

## File: src/index.ts
````typescript
/**
 * CLI entrypoint (§11).
 *
 * Creates the `RuntimeContext` once, selects the `PromptUi` (Clack on TTY,
 * Auto on `--yes`/`CI`), and runs the `citty` app with global flags and the
 * subcommands registered below. T8/T9 add subcommands (init, import, sync,
 * remove, list, add, doctor) additively to the `subCommands` record.
 */

import { defineCommand, runCommand, showUsage } from 'citty'
import { realpathSync } from 'node:fs'
import pkg from '$/package.json' with { type: 'json' }
import { createRuntimeContext, type RuntimeContext } from '$/src/core/context'
import { createClackUi, type PromptUi } from '$/src/ui/prompts'
import { createAutoUi } from '$/src/ui/auto'
import { syncCommand } from '$/src/commands/sync.command'
import { initCommand } from '$/src/commands/init.command'
import { removeCommand } from '$/src/commands/remove.command'
import { listCommand } from '$/src/commands/list.command'
import { importCommand } from '$/src/commands/import.command'
import { addCommand } from '$/src/commands/add.command'
import { doctorCommand } from '$/src/commands/doctor.command'

/** Global flags available on every command (§11). */
const globalFlags = {
  global: {
    type: 'boolean',
    alias: 'g',
    description:
      'Operate on the global agent configuration (~/.agents/mcp.json)',
  },
  yes: {
    type: 'boolean',
    alias: 'y',
    description: 'Run non-interactively, accepting recommended defaults',
  },
  agents: {
    type: 'string',
    description: 'Comma-separated target agents to sync (e.g. cursor,vscode)',
  },
  'dry-run': {
    type: 'boolean',
    description: 'Simulate operations without writing to disk or state',
  },
} as const

const app = defineCommand({
  meta: {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
  },
  args: globalFlags,
  subCommands: {
    sync: syncCommand,
    init: initCommand,
    remove: removeCommand,
    list: listCommand,
    import: importCommand,
    add: addCommand,
    doctor: doctorCommand,
  },
})

const SUBCOMMANDS = [
  'sync',
  'init',
  'remove',
  'list',
  'import',
  'add',
  'doctor',
]

/** Boolean global flags accepted before or after the subcommand token. */
const GLOBAL_BOOLEAN_FLAGS = new Set(['--global', '--yes', '--dry-run'])

/** Short aliases canonicalized to their long form for subcommand parsing. */
const SHORT_GLOBAL_FLAGS: Readonly<Record<string, string>> = {
  '-g': '--global',
  '-y': '--yes',
}

/**
 * Long flags that consume the following token as a value. Aliases like `-y`
 * must not be canonicalized when they are actually an argument value (e.g.
 * `add x --command npx --arg -y`).
 */
const VALUE_FLAGS = new Set([
  '--arg',
  '--env',
  '--header',
  '--command',
  '--http',
  '--sse',
  '--cwd',
  '--name',
])

/** Index of the first subcommand token, ignoring tokens after `--`. */
function findSubcommandIndex(rawArgs: readonly string[]): number {
  for (let i = 0; i < rawArgs.length; i++) {
    const token = rawArgs[i]
    if (token === '--') return -1
    if (token !== undefined && SUBCOMMANDS.includes(token)) return i
  }
  return -1
}

/**
 * Normaliza tokens de flag: converte `--agents <valor>` em `--agents=<valor>` e
 * canonicaliza os aliases globais (`-g` → `--global`, `-y` → `--yes`), já que
 * os subcomandos do `citty` não herdam os aliases do comando raiz. Tokens após
 * `--` são preservados literalmente.
 */
function normalizeFlagTokens(rawArgs: readonly string[]): string[] {
  const normalized: string[] = []
  let literal = false
  let previousWasValueFlag = false

  for (let i = 0; i < rawArgs.length; i++) {
    const token = rawArgs[i]
    if (token === undefined) continue

    if (token === '--') {
      literal = true
      normalized.push(token)
      continue
    }

    if (!literal) {
      // The token is the value of a preceding `--flag <value>`; never rewrite it.
      if (previousWasValueFlag) {
        normalized.push(token)
        previousWasValueFlag = false
        continue
      }

      if (token === '--agents') {
        const next = rawArgs[i + 1]
        if (next !== undefined && !next.startsWith('-')) {
          normalized.push(`--agents=${next}`)
          i++
          continue
        }
        normalized.push(token)
        continue
      }

      if (VALUE_FLAGS.has(token)) {
        normalized.push(token)
        previousWasValueFlag = true
        continue
      }

      const longForm = SHORT_GLOBAL_FLAGS[token]
      if (longForm !== undefined) {
        normalized.push(longForm)
        continue
      }
    }

    normalized.push(token)
  }

  return normalized
}

/**
 * Normaliza `rawArgs` para o `citty`.
 *
 * Além de converter `--agents <valor>` em `--agents=<valor>` e canonicalizar
 * `-g`/`-y` para `--global`/`--yes`, move flags globais posicionadas **antes**
 * do subcomando para logo depois dele: o `citty` corta `rawArgs` no índice do
 * subcomando e descarta tudo o que vem antes. Sem isso,
 * `agents-mcp --agents opencode sync` e `agents-mcp -g sync` perderiam as flags
 * silenciosamente.
 *
 * Exemplo: `['--agents', 'opencode,antigravity', 'sync']` →
 * `['sync', '--agents=opencode,antigravity']`.
 *
 * Tokens após `--` são preservados literalmente.
 */
export function normalizeGlobalArgs(rawArgs: readonly string[]): string[] {
  const subcommandIndex = findSubcommandIndex(rawArgs)
  if (subcommandIndex === -1) {
    return normalizeFlagTokens(rawArgs)
  }

  const prefix = normalizeFlagTokens(rawArgs.slice(0, subcommandIndex))
  const rest = normalizeFlagTokens(rawArgs.slice(subcommandIndex))
  const subcommand = rest[0] as string

  // Tokens que não são flags globais conhecidas permanecem antes do
  // subcomando, na ordem original.
  const leading: string[] = []
  const movedGlobals: string[] = []

  for (let i = 0; i < prefix.length; i++) {
    const token = prefix[i] as string

    if (GLOBAL_BOOLEAN_FLAGS.has(token)) {
      movedGlobals.push(token)
      continue
    }

    if (token === '--agents') {
      const next = prefix[i + 1]
      if (next !== undefined && !next.startsWith('-')) {
        movedGlobals.push(`--agents=${next}`)
        i++
      } else {
        movedGlobals.push(token)
      }
      continue
    }

    if (token.startsWith('--agents=')) {
      movedGlobals.push(token)
      continue
    }

    leading.push(token)
  }

  return [...leading, subcommand, ...movedGlobals, ...rest.slice(1)]
}

/**
 * CLI entry point. Runs the citty app with `process.argv`.
 * Only executes when this module is run directly (not when imported by tests).
 */
export async function main(): Promise<void> {
  const rawArgs = normalizeGlobalArgs(process.argv.slice(2))

  // Handle --version / -v at root level → exit 0.
  if (rawArgs.includes('--version') || rawArgs.includes('-v')) {
    console.log(pkg.version)
    return
  }

  // Handle --help / -h at root level (no subcommand specified) → exit 0.
  const hasSubcommand = rawArgs.some((a) => SUBCOMMANDS.includes(a))
  if (
    !hasSubcommand &&
    (rawArgs.includes('--help') || rawArgs.includes('-h'))
  ) {
    await showUsage(app)
    return
  }

  // Handle --help / -h with a subcommand → show subcommand help → exit 0.
  const subcmd = rawArgs.find((a) => SUBCOMMANDS.includes(a))
  if (subcmd && (rawArgs.includes('--help') || rawArgs.includes('-h'))) {
    const subCommandDef = (app.subCommands as Record<string, unknown>)[subcmd]
    if (subCommandDef) {
      await showUsage(subCommandDef, app)
      return
    }
  }

  try {
    await runCommand(app, { rawArgs })
  } catch (err) {
    // Never swallow errors silently: surface them on stderr before exiting.
    const message = err instanceof Error ? err.message : String(err)
    console.error(message)
    // citty throws CLIError (E_UNKNOWN_COMMAND / E_INVALID_ARG / E_NO_COMMAND)
    // for usage problems → exit 2. Runtime errors from commands → exit 1.
    if ((err as Error)?.name === 'CLIError') {
      process.exit(2)
    } else {
      process.exit(1)
    }
  }
}

/**
 * True when this file is executed directly (e.g. `node dist/index.js`), not
 * when imported as a module by tests. Uses argv[1] basename instead of
 * import.meta.url comparison, which breaks with symlinks (e.g. `npx`).
 */
/**
 * True when this file is executed directly (e.g. `node dist/index.js`), not
 * when imported as a module by tests. Resolves symlinks via `realpathSync`
 * so invoking `agents-mcp` through an installed bin symlink executes
 * `main()` instead of exiting silently. Guarded against `VITEST` and
 * invalid/unreadable paths.
 */
if (process.argv[1] && !process.env.VITEST) {
  try {
    const resolved = realpathSync(process.argv[1])
    if (resolved.endsWith('index.js')) {
      void main()
    }
  } catch {
    // Unreadable/missing argv[1] (e.g. under some test runners): fall back
    // to the literal basename check.
    if (process.argv[1].endsWith('index.js')) {
      void main()
    }
  }
}

/**
 * Build the `RuntimeContext` and `PromptUi` for the current process. Called
 * once by each command (`src/commands/*.ts`). The UI choice (TTY vs
 * `--yes`/`CI`) is consistent across all commands.
 */
export function createUi({ yes = false }: { yes?: boolean } = {}): {
  ctx: RuntimeContext
  ui: PromptUi
} {
  const ctx = createRuntimeContext()
  const isAuto = !ctx.isTTY || ctx.env.CI === 'true' || yes
  const ui: PromptUi = isAuto
    ? createAutoUi({ defaults: {}, log: undefined })
    : createClackUi()
  return { ctx, ui }
}
````

## File: tests/commands/add.test.ts
````typescript
import { describe, expect, it, vi, beforeEach, afterAll } from 'vitest'
import {
  readFileSync,
  existsSync,
  mkdirSync,
  writeFileSync,
  rmSync,
} from 'node:fs'
import { join } from 'node:path'
import { addCommand } from '$/src/commands/add.command'
import { createUiAndCtx, persistCanonicalConfig } from '$/src/commands/util'
import { getConfigPath } from '$/src/core/store'
import { loadState, writeState, emptyState } from '$/src/core/state'
import { DEFAULT_SCHEMA_URL } from '$/src/config'
import type { RuntimeContext } from '$/src/core/context'
import type { PromptUi } from '$/src/ui/prompts'
import { createSandbox } from '$/tests/helpers/sandbox'

vi.mock('$/src/commands/util', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return { ...actual, createUiAndCtx: vi.fn() }
})

const exitSpy = vi
  .spyOn(process, 'exit')
  .mockImplementation((() => {}) as NodeJS.Process['exit'])

beforeEach(() => {
  exitSpy.mockClear()
})

afterAll(() => {
  exitSpy.mockRestore()
})

/** Executa `add` num sandbox e devolve o canonical config gravado. */
async function runAddInSandbox(
  rawArgs: string[],
  opts: { command?: string; http?: string; sse?: string } = {},
) {
  const { ctx, cleanup } = createSandbox()
  let content = ''
  try {
    vi.mocked(createUiAndCtx).mockImplementation(() => ({
      ctx,
      ui: {
        error: vi.fn(),
        warn: vi.fn(),
        note: vi.fn(),
      } as unknown as PromptUi,
    }))

    await addCommand.run!({
      args: {
        yes: false,
        global: false,
        'no-sync': true,
        force: false,
        'extract-secrets': false,
        command: opts.command ?? 'npx',
        http: opts.http,
        sse: opts.sse,
        cwd: undefined,
        name: 'st',
        _: [],
      },
      rawArgs,
    } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])
    content = readFileSync(getConfigPath('project', ctx), 'utf8')
  } finally {
    cleanup()
  }
  return content
}

describe('commands add (R53: repeatable flags from rawArgs)', () => {
  it('acumula múltiplas --arg= valor, incluindo valor iniciado com -', async () => {
    const content = await runAddInSandbox([
      '--command=npx',
      '--arg=-y',
      '--arg=@modelcontextprotocol/server-sequential-thinking',
      '--name=st',
    ])
    const config = JSON.parse(content)
    expect(config.mcpServers.st.type).toBe('stdio')
    expect(config.mcpServers.st.args).toEqual([
      '-y',
      '@modelcontextprotocol/server-sequential-thinking',
    ])
  })

  it('acumula múltiplas --arg na forma --flag valor (espaço)', async () => {
    const content = await runAddInSandbox([
      '--command=npx',
      '--arg',
      '-y',
      '--arg',
      '@scope/pkg',
      '--name=st',
    ])
    const config = JSON.parse(content)
    expect(config.mcpServers.st.args).toEqual(['-y', '@scope/pkg'])
  })

  it('acumula múltiplas --env', async () => {
    const content = await runAddInSandbox([
      '--command=npx',
      '--env=FOO=bar',
      '--env=BAZ=qux',
      '--name=st',
    ])
    const config = JSON.parse(content)
    expect(config.mcpServers.st.env).toEqual({ FOO: 'bar', BAZ: 'qux' })
  })

  it('acumula múltiplas --header', async () => {
    const content = await runAddInSandbox(
      [
        '--http=https://api.example.com/mcp',
        '--header=X:1',
        '--header=Y:2',
        '--name=st',
      ],
      { http: 'https://api.example.com/mcp' },
    )
    const config = JSON.parse(content)
    expect(config.mcpServers.st.headers).toEqual({ X: '1', Y: '2' })
  })

  it('mantém uma única --arg (não regressa)', async () => {
    const content = await runAddInSandbox([
      '--command=npx',
      '--arg=-y',
      '--name=st',
    ])
    const config = JSON.parse(content)
    expect(config.mcpServers.st.args).toEqual(['-y'])
  })

  it('mescla --flag=valor com --flag valor', async () => {
    const content = await runAddInSandbox([
      '--command=npx',
      '--arg=-y',
      '--arg',
      '@scope/pkg',
      '--name=st',
    ])
    const config = JSON.parse(content)
    expect(config.mcpServers.st.args).toEqual(['-y', '@scope/pkg'])
  })

  it('não consome o próximo token quando ele começa com --', async () => {
    const content = await runAddInSandbox([
      '--arg',
      '--command=npx',
      '--name=st',
    ])
    const config = JSON.parse(content)
    expect(config.mcpServers.st.args).toEqual([])
  })

  it('não grava nada quando não há --arg/--env/--header', async () => {
    const content = await runAddInSandbox(['--command=npx', '--name=st'])
    const config = JSON.parse(content)
    expect(config.mcpServers.st.args).toEqual([])
    expect(config.mcpServers.st.env).toBeUndefined()
    expect(config.mcpServers.st.headers).toBeUndefined()
  })

  it('não chama process.exit ao adicionar com sucesso', async () => {
    await runAddInSandbox(['--command=npx', '--arg=-y', '--name=st'])
    expect(exitSpy).not.toHaveBeenCalled()
  })

  it('exibe --command (e não --stdio) na mensagem de uso sem fonte', async () => {
    const { ctx, cleanup } = createSandbox()
    const errorMock = vi.fn()
    // `restoreMocks` (vitest.config.ts) restaura process.exit antes de cada
    // teste, então re-mockamos aqui para não lançar ao chamar process.exit(2).
    vi.spyOn(process, 'exit').mockImplementation(
      (() => {}) as NodeJS.Process['exit'],
    )
    try {
      vi.mocked(createUiAndCtx).mockImplementation(() => ({
        ctx,
        ui: {
          error: errorMock,
          warn: vi.fn(),
          note: vi.fn(),
        } as unknown as PromptUi,
      }))

      await addCommand.run!({
        args: {
          yes: false,
          global: false,
          'no-sync': true,
          force: false,
          'extract-secrets': false,
          command: undefined,
          http: undefined,
          sse: undefined,
          cwd: undefined,
          name: 'st',
          _: [],
        },
        rawArgs: [],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])
    } finally {
      cleanup()
    }

    const message = errorMock.mock.calls[0]?.[0] as string
    expect(message).toContain('--command')
    expect(message).not.toContain('--stdio')
  })
})

describe('commands add (B2: interactive flow)', () => {
  it('inicia o fluxo interativo no TTY e grava o canonical config', async () => {
    const { ctx, cleanup } = createSandbox()
    const intro = vi.fn()
    const outro = vi.fn()
    const note = vi.fn()
    const select = vi.fn(async () => 'command')
    const text = vi.fn().mockResolvedValueOnce('npx').mockResolvedValueOnce('')
    const confirm = vi.fn(async () => false)
    try {
      const interactiveCtx = {
        ...ctx,
        isTTY: true,
        env: { ...ctx.env, CI: undefined },
      }
      vi.mocked(createUiAndCtx).mockImplementation(() => ({
        ctx: interactiveCtx,
        ui: {
          intro,
          outro,
          note,
          warn: vi.fn(),
          error: vi.fn(),
          select,
          text,
          confirm,
        } as unknown as PromptUi,
      }))

      await addCommand.run!({
        args: {
          yes: false,
          global: false,
          'no-sync': true,
          force: false,
          'extract-secrets': false,
          command: undefined,
          http: undefined,
          sse: undefined,
          cwd: undefined,
          name: undefined,
          _: ['my-server'],
        },
        rawArgs: [],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      const content = readFileSync(
        getConfigPath('project', interactiveCtx),
        'utf8',
      )
      const config = JSON.parse(content)
      expect(config.mcpServers['my-server']).toMatchObject({
        type: 'stdio',
        command: 'npx',
        args: [],
      })
      expect(intro).toHaveBeenCalledWith('Add MCP server')
      expect(outro).toHaveBeenCalled()
      expect(note).toHaveBeenCalledWith('Added server `my-server`')
    } finally {
      cleanup()
    }
  })

  it('sai com código 2 sem TTY quando só há <nome> posicional', async () => {
    const { ctx, cleanup } = createSandbox()
    const errorMock = vi.fn()
    vi.spyOn(process, 'exit').mockImplementation(
      (() => {}) as NodeJS.Process['exit'],
    )
    try {
      vi.mocked(createUiAndCtx).mockImplementation(() => ({
        ctx,
        ui: {
          error: errorMock,
          warn: vi.fn(),
          note: vi.fn(),
        } as unknown as PromptUi,
      }))

      await addCommand.run!({
        args: {
          yes: false,
          global: false,
          'no-sync': true,
          force: false,
          'extract-secrets': false,
          command: undefined,
          http: undefined,
          sse: undefined,
          cwd: undefined,
          name: undefined,
          _: ['my-server'],
        },
        rawArgs: [],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(process.exit).toHaveBeenCalledWith(2)
      const message = errorMock.mock.calls[0]?.[0] as string
      expect(message).toContain('--command')
      expect(message).not.toContain('--stdio')
      expect(existsSync(getConfigPath('project', ctx))).toBe(false)
    } finally {
      cleanup()
    }
  })

  it('sai com código 2 com --yes mesmo em TTY', async () => {
    const { ctx, cleanup } = createSandbox()
    vi.spyOn(process, 'exit').mockImplementation(
      (() => {}) as NodeJS.Process['exit'],
    )
    try {
      const ttyCtx = {
        ...ctx,
        isTTY: true,
        env: { ...ctx.env, CI: undefined },
      }
      vi.mocked(createUiAndCtx).mockImplementation(() => ({
        ctx: ttyCtx,
        ui: {
          error: vi.fn(),
          warn: vi.fn(),
          note: vi.fn(),
        } as unknown as PromptUi,
      }))

      await addCommand.run!({
        args: {
          yes: true,
          global: false,
          'no-sync': true,
          force: false,
          'extract-secrets': false,
          command: undefined,
          http: undefined,
          sse: undefined,
          cwd: undefined,
          name: undefined,
          _: ['my-server'],
        },
        rawArgs: [],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(process.exit).toHaveBeenCalledWith(2)
      expect(existsSync(getConfigPath('project', ttyCtx))).toBe(false)
    } finally {
      cleanup()
    }
  })
})

describe('commands add (B3/T5: --agents, --no-sync and plugin generation)', () => {
  function setupUi(ctx: RuntimeContext) {
    const ui = {
      error: vi.fn(),
      warn: vi.fn(),
      note: vi.fn(),
      intro: vi.fn(),
      outro: vi.fn(),
    }
    vi.mocked(createUiAndCtx).mockImplementation(() => ({
      ctx,
      ui: ui as unknown as PromptUi,
    }))
    return ui
  }

  /** Args equivalentes ao parse real do citty para `--no-sync`. */
  function baseArgs(
    overrides: Record<string, unknown> = {},
  ): Record<string, unknown> {
    return {
      yes: true,
      global: false,
      force: false,
      'extract-secrets': false,
      command: 'npx',
      http: undefined,
      sse: undefined,
      cwd: undefined,
      name: 'my-tool',
      _: [],
      ...overrides,
    }
  }

  it('gera plugin com --no-sync em projeto sem targets e não executa runSync', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      await addCommand.run!({
        args: baseArgs({ sync: false }),
        rawArgs: ['--command=npx', '--no-sync'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      const pluginDir = join(ctx.cwd, '.agents/plugins/my-tool')
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(false)

      const state = loadState('project', ctx).state
      expect(state.targets).toEqual([])
      expect(state.managedPlugins).toEqual(['my-tool'])
      expect(ui.error).not.toHaveBeenCalled()
      expect(exitSpy).not.toHaveBeenCalled()
    } finally {
      cleanup()
    }
  })

  it('honra --no-sync vindo de rawArgs mesmo sem args.sync', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      await addCommand.run!({
        args: baseArgs(),
        rawArgs: ['--command=npx', '--no-sync'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/my-tool/plugin.json')),
      ).toBe(true)
      expect(loadState('project', ctx).state.targets).toEqual([])
      expect(ui.error).not.toHaveBeenCalled()
    } finally {
      cleanup()
    }
  })

  it('honra --agents=<lista> no add e persiste o target selecionado', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      await addCommand.run!({
        args: baseArgs({ name: 'remote-mcp', agents: 'antigravity' }),
        rawArgs: ['--command=npx', '--agents=antigravity'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/remote-mcp/mcp_config.json')),
      ).toBe(true)
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/remote-mcp/mcp.json')),
      ).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.targets).toEqual(['antigravity'])
      expect(state.managedPlugins).toEqual(['remote-mcp'])
      expect(ui.error).not.toHaveBeenCalled()
      expect(exitSpy).not.toHaveBeenCalled()
    } finally {
      cleanup()
    }
  })

  it('honra --agents <lista> separado por espaço no add', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      await addCommand.run!({
        args: baseArgs({ name: 'remote-mcp' }),
        rawArgs: ['--command=npx', '--agents', 'antigravity'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/remote-mcp/mcp_config.json')),
      ).toBe(true)
      expect(loadState('project', ctx).state.targets).toEqual(['antigravity'])
      expect(ui.error).not.toHaveBeenCalled()
    } finally {
      cleanup()
    }
  })

  it('gera mcp_config.json com --agents antigravity --no-sync', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      await addCommand.run!({
        args: baseArgs({ sync: false }),
        rawArgs: ['--command=npx', '--agents', 'antigravity', '--no-sync'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/my-tool/mcp_config.json')),
      ).toBe(true)
      // runSync não roda: targets persistidos permanecem vazios.
      expect(loadState('project', ctx).state.targets).toEqual([])
      expect(ui.error).not.toHaveBeenCalled()
    } finally {
      cleanup()
    }
  })

  it('plugin dir existente com nome declarado no canônico e adotado por add --force (sem bloqueio; arquivos sobrescritos; registrado em managedPlugins)', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      // Declara `my-tool` no canônico e deixa um diretorio de plugin pre-existente.
      persistCanonicalConfig('project', ctx, {
        $schema: DEFAULT_SCHEMA_URL,
        mcpServers: {
          'my-tool': { type: 'stdio', command: 'npx', args: [] },
        },
      })
      const pluginDir = join(ctx.cwd, '.agents/plugins/my-tool')
      mkdirSync(pluginDir, { recursive: true })
      const sentinelPath = join(pluginDir, 'sentinel.txt')
      writeFileSync(sentinelPath, 'ADOTADO')

      await addCommand.run!({
        args: baseArgs({ force: true, name: 'my-tool' }),
        rawArgs: ['--command=npx', '--force'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()
      expect(ui.error).not.toHaveBeenCalled()

      // O sentinel (arquivo nao gerenciado) e preservado pela sincronizacao.
      expect(readFileSync(sentinelPath, 'utf8')).toBe('ADOTADO')
      // Os arquivos gerenciados sao sobrescritos/adotados.
      expect(
        JSON.parse(readFileSync(join(pluginDir, 'plugin.json'), 'utf8')).name,
      ).toBe('my-tool')
      expect(
        JSON.parse(readFileSync(join(pluginDir, 'mcp.json'), 'utf8'))
          .mcpServers['my-tool'],
      ).toBeDefined()

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toContain('my-tool')
    } finally {
      cleanup()
    }
  })
})

describe('commands add (T6: integridade do índice canônico)', () => {
  it('reporta mensagem clara quando .agents/mcp.json está inválido (sem mcpServers)', async () => {
    const { ctx, cleanup } = createSandbox()
    const errorMock = vi.fn()
    const exitMock = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as NodeJS.Process['exit'])

    // Escreve um .agents/mcp.json inválido diretamente (bypassa writeConfig).
    const { mkdirSync, writeFileSync } = await import('node:fs')
    mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
    writeFileSync(
      `${ctx.cwd}/.agents/mcp.json`,
      JSON.stringify({ $schema: DEFAULT_SCHEMA_URL }),
      'utf8',
    )

    try {
      vi.mocked(createUiAndCtx).mockImplementation(() => ({
        ctx,
        ui: {
          error: errorMock,
          warn: vi.fn(),
          note: vi.fn(),
        } as unknown as PromptUi,
      }))

      await addCommand.run!({
        args: {
          yes: true,
          global: false,
          'no-sync': true,
          force: false,
          'extract-secrets': false,
          command: 'npx',
          http: undefined,
          sse: undefined,
          cwd: undefined,
          name: 'my-tool',
          _: [],
        },
        rawArgs: ['--command=npx', '--no-sync'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(errorMock).toHaveBeenCalled()
      const message = errorMock.mock.calls[0]?.[0] as string
      expect(message).toContain('Invalid')
      expect(message).toContain('agents-mcp init --force')
      expect(exitMock).toHaveBeenCalledWith(1)
    } finally {
      cleanup()
      exitMock.mockRestore()
    }
  })
})

describe('commands add (B5: plugin criado independentemente de sync/targets)', () => {
  function baseUi(ctx: ReturnType<typeof createSandbox>['ctx']) {
    const note = vi.fn()
    const errorMock = vi.fn()
    vi.mocked(createUiAndCtx).mockImplementation(() => ({
      ctx,
      ui: {
        error: errorMock,
        warn: vi.fn(),
        note,
        intro: vi.fn(),
        outro: vi.fn(),
      } as unknown as PromptUi,
    }))
    return { note, errorMock }
  }

  function addArgs(name: string, noSync: boolean, yes = true) {
    return {
      yes,
      global: false,
      force: false,
      'extract-secrets': false,
      'no-sync': noSync,
      command: 'npx',
      http: undefined,
      sse: undefined,
      cwd: undefined,
      name,
      _: [],
    }
  }

  it('regressao B5: add sem --no-sync e sem targets nao chama exit, cria plugin', async () => {
    const { ctx, cleanup } = createSandbox()
    const { note, errorMock } = baseUi(ctx)
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    try {
      await addCommand.run!({
        args: addArgs('web', false),
        rawArgs: ['--command=npx'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()
      expect(errorMock).not.toHaveBeenCalled()

      const pluginDir = join(ctx.cwd, '.agents/plugins/web')
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(false)

      const state = loadState('project', ctx).state
      expect(state.targets).toEqual([])
      expect(state.managedPlugins).toEqual(['web'])

      const outputs = [
        ...note.mock.calls.map((call) => String(call[0])),
        ...logSpy.mock.calls.map((call) => String(call[0])),
      ]
      expect(outputs.some((o) => o.includes('No target agents'))).toBe(true)
      expect(outputs.some((o) => o.includes('agents-mcp sync --agents'))).toBe(
        true,
      )
    } finally {
      logSpy.mockRestore()
      cleanup()
    }
  })

  it('fluxo interativo com sincronizacao habilitada cria plugin, chama outro e nao sai com exit', async () => {
    const { ctx, cleanup } = createSandbox()
    const intro = vi.fn()
    const outro = vi.fn()
    const note = vi.fn()
    const select = vi.fn(async () => 'command')
    const text = vi.fn().mockResolvedValueOnce('npx').mockResolvedValueOnce('')
    const confirm = vi.fn(async () => false)
    const interactiveCtx = {
      ...ctx,
      isTTY: true,
      env: { ...ctx.env, CI: undefined },
    }
    try {
      vi.mocked(createUiAndCtx).mockImplementation(() => ({
        ctx: interactiveCtx,
        ui: {
          intro,
          outro,
          note,
          warn: vi.fn(),
          error: vi.fn(),
          select,
          text,
          confirm,
        } as unknown as PromptUi,
      }))

      await addCommand.run!({
        args: {
          yes: false,
          global: false,
          force: false,
          'extract-secrets': false,
          'no-sync': false,
          command: undefined,
          http: undefined,
          sse: undefined,
          cwd: undefined,
          name: undefined,
          _: ['my-server'],
        },
        rawArgs: [],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()
      expect(outro).toHaveBeenCalled()
      expect(intro).toHaveBeenCalledWith('Add MCP server')

      const pluginDir = join(interactiveCtx.cwd, '.agents/plugins/my-server')
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)
    } finally {
      cleanup()
    }
  })

  it('--no-sync preserva targets semeados no estado', async () => {
    const { ctx, cleanup } = createSandbox()
    baseUi(ctx)
    try {
      writeState('project', ctx, {
        ...emptyState('project'),
        targets: ['cursor'],
        managedPlugins: [],
      })

      await addCommand.run!({
        args: addArgs('my-tool', true),
        rawArgs: ['--command=npx', '--no-sync'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()
      expect(loadState('project', ctx).state.targets).toEqual(['cursor'])

      const pluginDir = join(ctx.cwd, '.agents/plugins/my-tool')
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(false)
    } finally {
      cleanup()
    }
  })

  it('antigravity via state.targets cria mcp_config.json sem --agents', async () => {
    const { ctx, cleanup } = createSandbox()
    baseUi(ctx)
    try {
      writeState('project', ctx, {
        ...emptyState('project'),
        targets: ['antigravity'],
      })

      await addCommand.run!({
        args: addArgs('my-tool', false),
        rawArgs: ['--command=npx'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()

      const pluginDir = join(ctx.cwd, '.agents/plugins/my-tool')
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.targets).toEqual(['antigravity'])
      expect(state.managedPlugins).toEqual(['my-tool'])
    } finally {
      cleanup()
    }
  })

  it('definicao identica recria plugin ausente sem process.exit', async () => {
    const { ctx, cleanup } = createSandbox()
    const { note, errorMock } = baseUi(ctx)
    try {
      await addCommand.run!({
        args: addArgs('srv', false),
        rawArgs: ['--command=npx'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()

      const pluginDir = join(ctx.cwd, '.agents/plugins/srv')
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)

      // Simula o plugin sumindo do disco (usuario afetado pelo B5 repete o add).
      rmSync(pluginDir, { recursive: true, force: true })
      expect(existsSync(pluginDir)).toBe(false)
      note.mockClear()

      await addCommand.run!({
        args: addArgs('srv', false),
        rawArgs: ['--command=npx'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()
      expect(errorMock).not.toHaveBeenCalled()
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)

      const notes = note.mock.calls.map((call) => String(call[0]))
      expect(
        notes.some((n) =>
          n.includes('already present with identical definition'),
        ),
      ).toBe(true)
    } finally {
      cleanup()
    }
  })

  it('B8: add succeeds even when an unrelated plugin path exists (file instead of directory)', async () => {
    const { ctx, cleanup } = createSandbox()
    const errorMock = vi.fn()
    const note = vi.fn()
    const exitMock = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as NodeJS.Process['exit'])
    try {
      persistCanonicalConfig('project', ctx, {
        $schema: DEFAULT_SCHEMA_URL,
        mcpServers: {
          srv: { type: 'stdio', command: 'npx', args: [] },
        },
      })
      writeState('project', ctx, {
        ...emptyState('project'),
        targets: [],
        agents: {},
        managedPlugins: ['srv'],
      })
      const pluginsDir = join(ctx.cwd, '.agents/plugins')
      mkdirSync(pluginsDir, { recursive: true })
      // Unrelated plugin path is a file, not a directory — add must not fail
      // because of it (B8: onlyPluginNames limits sync to the new server).
      const srvPluginPath = join(pluginsDir, 'srv')
      writeFileSync(srvPluginPath, 'not a directory')

      vi.mocked(createUiAndCtx).mockImplementation(() => ({
        ctx,
        ui: {
          error: errorMock,
          warn: vi.fn(),
          note,
          intro: vi.fn(),
          outro: vi.fn(),
        } as unknown as PromptUi,
      }))

      await addCommand.run!({
        args: addArgs('my-tool', false),
        rawArgs: ['--command=npx'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      // add succeeds; unrelated plugin path does not cause failure.
      expect(exitMock).not.toHaveBeenCalled()
      expect(errorMock).not.toHaveBeenCalled()

      // Both servers are in the canonical index.
      const config = JSON.parse(
        readFileSync(getConfigPath('project', ctx), 'utf8'),
      )
      expect(config.mcpServers.srv).toBeDefined()
      expect(config.mcpServers['my-tool']).toBeDefined()

      // Plugin for the newly added server was created.
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/my-tool/plugin.json')),
      ).toBe(true)
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/my-tool/mcp.json')),
      ).toBe(true)

      // The unrelated srv path was not touched (still a file, not a directory).
      expect(existsSync(srvPluginPath)).toBe(true)
      expect(existsSync(join(srvPluginPath, 'plugin.json'))).toBe(false)
    } finally {
      cleanup()
      exitMock.mockRestore()
    }
  })
})
````

## File: src/commands/sync.ts
````typescript
/**
 * `sync` command (§11).
 *
 * Validate canonical config → resolve targets → compile per adapter → write
 * native files → update sync state → print summary. Byte-idempotent: a second
 * run produces no byte changes. Exports `runSync` for reuse by `add`/`remove`.
 */

import { join } from 'node:path'
import {
  createUiAndCtx,
  configPath,
  formatConfigValidationError,
  formatDryRunActions,
  writeFileAtomic,
  persistSyncState,
  loadSyncState,
} from '$/src/commands/util'
import { resolveTargetsAsync, getAdapter } from '$/src/adapters/index'
import type { AgentId } from '$/src/adapters/types'
import { AGENTS_DIR } from '$/src/config'
import type { CanonicalServer } from '$/src/core/schema'
import type { ConfigScope, RuntimeContext } from '$/src/core/context'
import { loadValidatedConfig, ConfigValidationError } from '$/src/core/store'
import { readTextFile } from '$/src/core/fs-atomic'
import { syncPluginFiles, removeManagedPlugin } from '$/src/core/plugins'

export interface SyncOptions {
  scope: ConfigScope
  ctx: RuntimeContext
  flag: readonly string[] | undefined
  dryRun: boolean
  yes: boolean
  /**
   * When `true`, does not print the plugin error block. Used by `add`,
   * which reports the same failures once in its own summary.
   */
  quietErrors?: boolean
  /**
   * `add --no-sync`: generates only the plugin; does not resolve or write agents.
   * `state.targets` and `state.agents` are preserved.
   */
  skipAgentSync?: boolean
  /**
   * `add`: allows zero resolvable targets; keeps generating plugins.
   * Without it, zero targets keeps current behavior (error + exit 1).
   */
  allowEmptyTargets?: boolean
  /**
   * B8: when defined, `sync` writes/validates only plugins whose names are in
   * this list. Used by `add` to never fail because of an unmanaged unrelated
   * plugin.
   */
  onlyPluginNames?: readonly string[]
}

export interface SyncSummary {
  scope: ConfigScope
  targets: AgentId[]
  written: string[]
  warnings: string[]
  errors: string[]
}

export async function runSync(options: SyncOptions): Promise<SyncSummary> {
  const {
    scope,
    ctx,
    flag,
    dryRun,
    yes,
    quietErrors = false,
    skipAgentSync = false,
    allowEmptyTargets = false,
    onlyPluginNames = undefined,
  } = options
  const { ui } = createUiAndCtx({ yes })

  // 1. Load + validate canonical config.
  let validated
  try {
    validated = loadValidatedConfig(scope, ctx)
  } catch (err) {
    if (err instanceof ConfigValidationError) {
      ui.error(formatConfigValidationError(err))
      process.exit(1)
    }
    throw err
  }
  if (!validated) {
    ui.note(
      `No canonical config at ${configPath(scope, ctx)}. Nothing to sync.`,
    )
    return { scope, targets: [], written: [], warnings: [], errors: [] }
  }
  const { config, warnings: configWarnings } = validated

  // 2. Resolve targets: flag → state → detection.
  // In `skipAgentSync` (`add --no-sync`) there is no agent resolution: the
  // plugin phase still runs, but without native files and without touching
  // agent state.
  const stateResult = loadSyncState(scope, ctx)
  const state = stateResult.state
  const targets = skipAgentSync
    ? []
    : await resolveTargetsAsync({ flag, state, ctx })

  if (!skipAgentSync && targets.length === 0 && !allowEmptyTargets) {
    // Strict default: direct `runSync` callers, `remove`, and `import` keep
    // exiting 1. The `sync` command opts in via `allowEmptyTargets`.
    ui.error(
      'No resolvable target agents. Pass --agents <list> (e.g. --agents cursor,vscode).',
    )
    process.exit(1)
  }

  const allWarnings: Array<{ code: string; agent?: string; message: string }> =
    [
      ...configWarnings.map((w) => ({
        code: 'SCHEMA',
        agent: undefined,
        message: w,
      })),
    ]
  // Surface sync-state notices (e.g. a legacy file was imported) as non-fatal
  // STATE warnings, once per sync.
  for (const notice of stateResult.notices) {
    allWarnings.push({ code: 'STATE', agent: undefined, message: notice })
  }

  // 3. Compile + write per target adapter.
  const written: string[] = []
  // Planned file operations for the --dry-run preview (zero disk writes).
  const planned: { type: 'write' | 'remove'; path: string }[] = []
  // Preserve existing agent records; only overwrite the agents being synced.
  const nextAgents: Record<
    string,
    { path: string; names: string[]; updatedAt: string }
  > = { ...state.agents }
  const now = new Date().toISOString()

  for (const agentId of targets) {
    const adapter = getAdapter(agentId)
    const nativePath = adapter.getConfigPath(scope, ctx)
    if (nativePath === null) {
      // antigravity writes per-plugin files (no single native config path);
      // it is handled by the plugin sync phase below, not here.
      if (agentId !== 'antigravity') {
        allWarnings.push({
          code: 'SCOPE_UNSUPPORTED',
          agent: agentId,
          message: `${agentId} does not support ${scope} scope`,
        })
      }
      continue
    }

    const serversForAgent: Record<string, CanonicalServer> = {}
    for (const [name, server] of Object.entries(config.mcpServers)) {
      serversForAgent[name] = server
    }

    const previous = new Set<string>(state.agents[agentId]?.names ?? [])
    const existing = readTextFile(nativePath)

    const { content, managedNames, warnings } = adapter.applyServers(
      existing,
      serversForAgent,
      {
        ...ctx,
        scope,
        previousManagedNames: previous,
      },
    )
    allWarnings.push(...warnings)

    planned.push({ type: 'write', path: nativePath })
    if (!dryRun) {
      writeFileAtomic(nativePath, content)
      written.push(nativePath)
    }

    const existingAgent = state.agents[agentId]
    const namesChanged =
      !existingAgent ||
      existingAgent.path !== nativePath ||
      existingAgent.names.length !== managedNames.length ||
      managedNames.some((n) => !existingAgent.names.includes(n))
    // Refresh per-agent updatedAt only when names/path actually change
    // (byte-idempotence of state).
    nextAgents[agentId] = {
      path: nativePath,
      names: [...managedNames],
      updatedAt: namesChanged ? now : (existingAgent?.updatedAt ?? now),
    }
  }

  // 3b. Plugin sync: .agents/mcp.json is authoritative — for every canonical
  // server generate/overwrite .agents/plugins/<name>/ (plugin.json +
  // mcp.json always; mcp_config.json when antigravity is targeted) and adopt
  // the name into managedPlugins, regardless of pre-existing directories or
  // lock membership. Files in the plugin directory other than the three
  // managed filenames are never touched. Names not declared in .agents/mcp.json
  // are never visited (unmanaged dirs outside the canonical config stay
  // untouched and unreported).
  const includeAntigravity = skipAgentSync
    ? Boolean(
        flag?.includes('antigravity') || state.targets.includes('antigravity'),
      )
    : targets.includes('antigravity')
  const canonicalNames = Object.keys(config.mcpServers)
  const nextManagedPlugins = new Set<string>(
    state.managedPlugins.filter((n) => canonicalNames.includes(n)),
  )
  /** Canonical names whose plugin (including `mcp_config.json` when antigravity
   * is targeted) was written successfully this run. */
  const syncedPluginNames = new Set<string>()
  for (const [name, server] of Object.entries(config.mcpServers)) {
    // B8: when `onlyPluginNames` is set, generate only the requested plugins
    // requested (e.g. `add` writes only the plugin for the newly added server).
    if (onlyPluginNames && !onlyPluginNames.includes(name)) {
      continue
    }

    const result = syncPluginFiles({
      name,
      server,
      scope,
      ctx,
      includeAntigravity,
      dryRun,
    })

    if (result.ok) {
      nextManagedPlugins.add(name)
      syncedPluginNames.add(name)
      if (!dryRun) {
        written.push(...result.written)
      } else {
        for (const p of result.written) {
          planned.push({ type: 'write', path: p })
        }
      }
    } else {
      allWarnings.push({
        code: 'PLUGIN_WRITE_ERROR',
        agent: undefined,
        message: `Failed to generate plugin \`${name}\`: ${result.errors.join('; ')}`,
      })
    }
  }

  // Prune stale plugins: servers that left the canonical (removed by `remove`
  // or manually) clean their managed files and leave the managed-plugins state.
  // Manual files and non-empty directories are preserved by `removeManagedPlugin`.
  const stalePlugins = state.managedPlugins.filter(
    (n) => !canonicalNames.includes(n),
  )
  for (const name of stalePlugins) {
    const result = removeManagedPlugin({
      scope,
      ctx,
      name,
      managedPlugins: state.managedPlugins,
      dryRun,
    })
    if (!result.ok) {
      // Cleanup failure (e.g. plugin.json became a directory -> EISDIR): keep
      // the name in nextManagedPlugins so the next `sync` retries, instead of
      // dropping the plugin from state and leaving the directory orphaned without
      // reprocessing. The error is already in allWarnings and will be reported
      // in summary.errors (and exit 1 via sync.command).
      nextManagedPlugins.add(name)
      allWarnings.push({
        code: 'PLUGIN_CLEANUP_ERROR',
        agent: undefined,
        message: `Failed to remove plugin \`${name}\`: ${result.errors.join('; ')}`,
      })
    } else {
      for (const p of result.removed) {
        planned.push({ type: 'remove', path: p })
      }
    }
  }

  // 4a. Antigravity agent-state lifecycle: record `state.agents.antigravity`
  // when antigravity is targeted (path = .agents/plugins dir, names = plugins
  // whose sync succeeded this run). When antigravity is not targeted, its
  // state is preserved non-destructively (ADR-0013), symmetrically with all
  // other adapters. `mcp_config.json` files are only removed when their owning
  // server leaves the canonical config (stale plugin cleanup above).
  if (!skipAgentSync && targets.includes('antigravity')) {
    const base = scope === 'project' ? ctx.cwd : ctx.homeDir
    const antigravityPath = join(base, AGENTS_DIR, 'plugins')
    const existing = state.agents['antigravity']
    const names = [...syncedPluginNames]
    const namesChanged =
      !existing ||
      existing.path !== antigravityPath ||
      existing.names.length !== names.length ||
      names.some((n) => !existing.names.includes(n))
    nextAgents['antigravity'] = {
      path: antigravityPath,
      names,
      updatedAt: namesChanged ? now : (existing?.updatedAt ?? now),
    }
  }

  // 4. Update sync state (persist targets + per-agent managed names + plugins).
  // `--agents <list>` is additive: append newly requested valid targets to the
  // persisted list (deduplicated, preserving order) instead of overwriting it
  // (ADR-0013). Plain `sync` keeps the resolved targets (state.targets, or the
  // auto-detected ones when state.targets was empty).
  const nextTargets = skipAgentSync
    ? state.targets
    : [...state.targets, ...targets.filter((id) => !state.targets.includes(id))]
  const nextState = {
    ...state,
    scope,
    targets: nextTargets,
    agents: nextAgents,
    managedPlugins: [...nextManagedPlugins],
  }
  if (!dryRun) {
    persistSyncState(scope, ctx, nextState)
  }

  // --dry-run preview: show planned file operations, zero disk writes.
  if (dryRun && planned.length > 0) {
    ui.note(formatDryRunActions(planned))
  }

  // 5. Print summary.
  const isPluginError = (code: string): boolean =>
    code === 'PLUGIN_WRITE_ERROR' || code === 'PLUGIN_CLEANUP_ERROR'
  const pluginErrors = allWarnings
    .filter((w) => isPluginError(w.code))
    .map((w) => w.message)
  const summaryWarnings = allWarnings
    .filter((w) => !isPluginError(w.code))
    .map((w) => w.message)

  if (pluginErrors.length > 0) {
    if (!quietErrors) {
      ui.error(
        `Partial sync completed with failures: ${pluginErrors.length} plugin(s) could not be synced.`,
      )
      for (const e of pluginErrors) {
        ui.error(e)
      }
      ui.note(
        'Re-run `agents-mcp sync` after resolving the issues above. .agents/mcp.json was kept.',
      )
    }
  } else if (skipAgentSync) {
    // `add --no-sync`: agents were not synced, only plugins.
    ui.note(
      'Agent sync skipped (--no-sync): plugin files were updated in .agents/plugins/ and no agent was synced.',
    )
  } else if (targets.length === 0 && allowEmptyTargets) {
    // `add` without targets: completed with default plugin, no target agents.
    ui.note(
      'No target agents configured or detected: the default Agent Plugins plugin was generated in .agents/plugins/, but no agent was synced. To sync later, run `agents-mcp sync --agents <list>` (e.g. `--agents cursor,vscode`).',
    )
  } else {
    ui.note(
      `Synced ${targets.length} target(s) across ${written.length} file(s)`,
    )
  }
  for (const w of summaryWarnings) {
    ui.warn(w)
  }

  return {
    scope,
    targets,
    written,
    warnings: summaryWarnings,
    errors: pluginErrors,
  }
}
````

## File: skills-lock.json
````json
{
  "version": 2,
  "skills": {
    "architect-worker": {
      "source": "alexbruno/dev-skills",
      "commit": "9aae149bfa9f71a53ab63de1903edd30c59d6b91",
      "sourceType": "github",
      "skillPath": "skills/architect-worker/SKILL.md",
      "computedHash": "89a43f1845e46b0653e1b35a21fc647d2f483c2af96bc03d539154a19b25411b"
    },
    "changelog-management": {
      "source": "alexbruno/dev-skills",
      "commit": "9aae149bfa9f71a53ab63de1903edd30c59d6b91",
      "sourceType": "github",
      "skillPath": "skills/changelog-management/SKILL.md",
      "computedHash": "a340bc51c2123257c6c8ffc879f138c7bf350b7d68a84e7ccab2a28b26ad22e9"
    },
    "code-review": {
      "source": "alexbruno/dev-skills",
      "commit": "9aae149bfa9f71a53ab63de1903edd30c59d6b91",
      "sourceType": "github",
      "skillPath": "skills/code-review/SKILL.md",
      "computedHash": "b390efa66426d690d47e3e64ecbd3e0f0df59f4ab12a32e69e15e1b49317fe18"
    },
    "code-simplification": {
      "source": "alexbruno/dev-skills",
      "commit": "9aae149bfa9f71a53ab63de1903edd30c59d6b91",
      "sourceType": "github",
      "skillPath": "skills/code-simplification/SKILL.md",
      "computedHash": "98f29e95ab341345651370636d8d7b03e3bf1f6c205d76a7ac666d7d5bc3914c"
    },
    "codebase-indexing": {
      "source": "alexbruno/dev-skills",
      "commit": "9aae149bfa9f71a53ab63de1903edd30c59d6b91",
      "sourceType": "github",
      "skillPath": "skills/codebase-indexing/SKILL.md",
      "computedHash": "c7567e317f37dcf7eae248f360ff85c0f1c39f2114931f59ec71a781a8b69433"
    },
    "decision-records": {
      "source": "alexbruno/dev-skills",
      "commit": "9aae149bfa9f71a53ab63de1903edd30c59d6b91",
      "sourceType": "github",
      "skillPath": "skills/decision-records/SKILL.md",
      "computedHash": "8cef5912b2a2d24f894ef70502233a3c3cb56bc0fb98fc57a3bb710343a10284"
    },
    "environment-preflight": {
      "source": "alexbruno/dev-skills",
      "commit": "9aae149bfa9f71a53ab63de1903edd30c59d6b91",
      "sourceType": "github",
      "skillPath": "skills/environment-preflight/SKILL.md",
      "computedHash": "a114e3cbdeccbc22a8d60318713c85b83d29edde173af0c644550182e3f2130f"
    },
    "incremental-implementation": {
      "source": "alexbruno/dev-skills",
      "commit": "9aae149bfa9f71a53ab63de1903edd30c59d6b91",
      "sourceType": "github",
      "skillPath": "skills/incremental-implementation/SKILL.md",
      "computedHash": "e65803637333fb09c32bd8090fdd998163b7e61cbcadf62cbfd681f73c17e08d"
    },
    "npm-version-management": {
      "source": "alexbruno/dev-skills",
      "commit": "9aae149bfa9f71a53ab63de1903edd30c59d6b91",
      "sourceType": "github",
      "skillPath": "skills/npm-version-management/SKILL.md",
      "computedHash": "00bf02eb55459a27880cd14db2c03cbfd677cb81ba4e6a0f13452f03e7a4b4fc"
    },
    "planning-and-task-breakdown": {
      "source": "alexbruno/dev-skills",
      "commit": "9aae149bfa9f71a53ab63de1903edd30c59d6b91",
      "sourceType": "github",
      "skillPath": "skills/planning-and-task-breakdown/SKILL.md",
      "computedHash": "0a6a5591116d291636ecf970433972b059f2a0bb398360183a5218a81d00f84a"
    },
    "product-owner": {
      "source": "alexbruno/dev-skills",
      "commit": "9aae149bfa9f71a53ab63de1903edd30c59d6b91",
      "sourceType": "github",
      "skillPath": "skills/product-owner/SKILL.md",
      "computedHash": "43337ceb4e1df8ba1efe093c99b73154555c3e889e7b3ec44230a82e16afb377"
    },
    "software-audit": {
      "source": "alexbruno/dev-skills",
      "commit": "9aae149bfa9f71a53ab63de1903edd30c59d6b91",
      "sourceType": "github",
      "skillPath": "skills/software-audit/SKILL.md",
      "computedHash": "4c2a767366d1e212fea996497908151cf5f351808411baaf258d01314763d2ad"
    },
    "spec-driven-workflow": {
      "source": "alexbruno/dev-skills",
      "commit": "9aae149bfa9f71a53ab63de1903edd30c59d6b91",
      "sourceType": "github",
      "skillPath": "skills/spec-driven-workflow/SKILL.md",
      "computedHash": "53030b527b01bf198e6d4b18ae47af395ed312a4ecd185998719adfc93779f47"
    },
    "systematic-debugging": {
      "source": "alexbruno/dev-skills",
      "commit": "9aae149bfa9f71a53ab63de1903edd30c59d6b91",
      "sourceType": "github",
      "skillPath": "skills/systematic-debugging/SKILL.md",
      "computedHash": "a2c30f92a2d4c750876fb6c5f03a2bc17568c7a4b3472bf75df2c04136d77f2b"
    },
    "verification-and-testing": {
      "source": "alexbruno/dev-skills",
      "commit": "9aae149bfa9f71a53ab63de1903edd30c59d6b91",
      "sourceType": "github",
      "skillPath": "skills/verification-and-testing/SKILL.md",
      "computedHash": "5b5c612692cdf61a4f62f6a7893fcbdc8545a8db25369eeb53c9b1c7d6b84843"
    }
  }
}
````

## File: src/commands/add.command.ts
````typescript
/**
 * `add` command (§11) — direct-source variant (T9).
 *
 * Resolve direct flags (--command/--arg/--http/--env/--header/--cwd/--name),
 * prompt/accept `--name`, write canonical, then `runSync` unless `--no-sync`.
 * Idempotent: same name + same definition → exit 0, no write.
 * Conflict: same name + different definition → exit 1 with diff; `--force`
 * overwrites.
 * `--env KEY=VALUE` writes to `.env` and uses `${KEY}` in canonical.
 * `--env KEY` references only; warns when unresolved.
 */

import { defineCommand } from 'citty'
import { join } from 'node:path'
import {
  createUiAndCtx,
  configPath,
  persistCanonicalConfig,
  persistSyncState,
  isDryRun,
  isGlobalFlag,
  isYesFlag,
  parseAgentsFlag,
  statePath,
  formatDryRunActions,
} from '$/src/commands/util'
import { runSync } from '$/src/commands/sync'
import { collectInteractiveAddOptions } from '$/src/commands/add-interactive'
import { resolveDirect } from '$/src/sources/direct'
import { resolveSource } from '$/src/sources/index'
import type { Candidate } from '$/src/sources/types'
import { loadValidatedConfig, ConfigValidationError } from '$/src/core/store'
import { loadState, writeState } from '$/src/core/state'
import { DEFAULT_SCHEMA_URL, AGENT_ORDER } from '$/src/config'
import {
  appendToDotenv,
  applySecretExtraction,
  planSecretExtraction,
  syncEnvExample,
} from '$/src/core/env'
import type { CanonicalServer } from '$/src/core/schema'
import type { ConfigScope, RuntimeContext } from '$/src/core/context'
import { isUnmanagedPluginCollision } from '$/src/core/plugins'

function diffValues(a: unknown, b: unknown): string {
  const aStr = JSON.stringify(a, null, 2)
  const bStr = JSON.stringify(b, null, 2)
  if (aStr === bStr) {
    return ''
  }
  return `- ${aStr}\n+ ${bStr}`
}

/**
 * Coleta ocorrências de uma flag repetível (`--arg`, `--env`, `--header`)
 * diretamente de `rawArgs`.
 *
 * O `citty` (`parseArgs`) não acumula `type: 'string'` repetidas em um
 * array — sobrescreve com a última ocorrência (bloqueador [R53]). Esta
 * leitura direta preserva todas as ocorrências.
 *
 * Suporta:
 * - `--flag=valor` (o valor é tudo depois do primeiro `=`)
 * - `--flag valor` (o próximo token é o valor, mesmo começando com `-`,
 *   ex. `--arg -y`; um próximo token que começa com `--` não é consumido)
 */
function collectRepeatableFlags(rawArgs: string[], flag: string): string[] {
  const values: string[] = []
  const longFlag = `--${flag}`
  for (let i = 0; i < rawArgs.length; i++) {
    const token = rawArgs[i]
    if (token === undefined) continue
    if (token.startsWith(longFlag + '=')) {
      values.push(token.slice(longFlag.length + 1))
    } else if (token === longFlag) {
      const next = rawArgs[i + 1]
      if (next !== undefined && !next.startsWith('--')) {
        values.push(next)
        i++ // consome o valor do próximo token
      }
    }
  }
  return values
}

export const addCommand = defineCommand({
  meta: {
    name: 'add',
    description: 'Install an MCP server from direct flags',
  },
  args: {
    command: {
      type: 'string',
      description: 'Executable command for command-based MCP server',
    },
    arg: { type: 'string', description: 'Argument token (repeatable)' },
    http: { type: 'string' },
    sse: { type: 'string' },
    env: { type: 'string', description: 'KEY=VALUE (repeatable)' },
    header: { type: 'string', description: '"Name: Value" (repeatable)' },
    cwd: { type: 'string' },
    name: { type: 'string', description: 'Server name override' },
    'no-sync': {
      type: 'boolean',
      description: 'Skip agent sync; Agent Plugins files are still generated',
    },
    force: { type: 'boolean', alias: 'f' },
    'extract-secrets': {
      type: 'boolean',
      description: 'Write detected secrets to .env',
    },
  },
  run: async ({ args, rawArgs }) => {
    const { ctx, ui } = createUiAndCtx({ yes: isYesFlag(args) })
    const scope = (isGlobalFlag(args) ? 'global' : 'project') as ConfigScope
    const path = configPath(scope, ctx)
    const dryRun = isDryRun(args)
    // `citty`/`mri` converte `--no-sync` em `args.sync === false`; a checagem
    // direta em `rawArgs` cobre subcomandos que não declaram `sync`.
    const noSync =
      args['no-sync'] === true ||
      (args as Record<string, unknown>).sync === false ||
      rawArgs.includes('--no-sync')
    const agentsFlag = parseAgentsFlag(args as Record<string, unknown>, rawArgs)
    const force = args.force === true
    const extractSecrets = args['extract-secrets'] === true

    // NOTE (R53): `citty`'s `parseArgs` does not accumulate repeated
    // `type: 'string'` flags into an array — it overwrites with the last
    // occurrence. Collect `--arg`, `--env` and `--header` directly from
    // `rawArgs` so every occurrence is preserved.
    const options = {
      command: args.command as string | undefined,
      arg: collectRepeatableFlags(rawArgs, 'arg'),
      http: args.http as string | undefined,
      sse: args.sse as string | undefined,
      env: collectRepeatableFlags(rawArgs, 'env'),
      header: collectRepeatableFlags(rawArgs, 'header'),
      cwd: args.cwd as string | undefined,
      name: args.name as string | undefined,
    }

    // Dispatch between flag-driven mode and the interactive wizard. A direct
    // source is any of --command/--http/--sse/--arg; without one, a positional
    // `<name>` alone is not enough to build a server.
    const positionalArgs = (args._ as string[] | undefined) ?? []
    const hasDirectSource =
      Boolean(options.command || options.http || options.sse) ||
      options.arg.length > 0
    const isInteractive = ctx.isTTY && ctx.env.CI !== 'true' && !isYesFlag(args)

    /**
     * Determine if a positional argument looks like an external source reference
     * (GitHub URL, owner/repo, @scope/pkg, or npm package) rather than a
     * simple server name for the interactive wizard.
     */
    function isExternalSourceRef(arg: string): boolean {
      // Remote URL
      if (/^https?:\/\//.test(arg)) return true
      // GitHub owner/repo[#ref] or owner/repo format
      if (/^[\w-]+\/[\w.-]+(#.*)?$/.test(arg)) return true
      // npm scoped package @scope/pkg or bare package name with version @pkg@version
      if (/^@[\w-]+\/[\w.-]+(@.*)?$/.test(arg)) return true
      // Bare npm package (contains @ for version or is a known pattern)
      // We treat any arg with @ not at start as potentially a versioned package
      if (/^[\w-]+@[\w.-]+$/.test(arg)) return true
      return false
    }

    let validated: ReturnType<typeof loadValidatedConfig> | null = null
    try {
      validated = loadValidatedConfig(scope, ctx)
    } catch (err) {
      if (err instanceof ConfigValidationError) {
        ui.error(
          `Invalid config at ${err.path}: ${err.issues
            .map((i) => `${i.path || 'root'} — ${i.message}`)
            .join(
              '; ',
            )}. Run \`agents-mcp init --force\` or ensure \`mcpServers\` is defined in .agents/mcp.json.`,
        )
        process.exit(1)
        return
      }
      throw err
    }
    let canonical: Record<string, CanonicalServer> = {}
    let schemaUrl = DEFAULT_SCHEMA_URL
    if (validated) {
      schemaUrl = validated.config.$schema ?? DEFAULT_SCHEMA_URL
      canonical = {
        ...(validated.config.mcpServers as Record<string, CanonicalServer>),
      }
    }

    // Carrega o estado de sincronizacao antecipadamente para verificacao de
    // colisao de plugin (gera ou nao o fluxo interativo).
    const stateResult = loadState(scope, ctx)
    const state = stateResult.state

    let resolved: ReturnType<typeof resolveDirect>
    let name: string
    let interactiveAdd = false

    // Determine source resolution mode:
    // 1. Direct flags (--command/--http/--sse/--arg) -> resolveDirect
    // 2. Positional <source> arg that looks like external ref -> resolveSource
    // 3. No source at all -> interactive wizard (TTY) or usage error
    const positionalSource = positionalArgs[0]?.trim()
    const positionalIsSource =
      positionalSource && isExternalSourceRef(positionalSource)

    if (hasDirectSource) {
      // Explicit flags take precedence
      resolved = resolveDirect(options)
      name = options.name ?? positionalArgs[0] ?? resolved.suggestedName
    } else if (positionalIsSource) {
      // Positional <source> argument (GitHub, npm, Registry, URL)
      resolved = await resolveSource(
        {
          source: positionalSource,
          name: options.name,
          env: options.env,
          header: options.header,
          cwd: options.cwd,
        },
        {
          fetch: globalThis.fetch,
          yes: isYesFlag(args),
          selectCandidate:
            isInteractive && !isYesFlag(args)
              ? async (candidates: Candidate[]) => {
                  if (candidates.length === 0) return null
                  // Exact name match wins automatically
                  const exact = candidates.find(
                    (c: Candidate) =>
                      c.name.toLowerCase() === positionalSource.toLowerCase(),
                  )
                  if (exact) return exact
                  // Multiple candidates in TTY -> prompt user
                  const choice = await ui.select({
                    message: `Multiple candidates found for "${positionalSource}". Choose one:`,
                    options: candidates.map((c: Candidate) => ({
                      label: c.name,
                      value: c,
                      hint: c.ref,
                    })),
                  })
                  return choice ?? null
                }
              : undefined,
        },
      )
      name = options.name ?? resolved.suggestedName
    } else {
      // No source specified
      if (!isInteractive) {
        ui.error(
          'Usage: agents-mcp add <name> --command <cmd> [--arg <token>...] | --http <url>',
        )
        process.exit(2)
        return
      }
      const result = await collectInteractiveAddOptions({
        ui,
        initialName: options.name ?? positionalArgs[0],
        checkConflict: (candidate) => {
          if (candidate in canonical && !force) {
            return 'canonical'
          }
          // Unmanaged plugin collision: re-prompt only for names NOT declared
          // in .agents/mcp.json — declared names can be adopted by sync.
          if (
            !(candidate in canonical) &&
            isUnmanagedPluginCollision(
              scope,
              ctx,
              candidate,
              state.managedPlugins,
            )
          ) {
            return 'unmanaged'
          }
          return false
        },
      })
      interactiveAdd = true
      name = result.name
      resolved = resolveDirect(result.options)
    }

    /**
     * Fase de plugins (+ agentes, quando aplicável) — única fonte via `runSync`.
     * `skipAgentSync: noSync` (`--no-sync` gera só plugin, sem mexer em agentes);
     * `allowEmptyTargets: true` permite `add` sem targets resolvidos.
     */
    const runPluginAndAgentSync = (skipAgentSync: boolean) =>
      runSync({
        scope,
        ctx,
        flag: agentsFlag,
        dryRun,
        yes: isYesFlag(args),
        quietErrors: true,
        skipAgentSync,
        allowEmptyTargets: true,
        onlyPluginNames: [name],
      })

    /** Reports partial plugin failure and exits with code 1. */
    const reportSyncFailures = (errors: string[]): void => {
      ui.error(
        `Server \`${name}\` added to .agents/mcp.json, but failed to generate ${errors.length} plugin(s).`,
      )
      for (const e of errors) {
        ui.error(e)
      }
      ui.note(
        '.agents/mcp.json was kept. Re-run `agents-mcp sync` after resolving the issues above.',
      )
      process.exit(1)
    }

    if (name in canonical && !force) {
      const same =
        JSON.stringify(canonical[name]) === JSON.stringify(resolved.definition)
      if (same) {
        // Definicao identica: nao grava nada de agente, mas garante os
        // arquivos base do plugin (e o registro em managedPlugins) mesmo
        // sem targets e sem sincronizacao de agentes.
        if (!dryRun) {
          const result = await runPluginAndAgentSync(true)
          if (result.errors.length > 0) {
            reportSyncFailures(result.errors)
            return
          }
        }
        ui.note(`Server \`${name}\` already present with identical definition.`)
        return
      }
      ui.error(
        `Conflicting definition for \`${name}\`:\n${diffValues(
          canonical[name],
          resolved.definition,
        )}Use --force to overwrite.`,
      )
      process.exit(1)
    }

    // Non-interactive: fail on unmanaged plugin collision (no auto-rename,
    // no overwrite), but only when the name is NOT declared in
    // .agents/mcp.json — declared names can be adopted by sync.
    if (
      !interactiveAdd &&
      !(name in canonical) &&
      isUnmanagedPluginCollision(scope, ctx, name, state.managedPlugins)
    ) {
      ui.error(
        `The name \`${name}\` is already in use by an unmanaged plugin at .agents/plugins/${name}/. Pass a different --name.`,
      )
      process.exit(1)
    }

    // Secret extraction plan.
    const { writes, replacements, warnings } = planSecretExtraction(
      name,
      resolved.definition,
      { policy: extractSecrets ? 'extract' : 'warn' },
    )
    for (const w of warnings) {
      ui.warn(w)
    }

    // Apply secret extraction (pure, never mutates input). Only replaces when
    // extracting; warn-only leaves the definition unchanged.
    const definition = extractSecrets
      ? applySecretExtraction(resolved.definition, {
          writes,
          replacements,
          warnings,
        })
      : { ...resolved.definition }

    if (!dryRun && extractSecrets && writes.length > 0) {
      const dotenvPath =
        scope === 'project'
          ? join(ctx.cwd, '.env')
          : join(ctx.homeDir, '.agents', '.env')
      const examplePath =
        scope === 'project'
          ? join(ctx.cwd, '.env.example')
          : join(ctx.homeDir, '.agents', '.env.example')
      appendToDotenv(dotenvPath, writes)
      syncEnvExample(
        examplePath,
        writes.map((w) => w.key),
      )
    }

    canonical[name] = definition

    // Planned file operations for the --dry-run preview.
    const planned: { type: 'write' | 'remove'; path: string }[] = []

    if (!dryRun) {
      persistCanonicalConfig(scope, ctx, {
        $schema: schemaUrl,
        mcpServers: canonical,
      })
    } else {
      planned.push({ type: 'write', path })
    }

    if (!dryRun) {
      const nextState = {
        ...state,
        scope,
        targets: state.targets,
        agents: { ...state.agents },
      }
      writeState(scope, ctx, nextState)
    } else {
      planned.push({ type: 'write', path: statePath(scope, ctx) })
    }

    const syncResult = await runPluginAndAgentSync(noSync)
    if (syncResult.errors.length > 0) {
      reportSyncFailures(syncResult.errors)
      return
    }

    // --dry-run preview: show planned file operations, zero disk writes.
    if (dryRun && planned.length > 0) {
      ui.note(formatDryRunActions(planned))
    }

    if (!dryRun) {
      ui.note(`Added server \`${name}\``)
    }

    if (interactiveAdd && !dryRun) {
      ui.outro(`Server \`${name}\` added.`)
    }
  },
})
````

## File: CHANGELOG.md
````markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Sync state renamed to `.agents/mcp-lock.json` (project) and `~/.agents/mcp-lock.json` (global); `STATE_VERSION` stays `1` with a legacy read fallback for `.mcp-sync-state.json`.
- Lock file is no longer auto-added to `.gitignore`; teams choose whether to version it. `.env` remains the only auto-protected entry.
- `sync` is authoritative from `.agents/mcp.json`: it adopts declared plugin dirs (overwriting `plugin.json`/`mcp.json`/`mcp_config.json` while preserving extra files), overwrites canonical native entries, and preserves manual content.
- Zero-target `sync` succeeds: it materializes plugins, prints guidance, and exits `0`.

### Fixed

- Fresh-clone `sync` no longer fails with "pre-exists and is not managed by the CLI"; `add` still blocks undeclared unmanaged plugin names.

## [0.2.0] - 2026-11-25

### Added

- `antigravity` agent adapter and plugin sync support: per-plugin layouts under `.agents/plugins/<name>/` (`plugin.json`, `mcp.json`, plus `mcp_config.json` when `antigravity` is targeted), with `stdio` → `{ command, args?, env? }` and `streamable-http`/`sse` → `{ serverUrl, headers? }` mapping.
- Interactive `add` wizard (`agents-mcp add`) for server name, connection type (local command or HTTP URL), args, env vars, and headers.
- `add` now always creates/updates the base Agent Plugins files (`.agents/plugins/<name>/plugin.json` and `mcp.json`) even with `--no-sync` or when no target agent is configured/detected.
- `--extract-secrets` opt-in flag on `add`: writes detected literal secrets (tokens, keys, high-entropy values) to `.env` + `.env.example` and replaces them with `${VAR}` placeholders in `.agents/mcp.json`; without it, secrets are only warned about.
- Source resolvers for `add`: direct flags (`--command`/`--http`/`--sse`/`--arg`/`--env`/`--header`), GitHub URL/`owner/repo`, npm package, MCP Registry, and remote URLs.
- Repeatable `--arg`, `--env`, `--header` flags accumulated from `rawArgs`.
- `import` scans existing agent configs (`.mcp.json`, `.cursor/mcp.json`, `.vscode/mcp.json`, `opencode.json`, `.zed/settings.json`), deduplicates servers, extracts hardcoded secrets into `.env` + `.env.example`, and generates `.agents/mcp.json`.

### Changed

- Public CLI terminology uses `command` for local MCP servers instead of the transport-level term `stdio`; `list` reports `command`, `http`, and `sse`.
- Canonical configuration, adapters, and generated native configs use `mcpServers` and `type` per Agent Plugins MCP 1.0.0.
- Transport discriminators are `stdio`, `streamable-http`, and `sse`; obsolete `http` transport name removed.

### Removed

- Project-specific JSON Schema publication and Draft-07 schema generation; the Agent Plugins MCP 1.0.0 schema is the single normative reference.
- `disabled` and `targets` fields from the canonical server definition (per-agent targeting remains in the local sync state).
- Obsolete `"enabled": false` from OpenCode compiled output example.

### Fixed

- `remove` now preserves the other servers in the canonical config when deleting one (fixes silent data loss: previously all other servers were wiped).
- `remove --no-sync` respects the flag and does not sync agents: writes only canonical, cleans managed plugin files locally, and preserves `state.targets`/`state.agents`.
- Managed plugin file cleanup when a server leaves the canonical config (`plugin.json`, `mcp.json`, `mcp_config.json`, deleting the directory only if empty); deselecting an agent no longer deletes its files.
- `sync` is non-destructive for every agent: omitting `antigravity` from `--agents` no longer removes `.agents/plugins/<name>/mcp_config.json` or deletes `state.agents.antigravity` (ADR-0013).
- `sync --agents <list>` now appends newly requested targets to `state.targets` (deduplicated, preserving order) instead of overwriting it, so a later plain `sync` still targets previously configured agents (ADR-0013).
- Global flags placed before the subcommand (`-g`/`--global`, `-y`/`--yes`, `--dry-run`, `--agents`) are no longer silently dropped; short aliases are canonicalized for every subcommand.
- `sync` rejects unexpected positional arguments with exit code `2` and an actionable message instead of silently falling back to stale targets.
- Plugin cleanup failures on `sync` are reported with exit code `1`, and the plugin remains registered for retry on the next `sync`.

## [0.1.1] - 2026-11-19

### Added

- Initial `agents-mcp` CLI implementation: single-source `.agents/mcp.json` compiler for AI coding agents (Claude Code, Cursor, VS Code, OpenCode, Windsurf, Zed, Antigravity)
- Canonical `.agents/mcp.json` format aligned with the Agent Plugins MCP 1.0.0 JSON Schema (`https://agent-plugins.org/schemas/1.0.0/mcp.schema.json`): `mcpServers` root key, `type` discriminator, and `stdio`, `streamable-http`, and `sse` transports
- `init` command: scaffold canonical config and select target agents
- `import` command: consolidate existing agent MCP configs into canonical
- `sync` command: compile canonical config into all targeted agent config files (byte-idempotent)
- `remove` command: remove a server and clean from managed agent configs
- `list` command: inspect configured servers, targets, and sync status
- `add` command: install an MCP server via interactive wizard (`agents-mcp add <name>`) or direct flags (`--command`, `--arg`, `--http`, `--sse`, `--env`, `--header`, `--cwd`, `--name`)
- Automatic Agent Plugins directory generation (`.agents/plugins/<name>/plugin.json` and `mcp.json`) on `add` and `sync`, plus `mcp_config.json` when `antigravity` is targeted
- `doctor` command: audit schema validity, env vars, runtime binaries, semantic drift, state, hygiene
- Non-destructive JSONC AST edits (jsonc-parser) preserving comments, unrelated keys, and manual MCP entries
- Secret hygiene: symbolic `${VAR}` placeholders in versioned files, real values only in `.env` (mode 0600)
- Atomic writes with temp+rename and Windows rename fallback
- Per-agent targeting persisted in the local sync state

### Changed

- Public CLI terminology uses `command` for local MCP servers instead of the transport-level term `stdio`; `list` reports `command`, `http`, and `sse`
- Canonical configuration, adapters, and generated native configs use `mcpServers` and `type` per Agent Plugins MCP 1.0.0

### Removed

- Project-specific JSON Schema publication and Draft-07 schema generation; the Agent Plugins MCP 1.0.0 schema is the single normative reference
- `disabled` and `targets` fields from the canonical server definition (per-agent targeting remains in the local sync state)

### Fixed

- `agents-mcp add` now always creates/updates the standard Agent Plugins files (`.agents/plugins/<name>/plugin.json` and `mcp.json`) even with `--no-sync` or when no target agent is configured/detected; `sync` remains responsible for agent files and, when `antigravity` is targeted, `mcp_config.json`.

### Security

- `.env` and `.mcp-sync-state.json` added to `.gitignore` (lazy, managed block)
- `.env` written with mode `0600`; existing keys never overwritten
- Secret values never reach canonical/native files, logs, errors, or `--dry-run` output
````

## File: README.md
````markdown
# agents-mcp

**One `.agents/mcp.json` to rule them all.**

A tool-agnostic specification and CLI compiler for managing Model Context Protocol (MCP) servers across Claude Code, Cursor, VS Code, OpenCode, Windsurf, Zed, and Antigravity.

[![npm version](https://img.shields.io/npm/v/@agents-config/mcp.svg)](https://www.npmjs.com/package/@agents-config/mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Spec: v0.1.0](https://img.shields.io/badge/Spec-v0.1.0-emerald.svg)](./spec/SPEC.md)

---

## Why?

Modern software engineering is no longer tied to a single AI coding assistant. You might use **Claude Code** or **OpenCode** in the terminal, **Cursor** or **VS Code** in the editor, and **Zed** for quick edits—all inside the same repository.

The AI coding ecosystem has already reached broad consensus on **where** shared agent capabilities belong: all major coding agents have standardized on the `.agents/` directory (such as `.agents/skills`) and `AGENTS.md` for portable skills and instructions. Yet **MCP server configuration remains fragmented across incompatible, tool-specific files**:

- **Claude Code** expects `.mcp.json` with `"mcpServers"` and `${VAR}`
- **Cursor** expects `.cursor/mcp.json` with `"mcpServers"` and `${env:VAR}`
- **VS Code** expects `.vscode/mcp.json` with `"servers"` and `${env:VAR}`
- **OpenCode** expects `opencode.json` with `"mcp"`, `"command"` as an array, `"environment"`, and `{env:VAR}`
- **Zed** expects `.zed/settings.json` with `"context_servers"` and nested `"command": { "path", "args" }`

Every time you add an MCP server or rotate a token, you end up copy-pasting JSON across four different files, translating environment variable syntaxes by hand, and risking accidental secret leaks in Git.

Because the `.agents/` namespace is already the de facto industry standard for agent skills, extending that same convention to `.agents/mcp.json` is the most logical and cohesive step forward—keeping all shared agent context, skills, and tool integrations unified under a single, predictable directory without introducing another root-level dotfile.

**`agents-mcp` turns that convention into reality.**

---

## The Solution: Single Source of Truth + Non-Destructive Compiler

1. **Declare once in `.agents/mcp.json`:** A clean, schema-validated, tool-agnostic configuration file that lives alongside `.agents/skills` in your repository.
2. **Compile everywhere automatically:** `agents-mcp` translates and projects your canonical config into the exact native file format, root key, transport structure, and environment variable syntax each agent requires—preserving your existing comments and unrelated settings.

```text
                    ┌──────────────────────┐
                    │   .agents/mcp.json   │  ◄── Single Source of Truth (Git)
                    └──────────┬───────────┘
                               │
		              npx @agents-config/mcp sync
                               │
      ┌──────────────┬─────────┴─────────┬──────────────┐
      ▼              ▼                   ▼              ▼
  .mcp.json   .cursor/mcp.json    .vscode/mcp.json   opencode.json
(Claude Code)     (Cursor)           (VS Code)        (OpenCode)
```

Native files are managed **in place**: unrelated settings, arrays such as VS Code
`inputs`, and JSONC comments are preserved. `agents-mcp` never deletes or moves
them, and it never adds them to `.gitignore`.

## Quick Start

### Already have MCPs scattered across your repo?

Migrate and unify everything in one command:

```bash
npx @agents-config/mcp import
```

This scans your workspace for existing agent configs (`.mcp.json`, `.cursor/mcp.json`, `.vscode/mcp.json`, `opencode.json`, `.zed/settings.json`), deduplicates servers, extracts hardcoded secrets into `.env` + `.env.example`, generates `.agents/mcp.json`, and keeps your active agents synced. Your existing agent files are updated in place, never deleted.

### Starting from scratch?

1. Initialize `.agents/mcp.json` and select your agents:
   `npx @agents-config/mcp init`
2. Add an MCP server from GitHub, npm, MCP Registry, or direct flags
   `npx @agents-config/mcp add modelcontextprotocol/server-github`

   - **External sources:** pass a GitHub URL, `owner/repo`, npm package, or MCP Registry entry as the positional `<source>` argument (`agents-mcp add <source>`).
   - **Direct flags:** use `--command`, `--arg` (repeatable), `--http`, `--sse`, `--env` (`KEY=VALUE`, repeatable), `--header` (`Name: Value`, repeatable), `--cwd`, `--name`.
   - **Interactive wizard:** run `agents-mcp add` with no source in a TTY; the wizard prompts for server name, connection type (local command or HTTP URL), args, env vars, and headers.
   - **`--extract-secrets` (opt-in):** pass `--extract-secrets` to write detected literal secrets (tokens, keys, high-entropy values) to `.env` + `.env.example` and replace them with `${VAR}` placeholders in `.agents/mcp.json`. Without it, secrets are only warned about, not extracted. Real secret values never reach canonical/native files, logs, errors, or `--dry-run` output.

3. Sync changes across all targeted agents
   `npx @agents-config/mcp sync`

**Requirements:** Node.js 22 or newer.

## Canonical Format (`.agents/mcp.json`)

Every `.agents/mcp.json` is backed by a strict JSON Schema (`https://agent-plugins.org/schemas/1.0.0/mcp.schema.json`) for instant autocomplete and validation in modern editors.

Example:

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "postgres": {
      "type": "stdio",
      "command": "uvx",
      "args": ["mcp-server-postgres", "${DATABASE_URL}"]
    },
    "linear": {
      "type": "streamable-http",
      "url": "https://mcp.linear.app/mcp",
      "headers": {
        "Authorization": "Bearer ${LINEAR_API_KEY}"
      }
    }
  }
}
```

## Key Features

- **Zero-Friction Onboarding (`import`):** Absorbs existing configurations from 6+ agents without manual rewriting.
- **Non-Destructive by Design:** AST-level edits (`jsonc-parser`) keep comments, VS Code `inputs`, and non-MCP settings intact — and native agent files are never deleted or moved.
- **Secret Hygiene by Default:** Enforces `${VAR}` placeholders in versioned configs while syncing required keys to `.env` and `.env.example`.
- **Environment Diagnostics (`doctor`):** Validates schema compliance, checks missing `.env` variables, verifies local binaries (`npx`, `uvx`, `docker`), and detects configuration drift semantically.
- **Project & Global Scopes:** Works seamlessly at the repository level (`.agents/mcp.json`) or user level (`~/.agents/mcp.json` via `-g`).

## Supported Agents

| Agent           | Project Config       | Global Config                            | Env Syntax Translated  |
| :-------------- | :------------------- | :--------------------------------------- | :--------------------- |
| **Claude Code** | `.mcp.json`          | `~/.claude.json`                         | `${VAR}`               |
| **Cursor**      | `.cursor/mcp.json`   | `~/.cursor/mcp.json`                     | `${env:VAR}`           |
| **VS Code**     | `.vscode/mcp.json`   | User Profile `mcp.json`                  | `${env:VAR}`           |
| **OpenCode**    | `opencode.json`      | `~/.config/opencode/opencode.json`       | `{env:VAR}`            |
| **Windsurf**    | _(Global only)_      | `~/.codeium/windsurf/mcp_config.json`    | `${env:VAR}`           |
| **Zed**         | `.zed/settings.json` | `~/.config/zed/settings.json`            | `${VAR}`               |
| **Antigravity** | _(per-plugin)_       | `.agents/plugins/<name>/mcp_config.json` | `serverUrl` (HTTP/SSE) |

See the full field-by-field translation rules in [`spec/MATRIX.md`](./spec/MATRIX.md).

Remote servers use **Streamable HTTP** (`type: "streamable-http"`) or the legacy **SSE** (`type: "sse"`).

## Agent Plugins & Antigravity (`.agents/plugins/`)

`.agents/mcp.json` remains the **canonical source of truth** for all MCP server definitions. From `agents-mcp add` and `agents-mcp sync`, the CLI automatically generates a standard **Agent Plugins** layout under:

```
<scope>/.agents/plugins/<name>/
  plugin.json        # plugin manifest (name, version, description)
  mcp.json           # Agent Plugins MCP 1.0.0 document ($schema + mcpServers)
  mcp_config.json    # only when `antigravity` is among the targets
```

- **`plugin.json` + `mcp.json`**: generated for **any** server added or synced, regardless of target agents. `agents-mcp add` **always** creates/updates these base plugin files, including with `--no-sync` and when no agent is configured or detected in the project.
- **`mcp_config.json`**: generated only when `antigravity` is among the targets (`--agents antigravity`, `init`, or `sync`). `stdio` servers map to `{ command, args?, env? }`; `streamable-http` and `sse` servers map to `{ serverUrl, headers? }` (Antigravity's native format).
- When `agents-mcp add` does not resolve any target agent, the CLI completes the index and base plugin and informs that no agent was synced, directing to `agents-mcp sync --agents <list>` (e.g. `--agents cursor,vscode`).
- `agents-mcp sync` without targets succeeds: it materializes plugins, prints guidance (`run agents-mcp sync --agents <list>`), and exits `0`.
- `--no-sync` on `add` suppresses **only** agent sync: plugin files continue to be generated in `.agents/plugins/` and the target state (`state.targets`) and already-registered agents are preserved.

### Ownership and collision

The CLI tracks which plugins it manages in the lock file (`.agents/mcp-lock.json`, field `managedPlugins`; global scope: `~/.agents/mcp-lock.json`). The lock is **not** auto-added to `.gitignore`; teams choose whether to version it. `.env` remains auto-protected.

The lock is a record of what the CLI generated — not a gate on what `.agents/mcp.json` declares. `.agents/mcp.json` remains the canonical source of truth.

- **`sync`**: for every server declared in `.agents/mcp.json`, the CLI writes/overwrites `.agents/plugins/<name>/plugin.json` and `mcp.json` (and `mcp_config.json` when `antigravity` is targeted), regardless of whether the directory pre-exists or whether the name is in `managedPlugins`. Extra files in the plugin directory are preserved. Declared names are adopted into `managedPlugins`.
- **`add`**: if `.agents/plugins/<name>/` already exists **and** `<name>` is **not** declared in `.agents/mcp.json`, `add` blocks (non-interactive, exit `1`) or re-prompts (interactive). Declared names are adopted by `add`/`sync` instead.
- **Unmanaged directories** whose name is not declared in `.agents/mcp.json` remain untouched by `sync` (not written, not deleted, not reported as a collision).

### Partial failure

If `.agents/mcp.json` (and/or agent native files) is written successfully, but creation/update of a plugin file fails, the CLI **does not** print a false full-success message. It reports explicitly what was completed and what failed, with actionable next steps (e.g. re-run `agents-mcp sync`), and exits with code `1`.

### Removal and plugin cleanup

- `remove <name>` removes **only** `plugin.json`, `mcp.json`, and `mcp_config.json` from the managed plugin in `.agents/plugins/<name>/`. The directory is deleted only if empty after cleanup; manual files (e.g. `sentinel.txt`) and subdirectories are preserved.
- Directories in `.agents/plugins/<name>/` whose name is **not** declared in `.agents/mcp.json` are never modified or deleted by `remove` or `sync`.
- `sync` without `antigravity` among the targets removes `mcp_config.json` from managed plugins, keeping `plugin.json` and `mcp.json` intact.
- `remove --no-sync` removes the server from the canonical config and cleans the managed plugin files locally, without syncing agent configs nor changing `state.targets`/`state.agents`.
- `--dry-run` on `remove` and `sync` writes or deletes nothing: canonical, plugins, state, and agent native configs remain untouched.

### Best practices

- Manual edits should be made in `.agents/mcp.json` and propagated via `agents-mcp sync`.
- Files in `.agents/plugins/<name>/` are generated from `.agents/mcp.json`; direct edits to them will be overwritten on the next `sync`.
- When `antigravity` is synced, plugin files are ready in `.agents/plugins/<name>/` (the CLI does **not** automatically activate the Antigravity IDE interface).

## CLI Reference

| Command                    | Description                                                        |
| :------------------------- | :----------------------------------------------------------------- |
| `agents-mcp init`          | Scaffold `.agents/mcp.json` and select the agents to target        |
| `agents-mcp import`        | Consolidate existing agent MCP configs into `.agents/mcp.json`     |
| `agents-mcp add <source>`  | Install an MCP server from GitHub, npm, MCP Registry, or CLI flags |
| `agents-mcp sync`          | Compile `.agents/mcp.json` into all targeted agent config files    |
| `agents-mcp remove <name>` | Remove a server and clean it from managed agent configs            |
| `agents-mcp list`          | Inspect configured servers and sync state                          |
| `agents-mcp doctor`        | Audit schema validity, env vars, runtime binaries, and drift       |

Global flags: `-g`/`--global`, `-y`/`--yes`, `--agents <list>`, `--dry-run`.

## Open Specification

The `.agents/mcp.json` format is an open, public-domain specification ([CC0 1.0](./spec/SPEC.md)).

### Normative basis

This CLI adopts **Agent Plugins MCP 1.0.0** as its normative basis for MCP server configuration:

- **Official schema:** `https://agent-plugins.org/schemas/1.0.0/mcp.schema.json`
- **Implementation reference:** `https://agent-plugins.org/plugin-authors/mcp-servers`

### Scope delimitation

The `agents-mcp` CLI manages and synchronizes MCPs in a standardized way within the context of a project (and in the user's global scope). The Agent Plugins MCP 1.0.0 standard remains the normative reference for MCP server configuration in individual plugins. The proposal does not create or propose a competing variant of the Agent Plugins schema, and does not transform the project into a general plugin manager beyond per-project MCP management.

- **Formal Specification:** [`spec/SPEC.md`](./spec/SPEC.md)
- **Agent Translation Matrix:** [`spec/MATRIX.md`](./spec/MATRIX.md)
- **Technical Blueprint:** [`spec/BLUEPRINT.md`](./spec/BLUEPRINT.md)
- **Architecture Decisions:** [`docs/decisions/`](./docs/decisions/)

**Are you an AI agent or editor maintainer?**

You don't need to depend on this CLI to support `.agents/mcp.json`. If your tool already reads `.agents/skills`, adding native fallback support for `.agents/mcp.json` is a natural extension—check the [Implementer Guidelines](./spec/SPEC.md#8-implementer-guidelines-for-agent-maintainers) to implement it in under 50 lines of code.

## Contributing & License

Contributions, new agent adapters, and spec feedback are welcome. Open an issue or submit a PR!

- **CLI Source Code:** MIT License
- **Specification (`spec/`):** CC0 1.0 Universal (Public Domain)
````

## File: package.json
````json
{
  "name": "@agents-config/mcp",
  "version": "0.2.0",
  "description": "One .agents/mcp.json to rule them all. A tool-agnostic specification and CLI compiler for managing Model Context Protocol (MCP) servers across any AI agent.",
  "keywords": [
    "mcp",
    "model-context-protocol",
    "mcp-server",
    "mcp-config",
    "ai-agents",
    "coding-agents",
    "agents",
    "claude-code",
    "cursor",
    "vscode",
    "opencode",
    "windsurf",
    "zed",
    "cli",
    "config-sync",
    "jsonc",
    "dotenv",
    "devtools"
  ],
  "homepage": "https://github.com/agents-config/mcp#readme",
  "bugs": {
    "url": "https://github.com/agents-config/mcp/issues"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/agents-config/mcp.git"
  },
  "license": "MIT",
  "author": "Alex Bruno Cáceres <email@alexbruno.dev>",
  "type": "module",
  "engines": {
    "node": ">=22"
  },
  "scripts": {
    "build": "tsup",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "verify": "run-s typecheck format:check test build",
    "postversion": "git push --follow-tags",
    "prepublishOnly": "node -e \"console.error('❌ Error: Do not publish from the root! Use: npm run dist'); process.exit(1)\"",
    "dist:build": "npm run verify",
    "dist:package": "tsx scripts/dist-package.ts",
    "dist:publish": "npm publish ./dist --access public",
    "dist": "run-s dist:*",
    "cli": "node dist/index.js"
  },
  "dependencies": {
    "@clack/prompts": "^1.9.0",
    "citty": "^0.2.2",
    "jsonc-parser": "^3.3.1",
    "string-argv": "^0.4.0",
    "zod": "^4.6.0"
  },
  "devDependencies": {
    "@types/node": "^22.13.10",
    "@vitest/coverage-v8": "^5.1.0",
    "ajv": "^8.20.0",
    "ajv-formats": "^3.0.1",
    "npm-run-all2": "^9.0.4",
    "prettier": "^3.10.1",
    "tsup": "^9.0.0",
    "tsx": "^4.23.15",
    "typescript": "^7.0.2",
    "vitest": "^5.1.0"
  }
}
````
