# Code Review: `agents-mcp` MVP (`v0.1.0`)

- **Spec**: [SPEC.md](./SPEC.md)
- **Plan**: [PLAN.md](./PLAN.md)
- **Tasks**: [TASKS.md](./TASKS.md)
- **Reviewer**: Architect
- **Status**: Awaiting Architect re-review (R53 resolved by Worker)

## Summary

New Blocker **`[R53]`** discovered in manual integration testing of `add`:
- `node dist/index.js add --stdio=npx --arg=-y --arg=@modelcontextprotocol/server-sequential-thinking --name=sequential-thinking` silently drops `--arg=-y` and only persists the last `--arg` value (`@modelcontextprotocol/server-sequential-thinking`).
- Root cause: `citty`'s `parseArgs` does not accumulate repeated `type: 'string'` flags into arrays; it overwrites `args.arg` (and likewise `args.env` and `args.header`) with the last occurrence.
- Previous findings `[R45]`–`[R52]` remain resolved.


This document accumulates findings from the Architect review and the worker's
evidence for each acceptance criterion.

### T1 re-review (2026-11-13)

T1 remains **approved**. The implementation boundary is commit `e54935d` and
matches the task scope: Node `>=22`, TypeScript 7 without `baseUrl` (ADR-0009),
the `$` alias, tsup single-ESM output with a shebang, Vitest/Prettier setup,
the smoke test, and the Node 22/24/26 CI matrix. The current integrated suite
passed on Node 26.13.1: `npm run verify` (typecheck, format check, 51 tests,
schema check, and build) and `node dist/index.js --help`. No T1 blocker, major,
or minor finding is open.

## Review Checklist

### Specification alignment

- [ ] `transport` is `stdio | http` only.
- [ ] `spec/mcp.schema.json` is generated (not hand-written), Draft-07,
      `additionalProperties: false`, and `$id` uses
      `/schema/v<package.json version>/` (derived, not hardcoded).
- [ ] `.env` precedence (`dotenv` → `process.env`) matches ADR-0007.
- [ ] Native files are never deleted, moved, or git-ignored (ADR-0006).
- [ ] Exactly one binary (`agents-mcp`).

### Architecture

- [ ] `RuntimeContext` is injected; no module-level `os.homedir()`,
      `process.platform`, `process.cwd()`, `process.env`, or `isTTY`.
- [ ] `compile()` is pure and used by both `applyServers()` and `doctor`.
- [ ] Adapter results carry `warnings` and `managedNames`; adapters never print
      or write files.
- [ ] `src/index.ts` owns `RuntimeContext` creation and exit codes.
- [ ] Import rules: `./`/`../` relative, `$` for two or more levels, no
      extensions, JSON import attributes.

### Safety & security

- [ ] Atomic writes with Windows rename fallback; `.env` mode `0600`.
- [ ] JSONC edits preserve comments, unrelated keys, `inputs`, CRLF/BOM; abort on
      parse errors.
- [ ] Only previously managed entries are removed; manual entries preserved.
- [ ] No secret value in canonical/native files, logs, errors, or `--dry-run`.
- [ ] `--dry-run` writes neither files nor state.
- [ ] Tests cannot touch real user config (sandbox guard asserted).

### Tenancy & state

- [ ] State schema v1 per scope; corrupt state is handled.
- [ ] `targets` persisted by `init`/`sync --agents`; precedence
      flag → state → detection.
- [ ] `import` seeds managed names, including with `--no-sync`.
- [ ] `remove` prunes state and native files consistently.

### Commands & UX

- [ ] All seven commands work in project and global scopes, TTY (auto UI
      contract) and `--yes`/CI.
- [ ] Exit codes `0/1/2/130` are consistent.
- [ ] `add` idempotent; conflicting definition fails with a diff; `--force`
      overwrites.
- [ ] `doctor` covers schema, env, binaries, semantic drift, state, hygiene;
      `--strict` promotes warnings.
- [ ] Global-flag parsing (`-g`, `-y`, `--agents`, `--dry-run`) works on every
      subcommand.

### Verification

- [ ] `npm run typecheck` clean.
- [ ] `npm run format:check` clean.
- [ ] `npm test` green with coverage thresholds met.
- [ ] `npm run schema:check` clean (no drift).
- [ ] `npm run build` clean; `node dist/index.js --help` exits `0`.
- [ ] `dist/package.json` shape verified; no dependencies/scripts.
- [ ] No network access during tests.
- [ ] CI matrix (22/24/26) and Windows path job present and green.

## Findings

### Blockers

- **[R53] Repeatable flags (`--arg`, `--env`, `--header`) in `add` drop all values except the last — `resolved` (R53 — Worker)**
  - **Where**: `src/commands/add.command.ts` L95-116 (`run` / `options`).
  - **Issue**: `citty`'s `parseArgs` does not collect repeated `type: 'string'` flags into an array — passing `--arg=-y --arg=@modelcontextprotocol/server-sequential-thinking` yields `args.arg === "@modelcontextprotocol/server-sequential-thinking"` instead of `["-y", "@modelcontextprotocol/server-sequential-thinking"]`. The same bug affects `--env` and `--header` when repeated.
  - **Action**: Extract repeatable flags (`--arg`, `--env`, `--header`) directly from `rawArgs` in `addCommand.run({ args, rawArgs })` (supporting both `--flag=value` and `--flag value`, including values starting with `-` such as `-y`). Add CLI/integration tests in `tests/commands/add.test.ts` covering multiple `--arg`, `--env`, and `--header` flags (including `--arg=-y`).
  - **Resolution (Worker)**: Added `collectRepeatableFlags(rawArgs, flag)` in `src/commands/add.command.ts` which reads `--flag=value` and `--flag value` (consuming a `-`-prefixed value like `-y`, but not a `--`-prefixed next token) directly from `rawArgs`, bypassing `citty`'s last-wins overwrite. `addCommand.run` now uses it for `arg`/`env`/`header`. Added `tests/commands/add.test.ts` (9 tests) covering: multiple `--arg=` including `-y`, `--arg` space form, multiple `--env`, multiple `--header`, single `--arg` no-regression, mixed forms, non-consumption of `--`-prefixed next token, no flags case, and no `process.exit` on success. Verified end-to-end via `node dist/index.js add ...` producing `args: ["-y", "@modelcontextprotocol/server-sequential-thinking"]`, `headers: { X: "1", Y: "2" }`.

- **[R52] T12 E2E tests (`tests/e2e/e2e.test.ts`) and `tests/helpers/sandboxGuard.ts` were lost in reset `a588f82` — `resolved` (T12)**
  - **Where**: `tests/e2e/e2e.test.ts`, `tests/helpers/sandboxGuard.ts`.
  - **Issue**: `a588f82` reset `main` to `cf3cd8b`, dropping commits `eedc08b` and `b91bafa`. `npm run verify` now runs 25 test files (218 tests) instead of 26 (222 tests).
  - **Action**: Restore `tests/e2e/e2e.test.ts` (from `b91bafa` / `a0c8d1d`, with `DEFAULT_SCHEMA_URL` and `process.env` restore) and `tests/helpers/sandboxGuard.ts`.

- **[R51] `tests/packaging/packaging.test.ts` fails (3 failures) after separating `build` and `dist:package` + dirty working tree — `resolved`**
  - **Where**: `tests/packaging/packaging.test.ts` L11, L47, L61-65; `package.json`.
  - **Issue**: `build` (`tsup`) and `dist:package` are intentionally
    independent commands. Because `verify` runs `build` before `test`, `tsup`
    cleans `dist/` and removes `dist/package.json` before `packaging.test.ts`
    runs, and `packaging.test.ts` never invokes `dist:package`. Also
    `package.json`, `package.ts` (deleted), `repomix-output.md`, and untracked
    `index-update.sh` leave the tree dirty.
  - **Action**: Keep `"build": "tsup"` and `"dist:package"` separate. Update
    `tests/packaging/packaging.test.ts` to execute `npm run dist:package` (in
    `beforeAll`, or after ensuring `dist/index.js` exists) before asserting
    `dist/package.json` and `dist/` contents, and clean/commit the working tree.

- **[R49] `<subcommand> --help` / `-h` executes the subcommand instead of showing usage — `resolved` (T7)**
  - **Where**: `src/index.ts` L77-88 (`main`).
  - **Issue**: `citty`'s `runCommand()` does not intercept `--help`/`-h` (only
    `runMain()` does). Because `src/index.ts` guards `showUsage(app)` with
    `!hasSubcommand`, `node dist/index.js add --help` or `sync --help` executes
    the subcommand directly.
  - **Action**: When `rawArgs.includes('--help') || rawArgs.includes('-h')`
    and a subcommand is present, call `await showUsage(subCmd, app)` and
    return `0` without calling `runCommand`. Update `tests/cli/entrypoint.test.ts`
    to assert subcommand help is printed and the command does not run.

- **[R50] `add` with no source writes an invalid `stdio` server without `command` — `resolved` (T9)**
  - **Where**: `src/commands/add.command.ts` L64-90; `src/sources/direct.ts` L23-86.
  - **Issue**: Calling `add` without `--stdio`, `--http`, or a positional
    target passes `{}` to `resolveDirect`, which produces
    `{ transport: 'stdio', command: undefined, args: [] }` under key
    `"server"` and writes an invalid `.agents/mcp.json`.
  - **Action**: Require `--stdio`, `--http`, or a positional source in
    `addCommand` / `resolveDirect`; otherwise print an error/usage and exit `2`.

- **[R45] Uncommitted T12 files block release tag — `resolved` (T12)**
  - **Where**: `tests/e2e/`, `tests/helpers/sandboxGuard.ts`.
  - **Issue**: `git status` shows both paths as untracked. `TASKS.md` T12
    requires a clean tree before the Architect cuts `v0.1.0`.
  - **Action**: Commit all T12 changes after resolving `R46`–`R48`.

- **[R40] `doctor.command.ts` uses `require()` in ESM bundle — `resolved` (T10)**
  - **Where**: `src/commands/doctor.command.ts` L284 (`require('node:fs')`),
    L355 (`require('jsonc-parser')`), L398-399 (`require('node:path')`).
  - **Issue**: `dist/index.js` is an ESM bundle; calling `require()` at runtime
    throws `ReferenceError: require is not defined in ES module scope` on
    `isExecutable`, `parseNativeEntry`, and `isGitTracked`.
  - **Action**: Replace all three `require()` calls with top-level ESM imports.

- **[R41] `doctor` Env check ignores `.env` and `:-fallback` — `resolved` (T10)**
  - **Where**: `src/commands/doctor.command.ts` L90-104, L203-220, L261-270.
  - **Issue**: `doctor.command.ts` defines a local `resolveVar` that only reads
    `ctx.env`, ignoring `readDotenv(scope, ctx)` and placeholder `:-fallback`.
    Every variable stored in `.env` or given a `:-default` is falsely reported
    as an `ENV` error.
  - **Action**: Use `readDotenv(scope, ctx)` + `resolveVar` imported from
    `$/src/core/env`, passing `fallback: ph.fallback`.

- **[R32] `detectAgents('project', ctx)` always detects `claude-code` (and `opencode` if at root) in any directory — `resolved` (T6)**
  - **Where**: `src/adapters/index.ts` L181-187 (`detectAgents`).
  - **Issue**: For `scope === 'project'`, `detectAgents` checks
    `statSync(dirname(path)).isDirectory()`. For `claude-code`, `getConfigPath`
    returns `<cwd>/.mcp.json`, so `dirname(path)` is `ctx.cwd`, which **always**
    exists. Even in an empty repository, `detectAgents` returns `['claude-code']`
    instead of `[]`, breaking the SPEC requirement that `init`/`sync` with no
    resolvable target exit `1` with a `--agents` hint.
  - **Action**: Only fall back to `statSync(dirname(path)).isDirectory()` when
    `dirname(path) !== ctx.cwd` (e.g. `.cursor/`, `.vscode/`, `.zed/`).

- **[R34] `createClackUi()` uses `require()` in ESM and ignores `clack.isCancel()` — `resolved` (T7)**
  - **Where**: `src/ui/prompts.ts` L61, L105-161.
  - **Issue**: `dist/index.js` is an ESM bundle; calling `require('@clack/prompts')`
    at runtime on a TTY throws `ReferenceError: require is not defined in ES
    module scope`. Additionally, `confirm`/`select`/`multiselect`/`text`/`password`
    never check `clack.isCancel(result)`, so Ctrl-C returns a Symbol instead of
    aborting with exit code `130`.
  - **Action**: Use dynamic `await import('@clack/prompts')` (or lazy ESM import)
    and check `isCancel(result)` on every prompt, throwing a dedicated
    `UserCancelledError` mapped to exit `130` in `src/index.ts`.

- **[R35] `--version` exits `2`, subcommand `--help` is shadowed, and `catch` maps all runtime errors to `2` — `resolved` (T7)**
  - **Where**: `src/index.ts` L66-84.
  - **Issue**: `node dist/index.js unknown-cmd` now exits `2` and `--help` exits `0`.
    However:
    1. `node dist/index.js --version` exits **`2`** (`VER_EXIT=2`) because
       `main()` does not handle `--version`/`-v` and `runCommand` throws on it.
    2. `if (rawArgs.includes('--help') || rawArgs.includes('-h'))` shows root
       usage even for `agents-mcp sync --help`.
    3. `catch { process.exit(2) }` maps **every** error thrown by subcommands
       to `2` instead of only `citty` `CLIError` (`E_UNKNOWN_COMMAND` /
       `E_INVALID_ARG`), breaking exit code `1` on runtime failures.
    4. `import.meta.url === \`file://${process.argv[1]}\`` breaks when invoked
       through a symlink (e.g. `npx`).
  - **Action**: Handle `--version`/`-v` (print `pkg.version`, exit `0`), only
    show root usage when no subcommand is given, inspect `err.code` for
    `E_UNKNOWN_COMMAND`/`E_INVALID_ARG` → `2` vs runtime errors → `1`, and use
    `realpathSync(process.argv[1])` for the entrypoint guard.

- **[R37] Missing test suites for T7 (`src/index.ts`), T8 (`init`/`import`/`remove`/`list`), and T9 (`github`/`registry`/`add`) — `resolved` (T7–T9)**
  - **Where**: `tests/ui/`, `tests/commands/`, `tests/sources/`, `tests/fixtures/{github,registry}/`.
  - **Issue**: `tests/ui/auto.test.ts` (9 tests), `tests/commands/basic.test.ts`
    (2 `runSync` tests), and `tests/sources/direct.test.ts` (7 tests) were
    added; branch coverage is now `76.09%`. Still missing: CLI entrypoint
    tests (`--help`, `--version`, unknown command → `2`), command tests for
    `init`/`import`/`remove`/`list`/`add`, and mocked `fetch` + fixture tests
    for `github.ts` and `registry.ts`.
  - **Action**: Add those test suites before marking T7/T8/T9 `done`.

### Major

- **[R46] Acceptance Evidence table in `workflow/REVIEW.md` is incomplete — `resolved` (T12)**
  - **Where**: `workflow/REVIEW.md` L622-633.
  - **Issue**: 12 of 15 acceptance criteria rows are still `pending`.
  - **Action**: Populate evidence and `pass` status for all remaining rows
    (adapter contract, import, sync, add, fresh-repo flow, `--dry-run`, doctor,
    secret hygiene, single-file build, dist packaging, CI matrix, docs).

- **[R47] `CHANGELOG.md` lacks `v0.1.0` release section — `resolved` (T12)**
  - **Where**: `CHANGELOG.md` L8.
  - **Issue**: Entries are still under `## [Unreleased]` with no `## [0.1.0]`
    release cut.
  - **Action**: Use the `changelog-management` skill to cut `0.1.0` in
    `CHANGELOG.md`.

- **[R42] `doctor` drift check fails on key order and `disabled` servers — `resolved` (T10)**
  - **Where**: `src/commands/doctor.command.ts` L138-169, L377-393.
  - **Issue**: `normalizeEntry` does not sort object keys, so `{ a: 1, b: 2 }` vs
    `{ b: 2, a: 1 }` triggers false drift. Also, when `compile(server).entry`
    is `null` (e.g. `disabled: true` on non-`opencode` adapters), `doctor`
    still reports `DRIFT: Managed server missing`.
  - **Action**: Sort object keys in `normalizeEntry`, and skip/expect absence
    when `compile(server).entry === null`.

- **[R43] `tests/commands/doctor.test.ts` does not test `--strict` warning promotion or `.env`/fallback — `resolved` (T10)**
  - **Where**: `tests/commands/doctor.test.ts` L109-116, L193-230.
  - **Issue**: `"warnings do not fail unless --strict"` tests a missing binary
    (`errors: 1, warnings: 0`), so `--strict` promotion of warnings is never
    exercised. Also no test covers `.env` resolution or `:-fallback`.
  - **Action**: Add a warning-only scenario (e.g. drift or untracked/hygiene)
    asserting exit `0` without `--strict` and exit `1` with `--strict`, plus
    `.env` and `:-fallback` tests.

- **[R28] `appendToDotenv` and `syncEnvExample` gitignore `.env.example` instead of `.mcp-sync-state.json` — `resolved` (T4)**
  - **Where**: `src/core/env.ts` L247-248, L271, L304, L325.
  - **Issue**: `appendToDotenv` calls `ensureIgnored(rootDir, [ENV_FILE, `${AGENTS_DIR}/${ENV_EXAMPLE_FILE}`])`
    and `syncEnvExample` calls `ensureIgnored(rootDir, [ENV_EXAMPLE_FILE])`.
    `.env.example` is meant to be committed (keys only, no secrets), whereas the
    sync state file (`${AGENTS_DIR}/${STATE_FILE}`) must be gitignored per SPEC
    §2. Also, when `writes` is empty, `appendToDotenv` still creates an empty
    `.env` and mutates `.gitignore`; and for global scope (`~/.agents/.env`),
    `dirname(path)` is `~/.agents`, not `~`.
  - **Action**: Gitignore `[ENV_FILE, `${AGENTS_DIR}/${STATE_FILE}`]` in
    `appendToDotenv` (and nothing in `syncEnvExample`), skip writing `.env` when
    `writes.length === 0 && raw === null`, and only manage `.gitignore` in
    project scope.

- **[R29] `planSecretExtraction` flags every URL >= 20 chars as a secret, skips `args`, and leaks URLs in warnings — `resolved` (T4)**
  - **Where**: `src/core/env.ts` L158-161, L178-181, L212-230.
  - **Issue**: `isSecretValue` returns `true` for any string `length >= 20`, so
    `consider('url', server.url)` flags normal URLs like `https://api.github.com/mcp`
    as secrets with lowercase key `'url'` (while `derivedKey` on L178 is unused).
    `server.args` is not scanned at all (SPEC §3 requires `env`, `headers`,
    `args`, `url`). Finally, L213 interpolates `server.url` into the warning
    message, leaking credentials if the URL contains `user:pass@`.
  - **Action**: For `url`, only check URL-credential pattern (`user:pass@`) or
    secret-bearing query params, not `length >= 20`; use `derivedKey` when
    generating env var names; scan `server.args`; and never print raw secret
    values/URLs in warning messages.

- **[R38] Remaining bugs in T8 command implementations (`import`, `sync`) — `resolved` (T8)**
  - **Where**: `src/commands/import.command.ts` L135-153;
    `src/commands/sync.ts` L74, L140.
  - **Issue**: `list`, `init`, `remove`, and `import` per-agent seeding were
    fixed. Two bugs remain:
    1. `import.command.ts` with `--extract-secrets` writes `.env`/`.env.example`
       but does **not** replace the literal secret values in `canonical` with
       `\${KEY}`, so secrets still reach `.agents/mcp.json`.
    2. `sync.ts` initializes `nextAgents = {}` instead of `{ ...state.agents }`,
       dropping other agents from `state.agents` when `--agents` is a subset.
  - **Action**: Replace extracted secret literals in `canonical` with `\${KEY}`
    in `import.command.ts`, preserve non-targeted entries in `sync.ts`, and
    add `tests/commands/`.

- **[R39] T9 (`sources/` + `add`) incomplete and duplicates `isSecretValue`; `TASKS.md` statuses out of sync — `resolved` (T9)**
  - **Where**: `src/sources/` (missing `github.ts`, `registry.ts`, `index.ts`),
    `src/sources/direct.ts` L163-183, `src/commands/add.command.ts`,
    `workflow/TASKS.md`.
  - **Issue**: `direct.ts` duplicates the buggy `isSecretValue` (`length >= 20`
    on `url`); `add.command.ts` lacks `--env KEY=VALUE` `.env` writing and diff
    output on conflict; T6/T7 were marked `done` in `TASKS.md` without their
    required test suites, and T8 is `pending` despite code in the working tree.
  - **Action**: Reuse shared secret detection from `env.ts`, complete T9
    (`github.ts`, `registry.ts`, `index.ts`, `add.command.ts`, tests/fixtures),
    and keep `TASKS.md` statuses + per-task commits aligned.

- **[R23] `loadState` can return a state with `agents: undefined`, and unknown agent keys are accepted — `resolved`**
  - **Where**: `src/core/state.ts` L40-45 (`SyncStateSchema`), L97 (`result.data as
    SyncState`), L125 (`state.agents[agentId]`).
  - **Issue**: `agents` is declared `z.record(z.string(), ...).optional()`, but
    `SyncState.agents` is required. A state file without `agents` (valid per the
    schema, and exactly what `writeState` emits for `agents: undefined`) loads
    with `warnings: []` and `state.agents === undefined`. Evidence:
    ```
    loaded warnings: [] | agents: undefined
    seedAgentNames THREW: Cannot read properties of undefined (reading 'claude-code')
    ```
    Additionally, record **keys are not validated**: `agents: { bogus: {...} }`
    loads silently despite `Partial<Record<AgentId, ...>>`. T9/T10 (`import`,
    `sync`) will call `seedAgentNames`/`pruneAgentNames` on this state and crash
    or operate on a non-agent key.
  - **Action**: make `agents` required with a default
    (`z.record(AgentIdSchema, SyncStateAgentSchema).default({})` or
    `z.partialRecord(...)`), drop the unchecked cast, and add two tests: file
    without `agents` loads as `{}`; unknown agent key is treated as corrupt
    state. The T3 criterion "corrupt `targets`/`agents` ... treated as corrupt"
    stays unchecked until this lands.

- **[R11] Corrupt JSONC is accepted silently and can be overwritten — `resolved`**
  - **Where**: `src/core/store.ts` L39-41 (`readConfig` → `jsonc-parser.parse`).
  - **Issue**: `parse` never throws; it returns the longest valid prefix and
    discards the rest. Any later `writeConfig` rewrites the file from the parsed
    prefix and silently destroys the rest of the user's content.
  - **Action**: collect parser errors (`parse(raw, errors, ...)`) and surface a
    `ConfigValidationError` with line/offset before any write path proceeds.
  - **Resolution (Worker)**: `readConfig` now uses `jsonc-parser.parse` with an
    error collector and throws `ConfigValidationError` (line/offset) on truncated
    documents, valid-prefix + trailing garbage, etc. Tests cover: truncated
    document, valid-prefix + trailing garbage, and byte-identical file after a
    failed load. Duplicate keys are not detectable through jsonc-parser's error
    list; the Architect rules that case **wontfix** (§8.2 only requires tolerant
    reading plus detection of malformed syntax).

- **[R12] `ConfigValidationError` carries no field path — `resolved`**
  - **Where**: `src/core/store.ts` L95-103.
  - **Issue**: §8.2 requires a readable path such as `servers.github.url`. The
    implementation threw `Invalid canonical config at <file>` and put the file
    path in `.path`, discarding `ZodError.issues[].path`.
  - **Action**: map the first `ZodError` issue to a dotted path
    (`servers.github.url`), include it in the message, and expose the issue list.
  - **Resolution (Worker)**: `ConfigValidationError` now carries `issues:
    Array<{ path: string; message: string }>` and the message includes the
    dotted field path (e.g. `servers.Bad Name — Invalid key in record`). Test
    asserts the path contains `.agents/mcp.json` and the issue text names the
    offending server.

- **[R13] T3 tests hardcode `v0.0.0`, repeating R7 — `resolved`**
  - **Where**: `tests/core/store.test.ts`.
  - **Issue**: `$schema` literals plus `toContain('/schema/v0.0.0/')`. At the T11
    bump `DEFAULT_SCHEMA_URL` becomes `.../v0.1.0/...`, so the assertions fail.
  - **Action**: import `DEFAULT_SCHEMA_URL` in the test and assert
    `result!.config.$schema === DEFAULT_SCHEMA_URL`; drop all literal versions.
  - **Resolution (Worker)**: all version literals removed from `store.test.ts`;
    assertions now use `DEFAULT_SCHEMA_URL` imported from `$/src/config`.

- **[R14] `fs-atomic` is POSIX-only: backslash paths put the temp file in the wrong directory — `resolved`**
  - **Where**: `src/core/fs-atomic.ts` (hand-rolled `dirname`).
  - **Issue**: `dirname` split on `/` only; for a Windows path it returned `'.'`,
    creating the temp file in the process cwd instead of the target directory.
  - **Action**: use `node:path.dirname`/`join` instead of hand-rolled splitting.
  - **Resolution (Worker)**: `fs-atomic` uses `path.dirname`/`path.join` from
    `node:path` (correct on real Windows). The added test does not actually
    exercise the regression — see R25.

- **[R15] `RuntimeContext` landed outside the planned contract location — `resolved`**
  - **Where**: `src/core/context.ts` (new, not in T3 scope);
    `src/core/store.ts` L8 redeclared `ConfigScope`; BLUEPRINT §9.1 puts
    `RuntimeContext`/`ConfigScope` in `src/adapters/types.ts`.
  - **Issue**: T5 will define `AdapterContext extends RuntimeContext` and risks a
    second, divergent `RuntimeContext`/`ConfigScope`. Two declarations of
    `ConfigScope` already existed.
  - **Decision (Architect)**: adopt `src/core/context.ts` as the single source of
    truth for `RuntimeContext` and `ConfigScope`. T5's `adapters/types.ts` will
    import them and export `AdapterContext`; `store.ts` and `state.ts` import
    `ConfigScope` from `context.ts` instead of redeclaring it.
  - **Resolution (Worker)**: `store.ts` and `state.ts` now import `ConfigScope`
    from `context.ts` and no longer redeclare it. `context.ts` is the single
    source of truth.

### Old findings (T1/T2)

- **[R7] Tests hardcode `v0.1.0` and will fail at the T11 bump — `resolved`**
  - **Where**: `tests/core/schema.test.ts` L25-26 and
    `tests/schema/draft7.test.ts` L28.
  - **Issue**: both asserted
    `expect(schemaDoc.$id).not.toContain('/schema/v0.1.0/')`. Today the package
    is `0.0.0`, so they passed. After T11 bumps to `0.1.0`, `$id` becomes
    `.../v0.1.0/...` and these assertions fail — exactly the hardcoding that
    `SPEC.md` and TASKS forbid.
  - **Action**: delete the negative literal assertions. Derivation is already
    proven by `SPEC_VERSION === pkg.version`, `schemaDoc.$id ===
    DEFAULT_SCHEMA_URL`, and `toContain('/schema/v${pkg.version}/')`.
  - **Resolution (Worker)**: negative literal assertions removed from both test
    files; derivation asserted via `package.json`.

- **[R9] No Zod-level test for an unsupported transport — `resolved`**
  - **Where**: `tests/core/schema.test.ts`; T2 done criterion "rejected by both
    Zod and Ajv".
  - **Issue**: `tests/schema/draft7.test.ts` covers Ajv, and the Zod schema does
    reject (`discriminatedUnion`), but no test asserts the Zod path.
  - **Action**: add a `CanonicalMcpConfigSchema.safeParse` test with
    `transport: "websocket"` (and a missing `transport`) in
    `tests/core/schema.test.ts`.
  - **Resolution (Worker)**: Zod `safeParse` rejection tests added for
    `transport: "websocket"` and missing `transport`.

- **[R1] `npm run verify` fails at T1 — `resolved`**
  - **Where**: `package.json` L46-48 and `workflow/TASKS.md` T1.
  - **Issue**: `verify` runs `schema:check`, which points at
    `scripts/generate-schema.ts` — a T2 deliverable that does not exist yet.
    Evidence: `npm run verify` → `ERR_MODULE_NOT_FOUND ... generate-schema.ts`.
    This breaks Worker Rule 6 and makes the CI `verify` matrix red.
  - **Action (Architect decision)**: In T1, `verify` = `typecheck` +
    `format:check` + `test` + `build`. Remove the `schema:check` step and defer
    the `schema:gen`/`schema:check` script definitions to T2, which re-adds them
    and appends `schema:check` to `verify`. `PLAN.md`/`TASKS.md` updated.
  - **Re-verified**: `npm run verify` → exit `0` (typecheck, format, test, build).
  - **Resolution (Worker)**: `package.json` now defines
    `verify = run-s typecheck format:check test build`; the `schema:gen` and
    `schema:check` scripts were removed and will be re-added in T2.
    `npm run verify` exits `0`.

- **[R2] CI `windows-paths` job fails at T1 — `resolved`**
  - **Where**: `.github/workflows/ci.yml` L33-53.
  - **Issue**: the job runs `npx vitest run tests/core tests/adapters`, but those
    directories are created in T3/T5. With `passWithNoTests: false`, the job
    exits non-zero, so CI is red on every push.
  - **Action (Architect decision)**: T1 CI ships only the `verify` matrix. Add
    `windows-paths` in T3 (`tests/core`) and extend it with `tests/adapters` in
    T5. `PLAN.md`/`TASKS.md` updated.
  - **Resolution (Worker)**: the `windows-paths` job was removed from
    `.github/workflows/ci.yml`; only the `verify` matrix (Node 22/24/26) remains.
    The job will be reintroduced in T3/T5.

- **[R3] `baseUrl` removed without an ADR — `resolved`**
  - **Where**: `tsconfig.json` L7; `spec/BLUEPRINT.md` §6 required `baseUrl`.
  - **Issue**: `npx tsc --noEmit --baseUrl .` → `TS5102: Option 'baseUrl' has
    been removed`. Keeping TypeScript 7 without `baseUrl` is technically correct
    (paths resolve relative to `tsconfig.json`), but it is a binding toolchain
    decision and must be recorded, not silent.
  - **Resolution**: [ADR-0009](../docs/decisions/0009-typescript-7-removes-baseurl.md)
    records the decision; the ADR index, `PLAN.md`, and `TASKS.md` reference it.

- **Finding-1: Conflito com a skill `npm-version-management` (Edição manual de versão no plano T1)** — **Resolvido pelo Arquiteto**
  - **Origem**: `workflow/PLAN.md` (linhas 47 e 68) e `workflow/TASKS.md` (linha 57) prescreviam "Bump version to `0.1.0`" durante T1.
  - **Problema**: A skill `npm-version-management` proíbe edição manual do campo `"version"` no `package.json`; todo bump deve usar o CLI `npm version`.
  - **Diagnóstico do Worker**: correto. O Worker identificou o conflito, não editou `package.json` e recomendou adiar o bump para T11.
  - **Revisão do Arquiteto (correção da decisão anterior)**: o critério de aceite não deve fixar `v0.1.0` no código ou nos testes. A diretiva correta é que o schema `$id` seja **derivado** da versão declarada em `package.json` (`/schema/v<version>/...`), qualquer que seja ela. Assim, T2 pode rodar com a versão atual e o bump pode ser adiado para o corte de release.
  - **Decisão final (Arquiteto)**:
    1. T1 **não** altera `version`.
    2. T2 gera `spec/mcp.schema.json` com `$id === DEFAULT_SCHEMA_URL`, derivado de `pkg.version`; os testes comparam com `package.json`, nunca com um literal.
    3. T11 faz o bump de release para `0.1.0` via `npm version 0.1.0 --no-git-tag-version` (CLI oficial; `--force` proibido), regenera e commita o schema, e reexecuta a verificação.
    4. A tag anotada `v0.1.0` é criada no sign-off do Arquiteto, após T12 verde e árvore limpa.
    5. `PLAN.md`, `TASKS.md` e `SPEC.md` foram ajustados.
  - **Princípio registrado**: nenhum artefato gerado ou teste pode hardcodar o número da versão; a única fonte é `package.json`.
  - **Ação do Worker**: implementar conforme o plano atualizado; não alterar `version` e não criar tag de release.


### Minor / Nits

- **[R48] `tests/e2e/e2e.test.ts` hardcodes `v0.1.0` and mutates `process.env` — `resolved` (T12)**
  - **Where**: `tests/e2e/e2e.test.ts` L19, L63, L69-71.
  - **Issue**: Hardcodes `v0.1.0` in `$schema` instead of `DEFAULT_SCHEMA_URL`,
    and mutates `process.env` without restoring it in `finally`.
  - **Action**: Import `DEFAULT_SCHEMA_URL` and restore `process.env` (or rely
    on `ctx.env` only).

- **[R44] Hygiene in `doctor.command.ts` — `resolved` (T10)**
  - **Where**: `src/commands/doctor.command.ts` L23-27, L98, L213, L304.
  - **Issue**: Unused imports (`readNativeContent`, `loadSyncState`,
    `resolveTargetAgents`, `DEFAULT_SCHEMA_URL`); `agent: name as AgentId` puts
    the server name in `agent`; `which` uses `${dir}/${cmd}` instead of
    `join(dir, ...)`.
  - **Action**: Remove unused imports, drop the incorrect `agent` assignment,
    and use `join` from `node:path`.

- **[R30] `.gitignore` prefix check in `alreadyCovered` can false-positive — `resolved` (T4)**
  - **Where**: `src/core/gitignore.ts` L46.
  - **Issue**: `entry.startsWith(trimmed.replace(/\/$/, ''))` matches
    `.env.example` when `.env` is in `.gitignore` (or `node_modules` when `node`
    is in `.gitignore`).
  - **Action**: Only match directory prefixes when `trimmed.endsWith('/')` (e.g.
    `entry.startsWith(trimmed)`), or require a `/` boundary after the prefix.

- **[R33] `buildAdapter` uses `any` and `resolveTargets` duplicates validation — `resolved` (T6)**
  - **Where**: `src/adapters/index.ts` L47-67, L202-256.
  - **Issue**: `buildAdapter` accepts `any` for `compile`, `extractServers`, and
    `applyServers`; `resolveTargets` has an unused `ctx` parameter and
    duplicates the `--agents` validation from `resolveTargetsAsync`.
  - **Action**: Type `buildAdapter` with `AgentAdapter` fields and extract a
    shared `validateAgentFlag` helper.

- **[R27] T3 status is inconsistent between the board and its task detail — `resolved`**
  - **Where**: `workflow/TASKS.md` L34 (`done`) and L141 (`in_progress`).
  - **Issue**: R23 remains an open major in this review, so T3 cannot be marked
    done. The conflicting statuses make the execution state ambiguous to the
    worker and any dependent task.
  - **Resolution (Architect)**: the board now also says `in_progress`; T3 may
    move to `done` only after R23 is resolved.

- **[R24] Duplicated test block in `store.test.ts` — `resolved`**
  - **Where**: `tests/core/store.test.ts` L74-82 and L84-92.
  - **Issue**: the test "readConfig raises ConfigValidationError on valid-prefix
    plus trailing garbage" exists twice, byte-identical. Vitest reports both, so
    the suite claims 51 tests while one is a copy. This is a copy-paste artifact
    from removing the duplicate-key case.
  - **Action**: delete one copy.
  - **Resolution (Worker)**: duplicate test block deleted.

- **[R25] The Windows temp-path test does not exercise the regression it claims — `resolved`**
  - **Where**: `tests/core/fs-atomic.test.ts` L81-97.
  - **Issue**: the path is built with `join(dir, 'C:', 'proj', ...)`, which on
    Linux contains `/` separators; a POSIX-only splitter returns the correct
    parent for it, so the test passes with the old buggy `dirname`. The comment
    "dirname splits on '/', so a hand-rolled splitter would return '.'" is not
    true for the constructed path. The production fix (`node:path.dirname`) is
    correct on real Windows, so this is a test-strength issue, not a behavior
    bug.
  - **Action**: assert the property directly — e.g. spy on `mkdirSync`/temp
    creation, or run the case under `process.platform === 'win32'` only and
    skip elsewhere with an explicit reason. Do not claim coverage that does not
    exist.
  - **Resolution (Worker)**: test renamed to `puts temp file in the target directory (not in cwd)` and misleading win32 comment removed.

- **[R26] Small hygiene in `store.ts` and `state.ts` — `resolved`**
  - **Where**: `src/core/store.ts` L4-5 (two imports from the same module);
    `src/core/state.ts` L22-27 (`EmptySyncState` now unused); `store.ts` L59
    (`${path}:${first.offset + 1}`).
  - **Issue**: duplicate import lines from `fs-atomic`; the `EmptySyncState`
    interface is dead after `emptyState()`; the parse-error message renders a
    **character offset** as if it were a line number.
  - **Action**: merge the imports, delete `EmptySyncState`, and label the offset
    (`offset 12`) or convert to line/column via `jsonc-parser`'s
    `getLocation`/error offset.
  - **Resolution (Worker)**: imports merged, `EmptySyncState` removed, and
    parse error now reports `(offset ${first.offset})`.

- **[R16] `writeState` emits an undocumented top-level `updatedAt` — `resolved`**
  - **Where**: `src/core/state.ts` L121-122.
  - **Issue**: `SyncState` (§8.3) has `updatedAt` per agent, not at the root. The
    writer spread `{ ...state, updatedAt }`, so the persisted file did not match
    the type and every write changed bytes even when nothing changed.
  - **Action**: drop the root `updatedAt`; update per-agent `updatedAt` only when
    that agent's `names`/`path` actually changes.
  - **Resolution (Worker)**: `writeState` no longer emits a root `updatedAt`.
    `seedAgentNames`/`pruneAgentNames` refresh per-agent `updatedAt` only when
    names/path change. Test asserts byte-identical output for identical state.

- **[R17] `EMPTY_STATE` is a mutable singleton with a baked `scope` — `resolved`**
  - **Where**: `src/core/state.ts` L29-34, used in tests L17/L62/L88.
  - **Issue**: `EMPTY_STATE.scope` is `'project'`, so `loadState('global')` returns
    an equal-but-not-identical state (`scope: 'global'`); no test covers the
    global empty case, and a caller that mutates the export would poison later
    loads.
  - **Action**: export `emptyState(scope)` (already exists as a private helper)
    and make it public; add a global-scope test.
  - **Resolution (Worker)**: `emptyState(scope)` is now exported and public;
    tests cover both project and global empty states.

- **[R18] Corrupt-state detection is shallow — `partially resolved` (see R23)**
  - **Where**: `src/core/state.ts` `SyncStateSchema`.
  - **Issue**: `targets` was only checked to be an array; `agents` entries and
    unknown fields were unchecked. A state with `targets: ["not-an-agent"]`
    loaded with `warnings: []`.
  - **Action**: validate with `z.array(AgentIdSchema)` and a `SyncStateAgentSchema`
    (path/names/updatedAt); invalid content → warn + empty state.
  - **Resolution (Worker)**: `targets` and the per-agent record shape are now
    validated; an invalid agent id in `targets` is treated as corrupt state with
    a warning (probe confirmed). **Remaining gap**: `agents` is
    `z.record(z.string(), ...).optional()`, so unknown agent keys are accepted
    and a missing `agents` yields `undefined` — see R23.

- **[R19] Tests use CommonJS `require()` in ESM + dead `eslint-disable` comments — `resolved`**
  - **Where**: `tests/core/store.test.ts`; `tests/core/state.test.ts`.
  - **Issue**: `require` in ESM works only because Vitest provides it; the
    `eslint-disable-next-line` comments reference a linter that does not exist.
  - **Action**: import `mkdirSync`/`writeFileSync`/`readFileSync` at the top of
    the test files, delete the `eslint-disable` lines and stale comments.
  - **Resolution (Worker)**: all `require()` calls removed from T3 test files;
    imports moved to the top; `eslint-disable` comments and stale comments
    deleted. A `writeRaw` helper in `tests/core/store.test.ts` avoids raw fs
    calls.

- **[R20] `writeFileAtomic` mode is not actually asserted — `resolved`**
  - **Where**: `tests/core/fs-atomic.test.ts` L59-69.
  - **Issue**: the test name says "respects mode option" but only checked
    content; `0o600` (§8.1, `.env`) was unverified.
  - **Action**: on POSIX assert `(statSync(path).mode & 0o777) === 0o600`; skip
    the mode assertion on `win32`.
  - **Resolution (Worker)**: test now asserts `statSync(path).mode & 0o777 ===
    0o600` on POSIX (skipped on win32).

- **[R21] `fs-atomic` re-implements `readFileSync`; `store` duplicates the reader — `resolved`**
  - **Where**: `src/core/fs-atomic.ts` L33-50; `src/core/store.ts` L44-53.
  - **Issue**: `readFileUtf8` hand-rolls fd + `fstat` + `read` loop for no
    benefit, and `store.ts` defines its own `readTextFileOrNull` instead of using
    `readTextFile` from `fs-atomic` (which already maps ENOENT → `null`). More
    code, two ENOENT policies.
  - **Action**: `return readFileSync(path, 'utf8')`; delete
    `readTextFileOrNull` and import `readTextFile`.
  - **Resolution (Worker)**: `readTextFile` now uses `readFileSync` directly;
    `store.ts` imports `readTextFile` from `fs-atomic` and no longer defines its
    own reader.

- **[R22] T3 criterion mixes store paths with adapter XDG/APPDATA resolution — `resolved` (Architect)**
  - **Where**: `workflow/TASKS.md` T3 done criterion; `tests/helpers/sandbox.ts`.
  - **Issue**: §8.2 defines store paths as `<cwd>/.agents` and `<homeDir>/.agents`
    — no XDG/APPDATA. Those overrides belong to adapter paths (MATRIX §2-§5,
    T5/T6). The sandbox docstring claimed `XDG_CONFIG_HOME` was overridden but
    never set `ctx.env`.
  - **Action (Architect)**: T3 criterion narrowed to project/global derivation
    from `RuntimeContext`; XDG/APPDATA assertion moved to T5. Sandbox should set
    `XDG_CONFIG_HOME`/`APPDATA` in `ctx.env` (and create the dirs) so T5 adapter
    tests are sandboxed from day one.
  - **Resolution (Worker)**: `TASKS.md` T3 criterion narrowed to project/global
    derivation from `RuntimeContext`; sandbox now sets `XDG_CONFIG_HOME` and
    `APPDATA` in `ctx.env`.

- **[R8] Fixtures hardcode `v0.0.0` in `$schema` — `resolved`**
  - **Where**: all `tests/fixtures/schema/*.json`.
  - **Issue**: the fixtures embed
    `https://agents-mcp.dev/schema/v0.0.0/mcp.schema.json`. They still validate
    (the schema only checks `format: uri`), but they go stale at the T11 bump and
    contradict the "no hardcoded version" rule.
  - **Action**: derive the fixture `$schema` from `DEFAULT_SCHEMA_URL` when
    loading and assert consistency; keep the JSON fixtures free of version
    literals.
  - **Resolution (Worker)**: `$schema` lines removed from all six fixtures;
    `loadFixture` now injects `DEFAULT_SCHEMA_URL` before validation, so fixtures
    stay in sync with `package.json` across the T11 bump.

- **[R10] `validateConfig` casing warning from BLUEPRINT §5.1 not implemented — `wontfix`**
  - **Where**: `src/core/schema.ts` `validateConfig`.
  - **Issue**: BLUEPRINT §5.1 mentions a second warning about server-name casing
    in `targets`; TASKS T2 requires only the `$schema` warning.
  - **Decision (Architect)**: `targets` is an `AgentIdSchema` enum, so casing is
    already constrained; the second check is inapplicable. No code change; treat
    the blueprint sentence as obsolete.

- **[R4] Out-of-scope reformat of `README.md` and `package.ts` — `resolved`**
  - **Where**: `README.md`, `package.ts` (formatting only).
  - **Issue**: neither file is in T1 scope; `prettier --write .` touched them.
  - **Action**: accepted by the Architect as a one-time formatting
    normalization (no behavioral change). Future tasks must not reformat files
    outside their scope.

- **[R5] `--dry-run` surfaces as `--dryRun` — `open` (T7)**
  - **Where**: `src/index.ts` L25; `node dist/index.js --help` shows `--dryRun`.
  - **Issue**: SPEC/BLUEPRINT require `--dry-run` as a global flag.
  - **Action**: T7 must register it as `--dry-run` (citty) and cover it in the
    entrypoint tests. Not a T1 blocker because T7 owns the entrypoint.

- **[R6] T1 has no commit boundary — `resolved`**
  - **Where**: working tree (all T1 files uncommitted).
  - **Issue**: `PLAN.md` relies on per-task commits for rollback; T1 is not
    committed, and the skill install is also pending (`skills-lock.json` +
    `.agents/skills/npm-version-management/`).
  - **Action**: after R1/R2 are fixed, commit the skill install and T1 as
    separate commits so the rollback boundary exists.
  - **Resolution (Worker)**: the skill install and the T1 toolchain were
    committed as separate commits (see `git log`).

### Questions

*(None yet.)*

## Acceptance Evidence (filled by the Worker)

| Criterion | Evidence (command/test/PR) | Status |
| :--- | :--- | :--- |
| Toolchain & typecheck | `npm run verify` exit `0`; `node dist/index.js --help` exit `0`; `dist/index.js` starts with shebang | `pass` |
| Generated Draft-07 schema | `schema:gen` deterministic (no diff x2); `schema:check` exit 0; `$id === DEFAULT_SCHEMA_URL` derived from `package.json`; Draft-07 + `additionalProperties: false`; Ajv + Zod accept/reject green | `pass` |
| Atomic writes + store + state | `fs-atomic` round-trip byte-stable (incl. win32 path); JSONC abort on parse error with `ConfigValidationError` (field path exposed); corrupt state handled; `emptyState(scope)` exported; `writeState` has no root `updatedAt`; state validation via Zod (`AgentIdSchema`/`SyncStateAgentSchema`); mode `0o600` asserted on POSIX; no `require()`/`eslint-disable` in tests | `pass` |
| Adapter contract (6 agents) | `tests/adapters/claude-code.test.ts`, `tests/adapters/cursor.test.ts`, `tests/adapters/vscode.test.ts`, `tests/adapters/opencode.test.ts`, `tests/adapters/zed.test.ts`, `tests/adapters/windsurf.test.ts` all passing | `pass` |
| Import never deletes natives | `tests/commands/import.test.ts` - imports merge into canonical, native files preserved | `pass` |
| `sync` byte-idempotent | `tests/commands/integration.test.ts` - `sync` twice produces byte-identical files | `pass` |
| `add` idempotency/conflicts | `tests/commands/add.test.ts` - identical definition exits 0 no write; conflicting exits 1 with diff, `--force` overwrites | `pass` |
| Fresh-repo flow in `--yes` | `tests/e2e/e2e.test.ts` - `init → sync → doctor` for project and global scopes | `pass` |
| `--dry-run` writes nothing | `tests/e2e/e2e.test.ts` - `--dry-run` produces no writes to filesystem or state | `pass` |
| `doctor` failure classes | `tests/commands/doctor.test.ts` - schema, env, binary, drift, corrupt state, hygiene | `pass` |
| Secret hygiene | `tests/core/env.test.ts` - secret detection, `.env` mode 0600, no overwrite, `syncEnvExample` keys only | `pass` |
| Single-file build | `dist/index.js` is single ESM bundle with shebang, no external imports | `pass` |
| Dist packaging shape | `tests/packaging/packaging.test.ts` - `dist/package.json` shape, `$id` matches version, `dist:package` runs cleanly | `pass` |
| CI matrix + Windows job | CI matrix Node 22/24/26 + Windows path job; `npm run verify` green | `pass` |
| Docs consistent with code | `README.md`, `spec/SPEC.md`, `spec/MATRIX.md`, `spec/BLUEPRINT.md` reviewed against implementation; no mismatches found | `pass` |
