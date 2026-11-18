# agents-mcp

**One `.agents/mcp.json` to rule them all.**

A tool-agnostic specification and CLI compiler for managing Model Context Protocol (MCP) servers across Claude Code, Cursor, VS Code, OpenCode, Windsurf, Zed, and Antigravity.

[![npm version](https://img.shields.io/npm/v/agents-mcp.svg)](https://www.npmjs.com/package/agents-mcp)
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
		              npx agents-mcp sync
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
npx agents-mcp import
```

This scans your workspace for existing agent configs (`.mcp.json`, `.cursor/mcp.json`, `.vscode/mcp.json`, `opencode.json`, `.zed/settings.json`), deduplicates servers, extracts hardcoded secrets into `.env` + `.env.example`, generates `.agents/mcp.json`, and keeps your active agents synced. Your existing agent files are updated in place, never deleted.

### Starting from scratch?

1. Initialize `.agents/mcp.json` and select your agents:
   `npx agents-mcp init`
2. Add an MCP server from GitHub, npm, MCP Registry, or direct flags
   `npx agents-mcp add modelcontextprotocol/server-github`
3. Sync changes across all targeted agents
   `npx agents-mcp sync`

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
- **Deterministic Schema:** A single Zod source generates the published Draft 2020-12 JSON Schema, so types, runtime validation, and editor autocomplete never drift.
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

`.agents/mcp.json` permanece como a **unica fonte da verdade** (canonical source of truth) para todas as definicoes de servidores MCP. A partir do `agents-mcp add` e `agents-mcp sync`, a CLI gera automaticamente um layout padrao de **Agent Plugins** em:

```
<scope>/.agents/plugins/<nome>/
  plugin.json        # manifest do plugin (name, version, description)
  mcp.json           # documento Agent Plugins MCP 1.0.0 ($schema + mcpServers)
  mcp_config.json    # apenas quando `antigravity` esta nos targets
```

- **`plugin.json` + `mcp.json`**: gerados para **qualquer** servidor adicionado ou sincronizado, independentemente dos agentes alvo.
- **`mcp_config.json`**: gerado apenas quando `antigravity` esta entre os targets (`--agents antigravity`, `init` ou `sync`). Servidores `stdio` mapeiam para `{ command, args?, env? }`; servidores `streamable-http` e `sse` mapeiam para `{ serverUrl, headers? }` (formato nativo do Antigravity).

### Propriedade e colisao

A CLI rastreia quais plugins ela gerencia no estado de sincronizacao (`.agents/.mcp-sync-state.json`, campo `managedPlugins`). Se um diretório `.agents/plugins/<nome>/` ja existir em disco **e** o nome **nao** estiver registrado como gerenciado:

- **Modo interativo (`add`)**: avisa o usuario e solicita um nome diferente (sem auto-renomear nem sobrescrever).
- **Modo nao-interativo (`add`)**: falha com erro claro, orientando o usuario a passar um `--name` diferente (codigo de saida `1`).
- **`sync`**: pula a sobrescricao do diretorio nao-gerenciado, registra um aviso por plugin e inclui no relatorio de falha parcial.

### Falha parcial

Se `.agents/mcp.json` (e/ou arquivos nativos dos agentes) for gravado com sucesso, mas a criacao/atualizacao de um arquivo de plugin falhar, a CLI **nao** imprime confirmacao falsa de sucesso total. Reporta explicitamente o que foi concluido e o que falhou, com proximos passos acionaveis (ex. `reexecute agents-mcp sync`), e sai com codigo `1`.

### Boas praticas

- Edicoes manuais devem ser feitas em `.agents/mcp.json` e propagadas via `agents-mcp sync`.
- Arquivos em `.agents/plugins/<name>/` sao gerados a partir de `.agents/mcp.json`; edicoes diretas neles serao sobrescritas na proxima `sync`.
- Quando `antigravity` for sincronizado, os arquivos do plugin ficam prontos em `.agents/plugins/<name>/` (a CLI **nao** ativa a interface do IDE Antigravity automaticamente).

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

### Delimitação de valor

A CLI `agents-mcp` gerencia e sincroniza MCPs de forma padronizada dentro do contexto de um projeto (e no escopo global do usuário). O padrão Agent Plugins MCP 1.0.0 continua sendo a referência normativa para a configuração de servidores MCP em plugins individuais. A proposta não cria nem propõe uma variante concorrente do schema Agent Plugins, e não transforma o projeto em um gerenciador geral de plugins além do gerenciamento de MCPs por projeto.

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
