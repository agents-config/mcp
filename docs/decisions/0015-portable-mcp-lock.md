# ADR-0015: Portable `.agents/mcp-lock.json` (`version: 2`)

- **Status**: Accepted
- **Date**: 2026-11-26
- **Related Workflow**: [`workflow/b15-portable-mcp-lock/SPEC.md`](../../workflow/b15-portable-mcp-lock/SPEC.md) / [`workflow/b15-portable-mcp-lock/PLAN.md`](../../workflow/b15-portable-mcp-lock/PLAN.md)
- **Related Docs**: [`ADR-0014`](./0014-mcp-lock-and-authoritative-sync.md), [`spec/SPEC.md`](../../spec/SPEC.md), [`spec/BLUEPRINT.md`](../../spec/BLUEPRINT.md), [`spec/MATRIX.md`](../../spec/MATRIX.md)

## Context

Backlog item `B15` requires the committed lock to be deterministic and portable across machines. `ADR-0014` introduced `.agents/mcp-lock.json` with `STATE_VERSION = 1`, but the persisted `agents[].path` stores the absolute path returned by `adapter.getConfigPath(scope, ctx)`. On a second machine (different `cwd`, home directory, or OS) the computed absolute path differs, `sync` detects `existingAgent.path !== nativePath`, refreshes `updatedAt`, and rewrites the lock. The committed lock therefore leaks usernames/home directories and produces noisy, machine-specific Git diffs even when `.agents/mcp.json` did not change.

Secondary sources of churn/ambiguity:

- `import` always refreshes every scanned agent's `updatedAt`, even when nothing changed.
- Object key/array ordering is inherited from insertion order, so semantically identical states serialize differently.
- The `version: 1` contract and the `.mcp-sync-state.json` fallback are pre-release migration debt. `B15` explicitly allows dropping both.

## Decision

1. **Schema version 2.** `STATE_VERSION = 2`. The persisted document keeps the shape `version`, `scope`, `targets`, `agents`, `managedPlugins`; `agents[<id>]` keeps `path`, `names`, `updatedAt`.

2. **Portable `path` contract.** Every `agents[].path` persisted by any command is portable: relative to the repository root with `/` separators for project scope; prefixed with `~/` for paths under the home directory in global scope; prefixed with `$XDG_CONFIG_HOME/` or `$APPDATA/` when a global path is outside the home but inside one of those roots. Forward slash (`/`) is the only separator. The path MUST NOT contain a POSIX absolute prefix, a Windows drive, a UNC prefix, backslashes, `..` segments, or a bare home/user prefix. Validation on load (`isPortablePath`) rejects non-portable paths: warn, treat the lock as empty, never partially trust it.

3. **Portable path algorithm.** `core/portable-path.ts` provides `toPortablePath` (selects `posix`/`win32` from `ctx.platform`, normalizes separators, returns already-portable input normalized, matches against `cwd`/`homeDir`/`XDG_CONFIG_HOME`/`APPDATA` roots, last resort `basename`) and `isPortablePath`. The persisted path is metadata only; native paths are always resolved from the adapter.

4. **Deterministic serialization.** Fixed top-level key order (`version`, `scope`, `targets`, `agents`, `managedPlugins`); agents in `AGENT_ORDER`; `targets` deduplicated preserving order; `names` and `managedPlugins` deduplicated and sorted; two-space JSON with trailing newline; `writeState` skips the rewrite when content is byte-identical.

5. **`updatedAt` churn control.** `updatedAt` is refreshed only when an agent's portable path or managed names set actually changes (`sync` and `import` compare the portable path, not the absolute native path). Repeated runs produce a byte-identical lock; `updatedAt` values are preserved across machines when nothing changed.

6. **No migration and no legacy read.** A `version: 1` lock is unsupported: emit an actionable warning, treat state as empty, and let the next successful write replace it with `version: 2`. `.mcp-sync-state.json` is never consulted as state; it is left untouched on disk and not deleted automatically. No automatic conversion of absolute paths to relative paths; no backwards-compatibility code, dual schema, or legacy import branch.

7. **State diagnostics are not silent.** `sync`, `doctor`, `add`, `init`, `remove`, `import`, and `list` surface state warnings instead of silently treating an invalid/unsupported/corrupt lock as empty.

## Alternatives Considered

- **Keep absolute paths:** rejected. A committed lock leaks usernames/home directories and produces cross-machine diff noise; breaks the zero-diff project-lock workflow.
- **Drop `path` / store only agent ids:** rejected. `path` is useful diagnostics metadata and `ADR-0014` keeps it; removing it loses information with no I/O benefit since the path is never used for I/O anyway.
- **Keep `version: 1`:** rejected. `version: 1` carries the absolute-path contract and the legacy fallback; `B15` explicitly permits dropping both, and a clean `version: 2` contract avoids dual-schema complexity.
- **Migrate v1/legacy (convert absolute paths to relative):** rejected. An automatic conversion is lossy/ambiguous (home directory may differ) and contradicts the `B15` non-goal of no migration code. A one-time state reset for v1/legacy users is accepted; users re-run `sync --agents <list>` to rebuild.
- **Store only agent ids:** rejected (see "Drop `path`"). Keeping `path` as portable metadata preserves diagnostic value without leakage.

## Consequences

- **Positive:** Committed project locks produce zero cross-machine diff for the same `.agents/mcp.json` and targets. No usernames, home directories, drive letters, or absolute paths are persisted. Deterministic, byte-identical output on unchanged state; `updatedAt` churn eliminated. No migration or legacy-read code to maintain.
- **Negative / Trade-offs:** A one-time state reset for `version: 1`/legacy users (targets and `managedPlugins` are lost once; the next `sync` rewrites `version: 2`). Global locks remain OS-specific (explicit non-goal: global paths legitimately differ by OS). Exotic paths outside all known roots fall back to `basename` — metadata only, never used for I/O. v1/legacy users must re-run `sync --agents <list>` to rebuild state.
- **Follow-up:** ADR-0014 is partially superseded (lock portability and `version: 2`). `ADR-0005` remains superseded by `ADR-0014`. Backlog items `B11` (doctor parse errors) and `B12` (target removal) remain open.
