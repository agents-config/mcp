# ADR-0009: TypeScript 7 removes `baseUrl`; keep TS 7 with tsconfig-relative `paths`

- **Status**: Accepted
- **Date**: 2026-11-13
- **Related Docs**: [`spec/BLUEPRINT.md`](../../spec/BLUEPRINT.md), `workflow/PLAN.md`

## Context

BLUEPRINT §6 specified `baseUrl: "."` together with
`paths: { "$/*": ["./*"] }`, and stated that if TypeScript 7 rejected any option,
the project should fall back to TypeScript 5.9 and record a new ADR. TypeScript
7.0.2 removes `baseUrl` (`TS5102`), but it resolves `paths` relative to
`tsconfig.json` without it, so the `$` alias keeps working for `tsc`, `tsup`, and
`tsx`.

## Decision

- Keep TypeScript 7 as the only type checker.
- Omit `baseUrl`; keep `paths: { "$/*": ["./*"] }`, which TS 7 resolves relative
  to `tsconfig.json`.
- `vitest.config.ts` keeps its explicit `$` alias because Vitest does not read
  `tsconfig` paths.

## Alternatives Considered

- **Fall back to TypeScript 5.9**: rejected. It restores `baseUrl` but loses the
  TS 7 checker the plan targets, for an option TS 7 intentionally removed.
- **Add `paths: { "*": ["./*"] }`**: rejected. It broadens resolution beyond the
  `$` convention and can mask accidental bare imports.
- **Drop the `$` alias entirely**: rejected. It would force long relative paths
  and diverge from the import rule.

## Consequences

- **Positive**: TS 7 works with no configuration beyond removing `baseUrl`; the
  import/alias rule is preserved.
- **Negative / Trade-offs**: the literal `baseUrl` line in BLUEPRINT §6 is no
  longer accurate; readers must follow this ADR.
- **Follow-up**: treat the T1 `tsconfig.json` as the reference config and verify
  that `scripts/` (T2) resolve `$` under `tsx`.
