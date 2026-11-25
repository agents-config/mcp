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
