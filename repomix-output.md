This file is a merged representation of the entire codebase, combined into a single document by Repomix.

<file_summary>
This section contains a summary of this file.

<purpose>
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.
</purpose>

<file_format>
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  - File path as an attribute
  - Full contents of the file
</file_format>

<usage_guidelines>
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.
</usage_guidelines>

<notes>
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)
</notes>

</file_summary>

<directory_structure>
.agents/
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
    spec-driven-workflow/
      resources/
        PLAN.md
        REVIEW.md
        SPEC.md
        TASKS.md
        UPSTREAM.md
        VALIDATION.md
      SKILL.md
    systematic-debugging/
      SKILL.md
    verification-and-testing/
      SKILL.md
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
    schema.ts
    state.ts
    store.ts
  sources/
    direct.ts
    github.ts
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
    claude-code.test.ts
    cursor.test.ts
    detect.test.ts
    opencode.test.ts
    vscode.test.ts
    windsurf.test.ts
    zed.test.ts
  cli/
    entrypoint.test.ts
  commands/
    add.test.ts
    basic.test.ts
    doctor.test.ts
    integration.test.ts
  core/
    env.test.ts
    fs-atomic.test.ts
    gitignore.test.ts
    placeholder.test.ts
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
    registry.test.ts
  ui/
    auto.test.ts
  smoke.test.ts
.gitignore
.prettierignore
.prettierrc
CHANGELOG.md
LICENSE
package.json
README.md
repomix-output.md
skills-lock.json
tsconfig.json
tsup.config.ts
vitest.config.ts
</directory_structure>

<files>
This section contains the contents of the repository's files.

<file path="docs/decisions/0010-adopt-agent-plugins-mcp-schema.md">
# ADR-0010: Adotar o padrão Agent Plugins MCP 1.0.0

- **Status**: Accepted
- **Date**: 2026-11-14
- **Supersedes**: [ADR-0001](./0001-canonical-transports.md), [ADR-0002](./0002-schema-source-and-versioning.md)
- **Related Docs**: [`spec/SPEC.md`](../../spec/SPEC.md), [`UPSTREAM.md`](../../workflow/UPSTREAM.md#U4)

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
</file>

<file path=".agents/skills/changelog-management/resources/CHANGELOG.md">
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
</file>

<file path=".agents/skills/changelog-management/SKILL.md">
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

- **Feature or Bugfix Completion**: After implementing or verifying a feature, bug fix, or behavioral change (e.g., when completing a vertical slice or signing off on `workflow/SPEC.md` / `workflow/PLAN.md`).
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
</file>

<file path=".agents/skills/code-review/SKILL.md">
---
name: code-review
description: >-
  Perform structured, multi-dimensional code reviews aligned with the
  `spec-driven-workflow` (`workflow/SPEC.md`, `workflow/PLAN.md`,
  `workflow/REVIEW.md`). Use this skill after implementing a feature or bug fix,
  before merging a PR, or when reviewing changes written by another agent or
  human.
---

# Code Review

Review code changes against both **engineering quality** and **specification intent**, recording every actionable finding in `workflow/REVIEW.md`.

## Review Philosophy

- **Net improvement over perfection**: Approve changes that clearly improve overall code health and satisfy `workflow/SPEC.md`, even if minor stylistic preferences differ.
- **Evidence over opinion**: Ground every finding in a concrete file path, line range or symbol, and explain *why* it matters.
- **Zero silent passes**: Do not approve or finish work while any `blocker` or `major` finding remains `open`.

## 1. Load Workflow Context First

Before inspecting the diff, read the active `workflow/` artifacts (or `workflow/<change-slug>/` for scoped parallel work):

1. **`workflow/SPEC.md`** — Verify goals, non-goals, constraints, and acceptance criteria.
2. **`workflow/PLAN.md`** (and **`workflow/TASKS.md`**, if present) — Understand the intended technical approach and module scope.
3. **`workflow/REVIEW.md`** — Check prior review rounds so resolved items are not re-reported and open items are re-verified.

If `workflow/REVIEW.md` does not exist yet, create it (using the `spec-driven-workflow` `REVIEW.md` template if installed).

## 2. Five-Axis Review Framework

Evaluate the diff (e.g., `git diff`, staged changes, or target PR) across all five dimensions:

1. **Correctness & Spec Alignment**
   - Does the implementation satisfy every acceptance criterion in `workflow/SPEC.md`?
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

## 3. Record Findings in `workflow/REVIEW.md`

Log every finding in `workflow/REVIEW.md` using consistent severity tiers and resolution statuses:

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
2. Update `workflow/REVIEW.md` status (`Open` | `Changes Requested` | `Approved`):
   - **Approved**: All `SPEC.md` acceptance criteria are met, checks pass, and zero `blocker` or `major` items remain `open`.
   - **Changes Requested**: One or more `blocker` or `major` items remain `open`.
3. Follow the `spec-driven-workflow` cleanup rule: **never delete** `workflow/REVIEW.md`; only clear/reset its contents after the user confirms everything is ready.
</file>

<file path=".agents/skills/code-simplification/SKILL.md">
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
4. **Chesterton's Fence**: Before deleting or rewriting code that looks redundant or defensive, understand *why* it was written (check callers, tests, comments, or `workflow/SPEC.md`).

## When to Apply

- Right after a feature or bug fix works and tests pass, to clean up rough or over-complicated implementation details.
- When functions have deep `if/else` nesting, long monolithic blocks, or unclear variable/method names.
- When `workflow/REVIEW.md` flags readability, maintainability, or over-engineering issues.

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
</file>

<file path=".agents/skills/decision-records/resources/ADR.md">
# ADR-<NNNN>: <Short Decision Title>

- **Status**: Proposed | Accepted | Deprecated | Superseded by [ADR-XXXX](./XXXX-title.md)
- **Date**: <YYYY-MM-DD>
- **Related Workflow**: `workflow/SPEC.md` / `workflow/PLAN.md` (if applicable)

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
</file>

<file path=".agents/skills/decision-records/SKILL.md">
---
name: decision-records
description: >-
  Document significant technical and architectural decisions as lightweight
  Architecture Decision Records (ADRs). Use this skill when `workflow/SPEC.md`
  or `workflow/PLAN.md` introduces a hard-to-reverse choice, cross-cutting
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

**Skip ADRs** for routine implementation details, local refactorings, or easily reversible choices—those belong in `workflow/PLAN.md` or code comments.

## Storage & Naming

- Store records in `docs/decisions/` (or `docs/adr/` if the repository already uses that convention).
- Name files sequentially with a lowercase hyphenated slug:
  `docs/decisions/0001-short-decision-title.md`
- Start from the template in [ADR.md](./resources/ADR.md).

## Rules

1. **Link with `workflow/`**: Reference the ADR from `workflow/PLAN.md` (and `workflow/SPEC.md` if applicable) so design context stays connected.
2. **Keep it concise**: Focus on context, decision, alternatives rejected, and consequences—avoid turning an ADR into a tutorial or full specification.
3. **Immutable history**: Once accepted, do not rewrite an old ADR's intent; if a decision changes later, create a new ADR that marks the previous one as `Superseded by <ADR-XXXX>`.
</file>

<file path=".agents/skills/environment-preflight/SKILL.md">
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
</file>

<file path=".agents/skills/incremental-implementation/SKILL.md">
---
name: incremental-implementation
description: >-
  Build features and refactorings in small, verified vertical slices instead of
  large unverified code dumps. Use this skill when executing `workflow/PLAN.md`
  or `workflow/TASKS.md`, modifying multiple files, or implementing changes
  expected to exceed ~100 lines.
---

# Incremental Implementation

Deliver changes in **thin, verifiable increments**—one working slice at a time. Never write an entire multi-file feature in a single unverified pass.

## Core Rule

**One slice, one verification cycle.** Do not start the next slice while the current slice has failing tests, type errors, or a broken build.

## When to Apply

- Executing steps from `workflow/PLAN.md` or tasks from `workflow/TASKS.md`.
- Any change touching two or more files or exceeding ~100 lines of code.
- Refactoring existing modules where behavior must remain intact at every step.

## The Increment Loop

For each step in `workflow/PLAN.md` (or task in `workflow/TASKS.md`):

1. **Scope the Slice**: Pick the smallest cohesive unit that delivers testable progress toward `workflow/SPEC.md`.
2. **Implement Minimally**: Write only the code required for this slice—avoid speculative scaffolding for future slices.
3. **Test & Verify Immediately**: Run targeted unit/integration tests, typecheck, and linter to confirm the slice works and introduces no regressions.
4. **Checkpoint**: Update status in `workflow/PLAN.md` or `workflow/TASKS.md` (e.g., mark `done`), and create a clean commit/checkpoint when appropriate so rollback is effortless.
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
</file>

<file path=".agents/skills/npm-version-management/SKILL.md">
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
</file>

<file path=".agents/skills/planning-and-task-breakdown/SKILL.md">
---
name: planning-and-task-breakdown
description: >-
  Plan execution and break complex work into ordered, verifiable tasks aligned
  with `spec-driven-workflow` (`workflow/SPEC.md`, `workflow/PLAN.md`, and
  conditional `workflow/TASKS.md`). Use this skill when translating a
  specification into a concrete execution plan, scoping large or ambiguous work,
  mapping dependencies, or preparing parallelizable tasks.
---

# Planning & Task Breakdown

Decompose specifications into clear execution steps (`workflow/PLAN.md`) and, when warranted, small verifiable tasks (`workflow/TASKS.md`) before writing any implementation code.

> **Language & Architecture Agnostic**: This skill applies to any technology stack, domain, or project structure. Reason in terms of deliverables, boundaries, dependencies, and verification—never assume specific languages, frameworks, or architectural patterns.

## Core Rule

**Plan in read-only mode.** Explore the repository, map dependencies, and write the plan before modifying any deliverable files. Do not start implementing while planning.

## When to Apply

- Translating `workflow/SPEC.md` into an actionable execution plan (`workflow/PLAN.md`).
- Work feels too large, ambiguous, or multi-faceted to execute in a single pass.
- Multiple independent deliverables or parallel/asynchronous agent executions are possible.
- Skip formal breakdown for trivial, single-step edits where planning adds no value.

## Planning Process

### 1. Ground in `workflow/SPEC.md`

1. Read `workflow/SPEC.md` (or `workflow/<change-slug>/SPEC.md` for scoped initiatives).
   - If `SPEC.md` does not exist yet for a non-trivial change, create and align on `SPEC.md` first.
2. Confirm goals, non-goals, constraints, and acceptance criteria are unambiguous. Surface open questions before committing to a plan.

### 2. Explore & Map Dependencies (Read-Only)

1. Inspect the relevant areas of the repository (preferring indexed context if `codebase-indexing` is active).
2. Identify affected components, shared boundaries, and external constraints.
3. Map the **dependency graph**: determine what blocks what, which steps must run sequentially, and which units are truly independent.

### 3. Author `workflow/PLAN.md`

Create or update `workflow/PLAN.md` (initializing `workflow/` if missing):

- Reference `SPEC.md` requirements rather than duplicating them.
- Order steps logically—tackle high-risk or high-uncertainty unknowns early.
- Define a concrete **Verification Strategy** (automated checks, validations, or manual verification) for each step and for the overall change.
- Note risks and rollback considerations.

### 4. Shard into `workflow/TASKS.md` (Conditional)

Create `workflow/TASKS.md` **only** when at least one `spec-driven-workflow` trigger applies:

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

1. Every requirement and acceptance criterion in `workflow/SPEC.md` is covered by at least one step or task.
2. No circular dependencies exist, and parallel tasks have non-overlapping scopes.
3. Every step/task is small enough to implement and verify in a single focused pass.
4. No implementation code has been written prematurely during the planning phase.
</file>

<file path=".agents/skills/systematic-debugging/SKILL.md">
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
- If `workflow/SPEC.md` is active for this bug fix, record the reproduction steps and confirmed root cause there before planning the fix.

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
</file>

<file path=".agents/skills/verification-and-testing/SKILL.md">
---
name: verification-and-testing
description: >-
  Enforce evidence-based verification and meaningful test coverage before
  claiming any task is complete. Use this skill when writing tests, validating
  `workflow/SPEC.md` acceptance criteria, or verifying builds, linters, and
  runtime behavior after code changes.
---

# Verification & Testing

Never claim a change works, passes, or is complete without **fresh, direct verification evidence** collected after the final edit.

## Core Rule

**Evidence before completion claims.** If you did not run a check after your last change and observe its output, do not report it as passing.

## 1. Align Verification with `workflow/SPEC.md`

- Map every acceptance criterion in `workflow/SPEC.md` and the verification strategy in `workflow/PLAN.md` to a concrete check (automated test, build, lint, typecheck, or explicit runtime check).
- Treat untested acceptance criteria as incomplete work.

## 2. Write Meaningful Tests

- **Test behavior, not implementation details**: Assert observable outputs, state transitions, and side effects so tests survive safe refactoring (`code-simplification`).
- **Cover the edges**: Include boundary values, empty/null inputs, invalid states, and error paths—not just the happy path.
- **Keep tests isolated and deterministic**: Avoid shared mutable state, real network calls, or time-dependent flakiness unless explicitly testing integration boundaries.
- **Never weaken assertions**: Do not relax, skip, or mock away the core behavior under test just to make a suite green.

## 3. Execution Gate After Final Edit

Before handing off work or moving to `workflow/REVIEW.md`:

1. Run the relevant unit/integration tests, linter, typechecker, and build commands.
2. Confirm **all** executed checks pass with zero skipped or relaxed assertions.
3. Report the exact scope of what was run (e.g., full suite vs. targeted subset, any environment limitations).
</file>

<file path=".codegraph/.gitignore">
# CodeGraph data files — local to each machine, not for committing.
# Ignore everything in .codegraph/ except this file itself, so transient
# files (the database, daemon.pid, sockets, logs) never show up in git.
*
!.gitignore
</file>

<file path="docs/decisions/0001-canonical-transports.md">
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
</file>

<file path="docs/decisions/0002-schema-source-and-versioning.md">
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
</file>

<file path="docs/decisions/0003-bundler-tsup.md">
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
</file>

<file path="docs/decisions/0004-runtime-context-and-pure-compilers.md">
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
</file>

<file path="docs/decisions/0005-local-sync-state.md">
# ADR-0005: Local sync state and persisted agent targets

- **Status**: Accepted
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
</file>

<file path="docs/decisions/0006-non-destructive-compilation.md">
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
</file>

<file path="docs/decisions/0007-env-and-secrets.md">
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
</file>

<file path="docs/decisions/0008-packaging-and-runtime-floor.md">
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
</file>

<file path="docs/decisions/0009-typescript-7-removes-baseurl.md">
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
</file>

<file path="scripts/dist-package.ts">
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
const metadataFiles = ['LICENSE', 'README.md']
for (const file of metadataFiles) {
  const src = resolve(root, file)
  const dest = resolve(distDir, file)
  if (existsSync(src)) {
    copyFileSync(src, dest)
  } else {
    console.warn(`⚠️  Warning: ${file} not found, skipping copy to dist/`)
  }
}

// 4. Copy CHANGELOG.md when present, warn instead of failing when absent
const changelogSrc = resolve(root, 'CHANGELOG.md')
const changelogDest = resolve(distDir, 'CHANGELOG.md')
if (existsSync(changelogSrc)) {
  copyFileSync(changelogSrc, changelogDest)
} else {
  console.warn('⚠️  Warning: CHANGELOG.md not found, skipping copy to dist/')
}

console.log('✅ dist/package.json and metadata prepared in dist/ folder')
</file>

<file path="skills/system/run-workflow/SKILL.md">
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
</file>

<file path="spec/BLUEPRINT.md">
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
export const STATE_FILE = '.mcp-sync-state.json'
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

Location: `<state dir>/.mcp-sync-state.json`, where the state dir is `<cwd>/.agents`
or `<homeDir>/.agents`. Rules:

- Missing file → empty state, no warning.
- Corrupt/unknown-version file → warn, treat as empty, and rewrite on next
  successful `sync`.
- `targets` is the persisted agent selection. It is the second source of truth for
  `sync` (after `--agents`, before auto-detection).
- `names` per agent is the authoritative `previousManagedNames` set.
- `import` seeds `names` for every agent it read, even with `--no-sync`.
- `remove` and `sync` prune names no longer present in the canonical file.
- State is always written atomically and is git-ignored.

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

Minimal, lazy, and only for tool-owned secrets/state:

- `ensureIgnored(rootDir, entries)` adds a managed block only when something is
  about to be written:

  ```gitignore
  # agents-mcp local (managed)
  .env
  .agents/.mcp-sync-state.json
  ```

- Called by `env.appendToDotenv` and `state.writeState`, never by `init`/`sync` on
  their own.
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
</file>

<file path="src/adapters/claude-code.ts">
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
</file>

<file path="src/adapters/cursor.ts">
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
</file>

<file path="src/adapters/index.ts">
/**
 * Adapter registry (§9.5): all six adapters in `AGENT_ORDER`, plus lookup,
 * detection, and target resolution.
 *
 * `resolveTargets` implements the precedence: `--agents` flag → persisted
 * `state.targets` → auto-detection. Unknown ids are a usage error.
 */

import { z } from 'zod'
import type { AgentIdSchema } from '$/src/core/schema'
import { AGENT_ORDER } from '$/src/config'
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
  const { existsSync, statSync } = await import('node:fs')
  const { dirname } = await import('node:path')

  for (const adapter of adapters) {
    const path = adapter.getConfigPath(scope, ctx)
    if (path === null) {
      continue
    }
    let found = false
    try {
      found = await adapter.detect(scope, ctx)
    } catch {
      found = false
    }
    if (!found && scope === 'project') {
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
</file>

<file path="src/adapters/opencode.ts">
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

export const id: AgentId = 'opencode'
export const displayName = 'OpenCode'

export const capabilities: AdapterCapabilities = {
  scopes: ['project', 'global'],
  format: 'jsonc',
  envSyntax: 'brace-env' as const,
  nativeDefault: false,
  nativeDisabled: true,
  cwd: false,
}

export function getConfigPath(
  scope: ConfigScope,
  ctx: RuntimeContext,
): string | null {
  return scope === 'project'
    ? join(ctx.cwd, 'opencode.json')
    : join(ctx.homeDir, '.config', 'opencode', 'opencode.json')
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
</file>

<file path="src/adapters/shared.ts">
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
</file>

<file path="src/adapters/types.ts">
/**
 * Adapter contract for compiling and extracting MCP server configurations
 * to/from each agent's native file.
 *
 * Implements BLUEPRINT §9.1. All adapters are pure with respect to the
 * filesystem: they never print or write files; file I/O stays in the command
 * layer. Warnings and managed names are carried in the result.
 */

import type { RuntimeContext, ConfigScope } from '$/src/core/context'
import type { CanonicalServer } from '$/src/core/schema'

export type AgentId = CanonicalServer extends never
  ? never
  : 'claude-code' | 'cursor' | 'vscode' | 'opencode' | 'windsurf' | 'zed'

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
</file>

<file path="src/adapters/vscode.ts">
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

export const id: AgentId = 'vscode'
export const displayName = 'Visual Studio Code'

export const capabilities: AdapterCapabilities = {
  scopes: ['project', 'global'],
  format: 'jsonc',
  envSyntax: 'env-colon' as const,
  nativeDefault: false,
  nativeDisabled: false,
  cwd: false,
}

export function getConfigPath(
  scope: ConfigScope,
  ctx: RuntimeContext,
): string | null {
  return scope === 'project'
    ? join(ctx.cwd, '.vscode', 'mcp.json')
    : join(ctx.homeDir, '.vscode', 'mcp.json')
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
</file>

<file path="src/adapters/windsurf.ts">
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
</file>

<file path="src/adapters/zed.ts">
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

export const id: AgentId = 'zed'
export const displayName = 'Zed'

export const capabilities: AdapterCapabilities = {
  scopes: ['project', 'global'],
  format: 'jsonc',
  envSyntax: 'posix' as const,
  nativeDefault: false,
  nativeDisabled: false,
  cwd: false,
}

export function getConfigPath(
  scope: ConfigScope,
  ctx: RuntimeContext,
): string | null {
  return scope === 'project'
    ? join(ctx.cwd, '.zed', 'settings.json')
    : join(ctx.homeDir, '.config', 'zed', 'settings.json')
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
</file>

<file path="src/commands/doctor.command.ts">
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
 *   6. Hygiene — `.env` tracked by Git; placeholders without fallback that resolve
 *      nowhere
 *
 * Exit `1` if any error; `0` if only warnings; `--strict` makes warnings fatal.
 */

import { defineCommand } from 'citty'
import { execSync } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { parse } from 'jsonc-parser'
import { createUiAndCtx, configPath, isDryRun } from '$/src/commands/util'
import { resolveTargetsAsync, getAdapter } from '$/src/adapters/index'
import { loadValidatedConfig } from '$/src/core/store'
import { loadState } from '$/src/core/state'
import { parsePlaceholders } from '$/src/core/placeholder'
import { readDotenv, resolveVar } from '$/src/core/env'
import { readTextFile } from '$/src/core/fs-atomic'
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

  // 1. Schema check.
  const validated = loadValidatedConfig(scope, ctx)
  if (validated) {
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

    // 2. Env check — every placeholder in env/headers/args/url; missing required var = error.
    const dotenvVars = readDotenv(scope, ctx).vars
    for (const [name, server] of Object.entries(servers)) {
      for (const field of placeholderFields(server)) {
        const phs = parsePlaceholders(field.value)
        for (const ph of phs) {
          const resolved = resolveVar(ph.name, {
            dotenv: dotenvVars,
            processEnv: ctx.env,
          })
          if (resolved.source === 'unset' && ph.fallback === undefined) {
            results.push({
              code: 'ENV',
              severity: 'error',
              message: `Required env var \`${ph.name}\` is not set (no fallback) for server \`${name}\` field \`${field.name}\``,
              agent: name,
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
      if (isAbsolutePath(cmd)) {
        if (!existsSync(cmd) || !isExecutable(cmd)) {
          results.push({
            code: 'RUNTIME',
            severity: 'error',
            message: `Binary \`${cmd}\` does not exist or is not executable`,
          })
        }
      } else {
        const resolved = which(cmd, ctx.env)
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
        const parsed = parseNativeEntry(existing, name)
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
    }

    // 5. State check — corrupt state; targets pointing at unsupported scopes.
    for (const w of stateResult.warnings) {
      results.push({
        code: 'STATE',
        severity: 'error',
        message: w,
      })
    }
    for (const agentId of targets) {
      const adapter = getAdapter(agentId)
      if (adapter.getConfigPath(scope, ctx) === null) {
        results.push({
          code: 'STATE',
          severity: 'warning',
          message: `Target \`${agentId}\` does not support ${scope} scope`,
          agent: agentId,
        })
      }
    }

    // 6. Hygiene — .env tracked by Git; placeholders without fallback that resolve nowhere.
    const envPath =
      scope === 'project' ? `${ctx.cwd}/.env` : `${ctx.homeDir}/.agents/.env`
    if (isGitTracked(envPath)) {
      results.push({
        code: 'HYGIENE',
        severity: 'warning',
        message: `.env is tracked by Git; run \`git rm --cached .env\` to stop tracking it`,
      })
    }
    for (const [name, server] of Object.entries(servers)) {
      for (const field of placeholderFields(server)) {
        const phs = parsePlaceholders(field.value)
        for (const ph of phs) {
          const resolved = resolveVar(ph.name, {
            dotenv: dotenvVars,
            processEnv: ctx.env,
          })
          if (resolved.source === 'unset' && ph.fallback === undefined) {
            results.push({
              code: 'HYGIENE',
              severity: 'warning',
              message: `Placeholder \`${ph.raw}\` resolves nowhere for server \`${name}\` field \`${field.name}\``,
              agent: name,
              server: name,
              field: field.name,
            })
          }
        }
      }
    }
  } else {
    results.push({
      code: 'SCHEMA',
      severity: 'error',
      message: `No canonical config at ${configPath(scope, ctx)}. Run 'agents-mcp init' first.`,
    })
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
function isAbsolutePath(p: string): boolean {
  return (
    p.startsWith('/') ||
    (process.platform === 'win32' && /^[a-zA-Z]:[\\/]/.test(p))
  )
}

/** Check if a file is executable. */
function isExecutable(p: string): boolean {
  try {
    if (process.platform === 'win32') return true
    const stat = existsSync(p) ? statSync(p) : null
    return Boolean(stat?.isFile() && (stat.mode & 0o111) !== 0)
  } catch {
    return false
  }
}

/** Resolve a command in PATH (respecting PATHEXT on Windows). */
function which(cmd: string, env: NodeJS.ProcessEnv): string | null {
  const pathEnv = env.PATH || env.Path || env.path || ''
  const pathExt =
    process.platform === 'win32'
      ? env.PATHEXT || env.Pathext || env.pathext || '.exe;.cmd;.bat;.ps1'
      : ''
  const exts = pathExt.split(';').filter(Boolean)

  for (const dir of pathEnv
    .split(process.platform === 'win32' ? ';' : ':')
    .filter(Boolean)) {
    const candidates =
      exts.length > 0
        ? exts.map((e) => join(dir, `${cmd}${e}`))
        : [join(dir, cmd)]
    for (const cand of candidates) {
      try {
        if (
          existsSync(cand) &&
          (process.platform === 'win32' || isExecutable(cand))
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

/** Parse a native file entry for a server name (best-effort JSONC). */
function parseNativeEntry(
  content: string,
  name: string,
): Record<string, unknown> | null {
  try {
    const errors: { error: number; offset: number; length: number }[] = []
    const parsed = parse(content, errors) as Record<string, unknown>
    if (errors.length > 0) return null
    for (const [rootKey, rootVal] of Object.entries(parsed)) {
      if (rootVal && typeof rootVal === 'object' && !Array.isArray(rootVal)) {
        const obj = rootVal as Record<string, unknown>
        if (
          obj[name] &&
          typeof obj[name] === 'object' &&
          !Array.isArray(obj[name])
        ) {
          return obj[name] as Record<string, unknown>
        }
      }
    }
    return null
  } catch {
    return null
  }
}

/** Normalize an entry for drift comparison (strip formatting differences). */
function normalizeEntry(entry: unknown): unknown {
  if (entry === null || entry === undefined) return entry
  if (Array.isArray(entry)) return entry.map(normalizeEntry)
  if (typeof entry === 'object') {
    const normalized: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(entry as Record<string, unknown>)) {
      normalized[k] = normalizeEntry(v)
    }
    return normalized
  }
  return entry
}

/** Deep equality check. */
function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalizeEntry(a)) === JSON.stringify(normalizeEntry(b))
}

/** Check if .env is tracked by Git. */
function isGitTracked(filePath: string): boolean {
  try {
    const dir = dirname(filePath)
    const base = basename(filePath)
    execSync(['git', 'ls-files', '--error-unmatch', '--', base].join(' '), {
      cwd: dir,
      stdio: 'ignore',
    })
    return true
  } catch {
    return false
  }
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
  },
  run: async ({ args }) => {
    const { ctx, ui } = createUiAndCtx({ yes: args.strict === true })
    const scope = (args.global ? 'global' : 'project') as ConfigScope
    const dryRun = isDryRun(args)

    const summary = await runDoctor({
      scope,
      ctx,
      flag: args.agents ? String(args.agents).split(',') : undefined,
      dryRun,
      strict: args.strict === true,
    })

    if (summary.errors > 0 || (summary.warnings > 0 && args.strict === true)) {
      process.exit(1)
    }
  },
})
</file>

<file path="src/commands/import.command.ts">
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
import {
  createUiAndCtx,
  configPath,
  persistCanonicalConfig,
  persistSyncState,
  isDryRun,
} from '$/src/commands/util'
import { runSync } from '$/src/commands/sync'
import { resolveTargetsAsync, adapters } from '$/src/adapters/index'
import { DEFAULT_SCHEMA_URL } from '$/src/config'
import { loadValidatedConfig } from '$/src/core/store'
import { loadState, type SyncState } from '$/src/core/state'
import {
  planSecretExtraction,
  appendToDotenv,
  syncEnvExample,
} from '$/src/core/env'
import { readTextFile } from '$/src/core/fs-atomic'
import type { AgentId } from '$/src/adapters/types'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer } from '$/src/core/schema'
import type { ConfigScope, RuntimeContext } from '$/src/core/context'

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
  run: async ({ args }) => {
    const { ctx, ui } = createUiAndCtx({ yes: args.yes === true })
    const scope = (args.global ? 'global' : 'project') as ConfigScope
    const path = configPath(scope, ctx)
    const dryRun = isDryRun(args)
    const noSync = args['no-sync'] === true
    const force = args.force === true
    const extractSecrets = args['extract-secrets'] === true

    const validated = loadValidatedConfig(scope, ctx)
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
    const extracted: Record<string, CanonicalServer> = {}
    // Track which servers were extracted from each agent (for seeding state).
    const extractedByAgent: Record<AgentId, string[]> = {} as Record<
      AgentId,
      string[]
    >
    const scannedAgents: AgentId[] = []

    for (const adapter of adapters) {
      const nativePath = adapter.getConfigPath(scope, ctx)
      if (nativePath === null) continue
      const exists = await adapter.detect(scope, ctx)
      if (!exists) continue
      scannedAgents.push(adapter.id as AgentId)

      const existing = readTextFile(nativePath)
      if (existing === null) continue

      const { servers, warnings } = adapter.extractServers(existing, scope)
      allWarnings.push(...warnings.map((w) => w.message))
      const names: string[] = []
      for (const [name, server] of Object.entries(servers)) {
        names.push(name)
        if (!(name in extracted)) {
          extracted[name] = server
        }
      }
      extractedByAgent[adapter.id as AgentId] = names
    }

    let merged = false
    for (const [name, server] of Object.entries(extracted)) {
      if (name in canonical) {
        if (force) {
          canonical[name] = server
          merged = true
        }
        // existing wins: skip
      } else {
        canonical[name] = server
        merged = true
      }
    }

    // Secret policy: plan extraction and optionally write to .env + .env.example.
    const allWrites: Array<{ key: string; value: string }> = []
    const allKeys: string[] = []
    for (const server of Object.values(canonical)) {
      const { writes, warnings } = planSecretExtraction(server, {
        policy: extractSecrets ? 'extract' : 'warn',
      })
      allWarnings.push(...warnings)
      for (const w of writes) {
        allWrites.push(w)
        allKeys.push(w.key)
      }
    }

    // Replace literal secret values in canonical with ${KEY} placeholders so
    // secrets never reach versioned files (§13).
    for (const server of Object.values(canonical)) {
      if (isStdioServer(server)) {
        if (server.env) {
          for (const [key, value] of Object.entries(server.env)) {
            const write = allWrites.find((w) => w.value === value)
            if (write) {
              server.env[key] = `\${${write.key}}`
            }
          }
        }
      } else {
        if (server.headers) {
          for (const [key, value] of Object.entries(server.headers)) {
            const write = allWrites.find((w) => w.value === value)
            if (write) {
              server.headers[key] = `\${${write.key}}`
            }
          }
        }
        if (server.url) {
          const write = allWrites.find((w) => w.value === server.url)
          if (write) {
            server.url = `\${${write.key}}`
          }
        }
      }
    }

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

    if (!dryRun) {
      persistCanonicalConfig(scope, ctx, {
        $schema: schemaUrl,
        mcpServers: canonical,
      })

      const nextState: SyncState = {
        ...state,
        scope: (args.global ? 'global' : 'project') as ConfigScope,
        targets: state.targets,
        agents: { ...state.agents },
      }
      for (const agentId of scannedAgents) {
        nextState.agents[agentId] = {
          path,
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
        flag: undefined,
        dryRun: false,
        yes: args.yes === true,
      })
    }

    ui.note(
      `Imported ${Object.keys(extracted).length} server(s) from ${scannedAgents.length} agent(s)`,
    )
    for (const w of allWarnings) {
      ui.warn(w)
    }
  },
})
</file>

<file path="src/commands/init.command.ts">
/**
 * `init` command (§11).
 *
 * Scaffold `<scope>/.agents/mcp.json` (`$schema`, `mcpServers: {}`), select agents
 * (multi-select; `--agents` bypasses), persist `targets` in state. Existing
 * file → exit `1` unless `--force` (writes a `.bak.<timestamp>` first). Never
 * touches `.gitignore`. Non-interactive targets come from `--agents` or
 * detection; none → exit `1` with a hint.
 */

import { defineCommand } from 'citty'
import { existsSync } from 'node:fs'
import {
  createUiAndCtx,
  configPath,
  persistSyncState,
  persistCanonicalConfig,
  isDryRun,
} from '$/src/commands/util'
import { resolveTargetsAsync, adapters } from '$/src/adapters/index'
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
  run: async ({ args }) => {
    const { ctx, ui } = createUiAndCtx({ yes: args.yes === true })
    const scope = (args.global ? 'global' : 'project') as ConfigScope
    const path = configPath(scope, ctx)
    const dryRun = isDryRun(args)
    const force = args.force === true
    const flag = args.agents ? String(args.agents).split(',') : undefined

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
    if (flag) {
      targets = await resolveTargetsAsync({ flag, state, ctx })
    } else if (args.yes === true || !ctx.isTTY || ctx.env.CI === 'true') {
      targets = await resolveTargetsAsync({ flag: undefined, state, ctx })
    } else {
      // Interactive: multi-select agents.
      const options = adapters.map((a) => ({
        label: a.displayName,
        value: a.id,
      }))
      const selected = await ui.multiselect<AgentId>({
        message: 'Select target agents',
        options,
        initialValues: [],
      })
      targets = selected
    }

    if (targets.length === 0) {
      ui.error(
        'No resolvable target agents. Pass --agents <list> (e.g. --agents cursor,vscode).',
      )
      process.exit(1)
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

    ui.note(`Initialized ${scope} canonical config at ${path}`)
    ui.note(`Targets: ${targets.join(', ')}`)
  },
})
</file>

<file path="src/commands/list.command.ts">
/**
 * `list` command (§11).
 *
 * Read-only table: name, type, command/URL, per-agent sync status. `--all` includes the global scope and marks shadowed
 * entries (project wins).
 */

import { defineCommand } from 'citty'
import { createUiAndCtx, configPath, isDryRun } from '$/src/commands/util'
import { loadValidatedConfig } from '$/src/core/store'
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
  },
  run: async ({ args }) => {
    const { ctx, ui } = createUiAndCtx({ yes: args.yes === true })
    const includeAll = args.all === true

    const scopes: ConfigScope[] = includeAll
      ? ['project', 'global']
      : ['project']
    // Collect all server names from project scope first (for shadow detection).
    const projectNames = new Set<string>()
    const scopeData: Array<{
      scope: ConfigScope
      servers: Record<string, unknown>
      state: Awaited<ReturnType<typeof loadState>>['state']
    }> = []

    for (const scope of scopes) {
      const validated = loadValidatedConfig(scope, ctx)
      const stateResult = loadState(scope, ctx)
      const state = stateResult.state
      const servers = validated?.config.mcpServers ?? {}
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
        const target =
          type === 'streamable-http'
            ? (server.url ?? '')
            : (server.command ?? '')

        // Sync status: is this server managed by any agent in this scope?
        let synced = false
        for (const agentId of Object.keys(state.agents)) {
          const agent = state.agents[agentId as AgentId]
          if (agent?.names.includes(name)) {
            synced = true
            break
          }
        }

        const shadowed =
          includeAll && scope === 'global' && projectNames.has(name)
            ? ' (shadowed)'
            : ''

        ui.note(
          `${name.padEnd(14)} ${displayType.padEnd(8)} ${target.padEnd(24)} ${
            synced ? 'synced' : 'not-synced'
          }${shadowed}`,
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
</file>

<file path="src/commands/remove.command.ts">
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
} from '$/src/commands/util'
import { runSync } from '$/src/commands/sync'
import { loadValidatedConfig } from '$/src/core/store'

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
  run: async ({ args }) => {
    const { ctx, ui } = createUiAndCtx({ yes: args.yes === true })
    const scope = args.global ? 'global' : 'project'
    const path = configPath(scope, ctx)
    const dryRun = isDryRun(args)
    const noSync = args['no-sync'] === true
    const name = args._?.[0] as string | undefined

    if (!name) {
      ui.error('Usage: agents-mcp remove <name>')
      process.exit(2)
    }

    const validated = loadValidatedConfig(scope, ctx)
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

    delete servers[name]

    if (!dryRun) {
      persistCanonicalConfig(scope, ctx, {
        $schema: validated.config.$schema,
        servers,
      })
    }

    ui.note(`Removed server \`${name}\` from canonical config`)

    if (!noSync && !dryRun) {
      await runSync({
        scope,
        ctx,
        flag: undefined,
        dryRun: false,
        yes: args.yes === true,
      })
    }
  },
})
</file>

<file path="src/commands/sync.command.ts">
/**
 * `sync` command definition for citty (§11).
 *
 * Reuses `runSync` from `./sync` and wires citty args into `SyncOptions`.
 */

import { defineCommand } from 'citty'
import { runSync, type SyncOptions } from './sync'
import { createUiAndCtx } from '$/src/commands/util'

export const syncCommand = defineCommand({
  meta: {
    name: 'sync',
    description:
      'Compile .agents/mcp.json into all targeted agent config files',
  },
  args: {},
  run: async ({ args }) => {
    const { ctx, ui } = createUiAndCtx({ yes: args.yes === true })
    const scope = args.global ? 'global' : 'project'
    const flag = args.agents ? String(args.agents).split(',') : undefined
    const dryRun = args['dry-run'] === true

    await runSync({ scope, ctx, flag, dryRun, yes: args.yes === true })
  },
})
</file>

<file path="src/commands/sync.ts">
/**
 * `sync` command (§11).
 *
 * Validate canonical config → resolve targets → compile per adapter → write
 * native files → update sync state → print summary. Byte-idempotent: a second
 * run produces no byte changes. Exports `runSync` for reuse by `add`/`remove`.
 */

import {
  createUiAndCtx,
  configPath,
  writeFileAtomic,
  persistSyncState,
  loadSyncState,
} from '$/src/commands/util'
import { resolveTargetsAsync, getAdapter } from '$/src/adapters/index'
import type { AgentId } from '$/src/adapters/types'
import type { CanonicalServer } from '$/src/core/schema'
import type { ConfigScope, RuntimeContext } from '$/src/core/context'
import { loadValidatedConfig } from '$/src/core/store'
import { readTextFile } from '$/src/core/fs-atomic'

export interface SyncOptions {
  scope: ConfigScope
  ctx: RuntimeContext
  flag: readonly string[] | undefined
  dryRun: boolean
  yes: boolean
}

export interface SyncSummary {
  scope: ConfigScope
  targets: AgentId[]
  written: string[]
  warnings: string[]
}

export async function runSync(options: SyncOptions): Promise<SyncSummary> {
  const { scope, ctx, flag, dryRun, yes } = options
  const { ui } = createUiAndCtx({ yes })

  // 1. Load + validate canonical config.
  const validated = loadValidatedConfig(scope, ctx)
  if (!validated) {
    ui.note(
      `No canonical config at ${configPath(scope, ctx)}. Nothing to sync.`,
    )
    return { scope, targets: [], written: [], warnings: [] }
  }
  const { config, warnings: configWarnings } = validated

  // 2. Resolve targets: flag → state → detection.
  const stateResult = loadSyncState(scope, ctx)
  const state = stateResult.state
  const targets = await resolveTargetsAsync({ flag, state, ctx })
  if (targets.length === 0) {
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

  // 3. Compile + write per target adapter.
  const written: string[] = []
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
      allWarnings.push({
        code: 'SCOPE_UNSUPPORTED',
        agent: agentId,
        message: `${agentId} does not support ${scope} scope`,
      })
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

  // 4. Update sync state (persist targets + per-agent managed names).
  const nextState = {
    ...state,
    scope,
    targets,
    agents: nextAgents,
  }
  if (!dryRun) {
    persistSyncState(scope, ctx, nextState)
  }

  // 5. Print summary.
  ui.note(`Synced ${targets.length} target(s) across ${written.length} file(s)`)
  for (const w of allWarnings) {
    ui.warn(`[${w.code}] ${w.message}`)
  }

  return {
    scope,
    targets,
    written,
    warnings: allWarnings.map((w) => w.message),
  }
}
</file>

<file path="src/commands/util.ts">
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
} from '$/src/core/store'
import {
  getStatePath,
  loadState,
  writeState,
  type SyncState,
} from '$/src/core/state'
import { resolveTargetsAsync } from '$/src/adapters/index'
import { createUi } from '$/src/index'
import type { ConfigScope, RuntimeContext } from '$/src/core/context'
import type { AgentId, AgentAdapter } from '$/src/adapters/types'
import { getAdapter } from '$/src/adapters/index'
import type { CanonicalServer } from '$/src/core/schema'
import { AGENTS_DIR, CONFIG_FILE, STATE_FILE } from '$/src/config'

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

/** Load the sync state (empty state when absent/corrupt). */
export function loadSyncState(
  scope: ConfigScope,
  ctx: RuntimeContext,
): { state: SyncState; warnings: string[] } {
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

export { AGENTS_DIR, CONFIG_FILE, STATE_FILE, type CanonicalServer }
</file>

<file path="src/core/context.ts">
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
</file>

<file path="src/core/env.ts">
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
import { AGENTS_DIR, ENV_FILE, STATE_FILE } from '$/src/config'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer } from '$/src/core/schema'
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

export interface PlanSecretExtractionResult {
  writes: SecretWrite[]
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
]

export function isSecretValue(value: string): boolean {
  for (const prefix of SECRET_VALUE_PREFIXES) {
    if (value.startsWith(prefix)) {
      return true
    }
  }
  // URL credentials: scheme://user:pass@
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^:@]+:[^@]+@/.test(value)) {
    return true
  }
  return false
}

function isLiteral(value: string): boolean {
  return !/^\$\{[A-Za-z_][A-Za-z0-9_]*(?::-[^}]*)?\}$/.test(value)
}

/**
 * Plan which literal (non-placeholder) secret values in `server` should be
 * extracted to `.env`. Never touches disk.
 *
 * - `policy: 'warn'` → warnings only, no writes (CI / `--yes` default).
 * - `policy: 'extract'` → writes to be appended to `.env`.
 *
 * A value already wrapped in `${...}` is never flagged. Non-secret values such
 * as `NODE_ENV=production` are not flagged.
 */
export function planSecretExtraction(
  server: CanonicalServer,
  opts: { policy: 'warn' | 'extract' },
): PlanSecretExtractionResult {
  const writes: SecretWrite[] = []
  const warnings: string[] = []
  const { policy } = opts

  const consider = (key: string, value: string): void => {
    if (!isLiteral(value)) {
      return
    }
    const secret = SECRET_KEY_RE.test(key) || isSecretValue(value)
    if (!secret) {
      return
    }
    const envVarKey = derivedKey(
      isStdioServer(server) ? server.command : 'http',
      key,
    )
    if (policy === 'extract') {
      writes.push({ key: envVarKey, value })
    }
    warnings.push(
      `Secret detected for server field \`${key}\`; extract to \`.env\` as \${${envVarKey}}`,
    )
  }

  if (isStdioServer(server)) {
    if (server.args) {
      for (const arg of server.args) {
        // Args can embed secrets (e.g. a token passed positionally).
        consider('args', arg)
      }
    }
    if (server.env) {
      for (const [key, value] of Object.entries(server.env)) {
        consider(key, value)
      }
    }
  } else {
    if (server.headers) {
      for (const [key, value] of Object.entries(server.headers)) {
        consider(key, value)
      }
    }
    // For URLs, only flag embedded credentials (user:pass@), not length.
    consider('url', server.url)
  }

  return { writes, warnings }
}

/**
 * Append `writes` to the `.env` at `path`, creating it with mode `0600` when
 * missing. Never overwrites an existing key; warns when a key exists with a
 * different value. Ensures `.env` (and the sync state) are git-ignored first.
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
    ensureIgnored(rootDir, [ENV_FILE, `${AGENTS_DIR}/${STATE_FILE}`])
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
</file>

<file path="src/core/gitignore.ts">
/**
 * Minimal, lazy `.gitignore` management for tool-owned secrets and state.
 *
 * Implements BLUEPRINT §8.6: adds a managed block only for `.env` and the sync
 * state file, lazily (only when something is about to be written), never
 * touching agent configuration files, never duplicating entries.
 */

import { execSync } from 'node:child_process'
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

  const blockLines: string[] = []
  // Only insert a header if we aren't already inside a managed block.
  const alreadyManaged = existingLines.some(
    (l) => l.trim() === MANAGED_BLOCK_HEADER,
  )
  if (!alreadyManaged) {
    blockLines.push('', MANAGED_BLOCK_HEADER)
  }
  blockLines.push(...uncovered)
  if (!alreadyManaged) {
    blockLines.push(MANAGED_BLOCK_FOOTER)
  }

  const next = [...existingLines, ...blockLines].join('\n') + '\n'
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
function isGitTracked(rootDir: string, entry: string): boolean {
  try {
    execSync(['git', 'ls-files', '--error-unmatch', '--', entry].join(' '), {
      cwd: rootDir,
      stdio: 'ignore',
    })
    return true
  } catch {
    return false
  }
}
</file>

<file path="src/core/placeholder.ts">
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
  /(?:^|_)(?:TOKEN|SECRET|PASSWORD|PASSWD|API_KEY|CREDENTIAL|PRIVATE_KEY|AUTH|DSN)(?:_|$)/i

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
  const sanitized = field.replace(/[^A-Za-z0-9_]/g, '_')
  return `${serverName.toUpperCase()}_${sanitized.toUpperCase()}`
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
</file>

<file path="src/core/schema.ts">
import { z } from 'zod'
import { DEFAULT_SCHEMA_URL } from '$/src/config'

export const AgentIdSchema = z.enum([
  'claude-code',
  'cursor',
  'vscode',
  'opencode',
  'windsurf',
  'zed',
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
</file>

<file path="src/sources/direct.ts">
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
</file>

<file path="src/sources/github.ts">
/**
 * GitHub source resolver (§10.3).
 *
 * Resolves `owner/repo[#ref]` → `server.json` → `package.json`, following the
 * MCP server manifest discovery chain. HTTP interactions use `fetch` (mocked in
 * tests) with timeouts, retries, and a 2 MiB response cap.
 */

import type { ResolvedServerPackage } from '$/src/sources/types'
import { resolveDirect } from '$/src/sources/direct'
import type { CanonicalServer } from '$/src/core/schema'

const GITHUB_RAW = 'https://raw.githubusercontent.com'
const GITHUB_API = 'https://api.github.com/repos'
const RESPONSE_CAP = 2 * 1024 * 1024 // 2 MiB
const TIMEOUT_MS = 10_000

export interface GithubSourceOptions {
  ref: string // owner/repo[#ref]
}

export async function resolveGithub(
  ref: string,
): Promise<ResolvedServerPackage> {
  const { owner, repo, ref: gitRef } = parseRef(ref)

  // 1. Try server.json on ref, then main, then master.
  const branches = gitRef ? [gitRef] : ['main', 'master']
  let serverJson: unknown = null
  let resolvedRef = branches[0]
  for (const branch of branches) {
    try {
      serverJson = await fetchJson(
        `${GITHUB_RAW}/${owner}/${repo}/${branch}/server.json`,
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
      const repoInfo = await fetchJson(`${GITHUB_API}/${owner}/${repo}`)
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
    const manifest = parseServerJson(serverJson)
    const definition = manifestToServer(manifest)
    return {
      suggestedName: manifest.name ?? repo,
      definition,
      requiredEnv: (manifest.requiredEnv ?? []).map((e) => ({
        name: e.name,
        isSecret: e.is_secret ?? false,
      })),
      source: { type: 'github', ref },
    }
  }

  // 4. package.json fallback: bin selects <name> for npx -y.
  try {
    const pkg = await fetchJson(
      `${GITHUB_RAW}/${owner}/${repo}/${resolvedRef}/package.json`,
    )
    const bin = (pkg as { bin?: string | Record<string, string> }).bin
    let command: string
    if (typeof bin === 'string') {
      command = `npx -y ${bin}`
    } else if (bin && typeof bin === 'object' && Object.keys(bin).length > 0) {
      const [name] = Object.keys(bin)
      command = `npx -y ${name}`
    } else {
      throw new Error(`Repository ${owner}/${repo} is not an MCP server`)
    }
    const definition: CanonicalServer = {
      type: 'stdio',
      command,
      args: [],
    }
    return {
      suggestedName: repo,
      definition,
      requiredEnv: [],
      source: { type: 'github', ref },
    }
  } catch {
    throw new Error(`Repository ${owner}/${repo} is not an MCP server`)
  }
}

function parseRef(ref: string): {
  owner: string
  repo: string
  ref: string | undefined
} {
  const [ownerRepo, gitRef] = ref.split('#', 2) as [string, string | undefined]
  const parts = (ownerRepo || '').split('/')
  const owner = parts[0]
  const repo = parts[1]
  if (!owner || !repo) {
    throw new Error(`Invalid GitHub ref: ${ref}. Expected owner/repo[#ref].`)
  }
  return { owner, repo, ref: gitRef || undefined }
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`)
    }
    const text = await res.text()
    if (text.length > RESPONSE_CAP) {
      throw new Error(`Response too large (>2 MiB) for ${url}`)
    }
    return JSON.parse(text)
  } finally {
    clearTimeout(timeout)
  }
}

function parseServerJson(raw: unknown): {
  name?: string
  registry_type?: string
  identifier?: string
  requiredEnv?: Array<{ name: string; is_secret?: boolean }>
} {
  const obj = raw as Record<string, unknown>
  return {
    name: (obj.name as string) || undefined,
    registry_type:
      (obj.registry_type as string) ||
      (obj.registryType as string) ||
      undefined,
    identifier: (obj.identifier as string) || (obj.name as string) || undefined,
    requiredEnv: (Array.isArray(obj.environment_variables)
      ? obj.environment_variables
      : []) as Array<{ name: string; is_secret?: boolean }>,
  }
}

function manifestToServer(manifest: {
  registry_type?: string
  identifier?: string
  requiredEnv?: Array<{ name: string; is_secret?: boolean }>
}): CanonicalServer {
  const type = manifest.registry_type ?? 'npm'
  const id = manifest.identifier ?? ''

  switch (type) {
    case 'npm':
      return {
        type: 'stdio',
        command: `npx -y ${id}`,
        args: [],
      }
    case 'pypi':
      return {
        type: 'stdio',
        command: `uvx ${id}`,
        args: [],
      }
    case 'oci':
      return {
        type: 'stdio',
        command: `docker run -i --rm ${id}`,
        args: [],
      }
    default:
      return {
        type: 'stdio',
        command: `npx -y ${id}`,
        args: [],
      }
  }
}
</file>

<file path="src/sources/index.ts">
/**
 * Source resolution order (§10.5).
 *
 * Explicit flags → remote URL → `owner/repo` → registry/npm. The resolver
 * never writes files; `commands/add.ts` owns persistence.
 */

import type { ResolvedServerPackage } from '$/src/sources/types'
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
): Promise<ResolvedServerPackage> {
  // 1. Explicit flags (direct source)
  if (
    options.command ||
    options.http ||
    options.arg?.length ||
    options.env?.length ||
    options.header?.length
  ) {
    return resolveDirect(options)
  }

  // 2. Remote URL
  if (options.source && /^https?:\/\//.test(options.source)) {
    return resolveDirect({ http: options.source, name: options.name })
  }

  // 3. owner/repo
  if (options.source && /^[\w-]+\/[\w.-]+(#.+)?$/.test(options.source)) {
    return resolveGithub(options.source)
  }

  // 4. Registry/npm
  if (options.source) {
    return resolveRegistry(options.source)
  }

  throw new Error(
    'No source specified. Pass --command/--http/--arg/--env/--header or a source argument.',
  )
}
</file>

<file path="src/sources/registry.ts">
/**
 * Registry source resolver (§10.4).
 *
 * Resolves `@scope/name` or bare package names via npm, falling back to the
 * MCP Registry `v0/search`. Under `--yes`, prefers an exact name match, else
 * fails with the candidate list.
 */

import type { ResolvedServerPackage } from '$/src/sources/types'
import { resolveDirect } from '$/src/sources/direct'
import type { CanonicalServer } from '$/src/core/schema'

const NPM_REGISTRY = 'https://registry.npmjs.org'
const MCP_REGISTRY = 'https://registry.modelcontextprotocol.io/v0/servers'
const RESPONSE_CAP = 2 * 1024 * 1024
const TIMEOUT_MS = 10_000

export interface RegistrySourceOptions {
  ref: string
  yes?: boolean
}

export async function resolveRegistry(
  ref: string,
  opts: { yes?: boolean } = {},
): Promise<ResolvedServerPackage> {
  const { yes = false } = opts

  // 1. npm for @scope/name or bare package names.
  try {
    const pkg = await fetchJson(`${NPM_REGISTRY}/${encodeURIComponent(ref)}`)
    const name = (pkg as { name?: string }).name ?? ref
    const version = (pkg as { 'dist-tags'?: { latest?: string } })['dist-tags']
      ?.latest
    const spec = version ? `${name}@${version}` : name
    const definition: CanonicalServer = {
      type: 'stdio',
      command: `npx -y ${spec}`,
      args: [],
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

  // 2. MCP Registry v0/search.
  const results = await searchMcpRegistry(ref)
  if (results.length === 0) {
    throw new Error(`No MCP server found for "${ref}" on npm or MCP Registry.`)
  }
  if (results.length > 1 && !yes) {
    const candidates = results.map((r) => r.name ?? r).join(', ')
    throw new Error(
      `Ambiguous registry match for "${ref}". Candidates: ${candidates}. Pass --yes to select the first.`,
    )
  }
  const selected = results[0]!
  const name = selected.name ?? ref
  const definition: CanonicalServer = {
    type: 'stdio',
    command: `npx -y ${name}`,
    args: [],
  }
  return {
    suggestedName: name,
    definition,
    requiredEnv: [],
    source: { type: 'registry', ref },
  }
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`)
    }
    const text = await res.text()
    if (text.length > RESPONSE_CAP) {
      throw new Error(`Response too large (>2 MiB) for ${url}`)
    }
    return JSON.parse(text)
  } finally {
    clearTimeout(timeout)
  }
}

async function searchMcpRegistry(
  query: string,
): Promise<Array<{ name?: string }>> {
  try {
    const res = await fetchJson(
      `${MCP_REGISTRY}?search=${encodeURIComponent(query)}&limit=10`,
    )
    const arr = (res as { servers?: unknown[] })?.servers ?? []
    return Array.isArray(arr) ? (arr as Array<{ name?: string }>) : []
  } catch {
    return []
  }
}
</file>

<file path="src/sources/types.ts">
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
</file>

<file path="src/ui/auto.ts">
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
</file>

<file path="src/ui/prompts.ts">
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
export function createClackUi(): PromptUi {
  // Dynamic import keeps `@clack/prompts` out of the module graph for the
  // non-interactive path and avoids loading clack in non-TTY contexts. We use
  // `await import()` (ESM) instead of `require()` because `dist/index.js` is an
  // ESM bundle and `require` is not defined in ES module scope.
  async function loadClack() {
    return (await import('@clack/prompts')) as unknown as {
      intro(message: string): void
      outro(message: string): void
      note(message: string, title?: string): void
      warn(message: string): void
      error(message: string): void
      isCancel(value: unknown): boolean
      confirm(opts: {
        message: string
        initialValue?: boolean
      }): Promise<unknown>
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
  }

  async function assertNotCancel<T>(result: T): Promise<T> {
    const clack = await loadClack()
    if (clack.isCancel(result)) {
      process.exit(130)
    }
    return result
  }

  return {
    intro(message: string) {
      void loadClack().then((c) => c.intro(message))
    },
    outro(message: string) {
      void loadClack().then((c) => c.outro(message))
    },
    note(message: string, title?: string) {
      void loadClack().then((c) => c.note(message, title))
    },
    warn(message: string) {
      void loadClack().then((c) => c.warn(message))
    },
    error(message: string) {
      void loadClack().then((c) => c.error(message))
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
      return {
        start() {
          if (started) return
          started = true
          void loadClack().then((c) => {
            spin = c.spinner(message)
            spin.start()
          })
        },
        stop(message?: string) {
          void loadClack().then((c) => {
            if (spin) {
              spin.stop(message)
            }
          })
        },
      }
    },
  }
}
</file>

<file path="src/config.ts">
export const AGENT_PLUGINS_MCP_SCHEMA_URL =
  'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json'
export const AGENT_PLUGINS_MCP_SPEC_URL =
  'https://agent-plugins.org/plugin-authors/mcp-servers'
export const DEFAULT_SCHEMA_URL = AGENT_PLUGINS_MCP_SCHEMA_URL
export const SCHEMA_DRAFT = 'draft-2020-12'

export const AGENTS_DIR = '.agents'
export const CONFIG_FILE = 'mcp.json'
export const STATE_FILE = '.mcp-sync-state.json'
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
] as const
</file>

<file path="tests/adapters/claude-code.test.ts">
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
</file>

<file path="tests/adapters/cursor.test.ts">
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
</file>

<file path="tests/adapters/detect.test.ts">
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
    }
    expect(resolveTargets({ flag: ['cursor'], state, ctx })).toEqual(['cursor'])
  })

  it('resolveTargets falls back to state targets', () => {
    const state = {
      version: 1 as const,
      scope: 'project' as const,
      targets: ['vscode'] as AgentId[],
      agents: {},
    }
    expect(resolveTargets({ flag: undefined, state, ctx })).toEqual(['vscode'])
  })

  it('resolveTargets returns empty when nothing resolvable', () => {
    const state = {
      version: 1 as const,
      scope: 'project' as const,
      targets: [],
      agents: {},
    }
    expect(resolveTargets({ flag: undefined, state, ctx })).toEqual([])
  })

  it('resolveTargetsAsync falls back to detection', async () => {
    const state = {
      version: 1 as const,
      scope: 'project' as const,
      targets: [],
      agents: {},
    }
    const result = await resolveTargetsAsync({
      flag: undefined,
      state,
      ctx,
    })
    expect(Array.isArray(result)).toBe(true)
  })

  it('adapters has all six agents', () => {
    expect(adapters).toHaveLength(6)
    expect(adapters.map((a) => a.id)).toEqual([
      'claude-code',
      'cursor',
      'vscode',
      'opencode',
      'zed',
      'windsurf',
    ])
  })
})
</file>

<file path="tests/adapters/opencode.test.ts">
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
    })
  })

  it('getConfigPath project and global', () => {
    expect(getConfigPath('project', ctx)).toBe('/tmp/proj/opencode.json')
    expect(getConfigPath('global', ctx)).toBe(
      '/tmp/home/.config/opencode/opencode.json',
    )
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
</file>

<file path="tests/adapters/vscode.test.ts">
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
    })
  })

  it('getConfigPath project and global', () => {
    expect(getConfigPath('project', ctx)).toBe('/tmp/proj/.vscode/mcp.json')
    expect(getConfigPath('global', ctx)).toBe('/tmp/home/.vscode/mcp.json')
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
</file>

<file path="tests/adapters/windsurf.test.ts">
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
</file>

<file path="tests/adapters/zed.test.ts">
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
    })
  })

  it('getConfigPath project and global', () => {
    expect(getConfigPath('project', ctx)).toBe('/tmp/proj/.zed/settings.json')
    expect(getConfigPath('global', ctx)).toBe(
      '/tmp/home/.config/zed/settings.json',
    )
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
</file>

<file path="tests/cli/entrypoint.test.ts">
import { describe, expect, it, vi, afterEach, afterAll } from 'vitest'
import { main } from '$/src/index'

describe('CLI entrypoint', () => {
  const exitSpy = vi
    .spyOn(process, 'exit')
    .mockImplementation((() => {}) as NodeJS.Process['exit'])
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

  afterEach(() => {
    exitSpy.mockClear()
    logSpy.mockClear()
  })

  afterAll(() => {
    exitSpy.mockRestore()
    logSpy.mockRestore()
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
})
</file>

<file path="tests/commands/add.test.ts">
import { describe, expect, it, vi, beforeEach, afterAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { addCommand } from '$/src/commands/add.command'
import { createUiAndCtx } from '$/src/commands/util'
import { getConfigPath } from '$/src/core/store'
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
</file>

<file path="tests/commands/basic.test.ts">
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
</file>

<file path="tests/commands/doctor.test.ts">
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

  it('state error: corrupt state', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeFileAtomic(
        join(ctx.cwd, '.agents', 'mcp.json'),
        JSON.stringify({
          $schema: DEFAULT_SCHEMA_URL,
          mcpServers: {},
        }),
      )
      // Write corrupt state
      writeFileAtomic(
        join(ctx.cwd, '.agents', '.mcp-sync-state.json'),
        '{ not valid json',
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
    } finally {
      cleanup()
    }
  })
})
</file>

<file path="tests/commands/integration.test.ts">
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { runSync } from '$/src/commands/sync'
import { persistCanonicalConfig } from '$/src/commands/util'
import { createRuntimeContext } from '$/src/core/context'
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

      // Verify state was updated
      const stateContent = readFileSync(
        `${ctx.cwd}/.agents/.mcp-sync-state.json`,
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

  it('sync with no resolvable targets exits 1', async () => {
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
})
</file>

<file path="tests/core/gitignore.test.ts">
import { describe, expect, it } from 'vitest'
import { readFileSync, writeFileSync } from 'node:fs'
import { ensureIgnored } from '$/src/core/gitignore'
import { createSandbox } from '$/tests/helpers/sandbox'

describe('gitignore.ensureIgnored', () => {
  it('creates .gitignore with the managed block when missing', () => {
    const { dir, cleanup } = createSandbox()
    try {
      const result = ensureIgnored(dir, [
        '.env',
        '.agents/.mcp-sync-state.json',
      ])
      expect(result.added).toEqual(['.env', '.agents/.mcp-sync-state.json'])
      const content = readFileSync(`${dir}/.gitignore`, 'utf8')
      expect(content).toContain('# agents-mcp local (managed)')
      expect(content).toContain('.env')
      expect(content).toContain('.agents/.mcp-sync-state.json')
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
      const result = ensureIgnored(dir, [
        '.env',
        '.agents/.mcp-sync-state.json',
      ])
      // `.env` already covered; only the state file is added.
      expect(result.added).toEqual(['.agents/.mcp-sync-state.json'])
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
        '# agents-mcp local (managed)\n.env\n.agents/.mcp-sync-state.json\n# end agents-mcp local (managed)\n',
        'utf8',
      )
      const result = ensureIgnored(dir, [
        '.env',
        '.agents/.mcp-sync-state.json',
      ])
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
})
</file>

<file path="tests/core/placeholder.test.ts">
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
</file>

<file path="tests/e2e/e2e.test.ts">
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
      expect(fs.existsSync(`${ctx.cwd}/.agents/.mcp-sync-state.json`)).toBe(
        false,
      )
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
})
</file>

<file path="tests/fixtures/github/package-json-no-bin.json">
{
  "name": "not-an-mcp-server",
  "version": "1.0.0"
}
</file>

<file path="tests/fixtures/github/package-json.json">
{
  "name": "@modelcontextprotocol/server-github",
  "version": "0.1.0",
  "bin": {
    "server-github": "dist/index.js"
  }
}
</file>

<file path="tests/fixtures/github/server-json-npm.json">
{
  "name": "server-github",
  "registry_type": "npm",
  "identifier": "@modelcontextprotocol/server-github",
  "environment_variables": [
    { "name": "GITHUB_PERSONAL_ACCESS_TOKEN", "is_secret": true },
    { "name": "GITHUB_APP_ID", "is_secret": false }
  ]
}
</file>

<file path="tests/fixtures/registry/search-results.json">
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
</file>

<file path="tests/helpers/sandboxGuard.ts">
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
</file>

<file path="tests/sources/direct.test.ts">
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
</file>

<file path="tests/sources/github.test.ts">
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { resolveGithub } from '$/src/sources/github'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer } from '$/src/core/schema'

const originalFetch = global.fetch

function mockFetch(response: unknown, status = 200) {
  return vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        ({
          ok: status >= 200 && status < 300,
          status,
          text: async () => JSON.stringify(response),
          json: async () => response,
        }) as Response,
    ),
  )
}

function asStdio(server: CanonicalServer) {
  return server as Extract<CanonicalServer, { type: 'stdio' }>
}

describe('sources github', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', originalFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves owner/repo via server.json on main branch', async () => {
    mockFetch({
      name: 'server-github',
      registry_type: 'npm',
      identifier: '@modelcontextprotocol/server-github',
      environment_variables: [{ name: 'GITHUB_TOKEN', is_secret: true }],
    })

    const result = await resolveGithub('modelcontextprotocol/server-github')

    expect(result.suggestedName).toBe('server-github')
    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('npx -y @modelcontextprotocol/server-github')
    expect(result.requiredEnv).toHaveLength(1)
    expect(result.requiredEnv[0]!.name).toBe('GITHUB_TOKEN')
    expect(result.requiredEnv[0]!.isSecret).toBe(true)
  })

  it('resolves via package.json bin when no server.json', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('server.json')) {
        return {
          ok: false,
          status: 404,
          text: async () => 'Not Found',
        } as Response
      }
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            name: 'test-pkg',
            bin: { 'test-pkg': 'dist/index.js' },
          }),
        json: async () => ({
          name: 'test-pkg',
          bin: { 'test-pkg': 'dist/index.js' },
        }),
      } as Response
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveGithub('owner/test-pkg')

    expect(result.suggestedName).toBe('test-pkg')
    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('npx -y test-pkg')
  })

  it('throws when repo is not an MCP server', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('server.json')) {
        return {
          ok: false,
          status: 404,
          text: async () => 'Not Found',
        } as Response
      }
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ name: 'not-mcp' }),
        json: async () => ({ name: 'not-mcp' }),
      } as Response
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(resolveGithub('owner/not-mcp')).rejects.toThrow(
      'is not an MCP server',
    )
  })
})
</file>

<file path="tests/sources/registry.test.ts">
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { resolveRegistry } from '$/src/sources/registry'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer } from '$/src/core/schema'

const originalFetch = global.fetch

function mockFetch(response: unknown, status = 200) {
  return vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        ({
          ok: status >= 200 && status < 300,
          status,
          text: async () => JSON.stringify(response),
          json: async () => response,
        }) as Response,
    ),
  )
}

function asStdio(server: CanonicalServer) {
  return server as Extract<CanonicalServer, { type: 'stdio' }>
}

describe('sources registry', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', originalFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves @scope/name via npm registry', async () => {
    mockFetch({
      name: '@modelcontextprotocol/server-github',
      'dist-tags': { latest: '0.1.0' },
    })

    const result = await resolveRegistry('@modelcontextprotocol/server-github')

    expect(result.suggestedName).toBe('@modelcontextprotocol/server-github')
    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('npx -y @modelcontextprotocol/server-github@0.1.0')
  })

  it('resolves bare package name via npm registry', async () => {
    mockFetch({ name: 'server-github', 'dist-tags': { latest: '1.0.0' } })

    const result = await resolveRegistry('server-github')

    expect(result.suggestedName).toBe('server-github')
    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('npx -y server-github@1.0.0')
  })

  it('resolves via MCP Registry search when not on npm', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return {
          ok: false,
          status: 404,
          text: async () => 'Not Found',
        } as Response
      }
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({ servers: [{ name: 'server-linear' }] }),
        json: async () => ({ servers: [{ name: 'server-linear' }] }),
      } as Response
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveRegistry('server-linear')

    expect(result.suggestedName).toBe('server-linear')
    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('npx -y server-linear')
  })

  it('fails with ambiguous candidates under --yes=false', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return {
          ok: false,
          status: 404,
          text: async () => 'Not Found',
        } as Response
      }
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            servers: [{ name: 'server-a' }, { name: 'server-b' }],
          }),
        json: async () => ({
          servers: [{ name: 'server-a' }, { name: 'server-b' }],
        }),
      } as Response
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(resolveRegistry('server', { yes: false })).rejects.toThrow(
      'Ambiguous registry match',
    )
  })

  it('selects first candidate under --yes=true', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return {
          ok: false,
          status: 404,
          text: async () => 'Not Found',
        } as Response
      }
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            servers: [{ name: 'server-a' }, { name: 'server-b' }],
          }),
        json: async () => ({
          servers: [{ name: 'server-a' }, { name: 'server-b' }],
        }),
      } as Response
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveRegistry('server', { yes: true })

    expect(result.suggestedName).toBe('server-a')
  })

  it('throws when no results found', async () => {
    const fetchMock = vi.fn(async () => {
      return {
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      } as Response
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(resolveRegistry('nonexistent-package')).rejects.toThrow(
      'No MCP server found',
    )
  })
})
</file>

<file path="tests/ui/auto.test.ts">
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
</file>

<file path="tests/smoke.test.ts">
import { describe, expect, it } from 'vitest'
import pkg from '$/package.json' with { type: 'json' }

describe('smoke test', () => {
  it('resolves root alias and package manifest', () => {
    expect(pkg.name).toBe('agents-mcp')
    expect(pkg.type).toBe('module')
  })
})
</file>

<file path=".prettierignore">
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
repomix-output.md
skills-lock.json
</file>

<file path=".prettierrc">
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "useTabs": false
}
</file>

<file path="LICENSE">
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
</file>

<file path="repomix-output.md">

</file>

<file path="tsconfig.json">
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
</file>

<file path="tsup.config.ts">
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
</file>

<file path="vitest.config.ts">
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
</file>

<file path=".agents/skills/codebase-indexing/SKILL.md">
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
</file>

<file path=".agents/skills/product-owner/SKILL.md">
---
name: product-owner
description: >-
  Product Owner role grounded in Scrum and Kanban practices to discover,
  prioritize, and frame product features, improvements, and bug fixes in
  `workflow/UPSTREAM.md`, and validate final delivery in `workflow/VALIDATION.md`.
  Use this skill whenever asked to act as a Product Owner, manage an upstream
  product backlog, frame business/user requirements before technical
  specification, or validate delivered value in coordination with
  `spec-driven-workflow` and `architect-worker`.
---

# Product Owner Role

Own the **why**, **who**, and **what value** of product changes. Bridge user needs and business goals with engineering execution through `workflow/UPSTREAM.md` and `workflow/VALIDATION.md` (`spec-driven-workflow`), collaborating with the **Architect** and **Worker** (`architect-worker`).

## Agile Foundations (Scrum & Kanban)

Combine Scrum's value-driven product ownership with Kanban's upstream flow discipline:

- **Scrum**:
  - **Value Maximization & Product Goal**: Prioritize work that delivers the highest user and business impact toward the Product Goal.
  - **Product Backlog & Refinement**: Maintain an ordered mini-backlog of evolutions, features, and bug fixes in `workflow/UPSTREAM.md`, refining top items until they are clear and actionable.
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
3. **Collaboration Mode**: When working alongside `architect-worker`, hand off `Ready` items to the **Architect** via `workflow/UPSTREAM.md` and receive completed deliveries back via `workflow/VALIDATION.md`.

## Responsibilities

### 1. Maintain the Upstream Backlog & Frame Demands (`workflow/UPSTREAM.md`)

- Initialize `workflow/UPSTREAM.md` using [UPSTREAM.md](../spec-driven-workflow/resources/UPSTREAM.md) (and ensure `workflow/` is in `.gitignore` per `spec-driven-workflow`).
- Keep an ordered **Upstream Backlog** table for software evolutions, new features, enhancements, and bug reports (`Idea` -> `Refining` -> `Ready` -> `In Downstream` -> `Done`).
- When preparing a demand for engineering, complete the **Active Demand Brief** section:
  - Articulate the **User Problem & Business Value**.
  - Write a clear **User Story / Job-to-be-Done** (or **Bug Impact & Observed Behavior** for bug fixes).
  - Attach any screenshots (including annotated UI bug captures) or supporting evidence in `workflow/assets/` and link them in `workflow/UPSTREAM.md` (e.g., `./assets/<filename>`).
  - Define **Product Acceptance Expectations** (what a user or stakeholder must be able to do or observe).
  - State **Out of Scope** items explicitly to prevent scope creep.
  - Verify the **Definition of Ready (DoR)** checklist before handing off to the Architect.

### 2. Clarify Ambiguities During Downstream Execution

- If the Architect or Worker surfaces a product ambiguity or trade-off (e.g., in `SPEC.md` Open Questions or `REVIEW.md`), decide from a **user value and priority** perspective and update `workflow/UPSTREAM.md` accordingly.

### 3. Validate Completed Deliveries (`workflow/VALIDATION.md`)

- Once the Architect finishes `REVIEW.md` and prepares `workflow/VALIDATION.md`, inspect the **Delivery Summary**, **Upstream Value Mapping**, and **How to Validate** scenarios.
- Verify that the delivered increment satisfies the original product intent and acceptance expectations in `workflow/UPSTREAM.md`.
- Update `workflow/VALIDATION.md` status:
  - **`Approved`**: Complete the sign-off checklist so the Architect/user can close the cycle and clean up `workflow/` (while preserving or updating any remaining `UPSTREAM.md` backlog items if desired).
  - **`Changes Requested`**: Record clear product-level gaps in `workflow/VALIDATION.md` (without prescribing code) so the Architect can plan follow-up adjustments.
- Log any newly discovered opportunities or deferred enhancements back into the `UPSTREAM.md` backlog.

## Guardrails

- **Never prescribe technical implementation**: Do not specify file paths, database schemas, frameworks, class designs, or code changes. Leave *how* to the Architect (`SPEC.md`/`PLAN.md`) and Worker.
- **Never write or modify production code or test suites**.
- **Only create or edit product-governance artifacts**: `workflow/UPSTREAM.md`, `workflow/VALIDATION.md` (validation notes and sign-off), `workflow/assets/` (supporting screenshots or evidence), and `.gitignore` (ensuring `workflow/` is ignored).
- **Never commit `workflow/`**: Ensure `workflow/` remains untracked by Git per `spec-driven-workflow`.

## Handoff Lifecycle

```text
[Product Owner] 0. Discover & Frame  -> Curates backlog & writes Ready brief in workflow/UPSTREAM.md
       │
       ▼
[Architect]     1. Specify & Plan    -> Translates UPSTREAM.md into SPEC.md, PLAN.md (+ TASKS.md)
       │
       ▼
[Worker]        2. Implement & Verify-> Builds & tests against PLAN.md / TASKS.md
       │
       ▼
[Architect]     3. Review & Handoff  -> Approves REVIEW.md, writes workflow/VALIDATION.md
       │
       ▼
[Product Owner] 4. Validate Value    -> Reviews VALIDATION.md against UPSTREAM.md
       │
       ├── If Changes Requested ──────► [Architect] refines SPEC.md/PLAN.md for Worker
       │
       ▼
[PO / Architect]5. Sign-Off & Cleanup-> Marks Approved, confirms with user, resets workflow/
```
</file>

<file path=".agents/skills/spec-driven-workflow/resources/PLAN.md">
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

- [<Short description>](./assets/<filename>) — <Architecture diagram, trace, or supporting evidence stored in `workflow/assets/`>
</file>

<file path=".agents/skills/spec-driven-workflow/resources/REVIEW.md">
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
</file>

<file path=".agents/skills/spec-driven-workflow/resources/SPEC.md">
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

- [<Short description>](./assets/<filename>) — <Supporting screenshot, diagram, or evidence stored in `workflow/assets/`>
</file>

<file path=".agents/skills/spec-driven-workflow/resources/TASKS.md">
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
</file>

<file path=".agents/skills/spec-driven-workflow/resources/UPSTREAM.md">
# Upstream Backlog & Demand: <Project or Initiative>

- **Product Owner**: <author or agent>
- **Product Goal**: <Overarching outcome or product objective>
- **Last Updated**: <YYYY-MM-DD>

## Upstream Backlog

Prioritized list of product evolutions, features, bug reports, and improvements before entering downstream engineering (`SPEC.md`).

| Order | ID | Title | Type | Class of Service | Status | Value / Impact |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | U1 | <Short item title> | Feature \| Bug \| Improvement | Expedite \| Fixed Date \| Standard \| Intangible | Ready \| Refining \| Idea \| In Downstream \| Done | <Why this matters to users/business> |
| 2 | U2 | <Short item title> | Feature \| Bug \| Improvement | Standard | Idea | <Why this matters to users/business> |

---

## Active Demand Brief: <ID - Short Title>

> Complete this section when an item is refined to `Ready` for handoff to the Architect (`SPEC.md`).

- **Backlog ID**: `<U1>`
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
</file>

<file path=".agents/skills/spec-driven-workflow/resources/VALIDATION.md">
# Delivery Validation: <Short Title>

- **Upstream**: [UPSTREAM.md](./UPSTREAM.md)
- **Spec**: [SPEC.md](./SPEC.md)
- **Review**: [REVIEW.md](./REVIEW.md)
- **Prepared By**: <Architect / Lead Engineer>
- **Validated By**: <Product Owner>
- **Status**: Pending Validation | Changes Requested | Approved

## Delivery Summary

Plain-language overview of what was built or fixed, written for product and stakeholder review rather than code-level inspection.

## Upstream Value Mapping

| Upstream ID | Product Expectation | Delivery Status | Notes |
| :--- | :--- | :--- | :--- |
| U1 | <Original expectation from UPSTREAM.md> | Delivered \| Partial \| Deferred | <Summary of how it was met> |

## How to Validate

Observable user flows, commands, UI paths, or scenarios the Product Owner can check to confirm the expected behavior:

1. **<Scenario 1>**: <Steps to observe and expected outcome>
2. **<Scenario 2>**: <Steps to observe and expected outcome>

## Known Limitations & Follow-Ups

- <Any deferred scope, edge cases, or recommended next items for the `UPSTREAM.md` backlog>

## Product Owner Sign-Off

- [ ] Delivered behavior matches the product intent and user value in `UPSTREAM.md`.
- [ ] Product acceptance expectations are satisfied.
- [ ] Ready to close this cycle and reset/archive `workflow/` artifacts (or log follow-ups in `UPSTREAM.md`).

### Validation Notes / Requested Adjustments

- <Feedback from the Product Owner if `Changes Requested`, or sign-off note if `Approved`>

### Supporting Assets (Optional)

- [<Short description>](./assets/<filename>) — <Validation screenshot, recording, or evidence stored in `workflow/assets/`>
</file>

<file path=".github/workflows/ci.yml">
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

      - name: Run core tests
        run: npx vitest run tests/core
</file>

<file path="docs/decisions/README.md">
# Architecture Decision Records

Immutable records of the choices that shape `agents-mcp`. Each ADR states the
context, the decision, the alternatives rejected, and the accepted trade-offs.

| ADR | Title | Status |
| :--- | :--- | :--- |
| [0001](./0001-canonical-transports.md) | Canonical transports are `stdio` and `http` | Superseded by ADR-0010 |
| [0002](./0002-schema-source-and-versioning.md) | Zod 4 is the schema source of truth; publish Draft-07 | Superseded by ADR-0010 |
| [0003](./0003-bundler-tsup.md) | Bundle the CLI with `tsup` (esbuild), no declarations | Accepted |
| [0004](./0004-runtime-context-and-pure-compilers.md) | Injected runtime context and pure native compilers | Accepted |
| [0005](./0005-local-sync-state.md) | Local sync state and persisted agent targets | Accepted |
| [0006](./0006-non-destructive-compilation.md) | Preserve native files in place | Accepted |
| [0007](./0007-env-and-secrets.md) | `.env` precedence and safe secret extraction | Accepted |
| [0008](./0008-packaging-and-runtime-floor.md) | Node 22 floor, single binary, publish from `dist/` only | Accepted |
| [0009](./0009-typescript-7-removes-baseurl.md) | TypeScript 7 removes `baseUrl`; keep TS 7 with tsconfig-relative `paths` | Accepted |
| [0010](./0010-adopt-agent-plugins-mcp-schema.md) | Adotar o padrão Agent Plugins MCP 1.0.0 | Accepted |

## Conventions

- One decision per file, numbered sequentially.
- Never edit an accepted ADR's intent; supersede it with a new record.
- Every ADR is referenced from [`spec/BLUEPRINT.md`](../../spec/BLUEPRINT.md) §19 and,
  when relevant, from the package documentation.
</file>

<file path="src/core/fs-atomic.ts">
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
</file>

<file path="tests/core/schema.test.ts">
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

  it('AgentIdSchema enumerates the six agents', () => {
    expect(AgentIdSchema.options).toEqual([
      'claude-code',
      'cursor',
      'vscode',
      'opencode',
      'windsurf',
      'zed',
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
</file>

<file path="tests/fixtures/schema/invalid-missing-command.json">
{
  "mcpServers": {
    "github": {
      "type": "stdio"
    }
  }
}
</file>

<file path="tests/fixtures/schema/invalid-missing-url.json">
{
  "mcpServers": {
    "github": {
      "type": "streamable-http"
    }
  }
}
</file>

<file path="tests/fixtures/schema/invalid-server-name.json">
{
  "mcpServers": {
    "GitHub": {
      "type": "stdio",
      "command": "npx"
    }
  }
}
</file>

<file path="tests/fixtures/schema/invalid-transport.json">
{
  "mcpServers": {
    "github": {
      "type": "websocket",
      "command": "npx"
    }
  }
}
</file>

<file path="tests/fixtures/schema/invalid-unknown-key.json">
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "unknownKey": "should-be-rejected"
    }
  }
}
</file>

<file path="tests/fixtures/schema/valid.json">
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
</file>

<file path="tests/helpers/sandbox.ts">
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
</file>

<file path="CHANGELOG.md">
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial `agents-mcp` CLI implementation: single-source `.agents/mcp.json` compiler for 6 AI coding agents (Claude Code, Cursor, VS Code, OpenCode, Windsurf, Zed)
- Canonical `.agents/mcp.json` format with Zod 4 schema and Draft-07 JSON Schema generation
- `init` command: scaffold canonical config and select target agents
- `import` command: consolidate existing agent MCP configs into canonical
- `sync` command: compile canonical config into all targeted agent config files (byte-idempotent)
- `remove` command: remove a server and clean from managed agent configs
- `list` command: inspect configured servers, targets, and sync status
- `add` command: install an MCP server from direct flags (--command/--arg/--http/--env/--header/--cwd/--name)
- `doctor` command: audit schema validity, env vars, runtime binaries, semantic drift, state, hygiene
- Non-destructive JSONC AST edits (jsonc-parser) preserving comments, unrelated keys, and manual MCP entries
- Secret hygiene: symbolic `${VAR}` placeholders in versioned files, real values only in `.env` (mode 0600)
- Atomic writes with temp+rename and Windows rename fallback
- Per-agent targeting (`targets`) and disabled server handling

### Changed

- None

### Deprecated

- None

### Removed

- None

### Fixed

- None

### Security

- `.env` and `.mcp-sync-state.json` added to `.gitignore` (lazy, managed block)
- `.env` written with mode `0600`; existing keys never overwritten
- Secret values never reach canonical/native files, logs, errors, or `--dry-run` output
</file>

<file path="spec/MATRIX.md">
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

> **Transport inference:** native entries that expose only a URL, or whose
> native format does not distinguish transports, are imported as `"http"`
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

## 2. Compiled Output (`stdio` and `http`)

| Agent | `stdio` entry | `http` entry |
| :--- | :--- | :--- |
| `claude-code` | `{ "type": "stdio", "command", "args", "env" }` | `{ "type": "http", "url", "headers" }` |
| `cursor` | `{ "command", "args", "env" }` | `{ "url", "headers" }` |
| `vscode` | `{ "type": "stdio", "command", "args", "env" }` | `{ "type": "http", "url", "headers" }` |
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

| Agent | `stdio` inference | `http` inference | Transformations |
| :--- | :--- | :--- | :--- |
| `claude-code` | `type === "stdio"`, or `command` present without `url` | `type === "http"` or `url` present | `${VAR}` unchanged; omitted servers are unrecoverable |
| `cursor` | `command` present | `url` present | `${env:VAR}` → `${VAR}` |
| `vscode` | `type === "stdio"` | `type === "http"` or `url` present | `${env:VAR}` → `${VAR}`; `inputs` ignored; any other transport with `url` → `http` + warning |
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
| `TRANSPORT_INFERRED` | vscode, cursor, windsurf, zed | An entry without a canonical transport (for example, URL-only) was imported as `http`. |
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
      "type": "http",
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
      "type": "http",
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
      "command": ["uvx", "mcp-server-postgres", "{env:DATABASE_URL}"],
      "enabled": false
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
</file>

<file path="src/commands/add.command.ts">
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
} from '$/src/commands/util'
import { runSync } from '$/src/commands/sync'
import { resolveDirect } from '$/src/sources/direct'
import { loadValidatedConfig } from '$/src/core/store'
import { loadState, writeState } from '$/src/core/state'
import { DEFAULT_SCHEMA_URL } from '$/src/config'
import {
  appendToDotenv,
  planSecretExtraction,
  syncEnvExample,
} from '$/src/core/env'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer } from '$/src/core/schema'
import type { ConfigScope, RuntimeContext } from '$/src/core/context'

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
    'no-sync': { type: 'boolean' },
    force: { type: 'boolean', alias: 'f' },
    'extract-secrets': {
      type: 'boolean',
      description: 'Write detected secrets to .env',
    },
  },
  run: async ({ args, rawArgs }) => {
    const { ctx, ui } = createUiAndCtx({ yes: args.yes === true })
    const scope = (args.global ? 'global' : 'project') as ConfigScope
    const path = configPath(scope, ctx)
    const dryRun = isDryRun(args)
    const noSync = args['no-sync'] === true
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

    // Validate that at least one source is provided (--command, --http, --sse,
    // or positional argument). Without a source, there is nothing to add.
    const positionalArgs = (args._ as string[] | undefined) ?? []
    if (
      !options.command &&
      !options.http &&
      !options.sse &&
      options.arg.length === 0 &&
      positionalArgs.length === 0
    ) {
      ui.error(
        'Usage: agents-mcp add <source> --command <cmd> [--arg <token>...] | --http <url>',
      )
      process.exit(2)
    }

    const resolved = resolveDirect(options)
    const name = options.name ?? resolved.suggestedName

    const validated = loadValidatedConfig(scope, ctx)
    let canonical: Record<string, CanonicalServer> = {}
    let schemaUrl = DEFAULT_SCHEMA_URL
    if (validated) {
      schemaUrl = validated.config.$schema ?? DEFAULT_SCHEMA_URL
      canonical = {
        ...(validated.config.mcpServers as Record<string, CanonicalServer>),
      }
    }

    if (name in canonical && !force) {
      const same =
        JSON.stringify(canonical[name]) === JSON.stringify(resolved.definition)
      if (same) {
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

    // Secret extraction plan.
    const { writes, warnings } = planSecretExtraction(resolved.definition, {
      policy: extractSecrets ? 'extract' : 'warn',
    })
    for (const w of warnings) {
      ui.warn(w)
    }

    // Replace literal secret values with ${KEY} placeholders in canonical.
    const definition = { ...resolved.definition }
    for (const w of writes) {
      if (isStdioServer(definition)) {
        if (definition.env) {
          for (const [key, value] of Object.entries(definition.env)) {
            if (value === w.value) {
              definition.env[key] = `\${${w.key}}`
            }
          }
        }
      } else {
        if (definition.headers) {
          for (const [key, value] of Object.entries(definition.headers)) {
            if (value === w.value) {
              definition.headers[key] = `\${${w.key}}`
            }
          }
        }
        if (definition.url === w.value) {
          definition.url = `\${${w.key}}`
        }
      }
    }

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

    if (!dryRun) {
      persistCanonicalConfig(scope, ctx, {
        $schema: schemaUrl,
        mcpServers: canonical,
      })

      const stateResult = loadState(scope, ctx)
      const state = stateResult.state
      const nextState = {
        ...state,
        scope,
        targets: state.targets,
        agents: { ...state.agents },
      }
      writeState(scope, ctx, nextState)
    }

    ui.note(`Added server \`${name}\``)

    if (!noSync && !dryRun) {
      await runSync({
        scope,
        ctx,
        flag: undefined,
        dryRun: false,
        yes: args.yes === true,
      })
    }
  },
})
</file>

<file path="src/core/state.ts">
import { z } from 'zod'
import { AgentIdSchema } from '$/src/core/schema'
import { AGENTS_DIR, STATE_FILE, STATE_VERSION } from '$/src/config'
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
}

export interface LoadStateResult {
  state: SyncState
  warnings: string[]
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
  }
}

export function getStatePath(scope: ConfigScope, ctx: RuntimeContext): string {
  const base = scope === 'project' ? ctx.cwd : ctx.homeDir
  return `${base}/${AGENTS_DIR}/${STATE_FILE}`
}

/**
 * Load the sync state. Missing file → empty state, no warning.
 * Corrupt / unknown-version file → warn, treat as empty.
 */
export function loadState(
  scope: ConfigScope,
  ctx: RuntimeContext,
): LoadStateResult {
  const path = getStatePath(scope, ctx)
  const raw = readTextFile(path)
  if (raw === null) {
    return { state: emptyState(scope), warnings: [] }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {
      state: emptyState(scope),
      warnings: [`Corrupt sync state at ${path}; treating as empty`],
    }
  }

  const result = SyncStateSchema.safeParse(parsed)
  if (!result.success) {
    return {
      state: emptyState(scope),
      warnings: [`Invalid sync state at ${path}; treating as empty`],
    }
  }

  return { state: result.data, warnings: [] }
}

/**
 * Write the sync state atomically. No root-level `updatedAt` is emitted — the
 * per-agent `updatedAt` is updated only when that agent's `names`/`path`
 * actually changes, so identical states produce byte-identical files.
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
</file>

<file path="src/core/store.ts">
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
  writeFileAtomic(path, serialized)
}

function serializeMinimal(config: Record<string, unknown>): string {
  const mcpServers = config['mcpServers']
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
</file>

<file path="src/index.ts">
/**
 * CLI entrypoint (§11).
 *
 * Creates the `RuntimeContext` once, selects the `PromptUi` (Clack on TTY,
 * Auto on `--yes`/`CI`), and runs the `citty` app with global flags and the
 * subcommands registered below. T8/T9 add subcommands (init, import, sync,
 * remove, list, add, doctor) additively to the `subCommands` record.
 */

import { defineCommand, runCommand, showUsage } from 'citty'
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

/**
 * CLI entry point. Runs the citty app with `process.argv`.
 * Only executes when this module is run directly (not when imported by tests).
 */
export async function main(): Promise<void> {
  const rawArgs = process.argv.slice(2)

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
if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  void main()
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
</file>

<file path="tests/core/fs-atomic.test.ts">
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
</file>

<file path="tests/core/state.test.ts">
import { describe, expect, it } from 'vitest'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import {
  loadState,
  writeState,
  seedAgentNames,
  pruneAgentNames,
  emptyState,
  type SyncState,
} from '$/src/core/state'
import { createSandbox } from '$/tests/helpers/sandbox'

describe('state', () => {
  it('loadState returns empty state for missing file, no warning', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings).toEqual([])
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
      }
      writeState('project', ctx, state)
      const first = readFileSync(
        `${ctx.cwd}/.agents/.mcp-sync-state.json`,
        'utf8',
      )
      writeState('project', ctx, state)
      const second = readFileSync(
        `${ctx.cwd}/.agents/.mcp-sync-state.json`,
        'utf8',
      )
      expect(second).toBe(first)
    } finally {
      cleanup()
    }
  })

  it('loadState treats corrupt file as empty with warning', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.agents/.mcp-sync-state.json`
    try {
      mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      writeFileSync(path, '{ not valid json', 'utf8')

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('Corrupt')
    } finally {
      cleanup()
    }
  })

  it('loadState treats unknown version as empty with warning', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.agents/.mcp-sync-state.json`
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
    const path = `${ctx.cwd}/.agents/.mcp-sync-state.json`
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
    const path = `${ctx.cwd}/.agents/.mcp-sync-state.json`
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
    const path = `${ctx.cwd}/.agents/.mcp-sync-state.json`
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
})
</file>

<file path="tests/core/store.test.ts">
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
</file>

<file path=".agents/skills/architect-worker/SKILL.md">
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

- **Product Owner** *(optional, via `product-owner`)* — Owns product intent, priority, and value validation through `workflow/UPSTREAM.md` and `workflow/VALIDATION.md`.
- **Architect** — Owns specifications, high-level architecture, execution planning, task sharding, code review, quality control, and delivery handoff (`workflow/VALIDATION.md`).
- **Worker** — Owns code implementation, testing, and remediation, strictly following the Architect's specifications and all project documentation and skills.

## Role Activation

1. **Explicit Role Assignment**: Adopt the role specified by the user (e.g., *"Act as the Architect"* or *"Act as the Worker"*, including equivalent role names in the user's language).
2. **Role Persistence**: Maintain the assigned role for the entire session unless the user explicitly instructs a role switch.
3. **Missing Role Clarification**: If this skill is invoked without a clear role assignment, ask the user whether to proceed as **Architect** or **Worker** before taking action.

---

## Role 1: The Architect

The Architect governs **what** is built, **how** it is structured, and **whether** the result meets quality standards.

### Responsibilities

1. **Specification (`workflow/SPEC.md`)**
   - Read `workflow/UPSTREAM.md` (when present) to ground technical requirements in the Product Owner's problem statement, priority, and acceptance expectations.
   - Clarify requirements, scope, goals, non-goals, constraints, and testable acceptance criteria with the user (or Product Owner).
2. **Architecture & High-Level Decisions**
   - Define system boundaries, module contracts, data models, and cross-cutting trade-offs.
   - Record significant architectural choices as ADRs using `decision-records` (`docs/decisions/`).
3. **Planning & Task Breakdown (`workflow/PLAN.md` & `workflow/TASKS.md`)**
   - Apply `planning-and-task-breakdown` to map affected files, ordered execution steps, verification strategies, and dependencies.
   - Shard large or parallelizable plans into `workflow/TASKS.md` with disjoint scopes so one or more Worker agents can execute safely.
4. **Code Review & Quality Control (`workflow/REVIEW.md`)**
   - Apply `code-review` to inspect the Worker's implementation against `workflow/SPEC.md`, `workflow/PLAN.md`, and engineering standards.
   - Run verification checks (`test`, `lint`, `typecheck`, `build`) to validate quality firsthand.
   - Log actionable findings (`blocker`, `major`, `minor`, `question`) in `workflow/REVIEW.md` and set the review status (`Changes Requested` or `Approved`).
   - Once `REVIEW.md` is `Approved`, if `workflow/UPSTREAM.md` was used (or a Product Owner is in the loop), author `workflow/VALIDATION.md` to hand the delivery back to the Product Owner for value validation; otherwise proceed directly to final user sign-off and `workflow/` cleanup according to `spec-driven-workflow`.

### Architect Guardrails

- **Never write or modify production/application code or test suites.** Leave all implementation edits to the Worker.
- **Only create or edit governance artifacts**: `workflow/SPEC.md`, `workflow/PLAN.md`, `workflow/TASKS.md`, `workflow/REVIEW.md`, `workflow/VALIDATION.md`, `workflow/assets/` (supporting diagrams, screenshots, or evidence), `.gitignore` (ensuring `workflow/` is ignored), and architecture documentation (such as `docs/decisions/`).
- **Be thorough and produce Worker-ready artifacts**: Never hand off vague specifications, plans, or review comments. Every requirement in `SPEC.md`, step in `PLAN.md`, task in `TASKS.md`, and finding in `REVIEW.md` must specify explicit contracts, edge cases, constraints, file boundaries, and objective done criteria so the Worker never has to infer intent.

---

## Role 2: The Worker

The Worker turns the Architect's specifications and plans into clean, well-tested, production-ready code.

### Responsibilities

1. **Load Context Before Coding**
   - Read `workflow/SPEC.md`, `workflow/PLAN.md`, `workflow/TASKS.md` (if present), and `workflow/REVIEW.md` (if addressing review feedback), along with any linked evidence in `workflow/assets/`.
   - Inspect relevant project documentation, ADRs (`docs/decisions/`), codebase conventions, and active project skills.
   - If assigned a specific task ID (e.g., `T2` in `workflow/TASKS.md`), scope work strictly to that task and check that its dependencies are `done`.
2. **Execute & Verify Incrementally**
   - Follow `incremental-implementation` to build in small, verifiable slices.
   - Follow `verification-and-testing` and `code-simplification` to ensure every slice is tested, readable, and aligned with project conventions.
   - When fixing bugs or failing checks, follow `systematic-debugging` to identify root causes before applying fixes.
3. **Address Review Feedback**
   - When `workflow/REVIEW.md` has open items (`blocker`, `major`, `minor`, or `question`), resolve each item in code/tests strictly as directed and update its status in `workflow/REVIEW.md` (or provide answers to questions). If any review item is unclear or conflicts with the spec or codebase, ask the Architect for clarification before implementing.
4. **Track Progress**
   - Keep step and task statuses (`in_progress`, `blocked`, `done`) updated in `workflow/PLAN.md` and `workflow/TASKS.md`.

### Worker Guardrails

- **No unrequested work or scope drift**: Keep local, low-level implementation decisions (e.g., internal helpers, naming, test structure) within the assigned boundaries, **but never** make unrequested refactors, "improvements", or changes outside what is explicitly specified in `workflow/SPEC.md`, `workflow/PLAN.md`, `workflow/TASKS.md`, and `workflow/REVIEW.md`. Do not alter requirements in `SPEC.md` or redesign the architecture in `PLAN.md`.
- **Ask when anything is unclear — never guess**: If `SPEC.md`, `PLAN.md`, `TASKS.md`, or `REVIEW.md` is missing, contradictory, under-specified, or infeasible due to an unforeseen technical constraint, **stop on the affected scope**, mark the task/step as `blocked` (recording the exact question or constraint), and ask the Architect (or user) for the missing details rather than assuming or improvising.
- **Follow review directives strictly**: Address every open item in `workflow/REVIEW.md` as directed; do not silently ignore, override, or diverge from a review directive without explicit Architect approval.
- **Respect scope boundaries**: When working on a specific task in `workflow/TASKS.md`, do not modify files owned by other parallel tasks or unrelated areas of the codebase.
- **Never commit `workflow/`**: Ensure `workflow/` remains untracked by Git per `spec-driven-workflow`.

---

## Handoff Lifecycle

The Architect and Worker (and optionally the Product Owner via `product-owner`) coordinate asynchronously or sequentially through `workflow/`:

```text
[Product Owner] 0. Discover & Frame  -> (Optional) Writes workflow/UPSTREAM.md
       │
       ▼
[Architect]     1. Specify & Plan    -> Reads UPSTREAM.md (if any), writes SPEC.md, PLAN.md (+ TASKS.md)
       │
       ▼
[Worker]        2. Implement & Verify-> Executes PLAN.md / TASKS.md, runs tests, marks done
       │
       ▼
[Architect]     3. Review & Gate     -> Inspects diff, runs checks, writes workflow/REVIEW.md
       │
       ├── If Changes Requested ──────► [Worker] resolves open items in REVIEW.md
       │
       ▼
[Architect]     4. Delivery Handoff  -> (If PO in loop) Writes workflow/VALIDATION.md for PO
       │
       ├── If PO Requests Changes ────► [Architect] refines SPEC.md/PLAN.md for Worker
       │
       ▼
[PO / Architect]5. Sign-Off & Cleanup-> Confirms with user/PO and resets workflow/ files
```
</file>

<file path=".agents/skills/spec-driven-workflow/SKILL.md">
---
name: spec-driven-workflow
description: >-
  Default software engineering workflow using a `workflow/` directory with
  optional `UPSTREAM.md` and `VALIDATION.md` alongside `SPEC.md`, `PLAN.md`,
  `TASKS.md`, and `REVIEW.md`. Use this skill as the standard process whenever
  starting a feature, bug fix, refactoring, architecture change, or code
  review—to capture product intent, specify requirements, plan execution,
  coordinate parallel tasks, track review findings, and validate delivery.
---

# Spec-Driven Workflow

Adopt this workflow as the **standard software engineering process** for any non-trivial change. Do not jump straight into writing code; follow the gated lifecycle below using the `workflow/` directory to separate **why/value** (`UPSTREAM.md`), **what** needs to change (`SPEC.md`), **how** it will be built (`PLAN.md`), **who** executes independent pieces (`TASKS.md`), **what** needs attention after implementation (`REVIEW.md`), and **whether** the delivered value meets product expectations (`VALIDATION.md`).

## Standard Operating Flow

Follow these phases in order:

0. **Discover & Frame (`UPSTREAM.md`, conditional)** — Capture product intent, user value, priority, or a prioritized mini-backlog of evolutions/bugs (typically owned by the `product-owner` role) before technical specification.
1. **Specify (`SPEC.md`)** — Define the problem, scope, constraints, and acceptance criteria (consuming `UPSTREAM.md` when present) before designing or coding.
2. **Plan (`PLAN.md`)** — Map the technical approach, affected files, ordered steps, and verification strategy.
3. **Shard (`TASKS.md`, conditional)** — Break the plan into trackable tasks only when complexity, multi-scope work, or parallel execution warrants it.
4. **Implement** — Execute against `PLAN.md` (or `TASKS.md`), keeping artifact statuses current as work progresses.
5. **Review (`REVIEW.md`)** — Record code review findings (human or agent) and resolve blockers/major issues before completion.
6. **Validate (`VALIDATION.md`, conditional)** — Hand the approved delivery back to the Product Owner (or stakeholder) with plain-language summary and validation scenarios to confirm product value before cleanup.

> **Trivial changes exception**: Skip `workflow/` artifacts only for trivial, self-contained edits (e.g., typo fixes, single-line formatting, or minor comment updates) where specification and planning add no value.

## Directory Layout

By default, create artifacts at the repository root under `workflow/`:

```text
workflow/
├── assets/       # Optional: Screenshots, diagrams, logs, and supporting evidence linked by workflow docs
├── UPSTREAM.md   # Optional: Product Owner backlog, product intent, and Ready brief
├── SPEC.md       # Required for any non-trivial change
├── PLAN.md       # Required before implementation starts
├── TASKS.md      # Optional: only for large plans or parallel/async agent work
├── REVIEW.md     # Created during human or agent code review
└── VALIDATION.md # Optional: Architect-to-PO delivery handoff and value sign-off
```

If multiple independent initiatives run concurrently in the same repository, scope each one under `workflow/<change-slug>/` (including its own `workflow/<change-slug>/assets/` if needed) instead of overwriting root files.

If the `workflow/` directory or any required artifact does not exist yet, **create the directory and initialize the missing files automatically** using the templates in `./resources/`.

### Supporting Assets & Evidence (`workflow/assets/`)

Any agent or contributor in **any phase** (`UPSTREAM.md`, `SPEC.md`, `PLAN.md`, `TASKS.md`, `REVIEW.md`, or `VALIDATION.md`) may attach screenshots (e.g., annotated UI bug captures), diagrams, logs, or other supporting files to enrich context for downstream or peer agents:

- **Storage location**: Always save supporting files inside `workflow/assets/` (or `workflow/<change-slug>/assets/` for scoped concurrent work). Never scatter temporary evidence files in the repository root, source directories, or tracked `docs/` folders.
- **Naming**: Use clear, descriptive filenames (preferably kebab-case, prefixed with the related item/finding ID when applicable, such as `u1-checkout-bug-annotated.png` or `r2-mobile-overflow.png`).
- **Linking**: Reference attached files from any `workflow/*.md` document using relative Markdown links or image embeds (e.g., `![Annotated checkout bug](./assets/u1-checkout-bug-annotated.png)` or `[Failure log](./assets/test-failure.log)`).

### Version Control (`.gitignore`)

The `workflow/` directory—including `workflow/assets/` and all subdirectories—contains local process-management and guidance artifacts and **must never be tracked by Git**:

- Ensure `workflow/` is listed in the repository's `.gitignore` (add it automatically when initializing `workflow/` if missing).
- Never stage (`git add`) or commit `workflow/` or any files inside it. If `workflow/` is somehow already tracked, warn the user before untrack/cleanup operations.

## Artifact Lifecycle

### 0. `workflow/UPSTREAM.md` — Capture Product Intent & Backlog (Conditional)

Create or update `UPSTREAM.md` when a Product Owner (or stakeholder) wants to frame a new feature, improvement, or bug fix—or maintain a prioritized mini-backlog of software evolutions—before engineering specification begins.

- **Purpose**: Separate product discovery, priority, and user value (*why* and *who*) from technical design (`SPEC.md`).
- **Template**: Start from [UPSTREAM.md](./resources/UPSTREAM.md).
- **Rules**:
  - Maintain an ordered **Upstream Backlog** table for candidate evolutions, features, and bug reports (`Idea`, `Refining`, `Ready`, `In Downstream`, `Done`).
  - Complete the **Active Demand Brief** and **Definition of Ready (DoR)** before handing an item off to `SPEC.md`.
  - Keep `UPSTREAM.md` free of technical implementation details (file paths, schemas, or code).

### 1. `workflow/SPEC.md` — Define the Change

Create `SPEC.md` first for any new feature, bug fix, or architectural change.

- **Purpose**: Align on scope, behavior, constraints, and acceptance criteria before writing code.
- **Template**: Start from [SPEC.md](./resources/SPEC.md).
- **Rules**:
  - State both **Goals** and **Non-Goals** to prevent scope creep.
  - Write testable **Acceptance Criteria** so completion is objective.
  - For bug fixes, document reproduction steps, expected vs. actual behavior, and root cause (once known).

### 2. `workflow/PLAN.md` — Map Execution Steps

Create `PLAN.md` once `SPEC.md` is clear.

- **Purpose**: Translate the specification into concrete, ordered engineering steps.
- **Template**: Start from [PLAN.md](./resources/PLAN.md).
- **Rules**:
  - Reference `SPEC.md` requirements; do not duplicate the full spec.
  - List affected files/modules, ordered implementation steps, and a concrete verification strategy (tests, linters, manual checks).
  - Highlight risks, migrations, or rollback considerations if applicable.

### 3. `workflow/TASKS.md` — Shard Large or Parallel Work (Conditional)

Create `TASKS.md` **only** when at least one of these conditions holds:

1. The `PLAN.md` is too large or comprehensive to execute cleanly in a single pass.
2. The `PLAN.md` spans two or more distinct project scopes (e.g., frontend, backend, infra, or multiple packages), task types (`feature`, `bugfix`, `refactor`, `docs`), or independent deliverables that benefit from separate tracking.
3. Work can be split into independent units executed **in parallel or asynchronously** by different agents or contributors.

- **Template**: Start from [TASKS.md](./resources/TASKS.md).
- **Rules**:
  - Skip `TASKS.md` for small, linear changes where `PLAN.md` is sufficient.
  - Every task must specify an ID, status (`pending`, `in_progress`, `blocked`, `done`), dependencies, owned files/scope (to avoid merge conflicts between parallel agents), and clear done criteria.
  - Keep task statuses updated as work progresses.

### 4. `workflow/REVIEW.md` — Record Code Review Findings

Create or update `REVIEW.md` when a human or reviewing agent inspects the implemented changes.

- **Purpose**: Centralize actionable review observations that require attention before merging.
- **Template**: Start from [REVIEW.md](./resources/REVIEW.md).
- **Rules**:
  - Categorize every observation by severity (`blocker`, `major`, `minor`, `question`).
  - Point to exact file paths, line ranges, or symbols, and explain *why* the issue matters.
  - Track resolution status (`open`, `resolved`, `wontfix`) so nothing is lost across review rounds.

### 5. `workflow/VALIDATION.md` — Product Delivery Validation (Conditional)

Create `VALIDATION.md` after `REVIEW.md` is approved whenever `UPSTREAM.md` was used or a Product Owner / stakeholder needs a structured handoff to validate the delivered value.

- **Purpose**: Translate the completed engineering delivery back into plain-language product outcomes, validation steps, and formal acceptance sign-off.
- **Template**: Start from [VALIDATION.md](./resources/VALIDATION.md).
- **Rules**:
  - Prepared by the Architect (or lead engineer) with a **Delivery Summary**, **Upstream Value Mapping**, and observable **How to Validate** scenarios.
  - Reviewed and signed off by the Product Owner (`Approved` or `Changes Requested`) before closing the cycle.

## Verification & Cleanup

Before considering the workflow complete:

1. Every acceptance criterion in `workflow/SPEC.md` is satisfied and verified by tests or explicit checks.
2. All steps in `workflow/PLAN.md` (and `workflow/TASKS.md`, if used) are completed or explicitly deferred.
3. All `blocker` and `major` items in `workflow/REVIEW.md` are marked `resolved` (or `wontfix` with rationale).
4. If `workflow/VALIDATION.md` is used, the Product Owner has marked it `Approved` (and updated any `UPSTREAM.md` backlog item status to `Done`).
5. **Ask the user for final sign-off and cleanup**: Once the plan, tasks (if any), review, and validation (if used) are complete, explicitly ask the user if everything is ready and whether the `workflow/` artifacts can be cleaned up.
   - **Never delete** the root `workflow/` directory or its root files (`UPSTREAM.md`, `SPEC.md`, `PLAN.md`, `TASKS.md`, `REVIEW.md`, `VALIDATION.md`).
   - When the user confirms cleanup, **clear/reset the contents** of the root files (e.g., emptying them or resetting them to their blank templates) while keeping the directory and files intact, and remove completed-change files inside `workflow/assets/` (preserving any assets still referenced by ongoing `UPSTREAM.md` backlog items). If `UPSTREAM.md` holds ongoing backlog items the user wants to keep, preserve the backlog table and clear only the completed demand brief.
   - **Exception**: Subdirectories created inside `workflow/` by agents working in parallel on independent executions (e.g., `workflow/<change-slug>/`) **may be deleted** upon user confirmation.
</file>

<file path="spec/SPEC.md">
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

### Delimitação de valor

A CLI `agents-mcp` gerencia e sincroniza MCPs de forma padronizada dentro do contexto de um projeto (e no escopo global do usuário). O padrão Agent Plugins MCP 1.0.0 continua sendo a referência normativa para a configuração de servidores MCP em plugins individuais. A proposta não cria nem propõe uma variante concorrente do schema Agent Plugins, e não transforma o projeto em um gerenciador geral de plugins além do gerenciamento de MCPs por projeto.

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

1. **Sync state:** Implementations MAY keep a local state file at `.agents/.mcp-sync-state.json` (project scope) and `~/.agents/.mcp-sync-state.json` (global scope). Its format is implementation-defined. It MUST be listed in `.gitignore` and MUST NOT be required by conformant readers of `.agents/mcp.json`.
2. **Secrets:** Real values live only in `.env` (project scope) or `~/.agents/.env` (global scope), never in `.agents/mcp.json`. `.env.example` contains key names only.
3. **Agent files:** Native agent configuration files belong to the user. Compilers MUST NOT add them to `.gitignore`, and MUST NOT delete or move them.
4. **Gitignore changes:** The only entries a compiler may add to `.gitignore` are `.env` and the sync-state file, and only when it is about to write those files.

## 10. Compiler Safety Guarantees

A conformant compiler:

- Writes canonical and native files atomically (temporary file in the same directory, then rename).
- Preserves unrelated keys, arrays (e.g. VS Code `inputs`), comments, and formatting of JSONC targets by performing AST-level edits.
- Removes only entries that it previously managed, never hands-off entries.
- Aborts instead of overwriting a file it cannot parse, and keeps a `.bak` copy before destructive recovery operations.
- Produces byte-identical output when run twice against unchanged input (idempotence).

## 11. Versioning & Evolution

The `$schema` URI is the single version identifier. It MUST resolve to `https://agent-plugins.org/schemas/1.0.0/mcp.schema.json` (the major.minor.patch segment follows the Agent Plugins version without a `v` prefix), and the published schema document MUST set its `$id` to that same URI. Implementations SHOULD accept any structurally valid file and SHOULD warn — not fail — when `$schema` points to a different version than the one they implement. There is no `version` property inside the file.
</file>

<file path="tests/packaging/packaging.test.ts">
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
</file>

<file path=".gitignore">
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

# agents-mcp local sync state (when running the CLI on this repository)
.agents/.mcp-sync-state.json

# Package artifacts
*.tgz

# Local workflow artifacts (never published or tracked)
workflow/
</file>

<file path="package.json">
{
  "name": "agents-mcp",
  "version": "0.1.0",
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
  "homepage": "https://github.com/agents-mcp/cli#readme",
  "bugs": {
    "url": "https://github.com/agents-mcp/cli/issues"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/agents-mcp/cli.git"
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
    "prepublishOnly": "node -e \"console.error('❌ Error: Do not publish from the root! Use: npm run dist'); process.exit(1)\"",
    "dist:build": "npm run verify",
    "dist:package": "tsx scripts/dist-package.ts",
    "dist:publish": "npm publish ./dist",
    "dist": "run-s dist:*"
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
</file>

<file path="README.md">
# agents-mcp

**One `.agents/mcp.json` to rule them all.**

A tool-agnostic specification and CLI compiler for managing Model Context Protocol (MCP) servers across Claude Code, Cursor, VS Code, OpenCode, Windsurf, and Zed.

[![npm version](https://img.shields.io/npm/v/agents-mcp.svg)](https://www.npmjs.com/package/agents-mcp)
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
		              npx agents-mcp sync
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
npx agents-mcp import
```

This scans your workspace for existing agent configs (`.mcp.json`, `.cursor/mcp.json`, `.vscode/mcp.json`, `opencode.json`, `.zed/settings.json`), deduplicates servers, extracts hardcoded secrets into `.env` + `.env.example`, generates `.agents/mcp.json`, and keeps your active agents synced. Your existing agent files are updated in place, never deleted.

### Starting from scratch?

1. Initialize `.agents/mcp.json` and select your agents:
   `npx agents-mcp init`
2. Add an MCP server from GitHub, npm, MCP Registry, or direct flags
   `npx agents-mcp add modelcontextprotocol/server-github`
3. Sync changes across all targeted agents
   `npx agents-mcp sync`

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
- **Deterministic Schema:** A single Zod source generates the published Draft 2020-12 JSON Schema, so types, runtime validation, and editor autocomplete never drift.
- **Project & Global Scopes:** Works seamlessly at the repository level (`.agents/mcp.json`) or user level (`~/.agents/mcp.json` via `-g`).

## Supported Agents

| Agent           | Project Config       | Global Config                         | Env Syntax Translated |
| :-------------- | :------------------- | :------------------------------------ | :-------------------- |
| **Claude Code** | `.mcp.json`          | `~/.claude.json`                      | `${VAR}`              |
| **Cursor**      | `.cursor/mcp.json`   | `~/.cursor/mcp.json`                  | `${env:VAR}`          |
| **VS Code**     | `.vscode/mcp.json`   | User Profile `mcp.json`               | `${env:VAR}`          |
| **OpenCode**    | `opencode.json`      | `~/.config/opencode/opencode.json`    | `{env:VAR}`           |
| **Windsurf**    | _(Global only)_      | `~/.codeium/windsurf/mcp_config.json` | `${env:VAR}`          |
| **Zed**         | `.zed/settings.json` | `~/.config/zed/settings.json`         | `${VAR}`              |

See the full field-by-field translation rules in [`spec/MATRIX.md`](./spec/MATRIX.md).

Remote servers use **Streamable HTTP** (`type: "streamable-http"`) or the legacy **SSE** (`type: "sse"`).

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

### Delimitação de valor

A CLI `agents-mcp` gerencia e sincroniza MCPs de forma padronizada dentro do contexto de um projeto (e no escopo global do usuário). O padrão Agent Plugins MCP 1.0.0 continua sendo a referência normativa para a configuração de servidores MCP em plugins individuais. A proposta não cria nem propõe uma variante concorrente do schema Agent Plugins, e não transforma o projeto em um gerenciador geral de plugins além do gerenciamento de MCPs por projeto.

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
</file>

<file path="skills-lock.json">
{
  "version": 2,
  "skills": {
    "architect-worker": {
      "source": "alexbruno/dev-skills",
      "sourceType": "github",
      "skillPath": "skills/architect-worker/SKILL.md",
      "computedHash": "036e04213a6a71743bb93cccc9021486236f53d38b20862c1b82addf404a45c7"
    },
    "changelog-management": {
      "source": "alexbruno/dev-skills",
      "sourceType": "github",
      "skillPath": "skills/changelog-management/SKILL.md",
      "computedHash": "a672da9f6e4496ba8a07ab5970c26b1d4f1dc101e5a3fd6c6e3b095e8020ea25"
    },
    "code-review": {
      "source": "alexbruno/dev-skills",
      "sourceType": "github",
      "skillPath": "skills/code-review/SKILL.md",
      "computedHash": "dd466725e8fc6f851d9d99c34c4a886f4998d7cf81067ca1fc2eb558369d5f6e"
    },
    "code-simplification": {
      "source": "alexbruno/dev-skills",
      "sourceType": "github",
      "skillPath": "skills/code-simplification/SKILL.md",
      "computedHash": "f205fcbebc44ce27c87923d98ac8d1047cde03a279a3841b0152e72e541121f7"
    },
    "codebase-indexing": {
      "source": "alexbruno/dev-skills",
      "sourceType": "github",
      "skillPath": "skills/codebase-indexing/SKILL.md",
      "computedHash": "c7567e317f37dcf7eae248f360ff85c0f1c39f2114931f59ec71a781a8b69433"
    },
    "decision-records": {
      "source": "alexbruno/dev-skills",
      "sourceType": "github",
      "skillPath": "skills/decision-records/SKILL.md",
      "computedHash": "b5444c33f3bdabe39439915ede3f79eab44da1ef3528a10660c8d2fa143c0f54"
    },
    "environment-preflight": {
      "source": "alexbruno/dev-skills",
      "sourceType": "github",
      "skillPath": "skills/environment-preflight/SKILL.md",
      "computedHash": "a114e3cbdeccbc22a8d60318713c85b83d29edde173af0c644550182e3f2130f"
    },
    "incremental-implementation": {
      "source": "alexbruno/dev-skills",
      "sourceType": "github",
      "skillPath": "skills/incremental-implementation/SKILL.md",
      "computedHash": "85172018933c4e2b161e71063b60c7793f5c648220c2375098c27f75518dec30"
    },
    "npm-version-management": {
      "source": "alexbruno/dev-skills",
      "sourceType": "github",
      "skillPath": "skills/npm-version-management/SKILL.md",
      "computedHash": "00bf02eb55459a27880cd14db2c03cbfd677cb81ba4e6a0f13452f03e7a4b4fc"
    },
    "planning-and-task-breakdown": {
      "source": "alexbruno/dev-skills",
      "sourceType": "github",
      "skillPath": "skills/planning-and-task-breakdown/SKILL.md",
      "computedHash": "ffb62667cc06cbede985c3569c53d015cc4ca579e3db7f98f0eb579f54f75d8d"
    },
    "product-owner": {
      "source": "alexbruno/dev-skills",
      "sourceType": "github",
      "skillPath": "skills/product-owner/SKILL.md",
      "computedHash": "9e221f16be23ab892133b9962e3182d710923ed08ab6438c277d152364c6ddab"
    },
    "spec-driven-workflow": {
      "source": "alexbruno/dev-skills",
      "sourceType": "github",
      "skillPath": "skills/spec-driven-workflow/SKILL.md",
      "computedHash": "427d0be0f9ab32d6d11c5cfe830ba636e224b7914276015c6dc2d7910141062c"
    },
    "systematic-debugging": {
      "source": "alexbruno/dev-skills",
      "sourceType": "github",
      "skillPath": "skills/systematic-debugging/SKILL.md",
      "computedHash": "1b9d917589d51319271f41c66ef10a290c3e478bdd07c9513942eeaa1a14464d"
    },
    "verification-and-testing": {
      "source": "alexbruno/dev-skills",
      "sourceType": "github",
      "skillPath": "skills/verification-and-testing/SKILL.md",
      "computedHash": "3ab04c649d7f79852cf8e5ca0b2bba7403340de41414ba68bacccd591128b8e3"
    }
  }
}
</file>

</files>
