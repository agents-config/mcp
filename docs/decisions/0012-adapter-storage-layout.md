# ADR-0012: Explicit Adapter Storage Layout (`single-file` vs `per-plugin`)

- **Status**: Accepted
- **Date**: 2026-11-25
- **Related Docs**: [`spec/MATRIX.md`](../../spec/MATRIX.md), [`docs/decisions/0011-plugin-lifecycle-and-safe-cleanup.md`](./0011-plugin-lifecycle-and-safe-cleanup.md)

## Context

`AgentAdapter.getConfigPath(scope, ctx)` previously returned `null` for two incompatible reasons:

1. **Unsupported scope** — e.g., `windsurf` does not support `project` scope.
2. **Per-plugin multi-file storage** — e.g., `antigravity` supports both `project` and `global` scopes, but writes one `mcp_config.json` per server under `<scope>/.agents/plugins/<name>/mcp_config.json` instead of a single monolithic file.

Overloading `getConfigPath() === null` caused four cascading defects across the CLI:
- `detectAgents()` skipped `antigravity`, making `antigravity.detect()` dead code.
- `import` skipped `antigravity`, making `antigravity.extractServers()` dead code.
- `doctor` reported a false-positive `STATE` warning (`Target antigravity does not support project scope`).
- `list` reported `not-synced` when `antigravity` was the only target because `sync` had no single file path to record in `SyncState.agents`.

Separately, `doctor` lacked a declarative `rootKey` on `AdapterCapabilities`, forcing it to scan arbitrary top-level JSON keys during drift checks.

## Decision

1. Add `readonly layout: 'single-file' | 'per-plugin'` and `readonly rootKey?: string` to `AdapterCapabilities`:
   - `claude-code`, `cursor`, `vscode`, `opencode`, `zed`, `windsurf`: `layout: 'single-file'` + their respective `rootKey`.
   - `antigravity`: `layout: 'per-plugin'`, `rootKey: 'mcpServers'`.
2. **Scope support** MUST always be checked via `adapter.capabilities.scopes.includes(scope)`, never via `getConfigPath(scope, ctx) === null`.
3. **Sync state for `per-plugin` adapters:** `runSync` records `state.agents.antigravity` using `<base>/.agents/plugins` as `path` and the list of synced server names as `names`, removing the entry when `antigravity` is deselected.

## Alternatives Considered

- **Special-casing `if (agentId === 'antigravity')` in `detectAgents`, `import`, `doctor`, and `list`:** Rejected. Fragile, violates open/closed design, and breaks immediately if another per-plugin agent is added.
- **Returning a synthetic file path from `antigravity.getConfigPath()`:** Rejected. Callers expecting a single JSON/JSONC file would attempt to read/write a directory path.

## Consequences

- **Positive:** Eliminates four bugs from a single contract fix; makes `doctor` drift checks deterministic via `rootKey`; cleanly supports future per-plugin agents.
- **Negative / Trade-offs:** Requires updating `AdapterCapabilities` across all 7 adapters and recording `state.agents.antigravity` in `sync.ts`.
