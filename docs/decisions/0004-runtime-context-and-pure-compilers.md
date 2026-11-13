# ADR-0004: Injected runtime context and pure native compilers

- **Status**: Accepted
- **Date**: 2026-11-13
- **Related Docs**: [`spec/BLUEPRINT.md`](../../spec/BLUEPRINT.md)

## Context

The tool resolves OS-specific global paths (VS Code profiles, XDG, APPDATA), must
behave identically on Linux/macOS/Windows, and needs diagnostics (`doctor`) that
compare intended output with what is on disk. Calling `os.homedir()`,
`process.platform`, or `process.cwd()` inside modules forces brittle module
mocking and makes Windows behavior untestable on Linux CI.

## Decision

- Introduce `RuntimeContext { cwd, homeDir, platform, env, isTTY }`, created once
  at the entrypoint and injected everywhere.
- Adapters expose `capabilities` (scopes, format, env syntax, native default,
  native disable, `cwd`) and a **pure** `compile(server) → native entry`.
- `applyServers()` returns `{ content, managedNames, warnings }`; it never prints
  and never touches the filesystem.
- `extractServers()` returns `{ servers, warnings }`.
- Detection uses file/directory existence only; binary lookup belongs to `doctor`.

## Alternatives Considered

- **Module mocking in tests** (`vi.mock('node:os')`): rejected. Fragile, leaks
  into unrelated tests, and cannot model cross-platform path resolution cleanly.
- **Text-diff drift checks**: rejected. They produce false positives whenever a
  user reformats a file.

## Consequences

- **Positive**: hermetic tests, reusable pure compilers, semantic drift checks,
  correct Windows/Linux behavior.
- **Negative / Trade-offs**: every call site must thread the context; a missed
  argument is a compile-time error by design.
- **Follow-up**: keep `RuntimeContext` dependency-free; never add I/O methods to it.
