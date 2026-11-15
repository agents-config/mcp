# ADR-0001: Canonical transports are `stdio` and `http`

> **Superseded by [ADR-0010](./0010-adopt-agent-plugins-mcp-schema.md)** — esta decisão foi substituída pela adoção do padrão Agent Plugins MCP 1.0.0, que define três transportes (`stdio`, `streamable-http`, `sse`) sob o discriminador `type`.

- **Status**: Superseded by ADR-0010
- **Date**: 2026-11-13
- **Related Docs**: [`spec/BLUEPRINT.md`](../../spec/BLUEPRINT.md), [`docs/decisions/0010-adopt-agent-plugins-mcp-schema.md`](./0010-adopt-agent-plugins-mcp-schema.md)

## Context

The canonical format must describe both local process servers and remote HTTP
servers. Several target agents expose only a URL for remote servers, while others
distinguish transports explicitly. Introducing more than one remote discriminator
would force every adapter to carry a distinction that its native format cannot
represent, making round-trips lossy.

## Decision

`v0.1.0` supports exactly two transports: `"stdio"` and `"http"`. `transport` is
required and discriminated. Any other value is invalid.

When importing existing agent files whose native format does not distinguish
transports, or that expose only a `url`, the entry is imported as `"http"` and a
`TRANSPORT_INFERRED` warning is emitted.

## Alternatives Considered

- **Multiple remote discriminators**: rejected. Several native formats cannot
  represent the distinction, so compilation and extraction would silently lose
  information.
- **Infer transport from `command`/`url` without a discriminator**: rejected.
  An explicit discriminator produces better editor validation and clearer errors.

## Consequences

- **Positive**: simpler schema, honest round-trip guarantees, smaller adapter
  surface, one remote code path to test.
- **Negative / Trade-offs**: a server that requires a different remote transport
  must be reached through an HTTP gateway or kept outside the canonical file.
- **Follow-up**: revisit if a target agent documents a distinct transport that
  must be preserved natively.
