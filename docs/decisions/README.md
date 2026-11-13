# Architecture Decision Records

Immutable records of the choices that shape `agents-mcp`. Each ADR states the
context, the decision, the alternatives rejected, and the accepted trade-offs.

| ADR | Title | Status |
| :--- | :--- | :--- |
| [0001](./0001-canonical-transports.md) | Canonical transports are `stdio` and `http` | Accepted |
| [0002](./0002-schema-source-and-versioning.md) | Zod 4 is the schema source of truth; publish Draft-07 | Accepted |
| [0003](./0003-bundler-tsup.md) | Bundle the CLI with `tsup` (esbuild), no declarations | Accepted |
| [0004](./0004-runtime-context-and-pure-compilers.md) | Injected runtime context and pure native compilers | Accepted |
| [0005](./0005-local-sync-state.md) | Local sync state and persisted agent targets | Accepted |
| [0006](./0006-non-destructive-compilation.md) | Preserve native files in place | Accepted |
| [0007](./0007-env-and-secrets.md) | `.env` precedence and safe secret extraction | Accepted |
| [0008](./0008-packaging-and-runtime-floor.md) | Node 22 floor, single binary, publish from `dist/` only | Accepted |

## Conventions

- One decision per file, numbered sequentially.
- Never edit an accepted ADR's intent; supersede it with a new record.
- Every ADR is referenced from [`spec/BLUEPRINT.md`](../../spec/BLUEPRINT.md) §19 and,
  when relevant, from the package documentation.
