# Unified Agents MCP Configuration Specification (`v0.1.0`)

**Status:** Approved (`v0.1.0`)  
**Schema URI:** `https://agents-mcp.dev/schema/v0.1.0/mcp.schema.json`  
**License:** CC0 1.0 Universal (Public Domain)

---

## 1. Abstract

The **Unified Agents MCP Configuration** (`.agents/mcp.json`) defines a standardized, tool-agnostic file format and directory convention for declaring **Model Context Protocol (MCP)** servers across AI coding agents, IDEs, and CLI assistants.

As developers increasingly use multiple AI coding agents within the same codebase (e.g., Claude Code, Cursor, VS Code Copilot, OpenCode, Windsurf, Zed), maintaining separate, divergent MCP configuration files creates configuration drift, duplicated effort, and accidental secret exposure.

Across the ecosystem, all major AI coding agents have already converged on the `.agents/` directory (notably `.agents/skills`) as the shared standard for agent capabilities. Adopting `.agents/mcp.json` within that same namespace is the natural architectural progression—consolidating skills and MCP tool definitions under one predictable, repository-friendly convention rather than introducing another fragmented root-level configuration file. This specification establishes `.agents/mcp.json` as the single source of truth for workspace and user-level MCP server definitions.

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
| `transport` | `"stdio" \| "http"` | **Yes** | — | Explicitly defines the MCP transport protocol. |
| `disabled` | `boolean` | No | `false` | When `true`, the server is temporarily inactive and MUST NOT be loaded by target agents. |
| `targets` | `string[]` | No | *(All agents)* | Optional non-empty allowlist of canonical agent IDs (e.g., `["claude-code", "opencode"]`) that should load this server. Values MUST be canonical IDs from §6; an empty array is invalid. When omitted, the server applies to all agents. |

### 4.2 Local Process Transport (`transport: "stdio"`)

Used for MCP servers spawned as local child processes communicating over standard input/output.

| Property | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `transport` | `"stdio"` | **Yes** | — | Discriminator for local process servers. |
| `command` | `string` | **Yes** | — | Executable binary or runtime command (e.g., `"npx"`, `"uvx"`, `"node"`, `"docker"`). |
| `args` | `string[]` | No | `[]` | Ordered list of command-line arguments passed to `command`. |
| `env` | `Record<string, string>` | No | `{}` | Key-value map of environment variables injected into the server process. |
| `cwd` | `string` | No | *(Project root)* | Optional working directory for the child process. |

> **Compiler support for `cwd`:** The canonical field is preserved as-is. In `v0.1.0`, none of the supported agents exposes a documented native working-directory field, so compilers MUST omit `cwd` with a warning. Adapters MAY start emitting it once a target agent documents native support, without requiring a schema change.

### 4.3 Remote Network Transport (`transport: "http"`)

Used for remote MCP servers accessed over Streamable HTTP.

The format defines exactly two transport discriminators: `"stdio"` and `"http"`. Any other value is invalid. Implementations importing existing agent files whose native format does not distinguish transports, or that expose only a `url`, MUST treat the entry as `"http"` and emit a warning.

| Property | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `transport` | `"http"` | **Yes** | — | Discriminator for remote network servers. |
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

## 8. Implementer Guidelines (For Agent Maintainers)

AI coding agent maintainers wishing to adopt native support for `.agents/mcp.json` SHOULD implement the following loading lifecycle:

1.  **Discovery:** Check for `<project-root>/.agents/mcp.json` and `~/.agents/mcp.json` during workspace initialization.
2.  **Filtering:** Ignore any server where `disabled === true`, or where `targets` is defined and does not include the agent's canonical ID.
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

The `$schema` URI is the single version identifier. It MUST resolve to `https://agents-mcp.dev/schema/v<major>.<minor>.<patch>/mcp.schema.json`, and the published schema document MUST set its `$id` to that same URI. Implementations SHOULD accept any structurally valid file and SHOULD warn — not fail — when `$schema` points to a different version than the one they implement. There is no `version` property inside the file.
