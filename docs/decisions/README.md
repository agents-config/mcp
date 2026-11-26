# Architecture Decision Records

Immutable records of the choices that shape `agents-mcp`. Each ADR states the
context, the decision, the alternatives rejected, and the accepted trade-offs.

| ADR | Title | Status |
| :--- | :--- | :--- |
| [0001](./0001-canonical-transports.md) | Canonical transports are `stdio` and `http` | Superseded by ADR-0010 |
| [0002](./0002-schema-source-and-versioning.md) | Zod 4 is the schema source of truth; publish Draft-07 | Superseded by ADR-0010 |
| [0003](./0003-bundler-tsup.md) | Bundle the CLI with `tsup` (esbuild), no declarations | Accepted |
| [0004](./0004-runtime-context-and-pure-compilers.md) | Injected runtime context and pure native compilers | Accepted |
| [0005](./0005-local-sync-state.md) | Local sync state and persisted agent targets | Partially superseded by ADR-0014 |
| [0006](./0006-non-destructive-compilation.md) | Preserve native files in place | Accepted |
| [0007](./0007-env-and-secrets.md) | `.env` precedence and safe secret extraction | Accepted |
| [0008](./0008-packaging-and-runtime-floor.md) | Node 22 floor, single binary, publish from `dist/` only | Accepted |
| [0009](./0009-typescript-7-removes-baseurl.md) | TypeScript 7 removes `baseUrl`; keep TS 7 with tsconfig-relative `paths` | Accepted |
| [0010](./0010-adopt-agent-plugins-mcp-schema.md) | Adotar o padrão Agent Plugins MCP 1.0.0 | Accepted |
| [0011](./0011-plugin-lifecycle-and-safe-cleanup.md) | Ciclo de vida de plugins e limpeza segura | Accepted |
| [0012](./0012-adapter-storage-layout.md) | Explicit adapter storage layout (`single-file` vs `per-plugin`) | Accepted |
| [0013](./0013-non-destructive-antigravity-and-additive-sync-targets.md) | Non-destructive Antigravity sync and additive `state.targets` | Accepted |
| [0014](./0014-mcp-lock-and-authoritative-sync.md) | `mcp-lock.json` and authoritative `sync` | Accepted |

## Conventions

- One decision per file, numbered sequentially.
- Never edit an accepted ADR's intent; supersede it with a new record.
- Every ADR is referenced from [`spec/BLUEPRINT.md`](../../spec/BLUEPRINT.md) §19 and,
  when relevant, from the package documentation.
