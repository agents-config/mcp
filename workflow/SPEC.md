# Specification: MVP `agents-mcp` (`v0.1.0`)

- **Type**: Feature
- **Status**: Draft
- **Owner**: Alex Bruno Cáceres / AI Engineering Team

## Context & Problem Statement

O repositório `agents-mcp/cli` já possui a especificação formal ([`spec/SPEC.md`](../spec/SPEC.md)), a matriz de tradução entre agentes ([`spec/MATRIX.md`](../spec/MATRIX.md)), o blueprint técnico ([`PLAN.md`](../PLAN.md)) e a documentação de uso ([`README.md`](../README.md)). No entanto, ainda não há código-fonte implementado: [`package.json`](../package.json) está na versão `0.0.0` sem dependências, scripts de build/teste ou diretórios `src/`, `scripts/` e `tests/`.

Desenvolvedores que utilizam múltiplos agentes de IA no mesmo projeto (`claude-code`, `cursor`, `vscode`, `opencode`, `windsurf`, `zed`) precisam manter configurações MCP duplicadas e incompatíveis. O objetivo deste MVP é implementar a CLI `agents-mcp` (com alias `mcpx`) e o gerador de JSON Schema para tornar `.agents/mcp.json` a única fonte de verdade (*Single Source of Truth*) com compilação não-destrutiva e higiene de segredos.

## Goals

- Disponibilizar uma CLI funcional em TypeScript/ESM (`Node >= 20`) empacotada via `tsup` (`agents-mcp` e `mcpx`).
- Gerar automaticamente `spec/mcp.schema.json` (Draft-07) a partir do schema Zod canônico (`src/core/schema.ts`).
- Implementar leitura/escrita atômica de `.agents/mcp.json` (escopo de projeto) e `~/.agents/mcp.json` (escopo global), além do estado de sincronização `.agents/.mcp-sync-state.json`.
- Garantir higiene de segredos com placeholders `${VAR}` / `${VAR:-default}`, resolução em 2 níveis (`.env` → `process.env`) e sincronização não-destrutiva de `.env` e `.env.example`.
- Compilar e extrair configurações MCP de forma não-destrutiva (preservando comentários JSONC e chaves não-MCP via `jsonc-parser`) para todos os 6 agentes definidos em [`spec/MATRIX.md`](../spec/MATRIX.md).
- Entregar o ciclo completo de comandos: `init`, `import`, `add` (direto + GitHub + Registry/npm), `sync`, `remove`, `list` e `doctor`, com suporte a modo interativo (`@clack/prompts`) e não-interativo (`--yes` / `CI=true`).

## Non-Goals

- Publicação efetiva do pacote no npm ou deploy do site/domínio `https://agents-mcp.dev` (embora o `$schema` aponte para essa URI conforme `SPEC.md`).
- Suporte a formatos de configuração além dos 6 agentes definidos em `spec/MATRIX.md` (`claude-code`, `cursor`, `vscode`, `opencode`, `windsurf`, `zed`).
- Execução ou proxy em tempo de execução de servidores MCP (a ferramenta é exclusivamente um compilador/gerenciador de configuração).
- Suporte a Node.js `< 20.0.0`.

## Requirements

### Functional Requirements

1. **Schema Canônico & Validação (`src/core/schema.ts`, `scripts/generate-schema.ts`):**
   - Validar `$schema` (URI obrigatória) e `servers` (mapa de `CanonicalServerSchema` discriminado por `transport: "stdio" | "http" | "sse"`).
   - Suportar `disabled?: boolean`, `targets?: AgentId[]`, `cwd?: string` (stdio), `args?: string[]` (default `[]`), `env?: Record<string, string>`, `headers?: Record<string, string>`.
   - Gerar `spec/mcp.schema.json` (Draft-07) via `zod-to-json-schema`.
2. **Armazenamento & Estado (`src/core/store.ts`, `src/core/gitignore.ts`):**
   - Ler/escrever `.agents/mcp.json` e `~/.agents/mcp.json` de forma atômica.
   - Manter `.agents/.mcp-sync-state.json` rastreando os nomes de servidores gerenciados por agente/escopo.
   - Gerenciar bloco `# agents-mcp generated` em `.gitignore` (incluindo `.env`, `.agents/.mcp-sync-state.json` e arquivos derivados de agentes).
3. **Gestão de Variáveis de Ambiente e Segredos (`src/core/env.ts`):**
   - Reconhecer `${VAR_NAME}` e `${VAR_NAME:-default}` via regex `/\$\{([A-Z0-9_]+)(?::-([^}]*))?\}/g`.
   - Resolver variáveis em 2 níveis: (1) `.env` local → (2) `process.env`.
   - Detectar segredos literais (em `env`, `headers`, `args` e `url`) durante `import` e `add`, garantindo `.env` no `.gitignore` antes de gravar valores e mantendo `.env.example` sincronizado (`KEY=`).
4. **Adapters de Agentes (`src/adapters/`):**
   - Implementar `AgentAdapter` (`getConfigPath`, `detect`, `extractServers`, `applyServers`) para:
     - `claude-code`: `.mcp.json` / `~/.claude.json` (root `mcpServers`, `${VAR}` / `${VAR:-default}` nativos, merge não-destrutivo em `~/.claude.json`).
     - `cursor`: `.cursor/mcp.json` / `~/.cursor/mcp.json` (root `mcpServers`, `${env:VAR}`).
     - `vscode`: `.vscode/mcp.json` / User Profile `mcp.json` por SO (root `servers`, JSONC, `${env:VAR}`).
     - `opencode`: `opencode.json` / `~/.config/opencode/opencode.json` (root `mcp`, `type: "local"|"remote"`, `command: [cmd, ...args]`, `environment`, `enabled: !disabled`, `{env:VAR}`, JSONC).
     - `windsurf`: `~/.codeium/windsurf/mcp_config.json` (apenas global, `serverUrl`, `${env:VAR}`).
     - `zed`: `.zed/settings.json` / `~/.config/zed/settings.json` (root `context_servers`, `command: { path, args, env }`, JSONC, `${VAR}`).
   - Emitir warning quando `:-default` ou `cwd` não forem suportados pelo agente alvo.
   - Remover apenas entradas presentes em `previousManagedNames` que saíram da configuração canônica (ou ficaram `disabled: true` em agentes sem flag nativa), preservando servidores manuais e comentários JSONC.
5. **Resolvers de Origem (`src/sources/`):**
   - `direct.ts`: flags `--stdio`, `--http`, `--sse`, `--env`, `--header`, `--cwd` e URLs `http(s)://`.
   - `github.ts`: `owner/repo` ou URL GitHub → busca `server.json` (`main`/`master`) com prioridade `npm` (`npx -y`) → `pypi` (`uvx`) → `oci` (`docker run -i --rm`), ou fallback para `package.json`.
   - `registry.ts`: consulta ao MCP Registry oficial (`registry.modelcontextprotocol.io/v0/servers`) e npm registry (`registry.npmjs.org`).
6. **Comandos CLI (`src/commands/`):**
   - Flags globais: `--global` (`-g`), `--yes` (`-y`), `--agents <lista>`.
   - `init` (com `--force`), `import` (com `--clean` e deduplicação/resolução de conflitos), `add <source>` (com `--name`, `--cwd`, etc.), `sync`, `remove <name>`, `list` (com `--all`), `doctor` (exit code `1` em erros de schema, env ausente, binário ausente no `PATH` ou drift em disco).

### Non-Functional Requirements & Constraints

- **Linguagem & Runtime:** TypeScript 5.x (`strict: true`), ESM (`"type": "module"`), Node.js `>= 20.0.0`.
- **Segurança:** Nunca gravar segredos em `.env` sem antes garantir que `.env` esteja no `.gitignore`; nunca sobrescrever chaves já existentes em `.env`.
- **Resiliência:** `SITE_URL` em `src/core/schema.ts` deve ter fallback seguro (`'https://agents-mcp.dev'`) quando `AGENTS_MCP_SITE_URL` não estiver definida em runtime.
- **Usabilidade / CI:** Todos os fluxos interativos via `@clack/prompts` devem ser contornados de forma determinística quando `--yes` / `-y` ou `CI=true` estiverem ativos.

## Acceptance Criteria

- [ ] `npm run schema:gen` gera `spec/mcp.schema.json` válido (Draft-07) sincronizado com `CanonicalMcpConfigSchema`.
- [ ] `npm run build` gera `./dist/index.js` via `tsup` sem erros e executa em Node 20+ pelos binários `agents-mcp` e `mcpx`.
- [ ] `npm test` executa a suíte `vitest` com 100% dos testes passando para `core/` (schema, store, env, gitignore) e `adapters/` (os 6 agentes, cobrindo `extractServers`, `applyServers`, tradução de env, `targets`, `disabled`, remoção via `previousManagedNames` e preservação de comentários JSONC).
- [ ] Todos os 7 comandos (`init`, `import`, `add`, `sync`, `remove`, `list`, `doctor`) funcionam tanto em modo interativo (TTY) quanto em modo não-interativo (`--yes`), nos escopos de projeto e global (`-g`).
- [ ] `doctor` retorna exit code `1` quando há erro de schema, variável `${VAR}` sem fallback ausente, binário ausente no `PATH` ou drift em arquivos compilados.

## Open Questions

- [ ] No MVP, `tsup` deve usar alias `$` (conforme citado em `PLAN.md`) ou imports relativos padrão ESM? (Recomendado: imports relativos `.js` para evitar configuração extra de resolver no `tsx`/`tsup`, mantendo `tsconfig.json` simples).
- [ ] Para `add` via `github.ts` e `registry.ts`, devemos incluir testes de unidade com `fetch` mockado para não depender de rede no CI? (Recomendado: sim, mocks determinísticos de respostas HTTP).
