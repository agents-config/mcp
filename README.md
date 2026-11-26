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

### Portable lock file

The lock is deterministic and portable, so a project lock can be committed and shared:

```json
{
  "version": 2,
  "scope": "project",
  "targets": ["cursor", "vscode"],
  "agents": {
    "cursor": {
      "path": ".cursor/mcp.json",
      "names": ["github"],
      "updatedAt": "2026-11-26T12:00:00.000Z"
    },
    "vscode": {
      "path": ".vscode/mcp.json",
      "names": ["github"],
      "updatedAt": "2026-11-26T12:00:00.000Z"
    }
  },
  "managedPlugins": ["github"]
}
```

- **Paths are metadata.** `agents[].path` records where the lock was written for diagnostics only; it is never used for I/O. Native paths are always resolved from the adapter.
- **Project scope:** paths are relative to the repository root with `/` separators (`.mcp.json`, `.cursor/mcp.json`, `.vscode/mcp.json`, `opencode.json`, `.zed/settings.json`, `.agents/plugins`).
- **Global scope:** paths use `~/`, `$XDG_CONFIG_HOME/`, or `$APPDATA/` (for example `~/.claude.json`, `~/.cursor/mcp.json`, `~/.config/Code/User/mcp.json`). Absolute paths, drive letters, UNC prefixes, backslashes, and `..` segments are never persisted.
- **Deterministic output:** fixed key order, agents in a stable order, sorted and deduplicated names/plugins, two-space JSON with a trailing newline. The file is not rewritten when its content is already byte-identical, and `updatedAt` changes only when an agent's portable path or managed names change.
- **Zero-diff workflow:** commit `.agents/mcp-lock.json`; a second machine or workspace with the same `.agents/mcp.json` and targets reproduces it byte-for-byte. Global locks may legitimately differ across operating systems.
- **No migration:** `version: 2` is the only supported schema. A `version: 1` lock is ignored with a warning and replaced by the next successful `sync`; a legacy `.mcp-sync-state.json` is never read and is left untouched on disk.

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
