# ADR-0002: Zod 4 is the schema source of truth; publish Draft-07

> **Superseded by [ADR-0010](./0010-adopt-agent-plugins-mcp-schema.md)** — esta decisão foi substituída pela adoção do schema Agent Plugins MCP 1.0.0 (`https://agent-plugins.org/schemas/1.0.0/mcp.schema.json`) como base normativa.

- **Status**: Superseded by ADR-0010
- **Date**: 2026-11-13
- **Related Docs**: [`spec/BLUEPRINT.md`](../../spec/BLUEPRINT.md), [`docs/decisions/0010-adopt-agent-plugins-mcp-schema.md`](./0010-adopt-agent-plugins-mcp-schema.md)

## Context

The TypeScript types, runtime validation, and the published JSON Schema must never
drift. The published schema is consumed by editor language services, most of which
implement JSON Schema Draft-07 reliably and still have incomplete 2019-09/2020-12
support. The schema URL also acts as the format version, so it must be reproducible
byte-for-byte in CI.

## Decision

- Define the format once in Zod 4 (`z.strictObject`, `z.discriminatedUnion`,
  `z.url()`), with no `.refine()`/`.transform()` in the exported schema.
- Publish Draft-07 via the native `z.toJSONSchema(schema, { target: 'draft-7',
  io: 'input' })`.
- Generate `spec/mcp.schema.json` from `src/core/schema.ts`, with `$id` equal to
  `https://agents-mcp.dev/schema/v<version>/mcp.schema.json`.
- Keep the site URL and version in `src/config.ts` as constants; no environment
  variable influences generation.
- Enforce drift with `npm run schema:check` (`schema:gen` + `git diff --exit-code`)
  inside `verify` and `dist:build`.

## Alternatives Considered

- **Draft 2020-12**: rejected for now. No feature we need, and weaker editor
  support today. The versioned `$schema` URI makes a future migration cheap.
- **Hand-written schema**: rejected. Guaranteed drift with types and validation.
- **Env-driven site URL**: rejected. It makes the committed artifact machine
  dependent and breaks diff-based CI checks.

## Consequences

- **Positive**: one source of truth, deterministic artifact, strict validation,
  native autocomplete for users.
- **Negative / Trade-offs**: `.refine()` cannot be used in the generator schema;
  extra checks live in `validateConfig()` and are not visible to editors.
- **Follow-up**: snapshot test the generated document; revisit Draft 2020-12 in a
  future major version if editor support matures.
