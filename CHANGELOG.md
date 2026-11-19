# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial `agents-mcp` CLI implementation: single-source `.agents/mcp.json` compiler for 6 AI coding agents (Claude Code, Cursor, VS Code, OpenCode, Windsurf, Zed)
- Canonical `.agents/mcp.json` format aligned with the Agent Plugins MCP 1.0.0 JSON Schema (`https://agent-plugins.org/schemas/1.0.0/mcp.schema.json`): `mcpServers` root key, `type` discriminator, and `stdio`, `streamable-http`, and `sse` transports
- `init` command: scaffold canonical config and select target agents
- `import` command: consolidate existing agent MCP configs into canonical
- `sync` command: compile canonical config into all targeted agent config files (byte-idempotent)
- `remove` command: remove a server and clean from managed agent configs
- `list` command: inspect configured servers, targets, and sync status
- `add` command: install an MCP server from direct flags (`--command`, `--arg`, `--http`, `--sse`, `--env`, `--header`, `--cwd`, `--name`)
- `doctor` command: audit schema validity, env vars, runtime binaries, semantic drift, state, hygiene
- Non-destructive JSONC AST edits (jsonc-parser) preserving comments, unrelated keys, and manual MCP entries
- Secret hygiene: symbolic `${VAR}` placeholders in versioned files, real values only in `.env` (mode 0600)
- Atomic writes with temp+rename and Windows rename fallback
- Per-agent targeting persisted in the local sync state

### Changed

- Public CLI terminology uses `command` for local MCP servers instead of the transport-level term `stdio`; `list` reports `command`, `http`, and `sse`
- Canonical configuration, adapters, and generated native configs use `mcpServers` and `type` per Agent Plugins MCP 1.0.0

### Deprecated

- None

### Removed

- Project-specific JSON Schema publication and Draft-07 schema generation; the Agent Plugins MCP 1.0.0 schema is the single normative reference
- `disabled` and `targets` fields from the canonical server definition (per-agent targeting remains in the local sync state)

### Fixed

- `agents-mcp add` now always creates/updates the standard Agent Plugins files (`.agents/plugins/<name>/plugin.json` and `mcp.json`) even with `--no-sync` or when no target agent is configured/detected; `sync` remains responsible for agent files and, when `antigravity` is targeted, `mcp_config.json`.

### Security

- `.env` and `.mcp-sync-state.json` added to `.gitignore` (lazy, managed block)
- `.env` written with mode `0600`; existing keys never overwritten
- Secret values never reach canonical/native files, logs, errors, or `--dry-run` output
