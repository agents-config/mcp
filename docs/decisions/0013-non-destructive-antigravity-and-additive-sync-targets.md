# ADR-0013: Non-Destructive Antigravity Sync and Additive `state.targets`

- **Status**: Accepted
- **Date**: 2026-11-25
- **Related Docs**: [`docs/decisions/0006-non-destructive-compilation.md`](./0006-non-destructive-compilation.md), [`docs/decisions/0011-plugin-lifecycle-and-safe-cleanup.md`](./0011-plugin-lifecycle-and-safe-cleanup.md), [`docs/decisions/0012-adapter-storage-layout.md`](./0012-adapter-storage-layout.md)

## Context

`ADR-0011` introduced automatic deletion of `.agents/plugins/<name>/mcp_config.json` whenever `sync` ran without `antigravity` in the resolved `targets`. Meanwhile, `sync` also overwrote `state.targets` with the resolved `targets` array on every run.

In practice, this caused two severe UX regressions:
1. Running `sync --agents opencode` (or running `sync` with a legacy `state.targets: ["opencode"]`) **silently deleted** all `antigravity` `mcp_config.json` files and removed `antigravity` from `state.targets` and `state.agents` — whereas every other adapter (`claude-code`, `cursor`, `vscode`, `opencode`, `zed`, `windsurf`) is preserved non-destructively when omitted from `--agents`.
2. Adding a new target via `sync --agents <new-agent>` wiped previously configured targets from `state.targets`, breaking subsequent plain `agents-mcp sync` runs.

## Decision

1. **Non-destructive `antigravity` preservation (partially supersedes `ADR-0011`):** `sync` MUST NOT delete `mcp_config.json` or `state.agents.antigravity` simply because `antigravity` is omitted from the current `targets` list. `mcp_config.json` is only deleted when its owning server is removed from `.agents/mcp.json` (via `remove` or stale plugin cleanup) or via a future explicit target-removal command.
2. **Additive `state.targets` on `sync --agents <list>`:** Passing `--agents <list>` to `sync` appends any newly specified valid agent IDs to `state.targets` (deduplicated, preserving order) instead of overwriting the list. Running `sync` without `--agents` syncs **all** agents recorded in `state.targets` (falling back to `detectAgents()` only when `state.targets` is empty).

## Alternatives Considered

- **Delete `mcp_config.json` only when `antigravity` was explicitly in `state.targets` and `--agents` omitted it:** Rejected. Still breaks the intuitive workflow of running `sync --agents opencode` to refresh a single agent without destroying another agent's configuration.

## Consequences

- **Positive:** Symmetric non-destructive guarantee across all 7 adapters (`ADR-0006`); ergonomic incremental target adoption (`sync --agents <new>` followed by plain `sync`).
- **Negative / Trade-offs:** Removing a target from `state.targets` requires editing `.agents/.mcp-sync-state.json` (or a future `targets remove` command) rather than omitting it from `sync --agents`.
