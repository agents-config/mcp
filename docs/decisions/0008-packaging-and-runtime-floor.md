# ADR-0008: Node 22 floor, single binary, publish from `dist/` only

- **Status**: Accepted
- **Date**: 2026-11-13
- **Related Docs**: [`spec/BLUEPRINT.md`](../../spec/BLUEPRINT.md)

## Context

The package must expose a zero-dependency executable and must not leak repository
sources or build tooling to npm. Consumers install the CLI to run it, not to import
types or modules.

## Decision

- `engines.node >= 22`; `@types/node@^22` so the type check cannot use newer
  APIs; CI covers Node 22, 24, and 26.
- Exactly one binary: `bin: { "agents-mcp": "./index.js" }`.
- Root `package.json` is never published: `prepublishOnly` fails with a pointer to
  `npm run dist`.
- `package.ts` assembles `dist/package.json` (metadata only, no scripts, no
  dependencies) and copies LICENSE/README plus the changelog when present.
- `npm run dist` = build (full `verify`) → package → publish, in that order;
  publishing is always a manual, post-bump action.
- `dist:build` runs the full `verify` suite before publication.

## Alternatives Considered

- **Older Node versions**: rejected. Supporting a runtime past its maintenance
  window costs compatibility branches for no user benefit.
- **Ship source with `bin` pointing at `src/`**: rejected. Requires runtime
  transforms, exposes internals, and breaks the zero-dependency promise.
- **`npm publish` from the root**: rejected. Publishes dev tooling and tests.

## Consequences

- **Positive**: simple install, single artifact, reproducible release.
- **Negative / Trade-offs**: users on an older runtime must upgrade.
- **Follow-up**: verify `dist/package.json` in CI after `npm run build`.
