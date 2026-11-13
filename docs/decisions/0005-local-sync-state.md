# ADR-0005: Local sync state and persisted agent targets

- **Status**: Accepted
- **Date**: 2026-11-13
- **Related Docs**: [`spec/BLUEPRINT.md`](../../spec/BLUEPRINT.md)

## Context

Non-destructive compilation means `sync` may only remove native entries it created
before. That requires remembering which server names were written to which agent
file. It also needs to know which agents the user selected, because in a fresh
repository no native file exists yet — detection alone would make `sync` a silent
no-op. The state cannot live in the canonical file, which is shared and
hand-edited.

## Decision

Maintain `.agents/.mcp-sync-state.json` (project) and
`~/.agents/.mcp-sync-state.json` (global):

```json
{
  "version": 1,
  "scope": "project",
  "targets": ["claude-code", "opencode"],
  "agents": {
    "claude-code": { "path": "/abs/.mcp.json", "names": ["github"], "updatedAt": "..." }
  }
}
```

- `targets` is persisted by `init`, `sync --agents`, and `add`/`import` selections;
  `sync` precedence is `--agents` → `targets` → detection.
- `names` per agent is the authoritative `previousManagedNames`.
- `import` seeds names even with `--no-sync`.
- Missing state = empty; corrupt/unknown version = warn, treat as empty, rewrite
  after the next successful sync.
- State is git-ignored, written atomically, and never required by third-party
  implementations of the format.

## Alternatives Considered

- **Commit the state file**: rejected. Contains absolute paths and machine-local
  history; merge conflicts on every branch.
- **Marker comments inside native files**: rejected. Not portable across JSON
  files/agents and pollutes user config.
- **Own the entire root key (`mcpServers`/`mcp`)**: rejected. Destructive; would
  delete servers the user added manually.

## Consequences

- **Positive**: safe pruning, working fresh-clone flow, deterministic behavior.
- **Negative / Trade-offs**: each developer must run `init`/`sync --agents` once per
  checkout; state is not portable between machines.
- **Follow-up**: bump `STATE_VERSION` only with a migration path.
