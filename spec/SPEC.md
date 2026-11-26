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

1. **Sync state:** Implementations MAY keep a local lock file at `.agents/mcp-lock.json` (project scope) and `~/.agents/mcp-lock.json` (global scope). Its format is implementation-defined. When an implementation persists the schema used by `agents-mcp`, `version: 2` is the only supported contract: `agents[].path` MUST be portable metadata — relative to the repository root with `/` separators for project scope, or prefixed with `~/`, `$XDG_CONFIG_HOME/`, or `$APPDATA/` for global scope — and MUST NOT contain absolute paths, drive letters, UNC prefixes, backslashes, or `..` segments. The recorded path MUST NOT be used for I/O; native paths are resolved from the adapter. Implementations MUST NOT read a legacy `.agents/.mcp-sync-state.json` file as a fallback and MUST NOT migrate a `version: 1` lock; an unsupported lock is ignored with a warning and replaced on the next successful write. Implementations MUST NOT add the lock file (or its legacy name) to `.gitignore` automatically; implementers MAY version it. The lock MUST NOT be required by conformant readers of `.agents/mcp.json`.
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
