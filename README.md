# agents-mcp

**One `.agents/mcp.json` to rule them all.** 

A tool-agnostic specification and CLI compiler for managing Model Context Protocol (MCP) servers across Claude Code, Cursor, VS Code, OpenCode, Windsurf, and Zed.

[![npm version](https://img.shields.io/npm/v/agents-mcp.svg)](https://www.npmjs.com/package/agents-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Spec: v0.1.0](https://img.shields.io/badge/Spec-v0.1.0-emerald.svg)](./spec/SPEC.md)

---

## Why?

Modern software engineering is no longer tied to a single AI coding assistant. You might use **Claude Code** or **OpenCode** in the terminal, **Cursor** or **VS Code** in the editor, and **Zed** for quick edits—all inside the same repository.

While instructions and reusable workflows have started converging around `.agents/skills` and `AGENTS.md`, **MCP configuration remains completely fragmented**:

- **Claude Code** expects `.mcp.json` with `"mcpServers"` and `${VAR}`
- **Cursor** expects `.cursor/mcp.json` with `"mcpServers"` and `${env:VAR}`
- **VS Code** expects `.vscode/mcp.json` with `"servers"` and `${env:VAR}`
- **OpenCode** expects `opencode.json` with `"mcp"`, `"command"` as an array, `"environment"`, and `{env:VAR}`
- **Zed** expects `.zed/settings.json` with `"context_servers"` and nested `"command": { "path", "args" }`

Every time you add an MCP server or rotate a token, you end up copy-pasting JSON across four different files, translating environment variable syntaxes by hand, and risking accidental secret leaks in Git.

**`agents-mcp` fixes this at the root.**

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
      ┌──────────────┬─────────┴─────────┬──────────────┐ ◄── .gitignore
      ▼              ▼                   ▼              ▼
  .mcp.json   .cursor/mcp.json    .vscode/mcp.json   opencode.json
(Claude Code)     (Cursor)           (VS Code)        (OpenCode)
```

## Quick Start

### Already have MCPs scattered across your repo?

Migrate and unify everything in one command:

```bash
npx agents-mcp import --clean
```

This scans your workspace for existing agent configs (`.mcp.json`,  `.cursor/mcp.json`,  `.vscode/mcp.json`,  `opencode.json`,  `.zed/settings.json`), deduplicates servers, extracts hardcoded secrets into `.env` + `.env.example`, generates `.agents/mcp.json`, and keeps your active agents synced.

### Starting from scratch?

1. Initialize .agents/mcp.json and configure .gitignore for derived files:
`npx agents-mcp init`
2. Add an MCP server from GitHub, npm, MCP Registry, or direct flags
`npx agents-mcp add modelcontextprotocol/server-github`
3. Sync changes across all detected agents
`npx agents-mcp sync`

_Tip: Installing globally also exposes the short `mcpx` alias (`mcpx sync`)._

## Canonical Format (`.agents/mcp.json`)

Every `.agents/mcp.json` is backed by a strict JSON Schema (`https://[agents-mcp site url]/schema/vX.Y.Z/mcp.schema.json`) for instant autocomplete and validation in modern editors.

Example:

```json
{
  "$schema": "https://[agents-mcp site url]/schema/vX.Y.Z/mcp.schema.json",
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
      "targets": ["claude-code", "opencode"]
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

## Key Features

-   **Zero-Friction Onboarding (`import`):** Absorbs existing configurations from 6+ agents without manual rewriting.
-   **Non-Destructive JSONC Merging:** Uses AST-level edits (`jsonc-parser`) so comments and non-MCP settings in `opencode.json`,  `.vscode/mcp.json`, and `.zed/settings.json` are never wiped out.
-   **Secret Hygiene by Default:** Enforces `${VAR}` placeholders in versioned configs while syncing required keys to `.env` and `.env.example`.
-   **Per-Agent Targeting (`targets`):** Restrict heavy MCP servers to specific tools (e.g., UI servers only in Cursor/VS Code) to save context tokens elsewhere.
-   **Environment Diagnostics (`doctor`):** Validates schema compliance, checks missing `.env` variables, verifies local binaries (`npx`,  `uvx`,  `docker`), and detects configuration drift.
-   **Project & Global Scopes:** Works seamlessly at the repository level (`.agents/mcp.json`) or user level (`~/.agents/mcp.json` via `-g`).

## Supported Agents

| Agent | Project Config | Global Config | Env Syntax Translated |
| :--- | :--- | :--- | :--- |
| **Claude Code** | `.mcp.json` | `~/.claude.json` | `${VAR}` |
| **Cursor** | `.cursor/mcp.json` | `~/.cursor/mcp.json` | `${env:VAR}` |
| **VS Code** | `.vscode/mcp.json` | User Profile `mcp.json` | `${env:VAR}` |
| **OpenCode** | `opencode.json` | `~/.config/opencode/opencode.json` | `{env:VAR}` |
| **Windsurf** | *(Global only)* | `~/.codeium/windsurf/mcp_config.json` | `${env:VAR}` |
| **Zed** | `.zed/settings.json` | `~/.config/zed/settings.json` | `${VAR}` |

See the full field-by-field translation rules in [`spec/MATRIX.md`](https://www.google.com/search?q=./spec/MATRIX.md).

## CLI Reference

| Command | Description |
| :--- | :--- |
| `agents-mcp init` | Scaffold `.agents/mcp.json` and optionally gitignore derived agent files |
| `agents-mcp import` | Consolidate existing agent MCP configs into `.agents/mcp.json` |
| `agents-mcp add <source>` | Install an MCP server from GitHub, npm, MCP Registry, or CLI flags |
| `agents-mcp sync` | Compile `.agents/mcp.json` into all active agent config files |
| `agents-mcp remove <name>` | Remove a server and clean it from all derived agent configs |
| `agents-mcp list` | Inspect configured servers, targets, and sync state |
| `agents-mcp doctor` | Audit schema validity, env vars, runtime binaries, and drift |

_Tip: Installing globally also exposes the short `mcpx` alias (`mcpx sync`)._

## Open Specification

The `.agents/mcp.json` format is an open, public-domain specification ([CC0 1.0](https://www.google.com/search?q=./spec/SPEC.md)).

-   **Formal Specification:**  [`spec/SPEC.md`](https://www.google.com/search?q=./spec/SPEC.md)
-   **JSON Schema:**  [`spec/mcp.schema.json`](https://www.google.com/search?q=./spec/mcp.schema.json)
-   **Agent Translation Matrix:**  [`spec/MATRIX.md`](https://www.google.com/search?q=./spec/MATRIX.md)
    

**Are you an AI agent or editor maintainer?**

You don't need to depend on this CLI to support `.agents/mcp.json`. Check the [Implementer Guidelines](spec/SPEC.md#8.implementer-guidelines-for-agent-maintainers) to add native fallback loading in under 50 lines of code.

## Contributing & License

Contributions, new agent adapters, and spec feedback are welcome. Open an issue or submit a PR!

-   **CLI Source Code:** MIT License
-   **Specification (`spec/`):** CC0 1.0 Universal (Public Domain)
