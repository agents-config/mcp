# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial `agents-mcp` CLI implementation: single-source `.agents/mcp.json` compiler for 6 AI coding agents (Claude Code, Cursor, VS Code, OpenCode, Windsurf, Zed)
- Canonical `.agents/mcp.json` format with Zod 4 schema and Draft-07 JSON Schema generation
- `init` command: scaffold canonical config and select target agents
- `import` command: consolidate existing agent MCP configs into canonical
- `sync` command: compile canonical config into all targeted agent config files (byte-idempotent)
- `remove` command: remove a server and clean from managed agent configs
- `list` command: inspect configured servers, targets, and sync status
- `add` command: install an MCP server from direct flags (--command/--arg/--http/--env/--header/--cwd/--name)
- `doctor` command: audit schema validity, env vars, runtime binaries, semantic drift, state, hygiene
- Non-destructive JSONC AST edits (jsonc-parser) preserving comments, unrelated keys, and manual MCP entries
- Secret hygiene: symbolic `${VAR}` placeholders in versioned files, real values only in `.env` (mode 0600)
- Atomic writes with temp+rename and Windows rename fallback
- Per-agent targeting (`targets`) and disabled server handling

### Changed

- None

### Deprecated

- None

### Removed

- None

### Fixed

- None

### Security

- `.env` and `.mcp-sync-state.json` added to `.gitignore` (lazy, managed block)
- `.env` written with mode `0600`; existing keys never overwritten
- Secret values never reach canonical/native files, logs, errors, or `--dry-run` output
