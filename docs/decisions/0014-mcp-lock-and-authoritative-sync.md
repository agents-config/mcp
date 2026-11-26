# ADR-0014: `mcp-lock.json` and authoritative `sync`

- **Status**: Accepted
- **Date**: 2026-11-25
- **Related Workflow**: [`workflow/b14-mcp-lock-authoritative-sync/SPEC.md`](../../workflow/b14-mcp-lock-authoritative-sync/SPEC.md) / [`workflow/b14-mcp-lock-authoritative-sync/PLAN.md`](../../workflow/b14-mcp-lock-authoritative-sync/PLAN.md)
- **Related Docs**: [`ADR-0005`](./0005-local-sync-state.md), [`ADR-0006`](./0006-non-destructive-compilation.md), [`ADR-0011`](./0011-plugin-lifecycle-and-safe-cleanup.md), [`ADR-0013`](./0013-non-destructive-antigravity-and-additive-sync-targets.md), [`spec/SPEC.md`](../../spec/SPEC.md)

## Context

`ADR-0005` introduced `.agents/.mcp-sync-state.json` as a hidden, always-git-ignored cache of `targets`, per-agent managed names, and `managedPlugins`. `ADR-0011` made that cache the sole ownership source for plugin cleanup, and `sync` skips any `.agents/plugins/<name>/` directory whose name is not registered there.

On a fresh clone, the cache is absent. As a result:

- `sync` classifies every pre-existing plugin directory as "unmanaged", skips it, reports `PLUGIN_UNMANAGED`, and exits `1` — contradicting the product promise that `.agents/mcp.json` is the single source of truth.
- Teams cannot choose to version the hidden state file, because the CLI adds it to `.gitignore` automatically.
- With no detected agent, `sync` exits `1` before materializing plugins at all.

The `Expedite` backlog item `B14` is a release blocker for the initial experimental release.

## Decision

1. **Lock file identity.** Sync metadata lives at `.agents/mcp-lock.json` (project) and `~/.agents/mcp-lock.json` (global). The schema and `STATE_VERSION` remain `1`; only the filename changes.
2. **Non-destructive legacy migration.** `loadState` reads the new lock first, then the legacy `.mcp-sync-state.json`, then an empty state. Using the legacy file emits a non-fatal notice. The legacy file is never deleted automatically, and a corrupt new lock never falls back to the legacy file.
3. **Optional versioning.** The CLI never adds the lock (or the legacy file) to `.gitignore`; only `.env` remains auto-protected. Existing `.gitignore` content is not rewritten.
4. **Authoritative `sync` from `.agents/mcp.json`.**
   - Every server declared in the canonical config has `plugin.json`, `mcp.json`, and (when `antigravity` is targeted) `mcp_config.json` written/overwritten and adopted into `managedPlugins`, regardless of pre-existing directories or lock contents. Other files in the plugin directory are preserved.
   - Every canonical server entry is overwritten in targeted agent native configs; `previousManagedNames` only governs pruning of stale managed entries, never whether to overwrite.
   - Unmanaged plugin directories whose name is not declared in the canonical config remain untouched.
5. **`add` keeps the collision guard.** `add` blocks/re-prompts only when the plugin directory exists, the name is not managed, **and** the name is not declared in the canonical config. Declared names may be adopted (including via `--force`).
6. **Zero-target `sync` is non-fatal.** The `sync` command opts into `allowEmptyTargets`, so a fresh clone with only `.agents/mcp.json` materializes plugins and exits `0` with guidance. `runSync`'s strict default is preserved for direct callers.

This ADR partially supersedes `ADR-0005` (state filename and Git-ignored rule). It refines `ADR-0011` by populating `managedPlugins` through adoption while keeping its closed removal surface; it does not change `ADR-0013`'s non-destructive target behavior.

## Alternatives Considered

- **Keep the old filename and only fix the collision:** rejected. The hidden name and forced `.gitignore` entry prevent the team-versioning workflow requested by the Product Owner.
- **Infer plugin ownership from `plugin.json` content:** rejected. It creates a second source of truth and still requires parsing hand-edited files (`ADR-0011`).
- **Delete and regenerate a colliding plugin directory recursively:** rejected. It would destroy manual files and violates `ADR-0006`.
- **Auto-delete the legacy state file after migration:** rejected. Silent deletion of tool-owned but user-visible files is unnecessary risk; a notice plus `doctor` warning is enough.
- **Keep auto-ignoring the lock:** rejected. It makes versioning impossible and keeps the fresh-clone failure mode.
- **Keep `sync` failing on zero targets:** rejected. Plugin materialization does not depend on targets, and the failure breaks the clone-and-sync onboarding promise.

## Consequences

- **Positive:** Fresh-clone onboarding works without a local lock; `.agents/mcp.json` is authoritative in practice; teams choose whether to version the lock; plugin adoption is explicit and recorded; `add` still protects undeclared manual plugins.
- **Negative / Trade-offs:** Adopting a same-named manual plugin overwrites its three managed filenames (intended). The lock stores absolute `agents[].path` values and per-agent `updatedAt`, so a committed lock produces cross-machine diff noise. The legacy file lingers until manually removed. Zero-target `sync` no longer signals a usage error. On a lockless clone, `remove` before the first `sync` cannot prove ownership of the removed server's plugin directory and preserves it (run `sync` first or commit the lock).
- **Follow-up:** Consider a portable/relative lock representation (schema `version: 2`) if committed locks become common. Backlog items `B11` (doctor parse errors) and `B12` (target removal) remain open. Teams that want clean diffs may keep ignoring the lock; this is a project choice, not a CLI default.
