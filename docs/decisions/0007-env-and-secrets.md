# ADR-0007: `.env` precedence and safe secret extraction

- **Status**: Accepted
- **Date**: 2026-11-13
- **Related Docs**: [`spec/BLUEPRINT.md`](../../spec/BLUEPRINT.md)

## Context

The canonical file is committed, so it must never contain plaintext credentials.
Values must come from the project, not from whatever happens to be exported in the
developer's shell, because that makes builds non-reproducible. Importing existing
configs frequently encounters hard-coded tokens that must be moved somewhere safe
without silently rewriting unrelated values.

## Decision

- Resolution order: local `.env` of the active scope (`<cwd>/.env`, or
  `~/.agents/.env` for global) **first**, then `process.env`. This intentionally
  inverts the common `dotenv` default.
- Canonical and native files contain only `${VAR}` / `${VAR:-default}`
  placeholders; the compiler translates syntax, never substitutes values.
- Secret detection uses key-name heuristics plus value heuristics (URL credentials,
  known token prefixes, high-entropy ≥ 20 chars) across `env`, `headers`, `args`,
  `url`.
- Interactive imports propose extraction per finding; `--yes`/CI only **warn**
  unless `--extract-secrets` is passed.
- Before writing `.env`: ensure it is git-ignored, create it with mode `0600`, and
  never overwrite an existing key. `.env.example` receives `KEY=` only.
- Secret values are masked in all output, including `--dry-run`.

## Alternatives Considered

- **`process.env` first**: rejected. Shell state would override the project and
  make "works on my machine" bugs invisible.
- **Regex-only detection** (any non-placeholder value): rejected. It rewrites
  harmless values such as `NODE_ENV=production`.
- **Never extract automatically**: rejected. It leaves users with invalid
  committed secrets and no guided path.

## Consequences

- **Positive**: reproducible resolution, no secret leakage, explicit CI behavior.
- **Negative / Trade-offs**: differs from `dotenv`; may surprise users who rely on
  exported variables. Must be documented prominently.
- **Follow-up**: `doctor` reports unresolved required variables and tracked `.env`.
