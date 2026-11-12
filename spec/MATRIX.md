# Agent Translation & Interoperability Matrix (`v0.1.0`)

This document defines the exact deterministic mapping between the canonical `.agents/mcp.json` specification and the native configuration formats required by supported AI coding agents.

---

## 1. Summary Mapping Table

| Agent (`id`) | Project Path | Global Path | Root Key | `stdio` Mapping | `http` / `sse` Mapping | Env Interpolation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`claude-code`** | `.mcp.json` | `~/.claude.json` | `mcpServers` | `{ "type": "stdio", "command", "args", "env" }` *(omit if `disabled: true`)* | `{ "type": "http"\|"sse", "url", "headers" }` | Native `${VAR}` / `${VAR:-default}` |
| **`cursor`** | `.cursor/mcp.json` | `~/.cursor/mcp.json` | `mcpServers` | `{ "command", "args", "env" }` *(omit if `disabled: true`)* | `{ "url", "headers" }` | Convert `${VAR}` -> `${env:VAR}` |
| **`vscode`** | `.vscode/mcp.json` | OS User Profile `mcp.json` | `servers` | `{ "type": "stdio", "command", "args", "env" }` *(omit if `disabled: true`)* | `{ "type": "http"\|"sse", "url", "headers" }` | Convert `${VAR}` -> `${env:VAR}` |
| **`opencode`** | `opencode.json` | `~/.config/opencode/opencode.json` | `mcp` | `{ "type": "local", "command": [command, ...args], "environment": env, "enabled": !disabled }` | `{ "type": "remote", "url", "headers", "enabled": !disabled }` | Convert `${VAR}` -> `{env:VAR}` |
| **`windsurf`** | *(Unsupported)* | `~/.codeium/windsurf/mcp_config.json` | `mcpServers` | `{ "command", "args", "env" }` *(omit if `disabled: true`)* | `{ "serverUrl": url, "headers" }` | Convert `${VAR}` -> `${env:VAR}` |
| **`zed`** | `.zed/settings.json` | `~/.config/zed/settings.json` | `context_servers` | `{ "command": { "path": command, "args", "env" } }` *(omit if `disabled: true`)* | `{ "url", "headers" }` | Native `${VAR}` *(discard `:-default`)* |

> **Notes on Optional Fields & Fallbacks:**
> - **`cwd` (`stdio`):** Optional working directory (defaults to the project root when omitted). Compilers pass `cwd` through when supported by the target agent's native schema, or omit it with a warning when unsupported.
> - **`${VAR:-default}`:** Preserved natively for `claude-code`. For agents without native default-value syntax (`cursor`, `vscode`, `opencode`, `windsurf`, `zed`), the `:-default` suffix is discarded when translating to `${env:VAR}`, `{env:VAR}`, or `${VAR}`, with a compiler warning.

---

## 2. Canonical Input Reference

All side-by-side outputs in Section 3 are compiled from this canonical `.agents/mcp.json`:

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

## 3. Compiled Agent Outputs

### 3.1 Claude Code (`claude-code`)

-   **Target File:**  `.mcp.json` (project) / `~/.claude.json` (global)
-   **Notes:** Supports `${VAR}` and `${VAR:-default}` natively. Lacks an inline `disabled` flag in `.mcp.json`, so disabled servers are omitted during compilation. In global scope, `~/.claude.json` stores general Claude Code state (projects, history, flags, etc.) alongside `mcpServers`, so compilers MUST perform a non-destructive merge rather than overwriting the file.

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

### 3.2 Cursor (`cursor`)

-   **Target File:**  `.cursor/mcp.json` (project) / `~/.cursor/mcp.json` (global)
-   **Notes:** Requires `${env:VAR}` syntax for environment variable expansion. Omits `type` on `stdio` and `http` entries.

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

### 3.3 Visual Studio Code (`vscode`)

-   **Target File:**  `.vscode/mcp.json` (project) / OS User Profile `mcp.json` (global: `~/.config/Code/User/mcp.json` on Linux, `~/Library/Application Support/Code/User/mcp.json` on macOS, `%APPDATA%\Code\User\mcp.json` on Windows)
-   **Notes:** Uses `"servers"` as the root key instead of `"mcpServers"` and requires `${env:VAR}` syntax. Compilers MUST preserve existing `"inputs"` arrays and JSONC comments.

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

### 3.4 OpenCode (`opencode`)

-   **Target File:**  `opencode.json` (project) / `~/.config/opencode/opencode.json` (global)
-   **Notes:** Uses `"mcp"` as root key, merges `command` and `args` into a single `command` array, renames `env` to `environment`, uses `"local"` / `"remote"` types, supports native `"enabled"` boolean, and uses `{env:VAR}` syntax (without `$`). Note: `<server-key>` below (illustrated by `disabled-example`) shows how a server with `"disabled": true` compiles to `"enabled": false`.

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

### 3.5 Windsurf (`windsurf`)

-   **Target File:**  `~/.codeium/windsurf/mcp_config.json` (global scope only)
-   **Notes:** Uses `"serverUrl"` instead of `"url"` for remote endpoints and requires `${env:VAR}` interpolation.

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

### 3.6 Zed (`zed`)

-   **Target File:**  `.zed/settings.json` (project) / `~/.config/zed/settings.json` (global)
-   **Notes:** Nests `stdio` execution details inside a `"command": { "path", "args", "env" }` object under `"context_servers"`. Compilers MUST perform a non-destructive JSONC merge so editor settings in `settings.json` remain untouched.

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
