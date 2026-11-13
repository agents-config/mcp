# ADR-0006: Preserve native files in place

- **Status**: Accepted
- **Date**: 2026-11-13
- **Related Docs**: [`spec/BLUEPRINT.md`](../../spec/BLUEPRINT.md)

## Context

Existing agent files are often multi-purpose (`opencode.json`, `.zed/settings.json`,
`~/.claude.json`) or contain data we do not model (VS Code `inputs`, editor
settings, Claude projects/history). A migration that deletes or strips those files
after import is irreversible, loses non-MCP data, and breaks users who open the
old client before running `sync`.

## Decision

- Compilation is always in place and additive/non-destructive, using JSONC AST
  edits.
- The CLI never deletes, moves, or renames a native config file, and offers no
  destructive cleanup mode.
- `import` reads native files, merges into the canonical file, and then `sync`
  rewrites only the managed entries — the net effect of "migration" without data
  loss.
- `--force` on `init` writes a timestamped `.bak` before overwriting.
- Unparsable native files are never overwritten; the command fails with a clear
  message.

## Alternatives Considered

- **Delete native files after import**: rejected. Destructive and lossy.
- **Remove the MCP root key from shared files**: rejected. Same loss of manual
  entries; also impossible to distinguish ours without state.
- **Backup-then-delete**: rejected. Still surprises users and leaves stale files
  that can shadow the canonical config.

## Consequences

- **Positive**: no data loss, safe adoption path, users can keep using their
  existing clients during migration.
- **Negative / Trade-offs**: native files remain in the repository unless the user
  chooses otherwise; `sync` produces diffs in tracked files.
- **Follow-up**: document in `spec/SPEC.md` §9–10 and in the README quick start.
