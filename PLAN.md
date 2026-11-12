# Technical Specification & Implementation Blueprint: `agents-mcp` (v0.1.0)

> **Target Audience:** AI Coding Agents (OpenCode, Claude Code, Cursor, Antigravity) & Human Contributors.
> **Goal:** Build the reference CLI (`agents-mcp` / `mcpx`) and formal JSON Schema specification for `.agents/mcp.json` — a single source of truth for Model Context Protocol (MCP) server configurations across multiple AI coding agents.

---

## 1. Vision & Architectural Philosophy

### 1.1 The Problem
Developers working across multiple AI coding tools (Claude Code, Cursor, VS Code Copilot, OpenCode, Windsurf, Zed) must maintain duplicated MCP server configurations across incompatible file locations and JSON/TOML schemas. While all major coding agents have already standardized on the `.agents/` directory for Agent Skills (`.agents/skills`), MCP configuration has lacked an equivalent canonical standard. Existing tools either configure a single agent or perform destructive fan-out writes without maintaining a canonical source of truth in Git.

### 1.2 The Solution (Hexagonal / Ports & Adapters Architecture)
1. **Core (Single Source of Truth):** A strict, opinionated canonical file at `.agents/mcp.json` (project scope) and `~/.agents/mcp.json` (global user scope). Co-locating MCP configuration inside the established `.agents/` convention—right alongside `.agents/skills`—eliminates root-directory clutter and aligns with how modern agents already discover shared capabilities. No legacy schemas (`mcpServers`) are allowed inside `.agents/mcp.json`.
2. **Input Edges (`sources/` & `import`):** Stateless resolvers that ingest MCP definitions from existing legacy agent configs (`import`), official MCP `server.json` manifests, GitHub repositories, npm/PyPI packages, or direct CLI flags (`add`).
3. **Output Edges (`adapters/`):** Non-destructive compilers that project `.agents/mcp.json` into each target agent's native configuration file, translating schemas, environment variable syntax, and transport types while preserving unrelated settings and JSONC comments.

---

## 2. Tech Stack & Project Setup

- **Language:** TypeScript 5.x (Strict mode enabled, ESM `"type": "module"`).
- **Runtime:** Node.js `>=20.0.0`.
- **Bundler:** `tsup` (bundles CLI into fast single-file ESM output with `#!/usr/bin/env node` banner for instant `npx` execution).
- **CLI Argument Parser:** `citty` (or `commander`).
- **Interactive TUI:** `@clack/prompts` (must gracefully bypass prompts when `--yes` / `-y` is passed or `CI=true`).
- **Schema & Validation:** `zod` + `zod-to-json-schema` (generates `spec/mcp.schema.json` directly from the TypeScript Zod schema so types and published schema never drift).
- **JSONC Manipulation:** `jsonc-parser` (mandatory for reading/modifying `.vscode/mcp.json`, `opencode.json`, and `.zed/settings.json` without stripping comments or formatting).
- **Testing:** `vitest` (unit tests for schema validation, env extraction, and every agent adapter).

### 2.1 `package.json` Requirements
- Package name: `agents-mcp`
- Binaries exposed:
	 ```json
  "bin": {
    "agents-mcp": "./dist/index.js",
    "mcpx": "./dist/index.js"
  }```
 - Scripts:   
	- `build`: `tsup src/index.ts --format esm --dts --clean --shims`  
	- `schema:gen`: `tsx scripts/generate-schema.ts` (outputs `spec/mcp.schema.json`)
  - `test`: `vitest run`

## 3. Directory Structure

```text
agents-mcp/
├── spec/
│   ├── SPEC.md                    # Formal human-readable specification of .agents/mcp.json
│   ├── MATRIX.md                  # Field-by-field translation matrix across agents
│   ├── mcp.schema.json            # Auto-generated JSON Schema from src/core/schema.ts
├── scripts/
│   └── generate-schema.ts         # Script to emit spec/mcp.schema.json from Zod
├── src/
│   ├── core/
│   │   ├── schema.ts              # Canonical Zod schema & TypeScript types
│   │   ├── store.ts               # Atomic read/write/validate for .agents/mcp.json & ~/.agents/mcp.json
│   │   ├── env.ts                 # ${VAR} extraction, secret scrubbing, and .env.example sync
│   │   └── gitignore.ts           # Safe management of derived agent files in .gitignore
│   ├── sources/
│   │   ├── types.ts               # SourceResolver interface & ResolvedServerPackage DTO
│   │   ├── direct.ts              # CLI flags resolver (--stdio, --http, --sse, --env, --header)
│   │   ├── github.ts              # Fetches server.json or package.json from GitHub repos (owner/repo)
│   │   └── registry.ts            # Queries official MCP Registry API / npm registry
│   ├── adapters/
│   │   ├── types.ts               # AgentAdapter interface & ConfigScope type
│   │   ├── claude-code.ts         # .mcp.json (project) & ~/.claude.json (global)
│   │   ├── cursor.ts              # .cursor/mcp.json (project) & ~/.cursor/mcp.json (global)
│   │   ├── vscode.ts              # .vscode/mcp.json (project) & user settings mcp.json (global)
│   │   ├── opencode.ts            # opencode.json (project) & ~/.config/opencode/opencode.json (global)
│   │   ├── windsurf.ts            # ~/.codeium/windsurf/mcp_config.json (global)
│   │   ├── zed.ts                 # .zed/settings.json (project) & ~/.config/zed/settings.json (global)
│   │   └── index.ts               # Adapter registry & auto-detection logic
│   ├── commands/
│   │   ├── init.ts                # Initialize .agents/mcp.json & configure .gitignore
│   │   ├── import.ts              # Migrate existing agent configs into .agents/mcp.json
│   │   ├── add.ts                 # Resolve source -> write to .agents/mcp.json -> sync
│   │   ├── sync.ts                # Compile .agents/mcp.json to selected/detected agents
│   │   ├── remove.ts              # Remove server from .agents/mcp.json & clean derived files
│   │   ├── list.ts                # Display configured servers, targets, and sync status
│   │   └── doctor.ts              # Validate schema, env vars, runtime binaries, and sync drift
│   ├── ui/
│   │   └── prompts.ts             # Wrapper around @clack/prompts supporting --yes / non-TTY
│   └── index.ts                   # CLI entrypoint
├── tests/
│   ├── core/
│   └── adapters/
├── package.json
└── tsconfig.json
```

## 4. Canonical Specification (v0.1.0)

### 4.1 Design Rules

1.  **File Paths:**
    -   Project scope: `<project-root>/.agents/mcp.json`
    -   Global scope: `~/.agents/mcp.json`
2.  **Mandatory `$schema`:** Every valid file MUST include `"$schema": "https://agents-mcp.dev/schema/v0.1.0/mcp.schema.json"`.
3.  **No `version` property:** Versioning is governed exclusively by the `$schema` URL.
4.  **Explicit `transport`:** Every server entry MUST declare `"transport": "stdio" | "http" | "sse"`.
5.  **Secret Interpolation:** Secrets MUST use POSIX-style placeholders (`${VAR_NAME}` or `${VAR_NAME:-default}`). Plaintext secrets detected during `import` or `add` MUST be extracted into `.env`/`.env.example` and replaced with `${VAR_NAME}`.
6.  **Agent Targeting (`targets`):** Optional array of canonical agent IDs (e.g., `["claude-code", "opencode"]`). If omitted, the server compiles to all active/detected agents.

### 4.2 Canonical Example

```json
{
  "$schema": "https://agents-mcp.dev/schema/v0.1.0/mcp.schema.json",
  "servers": {
    "github": {
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "postgres": {
      "transport": "stdio",
      "command": "uvx",
      "args": ["mcp-server-postgres", "${DATABASE_URL}"],
      "targets": ["claude-code", "opencode"],
      "disabled": false
    },
    "linear": {
      "transport": "http",
      "url": "https://mcp.linear.app/mcp",
      "headers": {
        "Authorization": "Bearer ${LINEAR_API_KEY}"
      }
    }
  }
}
```

### 4.3 `src/core/schema.ts` Implementation

```typescript
import { z } from 'zod';

// $ - alias configurado no tsconfig.json para a raiz do projeto
// Fazer assert json caso necessário para os padrões de tipagem
import pkg from '$/src/package.json'

export const SPEC_VERSION = pkg.version; // - O build deve ser executado antes da publicação.
export const SITE_URL = process.env.AGENTS_MCP_SITE_URL.replace(/\/+$/, '');
export const DEFAULT_SCHEMA_URL = `${SITE_URL}/schema/${SPEC_VERSION}/mcp.schema.json`;

export const AgentIdSchema = z.enum([
  'claude-code',
  'cursor',
  'vscode',
  'opencode',
  'windsurf',
  'zed',
]);

export type AgentId = z.infer<typeof AgentIdSchema>;

const BaseServerSchema = z.object({
  disabled: z.boolean().optional(),
  targets: z.array(AgentIdSchema).optional(),
});

export const StdioServerSchema = BaseServerSchema.extend({
  transport: z.literal('stdio'),
  command: z.string().min(1),
  args: z.array(z.string()).default([]),
  env: z.record(z.string(), z.string()).optional(),
  cwd: z.string().optional(),
});

export const RemoteServerSchema = BaseServerSchema.extend({
  transport: z.enum(['http', 'sse']),
  url: z.string().url(),
  headers: z.record(z.string(), z.string()).optional(),
});

export const CanonicalServerSchema = z.discriminatedUnion('transport', [
  StdioServerSchema,
  RemoteServerSchema,
]);

export const CanonicalMcpConfigSchema = z.object({
  $schema: z.string().url(),
  servers: z.record(z.string(), CanonicalServerSchema),
});

export type CanonicalServer = z.infer<typeof CanonicalServerSchema>;
export type CanonicalMcpConfig = z.infer<typeof CanonicalMcpConfigSchema>;
```

## 5. Agent Adapters & Compilation Matrix (`src/adapters/`)

### 5.1 `AgentAdapter` Interface (`src/adapters/types.ts`)

```typescript
import type { AgentId, CanonicalServer } from '../core/schema.js';

export type ConfigScope = 'project' | 'global';

export interface AgentAdapter {
  readonly id: AgentId;
  readonly displayName: string;
  readonly supportsProjectScope: boolean;
  readonly supportsGlobalScope: boolean;

  /** Returns the target file path for the given scope, or null if unsupported */
  getConfigPath(scope: ConfigScope, cwd: string): string | null;

  /** Heuristic detection: checks if agent config dir/file exists or binary is in PATH */
  detect(scope: ConfigScope, cwd: string): Promise<boolean>;

  /** Parses existing native config (JSON/JSONC) into canonical servers for `import` */
  extractServers(rawContent: string): Record<string, CanonicalServer>;

  /**
   * Non-destructively merges compiled servers into existing raw JSON/JSONC content.
   * - Respects `server.disabled`: omits server for agents without native disable flags,
   *   or maps to native flag (`enabled: false` in OpenCode).
   * - Respects `server.targets`: skips servers whose `targets` exclude `this.id`.
   * - Removes servers present in `previousManagedNames` that were deleted from canonical config.
   * - Preserves all unrelated keys and JSONC comments via `jsonc-parser` `modify()` + `applyEdits()`.
   */
  applyServers(
    existingRawContent: string | null,
    servers: Record<string, CanonicalServer>,
    previousManagedNames?: Set<string>
  ): string;
}
```

### 5.2 Exact Translation Rules per Agent

| Agent (`id`) | Project Path | Global Path | Root Key | `stdio` Mapping | `http` / `sse` Mapping | Env Interpolation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`claude-code`** | `.mcp.json` | `~/.claude.json` | `mcpServers` | `{ "type": "stdio", "command", "args", "env" }` (omit if `disabled: true`) | `{ "type": "http"\|"sse", "url", "headers" }` | Native `${VAR}` / `${VAR:-default}` |
| **`cursor`** | `.cursor/mcp.json` | `~/.cursor/mcp.json` | `mcpServers` | `{ "command", "args", "env" }` (omit if `disabled: true`) | `{ "url", "headers" }` | Convert `${VAR}` -> `${env:VAR}` |
| **`vscode`** | `.vscode/mcp.json` | OS User Profile `mcp.json` | `servers` | `{ "type": "stdio", "command", "args", "env" }` (omit if `disabled: true`) | `{ "type": "http"\|"sse", "url", "headers" }` | Convert `${VAR}` -> `${env:VAR}` |
| **`opencode`** | `opencode.json` | `~/.config/opencode/opencode.json` | `mcp` | `{ "type": "local", "command": [command, ...args], "environment": env, "enabled": !disabled }` | `{ "type": "remote", "url", "headers", "enabled": !disabled }` | Convert `${VAR}` -> `{env:VAR}` |
| **`windsurf`** | *(Unsupported)* | `~/.codeium/windsurf/mcp_config.json` | `mcpServers` | `{ "command", "args", "env" }` (omit if `disabled: true`) | `{ "serverUrl": url, "headers" }` | Convert `${VAR}` -> `${env:VAR}` |
| **`zed`** | `.zed/settings.json` | `~/.config/zed/settings.json` | `context_servers` | `{ "command": { "path": command, "args", "env" } }` (omit if `disabled: true`) | `{ "url", "headers" }` | Native `${VAR}` |

### 5.3 Critical Adapter Implementation Details

1.  **JSONC & Non-Destructive Preservation:** Every `applyServers` implementation MUST use `modify()` and `applyEdits()` from `jsonc-parser` with formatting options `{ tabSize: 2, insertSpaces: true }` instead of `JSON.stringify()` over the whole file. This prevents destroying user comments and unrelated settings in `.vscode/mcp.json`, `opencode.json`, `.zed/settings.json`, and especially global `~/.claude.json` (which stores general Claude Code state such as projects, history, and flags alongside `mcpServers`). For `vscode` global scope, resolve the OS-specific User Profile path (`~/.config/Code/User/mcp.json` on Linux, `~/Library/Application Support/Code/User/mcp.json` on macOS, `%APPDATA%\Code\User\mcp.json` on Windows).
    
2.  **State Tracking for Removals:** Store a lightweight local state file `.agents/.mcp-sync-state.json` (gitignored) listing which server names were last synced to each adapter. When a server is removed from `.agents/mcp.json` (or `disabled: true` is set for an agent that lacks native disable support), `sync` uses `.mcp-sync-state.json` to cleanly delete only managed entries without touching unmanaged manual entries in the user's native agent config.

3.  **Fallbacks (`${VAR:-default}`) & `cwd` Translation:** Preserve `${VAR:-default}` natively for agents that support it (`claude-code`); for agents without native fallback syntax (`cursor`, `vscode`, `opencode`, `windsurf`, `zed`), discard the `:-default` suffix during translation and emit a warning. Similarly, pass `cwd` through when supported by the target agent, or omit it with a warning when unsupported.
    

## 6. Source Resolvers (`src/sources/`)

The `add <source>` command resolves server definitions in the following order:

1.  **Direct Flags (`src/sources/direct.ts`):**
    -   Triggered when `--stdio` or `--http` / `--sse` is provided.
    -   Example: `agents-mcp add postgres --stdio "uvx mcp-server-postgres" --env DATABASE_URL`
    -   Splits command string safely into `command` and `args`.
2.  **Remote URL (`src/sources/direct.ts`):**
    -   Triggered when `<source>` starts with `http://` or `https://`.
    -   Defaults to `transport: "http"` (overridable via `--sse`). Derives `suggestedName` from hostname/path.
3.  **GitHub Repository (`src/sources/github.ts`):**
    -   Triggered when `<source>` matches `owner/repo` (or `https://github.com/owner/repo`).
    -   Fetches `https://raw.githubusercontent.com/<owner>/<repo>/main/server.json` (falling back to `master`).
    -   If `server.json` exists (official MCP manifest standard), parses `packages` (preferring `npm` $\rightarrow$ `npx -y <identifier>`, then `pypi` $\rightarrow$ `uvx <identifier>`, then `oci` $\rightarrow$ `docker run -i --rm <identifier>`) and extracts `environment_variables` where `is_required: true`.
    -   If `server.json` does not exist, falls back to inspecting `package.json` (`bin` / `name`) to construct an `npx -y` stdio entry.
4.  **Official MCP Registry & npm (`src/sources/registry.ts`):**
    -   Queries the official MCP Registry (`https://registry.modelcontextprotocol.io/v0/servers?search=<query>`) or npm registry (`https://registry.npmjs.org/<pkg>`) when `<source>` is a package name (e.g., `@modelcontextprotocol/server-github`).

## 7. CLI Commands Specification (`src/commands/`)

All commands accept global flags:

-   `--global` / `-g`: Operate on `~/.agents/mcp.json` and global agent paths instead of project scope.
-   `--yes` / `-y`: Skip all interactive prompts and accept defaults (essential for CI/scripts).
-   `--agents <list>`: Comma-separated target agents (e.g., `--agents claude-code,opencode`), overriding auto-detection.

### 7.1 `agents-mcp init`

1.  Checks if `.agents/mcp.json` already exists. If so, warns and exits unless `--force` is passed.
2.  Creates `.agents/mcp.json` with `$schema` and `"servers": {}`.
3.  Runs agent auto-detection across the workspace and machine; prompts user via `@clack/prompts` multiselect to confirm active agents.
4.  Prompts user: _"Add generated agent config files (e.g., .mcp.json, .cursor/mcp.json) to .gitignore so only .agents/mcp.json is tracked?"_ (Default: `Yes`). Appends a managed `# agents-mcp generated` block to `.gitignore` and adds `.agents/.mcp-sync-state.json`.

### 7.2 `agents-mcp import`

**Critical onboarding command for existing repositories.**

1.  Scans all supported agent config paths in the current scope (`claude-code`, `cursor`, `vscode`, `opencode`, `windsurf`, `zed`).
2.  Calls `extractServers()` on each discovered file.
    
3.  Deduplicates servers by name:
    -   If identical definitions exist across files, merges silently.
    -   If conflicting definitions exist for the same server name, prompts user to pick which version to keep (or picks first with warning under `--yes`).
        
4.  **Secret Hygiene:** Scans `env` values, `headers`, and sensitive arguments/URL query parameters for literal secrets (strings not already wrapped in `${...}`). Prompts to extract them into `.env` (gitignored) + `.env.example` (empty keys) and replaces values in `.agents/mcp.json` with `${VAR_NAME}`.
    
5.  Writes `.agents/mcp.json`.
    
6.  If `--clean` is passed (or confirmed interactively), deletes standalone legacy files (`.mcp.json`, `.cursor/mcp.json`, `.vscode/mcp.json`) or removes the MCP key from shared settings files (`opencode.json`, `.zed/settings.json`), then runs `sync` for active agents.

### 7.3 `agents-mcp add <source>`

1.  Resolves `<source>` via `src/sources/` into `ResolvedServerPackage`.
2.  Prompts for server alias (defaulting to `suggestedName`, overridable via `--name <alias>`).
3.  For `stdio` servers, prompts for the working directory (`cwd`), defaulting to the project root (omitting `cwd` when left as the default). In direct/non-interactive mode (`--yes` or direct CLI flags), defaults to the project root unless `--cwd <dir>` is explicitly passed.
4.  For each `requiredEnvVars` entry:
    -   Checks 2 levels: 1) local `.env` file, 2) host system environment (`process.env`).
    -   If not found (or when adding interactively), notifies the user and prompts for the value (masked input if `isSecret`), writes the actual value to `.env`, appends `KEY=` to `.env.example`, and stores `"${KEY}"` in `.agents/mcp.json`.
5.  Optionally prompts for `targets` (default: all agents).
6.  Writes server entry to `.agents/mcp.json` and automatically invokes `sync`.
    

### 7.4 `agents-mcp sync`

1.  Reads and validates `.agents/mcp.json` against `CanonicalMcpConfigSchema`.
2.  Determines target agents (`--agents` flag $\rightarrow$ previously synced agents in `.mcp-sync-state.json` $\rightarrow$ auto-detected agents).
3.  Compiles servers for each target agent via `adapter.applyServers()`, filtering by `server.targets` and handling `server.disabled`.
4.  Updates `.agents/.mcp-sync-state.json` and prints a concise summary table of synced files.

### 7.5 `agents-mcp remove <name>`

1.  Removes `<name>` from `servers` in `.agents/mcp.json`.
2.  Runs `sync` so all derived agent configs immediately drop `<name>`.

### 7.6 `agents-mcp list`

1.  Reads `.agents/mcp.json` (and optionally `~/.agents/mcp.json` with `--all`).
2.  Displays a clean terminal table showing: Server Name, Transport, Command/URL, Targets, Status (`enabled` / `disabled`), and Sync State across detected agents.

### 7.7 `agents-mcp doctor`

Runs diagnostic checks and exits with code `1` if errors are found:

1.  **Schema Check:** Validates `.agents/mcp.json` against `CanonicalMcpConfigSchema`.
2.  **Env Check:** Parses all `${VAR}` references; verifies every variable without a `:-default` fallback is defined in `.env` or `process.env`.
3.  **Runtime Check:** For `stdio` servers, verifies `command` (`npx`, `uvx`, `node`, `python`, `docker`, or local binary path) exists and is executable in `PATH`.
4.  **Drift Check:** Compares compiled output against actual files on disk for detected agents; flags any out-of-sync files and advises running `agents-mcp sync`.

## 8. Secret & Environment Management (`src/core/env.ts`)

1.  **Placeholder Regex:** `/\$\{([A-Z0-9_]+)(?::-([^}]*))?\}/g`
2.  **2-Level Variable Resolution:** Resolve `${VAR_NAME}` in 2 levels: (1) local `.env` file, then (2) host system environment variables (`process.env`). If a referenced variable without a `:-default` fallback is not found in either level, notify/warn the user.
3.  **Secret Detection Heuristic (during `import`):**
    -   Any `env` value, `Authorization`/`x-api-key` header value, or sensitive token/connection string in `args` / `url` that does **not** match `/^\$\{.+\}$/` and is non-empty is flagged as a potential hardcoded secret.
    -   Automatically derives a clean uppercase variable name (e.g., server `github` + key `GITHUB_PERSONAL_ACCESS_TOKEN` $\rightarrow$ `${GITHUB_PERSONAL_ACCESS_TOKEN}`).
4.  **`.env` & `.env.example` Sync:**
    -   Never overwrites existing keys in `.env`.
    -   Ensures `.env` is listed in `.gitignore` before writing any secret to disk.
    -   Appends missing keys to `.env.example` as `KEY=` so teammates know which environment variables are required after cloning.

## 9. Definition of Done for `v0.1.0`

-   [ ] `scripts/generate-schema.ts` generates a valid Draft-07 `spec/mcp.schema.json` matching `CanonicalMcpConfigSchema`.
-   [ ] All 6 adapters (`claude-code`, `cursor`, `vscode`, `opencode`, `windsurf`, `zed`) have unit tests covering both `extractServers()` and `applyServers()`, including JSONC comment preservation and env interpolation translation (`${VAR}` $\leftrightarrow$ `${env:VAR}` / `{env:VAR}`).
-   [ ] `init`, `import`, `add`, `sync`, `remove`, `list`, and `doctor` work in both interactive TTY mode and non-interactive `--yes` mode.
-   [ ] `tsup` builds cleanly into `dist/index.js` with zero runtime errors on Node 20+.
-   [ ] `spec/SPEC.md` and `spec/MATRIX.md` are complete and ready to deploy alongside `spec/mcp.schema.json` at `https://agents-mcp.dev/schema/v0.1.0/mcp.schema.json`.
