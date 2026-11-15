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
