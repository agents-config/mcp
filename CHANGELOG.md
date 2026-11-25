# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-11-25

### Added

- `antigravity` agent adapter and plugin sync support: per-plugin layouts under `.agents/plugins/<name>/` (`plugin.json`, `mcp.json`, plus `mcp_config.json` when `antigravity` is targeted), with `stdio` → `{ command, args?, env? }` and `streamable-http`/`sse` → `{ serverUrl, headers? }` mapping.
- Interactive `add` wizard (`agents-mcp add`) for server name, connection type (local command or HTTP URL), args, env vars, and headers.
- `add` now always creates/updates the base Agent Plugins files (`.agents/plugins/<name>/plugin.json` and `mcp.json`) even with `--no-sync` or when no target agent is configured/detected.
- `--extract-secrets` opt-in flag on `add`: writes detected literal secrets (tokens, keys, high-entropy values) to `.env` + `.env.example` and replaces them with `${VAR}` placeholders in `.agents/mcp.json`; without it, secrets are only warned about.
- Source resolvers for `add`: direct flags (`--command`/`--http`/`--sse`/`--arg`/`--env`/`--header`), GitHub URL/`owner/repo`, npm package, MCP Registry, and remote URLs.
- Repeatable `--arg`, `--env`, `--header` flags accumulated from `rawArgs`.
- `import` scans existing agent configs (`.mcp.json`, `.cursor/mcp.json`, `.vscode/mcp.json`, `opencode.json`, `.zed/settings.json`), deduplicates servers, extracts hardcoded secrets into `.env` + `.env.example`, and generates `.agents/mcp.json`.

### Changed

- Public CLI terminology uses `command` for local MCP servers instead of the transport-level term `stdio`; `list` reports `command`, `http`, and `sse`.
- Canonical configuration, adapters, and generated native configs use `mcpServers` and `type` per Agent Plugins MCP 1.0.0.
- Transport discriminators are `stdio`, `streamable-http`, and `sse`; obsolete `http` transport name removed.

### Removed

- Project-specific JSON Schema publication and Draft-07 schema generation; the Agent Plugins MCP 1.0.0 schema is the single normative reference.
- `disabled` and `targets` fields from the canonical server definition (per-agent targeting remains in the local sync state).
- Obsolete `"enabled": false` from OpenCode compiled output example.

### Fixed

- `remove` now preserves the other servers in the canonical config when deleting one (fixes silent data loss: previously all other servers were wiped).
- `remove --no-sync` respects the flag and does not sync agents: writes only canonical, cleans managed plugin files locally, and preserves `state.targets`/`state.agents`.
- Managed plugin file cleanup when a server leaves the canonical config (`plugin.json`, `mcp.json`, `mcp_config.json`, deleting the directory only if empty); deselecting an agent no longer deletes its files.
- `sync` is non-destructive for every agent: omitting `antigravity` from `--agents` no longer removes `.agents/plugins/<name>/mcp_config.json` or deletes `state.agents.antigravity` (ADR-0013).
- `sync --agents <list>` now appends newly requested targets to `state.targets` (deduplicated, preserving order) instead of overwriting it, so a later plain `sync` still targets previously configured agents (ADR-0013).
- Global flags placed before the subcommand (`-g`/`--global`, `-y`/`--yes`, `--dry-run`, `--agents`) are no longer silently dropped; short aliases are canonicalized for every subcommand.
- `sync` rejects unexpected positional arguments with exit code `2` and an actionable message instead of silently falling back to stale targets.
- Plugin cleanup failures on `sync` are reported with exit code `1`, and the plugin remains registered for retry on the next `sync`.

## [0.1.1] - 2026-11-19

### Added

- Initial `agents-mcp` CLI implementation: single-source `.agents/mcp.json` compiler for AI coding agents (Claude Code, Cursor, VS Code, OpenCode, Windsurf, Zed, Antigravity)
- Canonical `.agents/mcp.json` format aligned with the Agent Plugins MCP 1.0.0 JSON Schema (`https://agent-plugins.org/schemas/1.0.0/mcp.schema.json`): `mcpServers` root key, `type` discriminator, and `stdio`, `streamable-http`, and `sse` transports
- `init` command: scaffold canonical config and select target agents
- `import` command: consolidate existing agent MCP configs into canonical
- `sync` command: compile canonical config into all targeted agent config files (byte-idempotent)
- `remove` command: remove a server and clean from managed agent configs
- `list` command: inspect configured servers, targets, and sync status
- `add` command: install an MCP server via interactive wizard (`agents-mcp add <name>`) or direct flags (`--command`, `--arg`, `--http`, `--sse`, `--env`, `--header`, `--cwd`, `--name`)
- Automatic Agent Plugins directory generation (`.agents/plugins/<name>/plugin.json` and `mcp.json`) on `add` and `sync`, plus `mcp_config.json` when `antigravity` is targeted
- `doctor` command: audit schema validity, env vars, runtime binaries, semantic drift, state, hygiene
- Non-destructive JSONC AST edits (jsonc-parser) preserving comments, unrelated keys, and manual MCP entries
- Secret hygiene: symbolic `${VAR}` placeholders in versioned files, real values only in `.env` (mode 0600)
- Atomic writes with temp+rename and Windows rename fallback
- Per-agent targeting persisted in the local sync state

### Changed

- Public CLI terminology uses `command` for local MCP servers instead of the transport-level term `stdio`; `list` reports `command`, `http`, and `sse`
- Canonical configuration, adapters, and generated native configs use `mcpServers` and `type` per Agent Plugins MCP 1.0.0

### Removed

- Project-specific JSON Schema publication and Draft-07 schema generation; the Agent Plugins MCP 1.0.0 schema is the single normative reference
- `disabled` and `targets` fields from the canonical server definition (per-agent targeting remains in the local sync state)

### Fixed

- `agents-mcp add` now always creates/updates the standard Agent Plugins files (`.agents/plugins/<name>/plugin.json` and `mcp.json`) even with `--no-sync` or when no target agent is configured/detected; `sync` remains responsible for agent files and, when `antigravity` is targeted, `mcp_config.json`.

### Security

- `.env` and `.mcp-sync-state.json` added to `.gitignore` (lazy, managed block)
- `.env` written with mode `0600`; existing keys never overwritten
- Secret values never reach canonical/native files, logs, errors, or `--dry-run` output
