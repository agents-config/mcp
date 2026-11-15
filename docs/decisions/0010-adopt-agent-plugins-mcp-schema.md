# ADR-0010: Adotar o padrão Agent Plugins MCP 1.0.0

- **Status**: Accepted
- **Date**: 2026-11-14
- **Supersedes**: [ADR-0001](./0001-canonical-transports.md), [ADR-0002](./0002-schema-source-and-versioning.md)
- **Related Docs**: [`spec/SPEC.md`](../../spec/SPEC.md), [`UPSTREAM.md`](../../workflow/UPSTREAM.md#U4)

## Context

A CLI `agents-mcp` mantinha um schema JSON próprio (`https://agents-mcp.dev/schema/v0.1.0/mcp.schema.json`) com estrutura proprietária (`servers` na raiz, discriminador `transport: "stdio" | "http"`). Manter um formato concorrente aumenta o custo de evolução e impede a interoperabilidade direta com ferramentas que adotam o padrão aberto **Agent Plugins**.

O padrão **Agent Plugins MCP 1.0.0** (`https://agent-plugins.org/schemas/1.0.0/mcp.schema.json`) define um documento de configuração de servidores MCP com transportes para processos locais (`stdio`), HTTP streaming (`streamable-http`) e o legado HTTP+SSE (`sse`), usando a chave raiz `mcpServers` e o discriminador `type`.

## Decision

Adotar o **Agent Plugins MCP 1.0.0** como base normativa da configuração de MCPs na CLI:

- Chave raiz `mcpServers` (substitui `servers`).
- Discriminador `type` com os três transportes oficiais: `"stdio"`, `"streamable-http"` e `"sse"`.
- `$schema` padrão apontando para `https://agent-plugins.org/schemas/1.0.0/mcp.schema.json`.
- Documentação normativa (`spec/SPEC.md`, `README.md`) referencia `https://agent-plugins.org/plugin-authors/mcp-servers` e o schema oficial.

## Delimitação de valor

A CLI `agents-mcp` gerencia e sincroniza MCPs de forma padronizada no contexto de um projeto (e escopo global do usuário), enquanto o padrão Agent Plugins MCP 1.0.0 continua sendo a referência para a configuração de servidores MCP em plugins individuais. A proposta não cria nem propõe uma variante concorrente do schema Agent Plugins.

## Alternatives Considered

- **Manter o schema próprio (`agents-mcp.dev`)**: rejeitado. Aumenta o custo de evolução, limita a interoperabilidade e força a manutenção de um formato concorrente sem benefício para o usuário.
- **Definir um novo discriminador proprietário**: rejeitado. Incompatível com o ecossistema Agent Plugins e exigiria adaptação em cada target agent.

## Consequences

- **Positive**: interoperabilidade direta com ferramentas que adotam Agent Plugins; schema único e versionado externamente; redução da superfície de manutenção da CLI.
- **Negative / Trade-offs**: o transporte `sse` (legado HTTP+SSE) é exposto internamente na representação canônica, embora a CLI continue usando `--http` e `--command` na interface pública; ADRs-0001 e ADR-0002 são marcadas como supersedidas.
- **Follow-up**: `docs/decisions/0001` e `docs/decisions/0002` marcadas como `Superseded by ADR-0010`; nenhum outro documento depende delas.
