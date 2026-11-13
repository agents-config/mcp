# ADR-0003: Bundle the CLI with `tsup` (esbuild), no declarations

- **Status**: Accepted
- **Date**: 2026-11-13
- **Related Docs**: [`spec/BLUEPRINT.md`](../../spec/BLUEPRINT.md)

## Context

The deliverable is a Node CLI distributed as a single ESM file with zero runtime
dependencies and a shebang. We do not publish type declarations. The build must be
fast, deterministic, and require little bespoke glue. The project also runs
TypeScript 7 (native compiler), which makes any tool that depends on the
TypeScript JS API a risk.

## Decision

Use `tsup@^9` with esbuild under the hood:

- single entry `src/index.ts`, `format: ['esm']`, `platform: 'node'`,
  `target: 'node22'`, `splitting: false`, `sourcemap: false`, `treeshake: true`;
- `banner: { js: '#!/usr/bin/env node' }`, `clean: true`;
- **`dts: false`** — there are no types to emit, which also removes the
  `rollup-plugin-dts`/TypeScript-API dependency from the build.

If `tsup` blocks a future Node/TypeScript upgrade, replace it with a
`scripts/build.ts` that calls `esbuild.build()` with the same options.

## Alternatives Considered

- **Vite**: rejected. Browser-first; CLI use requires library/SSR mode with Rollup,
  externalization rules, and a dev server we never use.
- **Raw esbuild**: viable, but requires hand-maintaining a build script for
  banner, clean, target, and single-file output.
- **`tsc` only**: rejected. It does not bundle dependencies into one file and
  cannot inline JSON at build time.

## Consequences

- **Positive**: near-zero build configuration, esbuild speed, single-file output,
  no type-emission failure mode.
- **Negative / Trade-offs**: one dev dependency wrapper; its defaults can change
  between majors.
- **Follow-up**: verify the output contract in CI (`node dist/index.js --help`, no
  bare external imports).
