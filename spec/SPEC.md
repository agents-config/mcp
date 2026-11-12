# Unified Agents MCP Configuration Specification (`v0.1.0`)

**Status:** Draft Specification  
**Schema URI:** `https://[agents-mcp site url]/schema/v0.1.0/mcp.schema.json`  
**License:** CC0 1.0 Universal (Public Domain)

---

## 1. Abstract

The **Unified Agents MCP Configuration** (`.agents/mcp.json`) defines a standardized, tool-agnostic file format and directory convention for declaring **Model Context Protocol (MCP)** servers across AI coding agents, IDEs, and CLI assistants.

As developers increasingly use multiple AI coding agents within the same codebase (e.g., Claude Code, Cursor, VS Code Copilot, OpenCode, Windsurf, Zed), maintaining separate, divergent MCP configuration files creates configuration drift, duplicated effort, and accidental secret exposure. This specification establishes `.agents/mcp.json` as the single source of truth for workspace and user-level MCP server definitions.

---

## 2. File Locations & Precedence

Conformant tools and compilers MUST resolve configuration files using the following conventions:

1. **Project Scope (Workspace):** `<project-root>/.agents/mcp.json`  
   Intended to be version-controlled in Git and shared across the engineering team.
2. **Global Scope (User):** `~/.agents/mcp.json`  
   Intended for personal MCP servers and user-wide credentials across all projects.

### 2.1 Resolution & Merging Rules
When both scopes exist, conformant tools SHOULD load `~/.agents/mcp.json` as the base layer and merge `<project-root>/.agents/mcp.json` on top. If a server key exists in both files, the project-level definition takes precedence over the global definition.

---

## 3. Document Structure

A valid configuration file MUST be a UTF-8 encoded JSON object conforming to the published JSON Schema (`Draft-07`).

### 3.1 Top-Level Properties

| Property | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `$schema` | `string` (URI) | **Yes** | MUST point to a valid specification schema URI (e.g., `https://agents-mcp.dev/schema/v0.1.0/mcp.schema.json`). Serves as both editor validation target and format version identifier. |
| `servers` | `object` | **Yes** | A map of unique logical server identifiers (keys) to server configuration objects (values). |

> **Note on Versioning:** A separate `version` property is intentionally omitted. Schema evolution is governed strictly by the `$schema` URI.

---

## 4. Server Definitions

Each entry inside `servers` is a discriminated union keyed by the required `transport` property.

### 4.1 Common Properties (All Transports)

| Property | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `transport` | `"stdio" \| "http" \| "sse"` | **Yes** | — | Explicitly defines the MCP transport protocol. |
| `disabled` | `boolean` | No | `false` | When `true`, the server is temporarily inactive and MUST NOT be loaded by target agents. |
| `targets` | `string[]` | No | *(All agents)* | Optional allowlist of canonical agent IDs (e.g., `["claude-code", "opencode"]`) that should load this server. When omitted, the server applies to all agents. |

### 4.2 Local Process Transport (`transport: "stdio"`)

Used for MCP servers spawned as local child processes communicating over standard input/output.

| Property | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `transport` | `"stdio"` | **Yes** | — | Discriminator for local process servers. |
| `command` | `string` | **Yes** | — | Executable binary or runtime command (e.g., `"npx"`, `"uvx"`, `"node"`, `"docker"`). |
| `args` | `string[]` | No | `[]` | Ordered list of command-line arguments passed to `command`. |
| `env` | `Record<string, string>` | No | `{}` | Key-value map of environment variables injected into the server process. |
| `cwd` | `string` | No | *(Project root)* | Optional working directory for the child process. |

### 4.3 Remote Network Transport (`transport: "http"` | `"sse"`)

Used for remote MCP servers accessed over Streamable HTTP (`"http"`) or legacy HTTP+SSE (`"sse"`).

| Property | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `transport` | `"http" \| "sse"` | **Yes** | — | Discriminator for remote network servers. |
| `url` | `string` (URI) | **Yes** | — | Full endpoint URL of the remote MCP server. |
| `headers` | `Record<string, string>` | No | `{}` | Key-value map of HTTP headers sent with requests (e.g., `Authorization`). |

---

## 5. Environment Variable Interpolation & Secret Hygiene

Because `.agents/mcp.json` is designed to be committed to version control, **plaintext secrets MUST NOT be stored inside the file**.

### 5.1 Placeholder Syntax
Conformant parsers and compilers MUST support POSIX-style variable interpolation inside string values of `args`, `env`, `url`, and `headers`:

* **Required variable:** `${VAR_NAME}`  
  Resolves to the value of `VAR_NAME` from the host environment or workspace `.env` file.
* **Variable with default fallback:** `${VAR_NAME:-default_value}`  
  Resolves to `VAR_NAME` if set and non-empty; otherwise evaluates to `default_value`.

### 5.2 Compilation to Target Agents
When projecting `.agents/mcp.json` into native agent files that use proprietary interpolation syntax, compilers MUST translate `${VAR_NAME}` into the target agent's native format (see `MATRIX.md`).

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
  "$schema": "https://[agents-mcp site url]/schema/v0.1.0/mcp.schema.json",
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

## 8. Implementer Guidelines (For Agent Maintainers)

AI coding agent maintainers wishing to adopt native support for `.agents/mcp.json` SHOULD implement the following loading lifecycle:

1.  **Discovery:** Check for `<project-root>/.agents/mcp.json` and `~/.agents/mcp.json` during workspace initialization.
2.  **Filtering:** Ignore any server where `disabled === true`, or where `targets` is defined and does not include the agent's canonical ID.
3.  **Interpolation:** Resolve `${VAR_NAME}` and `${VAR_NAME:-fallback}` against process environment variables and workspace `.env` files prior to spawning processes or opening network connections.
4.  **Precedence:** If a user also maintains a legacy agent-specific file (e.g.,  `.cursor/mcp.json`), agent-specific overrides MAY take precedence over `.agents/mcp.json` for local experimentation while this spec is under adoption.
