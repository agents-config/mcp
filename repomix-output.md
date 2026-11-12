This file is a merged representation of the entire codebase, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
````
.agents/
  skills/
    code-review/
      SKILL.md
    code-simplification/
      SKILL.md
    codebase-indexing/
      SKILL.md
    decision-records/
      resources/
        ADR.md
      SKILL.md
    environment-preflight/
      SKILL.md
    incremental-implementation/
      SKILL.md
    planning-and-task-breakdown/
      SKILL.md
    spec-driven-workflow/
      resources/
        PLAN.md
        REVIEW.md
        SPEC.md
        TASKS.md
      SKILL.md
    systematic-debugging/
      SKILL.md
    verification-and-testing/
      SKILL.md
.codegraph/
  .gitignore
skills/
  system/
    run-workflow/
      SKILL.md
spec/
  MATRIX.md
  SPEC.md
workflow/
  PLAN.md
  REVIEW.md
  SPEC.md
  TASKS.md
.env.example
.gitignore
LICENSE
package.json
PLAN.md
README.md
skills-lock.json
````

# Files

## File: .codegraph/.gitignore
````
# CodeGraph data files — local to each machine, not for committing.
# Ignore everything in .codegraph/ except this file itself, so transient
# files (the database, daemon.pid, sockets, logs) never show up in git.
*
!.gitignore
````

## File: workflow/PLAN.md
````markdown
# Execution Plan: MVP `agents-mcp` (`v0.1.0`)

- **Spec**: [SPEC.md](./SPEC.md)
- **Status**: Draft

## Technical Approach

Seguiremos a arquitetura Hexagonal (Ports & Adapters) definida em [`PLAN.md`](../PLAN.md):

1. **Núcleo (`src/core/`):** schema Zod como fonte única de verdade (gerando tipos TS e `spec/mcp.schema.json`), persistência atômica em disco (`.agents/mcp.json`, `~/.agents/mcp.json` e `.agents/.mcp-sync-state.json`), motor de variáveis de ambiente/segredos e gerenciamento seguro de `.gitignore`.
2. **Adapters (`src/adapters/`):** interface `AgentAdapter` uniforme para os 6 agentes, apoiada por utilitários compartilhados de edição JSONC (`jsonc-parser`: `modify()` + `applyEdits()`) e tradução de sintaxe de variáveis (`${VAR}` ↔ `${env:VAR}` / `{env:VAR}`).
3. **Sources (`src/sources/`):** resolvers stateless que normalizam entradas diretas (flags/URL), repositórios GitHub (`server.json` / `package.json`) e registries (MCP Registry / npm) para um DTO comum (`ResolvedServerPackage`).
4. **CLI & UI (`src/commands/`, `src/ui/`, `src/index.ts`):** `citty` para roteamento de subcomandos e flags globais (`-g`, `-y`, `--agents`), e wrapper sobre `@clack/prompts` que degrada para defaults seguros em `--yes` ou `CI=true`.

### Decisões-chave e Trade-offs

- **Edição JSONC via AST (`jsonc-parser`):** obrigatória em vez de `JSON.stringify` para preservar comentários e chaves não-MCP (crítico em `.vscode/mcp.json`, `opencode.json`, `.zed/settings.json` e `~/.claude.json`).
- **Fallback de `SITE_URL`:** `process.env.AGENTS_MCP_SITE_URL?.replace(/\/+$/, '') || 'https://agents-mcp.dev'` para evitar falha em máquinas de usuários finais sem `.env`.
- **Entrega em marcos verificáveis:** primeiro setup + core + adapters P0 (`claude-code`, `cursor`, `vscode`, `opencode`) + comandos essenciais (`init`, `import`, `sync`, `add` direto, `remove`, `list`), depois adapters P1 (`zed`, `windsurf`), resolvers remotos (`github`, `registry`) e `doctor`.

## Affected Areas

- [`package.json`](../package.json) — adicionar `bin` (`agents-mcp`, `mcpx`), `dependencies`, `devDependencies` e scripts (`build`, `schema:gen`, `test`, `typecheck`).
- `tsconfig.json`, `tsup.config.ts`, `vitest.config.ts` — configuração de build, tipagem estrita e testes.
- `scripts/generate-schema.ts` → `spec/mcp.schema.json` — geração do JSON Schema Draft-07.
- `src/core/` (`schema.ts`, `store.ts`, `env.ts`, `gitignore.ts`) — núcleo canônico e higiene de segredos.
- `src/adapters/` (`types.ts`, `shared.ts`, `claude-code.ts`, `cursor.ts`, `vscode.ts`, `opencode.ts`, `windsurf.ts`, `zed.ts`, `index.ts`) — compiladores e extratores por agente.
- `src/sources/` (`types.ts`, `direct.ts`, `github.ts`, `registry.ts`, `index.ts`) — resolução de origens para `add`.
- `src/ui/prompts.ts` — abstração de prompts TTY / `--yes` / `CI`.
- `src/commands/` (`init.ts`, `import.ts`, `add.ts`, `sync.ts`, `remove.ts`, `list.ts`, `doctor.ts`) e `src/index.ts` — comandos da CLI.
- `tests/` (`core/`, `adapters/`, `sources/`, `commands/`) — suíte `vitest`.

## Execution Steps

1. **Setup do Projeto & Tooling**
   - Configurar `tsconfig.json` (ESM, `NodeNext`/`Bundler`, `strict: true`), `tsup.config.ts` (banner `#!/usr/bin/env node`, formato `esm`, `dts`, `clean`, `shims`) e `vitest.config.ts`.
   - Instalar dependências (`zod`, `zod-to-json-schema`, `jsonc-parser`, `citty`, `@clack/prompts`) e devDependencies (`typescript`, `tsup`, `tsx`, `vitest`, `@types/node`).
   - Atualizar [`package.json`](../package.json) com `bin` e scripts (`build`, `schema:gen`, `test`, `typecheck`).
   - **Verification:** `npm run typecheck` e `npm test` executam sem erros de configuração.

2. **Núcleo Canônico (`src/core/`) & Geração de Schema**
   - Implementar `src/core/schema.ts` com `AgentIdSchema`, `StdioServerSchema`, `RemoteServerSchema`, `CanonicalServerSchema`, `CanonicalMcpConfigSchema` e constantes `SPEC_VERSION`, `SITE_URL`, `DEFAULT_SCHEMA_URL`.
   - Implementar `scripts/generate-schema.ts` e gerar `spec/mcp.schema.json`.
   - Implementar `src/core/store.ts` (caminhos project/global, escrita atômica via arquivo temporário + rename, leitura/escrita de `.agents/.mcp-sync-state.json`).
   - Implementar `src/core/env.ts` (regex de placeholders, resolução `.env` → `process.env`, detecção de segredos literais, sincronização não-destrutiva de `.env` e `.env.example`).
   - Implementar `src/core/gitignore.ts` (bloco gerenciado `# agents-mcp generated` e proteção de `.env` / `.agents/.mcp-sync-state.json`).
   - **Verification:** Testes unitários em `tests/core/` + `npm run schema:gen` gerando `spec/mcp.schema.json` válido.

3. **Infraestrutura de Adapters & Lote P0 (`claude-code`, `cursor`, `vscode`, `opencode`)**
   - Criar `src/adapters/types.ts` e helpers compartilhados em `src/adapters/shared.ts` (tradução de env vars `${VAR}` ↔ `${env:VAR}` / `{env:VAR}`, tratamento de `:-default` e `cwd` com warnings, edição JSONC via `jsonc-parser`, remoção limpa por `previousManagedNames`).
   - Implementar `claude-code.ts`, `cursor.ts`, `vscode.ts` (com resolução de User Profile por SO) e `opencode.ts`.
   - **Verification:** Testes unitários em `tests/adapters/` validando `extractServers()`, `applyServers()`, comentários JSONC, `targets`, `disabled` e `previousManagedNames`.

4. **Adapters Lote P1 (`zed`, `windsurf`) & Registry de Adapters**
   - Implementar `zed.ts` (`.zed/settings.json` / `~/.config/zed/settings.json`, `context_servers`, `command: { path, args, env }`) e `windsurf.ts` (`~/.codeium/windsurf/mcp_config.json`, global only, `serverUrl`).
   - Implementar `src/adapters/index.ts` com registro dos 6 adapters e função de auto-detecção.
   - **Verification:** Testes unitários para `zed` e `windsurf` + testes de auto-detecção em diretórios temporários.

5. **UI Wrapper & Comandos Core (`init`, `import`, `sync`, `remove`, `list`)**
   - Implementar `src/ui/prompts.ts` suportando `--yes` / `-y` e `CI=true`.
   - Implementar `src/index.ts` com `citty` e flags globais (`--global`, `--yes`, `--agents`).
   - Implementar `init.ts`, `import.ts` (incluindo deduplicação, resolução de conflitos, extração de segredos e `--clean`), `sync.ts`, `remove.ts` e `list.ts`.
   - **Verification:** Testes de integração em diretórios temporários simulando `init`/`import` → `sync` → `list` → `remove` em modo `--yes`.

6. **Resolvers (`src/sources/`) & Comando `add`**
   - Implementar `src/sources/types.ts` e `direct.ts` (flags `--stdio`, `--http`, `--sse`, `--env`, `--header`, `--cwd` e URLs remotas).
   - Implementar `github.ts` (`owner/repo` → `server.json` / `package.json`) e `registry.ts` (MCP Registry API / npm).
   - Implementar `src/commands/add.ts` integrando resolução de origem, prompt de alias/`cwd`/variáveis de ambiente (2 níveis), gravação em `.agents/mcp.json` e `sync`.
   - **Verification:** Testes unitários dos resolvers (com `fetch` mockado) e teste de integração de `add` em modo direto e `--yes`.

7. **Diagnóstico (`doctor`) & Empacotamento Final `v0.1.0`**
   - Implementar `src/commands/doctor.ts` (schema check, env check, runtime binary check no `PATH`, drift check comparando compilação em memória com disco, exit code `1` em erros).
   - Validar build final `npm run build` (`dist/index.js`) e execução real via Node (`node dist/index.js --help`, `init`, `sync`, `doctor` em sandbox temporário).
   - **Verification:** Todos os itens de *Acceptance Criteria* em `SPEC.md` marcados e validados.

## Verification Strategy

- **Unitários (`tests/core/`, `tests/adapters/`, `tests/sources/`):** `vitest` cobrindo schema, env/segredos, gitignore, todos os 6 adapters (round-trip `applyServers` ↔ `extractServers`, JSONC, fallbacks) e resolvers com mocks HTTP.
- **Integração (`tests/commands/`):** execução dos comandos CLI contra diretórios temporários (`fs.mkdtempSync`) validando efeitos em `.agents/mcp.json`, `.env`, `.env.example`, `.gitignore` e arquivos nativos dos agentes.
- **Comandos de checagem contínua:**
  - `npm run typecheck` (`tsc --noEmit`)
  - `npm test` (`vitest run`)
  - `npm run schema:gen`
  - `npm run build` (`tsup`)

## Risks & Rollback

- **Edição destrutiva em `~/.claude.json` ou `.zed/settings.json`:** risco de corromper configurações não-MCP do usuário. *Mitigação:* usar exclusivamente `jsonc-parser` (`modify()` + `applyEdits()`), nunca reescrever o objeto raiz inteiro, e escrever de forma atômica.
- **Vazamento acidental de segredos durante `import`/`add`:** *Mitigação:* garantir que `.env` esteja listado em `.gitignore` **antes** de escrever qualquer segredo em disco, e nunca sobrescrever chaves já existentes em `.env`.
- **Variável `AGENTS_MCP_SITE_URL` ausente em produção:** *Mitigação:* fallback hardcoded para `'https://agents-mcp.dev'` em `src/core/schema.ts`.
- **Diferenças de caminho global por OS (especialmente VS Code):** *Mitigação:* isolar resolução de paths por `process.platform` (`linux`, `darwin`, `win32`) e testar com mocks de `os.homedir()` / `process.platform`.
- **Rollback:** Como o projeto ainda está em `0.0.0` sem código em `src/`, cada fase pode ser revertida isoladamente por commit antes de avançar para a próxima.
````

## File: workflow/REVIEW.md
````markdown
# Code Review: MVP `agents-mcp` (`v0.1.0`)

- **Spec**: [SPEC.md](./SPEC.md)
- **Plan**: [PLAN.md](./PLAN.md)
- **Reviewer**: Pending
- **Status**: Open

## Summary

Aguardando início da implementação. Este documento centralizará achados de revisão durante a execução das tarefas em [TASKS.md](./TASKS.md).

## Findings

### Blockers

*(Nenhum ainda)*

### Major

*(Nenhum ainda)*

### Minor / Nits

*(Nenhum ainda)*

### Questions

*(Nenhuma ainda)*
````

## File: workflow/SPEC.md
````markdown
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
````

## File: workflow/TASKS.md
````markdown
# Tasks: MVP `agents-mcp` (`v0.1.0`)

- **Plan**: [PLAN.md](./PLAN.md)
- **Execution Mode**: Sequential / Parallelizable by Module

## Task Board

| ID | Task | Type | Status | Owner / Agent | Dependencies | Scope (Files/Modules) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| T1 | Setup TypeScript, `tsup`, `vitest` e `package.json` | `chore` | `pending` | — | None | `package.json`, `tsconfig.json`, `tsup.config.ts`, `vitest.config.ts` |
| T2 | Schema canônico Zod e gerador `spec/mcp.schema.json` | `feature` | `pending` | — | T1 | `src/core/schema.ts`, `scripts/generate-schema.ts`, `spec/mcp.schema.json`, `tests/core/schema.test.ts` |
| T3 | Store atômico, gestão de `.env` e `.gitignore` | `feature` | `pending` | — | T2 | `src/core/store.ts`, `src/core/env.ts`, `src/core/gitignore.ts`, `tests/core/` |
| T4 | Infraestrutura de adapters + Lote P0 (`claude-code`, `cursor`, `vscode`, `opencode`) | `feature` | `pending` | — | T2 | `src/adapters/types.ts`, `src/adapters/shared.ts`, `src/adapters/{claude-code,cursor,vscode,opencode}.ts`, `tests/adapters/` |
| T5 | Adapters Lote P1 (`zed`, `windsurf`) + Registry/Auto-detecção | `feature` | `pending` | — | T4 | `src/adapters/{zed,windsurf,index}.ts`, `tests/adapters/` |
| T6 | UI prompts wrapper e entrypoint CLI (`citty`) | `feature` | `pending` | — | T1 | `src/ui/prompts.ts`, `src/index.ts` |
| T7 | Comandos core (`init`, `import`, `sync`, `remove`, `list`) | `feature` | `pending` | — | T3, T5, T6 | `src/commands/{init,import,sync,remove,list}.ts`, `tests/commands/` |
| T8 | Source resolvers (`direct`, `github`, `registry`) e comando `add` | `feature` | `pending` | — | T3, T5, T6 | `src/sources/`, `src/commands/add.ts`, `tests/sources/` |
| T9 | Comando `doctor`, testes E2E e validação final do build `v0.1.0` | `feature` | `pending` | — | T7, T8 | `src/commands/doctor.ts`, `tests/commands/`, `dist/` |

## Task Details

### T1: Setup TypeScript, `tsup`, `vitest` e `package.json`

- **Status**: `pending`
- **Dependencies**: None
- **Scope**: `package.json`, `tsconfig.json`, `tsup.config.ts`, `vitest.config.ts`
- **Instructions**: Configurar TypeScript 5.x (`strict: true`, ESM), `tsup` com saída ESM e banner `#!/usr/bin/env node`, `vitest`, instalar dependências (`zod`, `zod-to-json-schema`, `jsonc-parser`, `citty`, `@clack/prompts`) e atualizar `package.json` com `bin` (`agents-mcp`, `mcpx`) e scripts (`build`, `schema:gen`, `test`, `typecheck`).
- **Done Criteria**:
  - [ ] `npm run typecheck` e `npm test` executam sem erros de setup.

### T2: Schema canônico Zod e gerador `spec/mcp.schema.json`

- **Status**: `pending`
- **Dependencies**: T1
- **Scope**: `src/core/schema.ts`, `scripts/generate-schema.ts`, `spec/mcp.schema.json`, `tests/core/schema.test.ts`
- **Instructions**: Implementar `CanonicalMcpConfigSchema` e sub-schemas conforme `spec/SPEC.md` (incluindo fallback seguro para `SITE_URL`), criar `scripts/generate-schema.ts` usando `zod-to-json-schema` (Draft-07) e adicionar testes de validação positiva/negativa.
- **Done Criteria**:
  - [ ] `npm run schema:gen` gera `spec/mcp.schema.json` válido.
  - [ ] `tests/core/schema.test.ts` passa no `vitest`.

### T3: Store atômico, gestão de `.env` e `.gitignore`

- **Status**: `pending`
- **Dependencies**: T2
- **Scope**: `src/core/store.ts`, `src/core/env.ts`, `src/core/gitignore.ts`, `tests/core/`
- **Instructions**: Implementar leitura/escrita atômica de `.agents/mcp.json`, `~/.agents/mcp.json` e `.agents/.mcp-sync-state.json`; parser e resolução 2-níveis de `${VAR}` / `${VAR:-default}`; detecção de segredos literais e sync de `.env` + `.env.example`; gerenciamento do bloco `# agents-mcp generated` no `.gitignore`.
- **Done Criteria**:
  - [ ] Testes unitários para `store`, `env` e `gitignore` passam.
  - [ ] `.env` nunca recebe segredos sem estar protegido no `.gitignore`.

### T4: Infraestrutura de adapters + Lote P0 (`claude-code`, `cursor`, `vscode`, `opencode`)

- **Status**: `pending`
- **Dependencies**: T2
- **Scope**: `src/adapters/types.ts`, `src/adapters/shared.ts`, `src/adapters/{claude-code,cursor,vscode,opencode}.ts`, `tests/adapters/`
- **Instructions**: Definir `AgentAdapter` e helpers de interpolação/JSONC (`jsonc-parser` `modify()` + `applyEdits()`). Implementar `claude-code`, `cursor`, `vscode` e `opencode` seguindo exatamente `spec/MATRIX.md`.
- **Done Criteria**:
  - [ ] Testes unitários para os 4 adapters cobrindo `extractServers`, `applyServers`, comentários JSONC, `targets`, `disabled` e `previousManagedNames`.

### T5: Adapters Lote P1 (`zed`, `windsurf`) + Registry/Auto-detecção

- **Status**: `pending`
- **Dependencies**: T4
- **Scope**: `src/adapters/{zed,windsurf,index}.ts`, `tests/adapters/`
- **Instructions**: Implementar `zed` (`.zed/settings.json` / `~/.config/zed/settings.json`) e `windsurf` (global only, `serverUrl`). Registrar os 6 adapters em `src/adapters/index.ts` com heurísticas de `detect(scope, cwd)`.
- **Done Criteria**:
  - [ ] Testes unitários para `zed`, `windsurf` e auto-detecção passam.

### T6: UI prompts wrapper e entrypoint CLI (`citty`)

- **Status**: `pending`
- **Dependencies**: T1
- **Scope**: `src/ui/prompts.ts`, `src/index.ts`
- **Instructions**: Criar wrapper sobre `@clack/prompts` com suporte a `--yes`/`-y` e `CI=true`. Configurar entrypoint `citty` com flags globais (`--global`, `--yes`, `--agents`) e registro dos subcomandos.
- **Done Criteria**:
  - [ ] CLI responde a `--help` e encaminha flags globais corretamente.

### T7: Comandos core (`init`, `import`, `sync`, `remove`, `list`)

- **Status**: `pending`
- **Dependencies**: T3, T5, T6
- **Scope**: `src/commands/{init,import,sync,remove,list}.ts`, `tests/commands/`
- **Instructions**: Implementar os 5 comandos do ciclo principal conforme `PLAN.md` §7, garantindo suporte a escopo `project`/`global` e modo `--yes`.
- **Done Criteria**:
  - [ ] Testes de integração em diretório temporário cobrem `init`, `import` (com extração de segredos e `--clean`), `sync`, `list` e `remove`.

### T8: Source resolvers (`direct`, `github`, `registry`) e comando `add`

- **Status**: `pending`
- **Dependencies**: T3, T5, T6
- **Scope**: `src/sources/{types,direct,github,registry,index}.ts`, `src/commands/add.ts`, `tests/sources/`
- **Instructions**: Implementar `ResolvedServerPackage` e os 3 resolvers na ordem `direct` → `github` (`server.json` / `package.json`) → `registry` (MCP Registry / npm). Integrar ao comando `add` com prompt de alias, `cwd`, env vars (2 níveis) e `sync` automático.
- **Done Criteria**:
  - [ ] Testes unitários dos resolvers (com `fetch` mockado) e teste de integração do `add` passam.

### T9: Comando `doctor`, testes E2E e validação final do build `v0.1.0`

- **Status**: `pending`
- **Dependencies**: T7, T8
- **Scope**: `src/commands/doctor.ts`, `tests/commands/`, `dist/`
- **Instructions**: Implementar `doctor` (schema, env vars, binários no `PATH`, drift em disco, exit code `1` em erros). Rodar `npm run typecheck`, `npm test`, `npm run schema:gen` e `npm run build`, validando os binários `agents-mcp` e `mcpx` em Node 20+.
- **Done Criteria**:
  - [ ] `doctor` detecta e reporta os 4 tipos de falha com exit code `1`.
  - [ ] `npm run build` gera `dist/index.js` funcional e toda a suíte `vitest` passa.
````

## File: .agents/skills/code-review/SKILL.md
````markdown
---
name: code-review
description: >-
  Perform structured, multi-dimensional code reviews aligned with the
  `spec-driven-workflow` (`workflow/SPEC.md`, `workflow/PLAN.md`,
  `workflow/REVIEW.md`). Use this skill after implementing a feature or bug fix,
  before merging a PR, or when reviewing changes written by another agent or
  human.
---

# Code Review

Review code changes against both **engineering quality** and **specification intent**, recording every actionable finding in `workflow/REVIEW.md`.

## Review Philosophy

- **Net improvement over perfection**: Approve changes that clearly improve overall code health and satisfy `workflow/SPEC.md`, even if minor stylistic preferences differ.
- **Evidence over opinion**: Ground every finding in a concrete file path, line range or symbol, and explain *why* it matters.
- **Zero silent passes**: Do not approve or finish work while any `blocker` or `major` finding remains `open`.

## 1. Load Workflow Context First

Before inspecting the diff, read the active `workflow/` artifacts (or `workflow/<change-slug>/` for scoped parallel work):

1. **`workflow/SPEC.md`** — Verify goals, non-goals, constraints, and acceptance criteria.
2. **`workflow/PLAN.md`** (and **`workflow/TASKS.md`**, if present) — Understand the intended technical approach and module scope.
3. **`workflow/REVIEW.md`** — Check prior review rounds so resolved items are not re-reported and open items are re-verified.

If `workflow/REVIEW.md` does not exist yet, create it (using the `spec-driven-workflow` `REVIEW.md` template if installed).

## 2. Five-Axis Review Framework

Evaluate the diff (e.g., `git diff`, staged changes, or target PR) across all five dimensions:

1. **Correctness & Spec Alignment**
   - Does the implementation satisfy every acceptance criterion in `workflow/SPEC.md`?
   - Does it stay within scope (no unintended changes outside `SPEC.md` / `PLAN.md`)?
   - Are edge cases (null/empty values, boundaries, concurrency) and error paths handled?
   - Do tests verify the new behavior and guard against regressions?
2. **Readability & Simplicity**
   - Are names clear and consistent with the codebase?
   - Is control flow shallow and easy to follow without dead code or over-engineering?
3. **Architecture & Maintainability**
   - Does the change follow existing codebase patterns and respect module boundaries?
   - Does it avoid duplicated logic or unnecessary coupling?
4. **Security**
   - Is untrusted input validated and sanitized at system boundaries?
   - Are secrets, tokens, and sensitive data kept out of code, configs, and logs?
   - Are queries parameterized and auth/authorization checks enforced?
5. **Performance**
   - Are there obvious N+1 queries, unbounded loops/fetches, memory leaks, or blocking I/O on hot paths?

## 3. Record Findings in `workflow/REVIEW.md`

Log every finding in `workflow/REVIEW.md` using consistent severity tiers and resolution statuses:

- **Severities**:
  - `blocker`: Must be fixed before completion (broken spec requirement, security flaw, data-loss risk, failing build/tests).
  - `major`: Must be addressed before completion (edge-case bug, weak error handling, architectural violation, missing test coverage).
  - `minor`: Optional improvement or nit (naming, minor readability cleanup); never blocks approval.
  - `question`: Clarification needed from the author or implementing agent.
- **Statuses**: `open` | `resolved` | `wontfix` (with brief rationale).

Each finding entry must include:
- A unique ID (e.g., `[R1]`, `[Q1]`), exact file path and line/symbol reference, severity, status, **Issue**, and **Action**.

## 4. Verification & Sign-Off

1. Run the project's verification commands (`test`, `lint`, `typecheck`, `build` as applicable) rather than relying on inspection alone.
2. Update `workflow/REVIEW.md` status (`Open` | `Changes Requested` | `Approved`):
   - **Approved**: All `SPEC.md` acceptance criteria are met, checks pass, and zero `blocker` or `major` items remain `open`.
   - **Changes Requested**: One or more `blocker` or `major` items remain `open`.
3. Follow the `spec-driven-workflow` cleanup rule: **never delete** `workflow/REVIEW.md`; only clear/reset its contents after the user confirms everything is ready.
````

## File: .agents/skills/code-simplification/SKILL.md
````markdown
---
name: code-simplification
description: >-
  Simplify code for human readability, clarity, and directness without
  changing behavior. Use this skill after implementing a feature, during
  refactoring, or when addressing code review feedback—especially when code feels
  over-engineered, deeply nested, or takes unnecessary detours to do simple
  things.
---

# Code Simplification

Make code **clean, direct, and easy for humans to read** while preserving exact runtime behavior. Prefer straightforward, objective implementations over clever tricks or premature abstractions.

## Core Principles

1. **Preserve Behavior Exactly**: Inputs, outputs, side effects, error semantics, and edge-case guards must remain identical. Existing tests must pass without modification.
2. **Clarity Over Cleverness (and Over Brevity)**: The goal is human comprehension, not fewer lines. Never replace readable code with cryptic one-liners, nested ternaries, or dense chains.
3. **Direct Over Indirection**: Do not take three hops to do something simple. Inline trivial single-use wrappers, pass-through helpers, and speculative abstractions that add ceremony without clarity.
4. **Chesterton's Fence**: Before deleting or rewriting code that looks redundant or defensive, understand *why* it was written (check callers, tests, comments, or `workflow/SPEC.md`).

## When to Apply

- Right after a feature or bug fix works and tests pass, to clean up rough or over-complicated implementation details.
- When functions have deep `if/else` nesting, long monolithic blocks, or unclear variable/method names.
- When `workflow/REVIEW.md` flags readability, maintainability, or over-engineering issues.

## What to Simplify

- **Flatten control flow**: Replace deep `if/else` nesting with guard clauses and early returns.
- **Remove unnecessary indirection**: Collapse pass-through functions, single-use factories, or redundant layers that hide simple operations.
- **Make logic linear and objective**: Replace convoluted state flags or roundabout transformations with direct, step-by-step code.
- **Right-size functions**: Break up overly long functions into cohesive, well-named units—only when each unit represents a clear step, not to fragment trivial code.
- **Use clear names, trim obvious noise**: Rename vague identifiers so code is self-explanatory. Remove comments that merely restate the code, while preserving non-obvious *why* comments and existing docstrings.
- **Unify genuine duplication**: When two blocks repeat the same logic, extract a single parameterized helper rather than maintaining parallel copies.

## Guardrails (What NOT to Do)

- Do **not** alter public APIs, return shapes, or error handling unless explicitly requested.
- Do **not** refactor unrelated files outside the scope of the current change.
- Do **not** remove edge-case checks (`null`, empty, boundary conditions) unless proven unreachable.

## Verification

1. Review the diff to confirm every change is simpler, cleaner, and strictly behavior-preserving.
2. Run the relevant test suite, linter, and typechecker to verify all checks pass unchanged.
````

## File: .agents/skills/codebase-indexing/SKILL.md
````markdown
---
name: codebase-indexing
description: >-
  Index, synchronize, and query a project's codebase using CodeGraph and
  Repomix. Use this skill when exploring an unfamiliar repository, maintaining
  up-to-date code intelligence after edits, or setting up project indexing with
  `.codegraph/` and Markdown-formatted Repomix snapshots.
---

# Codebase Indexing (CodeGraph + Repomix)

Maintain a dual indexing setup and **use these indexed artifacts as your primary context** to understand the project's full structure, architecture, and engineering before scanning individual files or running brute-force searches:
- **CodeGraph** (`.codegraph/`) as the primary source for structural symbol lookup, call paths, and dependency graphs.
- **Repomix** (`repomix-output.md`) as the primary single-file Markdown snapshot of the repository's layout and implementation.

Always check whether each index already exists before running commands: **initialize** when missing, and **sync/update** when present.

## 1. CodeGraph

### Pre-flight Check

Before running any CodeGraph command, verify that the `codegraph` executable is available in the environment (`command -v codegraph`).

- **If `codegraph` is NOT installed**:
  - **Alert the user immediately** that CodeGraph indexing cannot be executed because the `codegraph` executable is missing from the environment.
  - Provide clear installation and setup instructions:
    ```bash
    # Install globally via npm (or run `npx @colbymchenry/codegraph` for interactive setup)
    npm install -g @colbymchenry/codegraph

    # Optional: configure MCP / AI agent integration
    codegraph install

    # Initialize and index the project
    codegraph init
    codegraph index
    ```
  - Do not silently ignore the missing binary; continue with Repomix (if available) and note that CodeGraph remains unindexed until installed.

### Check & Initialize vs. Sync

Check if `.codegraph/` exists at the repository root:

- **If `.codegraph/` does NOT exist** — initialize and build the graph database:
  ```bash
  codegraph init
  codegraph index
  ```
- **If `.codegraph/` already exists** — always run incremental synchronization:
  ```bash
  codegraph sync
  ```
  Do not re-run `codegraph init` or a full `codegraph index` when `.codegraph/` is already present, unless the database is corrupted or major structural resets require a rebuild.

### Querying CodeGraph

Reach for CodeGraph before running brute-force `grep`/`find` across the codebase:

- **MCP tool** (when available): call `codegraph_explore` with symbol names, file paths, or architectural questions.
- **CLI**: run `codegraph explore "<symbol names or question>"`.

## 2. Repomix (Markdown Priority)

Always prioritize **Markdown** (`--style markdown`) for Repomix outputs so the snapshot is readable by both humans and LLMs. Always invoke Repomix via `npx -y` so it executes reliably even when not installed globally and without interactive prompts.

### Check & Create vs. Update

Check if a Repomix Markdown file (e.g., `repomix-output.md`, or the output path configured in `repomix.config.json`) exists:

- **If it does NOT exist** — create it in Markdown format:
  ```bash
  npx -y repomix --style markdown -o repomix-output.md
  ```
- **If it already exists** — re-run the update command to synchronize it with the current codebase:
  ```bash
  npx -y repomix --style markdown -o repomix-output.md
  ```
  *(If `repomix.config.json` is present and already configured with `"style": "markdown"`, running `npx -y repomix` updates the configured output file directly.)*

## 3. Maintenance & Verification

1. **Keep indexes fresh**: Run `codegraph sync` and update the Repomix Markdown file after significant code changes, branch switches, or merges.
2. **Respect repository hygiene**: Check `.gitignore` before committing generated `.codegraph/` or `repomix-output.md` artifacts—ignore them unless the project explicitly tracks them in version control.
3. **Verify**: Confirm `.codegraph/` responds to `codegraph explore` and `repomix-output.md` (or the configured `.md` file) reflects the latest file tree.
````

## File: .agents/skills/decision-records/resources/ADR.md
````markdown
# ADR-<NNNN>: <Short Decision Title>

- **Status**: Proposed | Accepted | Deprecated | Superseded by [ADR-XXXX](./XXXX-title.md)
- **Date**: <YYYY-MM-DD>
- **Related Workflow**: `workflow/SPEC.md` / `workflow/PLAN.md` (if applicable)

## Context

What problem, constraint, or force is driving this decision? Keep it factual and concise.

## Decision

What specific approach or choice are we adopting? State it clearly in active voice.

## Alternatives Considered

- **<Alternative A>**: Why it was not chosen (pros/cons).
- **<Alternative B>**: Why it was not chosen (pros/cons).

## Consequences

- **Positive**: Benefits and capabilities gained.
- **Negative / Trade-offs**: Costs, complexity, or limitations accepted.
- **Follow-up**: Any migration, monitoring, or future review needed.
````

## File: .agents/skills/decision-records/SKILL.md
````markdown
---
name: decision-records
description: >-
  Document significant technical and architectural decisions as lightweight
  Architecture Decision Records (ADRs). Use this skill when `workflow/SPEC.md`
  or `workflow/PLAN.md` introduces a hard-to-reverse choice, cross-cutting
  trade-off, new dependency, or protocol/schema change worth preserving for
  future contributors.
---

# Decision Records (ADRs)

Capture **why** important technical decisions were made—along with alternatives considered and trade-offs accepted—in concise, immutable Markdown records.

## When to Create an ADR

Create an ADR when a change involves:

- A **hard-to-reverse** architectural or data-model choice.
- A **cross-cutting trade-off** affecting multiple modules, services, or teams.
- Adding or replacing a core dependency, protocol, storage engine, or integration pattern.

**Skip ADRs** for routine implementation details, local refactorings, or easily reversible choices—those belong in `workflow/PLAN.md` or code comments.

## Storage & Naming

- Store records in `docs/decisions/` (or `docs/adr/` if the repository already uses that convention).
- Name files sequentially with a lowercase hyphenated slug:
  `docs/decisions/0001-short-decision-title.md`
- Start from the template in [ADR.md](./resources/ADR.md).

## Rules

1. **Link with `workflow/`**: Reference the ADR from `workflow/PLAN.md` (and `workflow/SPEC.md` if applicable) so design context stays connected.
2. **Keep it concise**: Focus on context, decision, alternatives rejected, and consequences—avoid turning an ADR into a tutorial or full specification.
3. **Immutable history**: Once accepted, do not rewrite an old ADR's intent; if a decision changes later, create a new ADR that marks the previous one as `Superseded by <ADR-XXXX>`.
````

## File: .agents/skills/environment-preflight/SKILL.md
````markdown
---
name: environment-preflight
description: >-
  Inspect a project's structure, frameworks, and tech stack, then verify in the
  user's shell and development environment whether the agent has direct access
  to the required runtimes, package managers, and CLIs. Use this skill when
  starting work in a repository, before running builds/tests/toolchains, or when
  diagnosing missing command-line tools—and notify the user clearly whenever
  required tools are missing or inaccessible.
---

# Environment Preflight

Before assuming you can build, test, lint, migrate, or run a project's toolchain, **inspect the repository to determine what technologies it uses**, then **probe the active shell environment** to confirm direct access to every required tool. Never guess, fabricate tool output, or silently skip a check when a CLI is unavailable.

## 1. Identify Project Stack & Required Tools

Scan the repository root (and workspace/monorepo packages, if present) for manifests, lockfiles, and configuration files to map the tech stack:

- **Runtimes & Version Pins**: `.nvmrc`, `.node-version`, `.python-version`, `.ruby-version`, `.tool-versions`, `mise.toml`, `rust-toolchain.toml`, `go.mod`, `engines` in `package.json`, `requires-python` in `pyproject.toml`.
- **Package Managers & Lockfiles**: `package.json` + `package-lock.json` / `pnpm-lock.yaml` / `yarn.lock` / `bun.lockb`, `pyproject.toml` / `uv.lock` / `poetry.lock` / `requirements.txt`, `Cargo.toml`, `go.mod`, `pom.xml`, `build.gradle*`, `Gemfile`, `composer.json`.
- **Frameworks, Build & Quality Tools**: Scripts and configs (e.g., `scripts` in `package.json`, `Makefile`, `justfile`, `Taskfile.yml`, `tsconfig.json`, `vite.config.*`, `next.config.*`, `pytest.ini`, `ruff.toml`, `.eslintrc*`, `biome.json`).
- **Infrastructure & External CLIs**: `Dockerfile`, `docker-compose.yml`, `terraform/`, `k8s/`, `.github/workflows/*`, database/migration configs (e.g., `prisma/`, `drizzle.config.*`, `alembic.ini`), or cloud/platform configs (`vercel.json`, `firebase.json`, `fly.toml`).

From these files, build a concise list of **required** tools for the current task (e.g., runtime, package manager, test runner, linter/typechecker, container or cloud CLI) and **optional** tools.

## 2. Probe the Shell & Development Environment

Check what the agent can directly execute in the current terminal/shell:

1. **Check binary availability**:
   - POSIX (`bash`/`zsh`/`sh`): `command -v <tool>` (or `which <tool>`).
   - Windows PowerShell: `Get-Command <tool> -ErrorAction SilentlyContinue`.
2. **Check project-local and version-manager paths** before concluding a tool is missing:
   - Node.js: `./node_modules/.bin/<tool>` (or `npx` / `pnpm exec` / `bunx`).
   - Python: `.venv/bin/<tool>`, `venv/bin/<tool>`, or `uv run <tool>`.
   - Version managers: `nvm`, `fnm`, `mise`, `asdf`, `pyenv`, `rbenv`, `rustup` (check if shims exist or if the shell hasn't initialized them).
3. **Verify versions & runtime readiness**:
   - Run lightweight version checks (`<tool> --version` or `<tool> version`) and compare against project version pins.
   - For daemon- or auth-dependent CLIs (e.g., `docker`, `kubectl`, `gh`, `aws`, `gcloud`, `psql`), verify operational access when the task requires them (e.g., `docker info`, `gh auth status`)—not just binary existence.
4. **Do not mutate the system silently**:
   - Never install global packages, modify shell profiles, or change system toolchains without explicit user approval.

## 3. Classify Findings & Notify the User

Categorize each required tool into one of three states:

- **Ready**: Accessible in the agent's shell (or project-local environment) with a compatible version.
- **Accessible with caveats**: Installed, but requires activating a local environment (e.g., `.venv`, `nvm use`), has a version mismatch against project pins, or its daemon/auth/network access is unavailable in the current shell.
- **Missing / Inaccessible**: Not installed or not reachable from the agent's terminal environment.

### When Tools Are Missing or Inaccessible

**Notify the user immediately** before proceeding with work that depends on those tools. Keep the notification concise and actionable:

1. **What is missing or blocked**: Name the exact tool/CLI and which part of the project or task requires it (e.g., `pnpm` required by `pnpm-lock.yaml`, `docker` daemon unreachable).
2. **What was checked**: Mention the probe performed (e.g., `command -v pnpm`, `.venv/bin/pytest`, `docker info`) and the observed error or version mismatch.
3. **How to resolve**: Provide clear installation, `PATH`/environment activation, or permission instructions—or ask the user to run the command locally and share the output if the agent environment cannot access it.
4. **Impact on current task**: State clearly whether you can still make progress (e.g., implementing code changes while deferring test/build verification to the user) or whether the task is blocked until the tool is available.

## 4. Session Discipline

- Run this preflight once when entering an unfamiliar project or starting a new toolchain-dependent task; do not repeat identical probes on every step.
- Re-probe only when switching to a different subproject/stack or after the user confirms they installed or fixed a tool.
````

## File: .agents/skills/incremental-implementation/SKILL.md
````markdown
---
name: incremental-implementation
description: >-
  Build features and refactorings in small, verified vertical slices instead of
  large unverified code dumps. Use this skill when executing `workflow/PLAN.md`
  or `workflow/TASKS.md`, modifying multiple files, or implementing changes
  expected to exceed ~100 lines.
---

# Incremental Implementation

Deliver changes in **thin, verifiable increments**—one working slice at a time. Never write an entire multi-file feature in a single unverified pass.

## Core Rule

**One slice, one verification cycle.** Do not start the next slice while the current slice has failing tests, type errors, or a broken build.

## When to Apply

- Executing steps from `workflow/PLAN.md` or tasks from `workflow/TASKS.md`.
- Any change touching two or more files or exceeding ~100 lines of code.
- Refactoring existing modules where behavior must remain intact at every step.

## The Increment Loop

For each step in `workflow/PLAN.md` (or task in `workflow/TASKS.md`):

1. **Scope the Slice**: Pick the smallest cohesive unit that delivers testable progress toward `workflow/SPEC.md`.
2. **Implement Minimally**: Write only the code required for this slice—avoid speculative scaffolding for future slices.
3. **Test & Verify Immediately**: Run targeted unit/integration tests, typecheck, and linter to confirm the slice works and introduces no regressions.
4. **Checkpoint**: Update status in `workflow/PLAN.md` or `workflow/TASKS.md` (e.g., mark `done`), and create a clean commit/checkpoint when appropriate so rollback is effortless.
5. **Repeat**: Advance to the next slice only after the current one is green.

## Slicing Strategies

Choose the slicing strategy that best fits the work:

- **Vertical Slices (Default)**: Implement one thin end-to-end capability across layers (e.g., schema -> service -> endpoint -> test) rather than building all backend files first and all frontend/test files last.
- **Risk-First Slicing**: Tackle the highest-uncertainty assumption, integration, or performance bottleneck in the earliest slice so surprises surface immediately.
- **Contract-First Slicing**: Define types, interfaces, and test assertions first, verify they compile/fail as expected, then implement the concrete behavior.

## Guardrails

- **No stacked brokenness**: Fix failing checks in the current slice before moving on.
- **Keep diffs reviewable**: If a slice grows too large, split it into smaller sub-slices before continuing.
- **Stay aligned with `SPEC.md`**: Do not add unrequested features while implementing a slice.
````

## File: .agents/skills/planning-and-task-breakdown/SKILL.md
````markdown
---
name: planning-and-task-breakdown
description: >-
  Plan execution and break complex work into ordered, verifiable tasks aligned
  with `spec-driven-workflow` (`workflow/SPEC.md`, `workflow/PLAN.md`, and
  conditional `workflow/TASKS.md`). Use this skill when translating a
  specification into a concrete execution plan, scoping large or ambiguous work,
  mapping dependencies, or preparing parallelizable tasks.
---

# Planning & Task Breakdown

Decompose specifications into clear execution steps (`workflow/PLAN.md`) and, when warranted, small verifiable tasks (`workflow/TASKS.md`) before writing any implementation code.

> **Language & Architecture Agnostic**: This skill applies to any technology stack, domain, or project structure. Reason in terms of deliverables, boundaries, dependencies, and verification—never assume specific languages, frameworks, or architectural patterns.

## Core Rule

**Plan in read-only mode.** Explore the repository, map dependencies, and write the plan before modifying any deliverable files. Do not start implementing while planning.

## When to Apply

- Translating `workflow/SPEC.md` into an actionable execution plan (`workflow/PLAN.md`).
- Work feels too large, ambiguous, or multi-faceted to execute in a single pass.
- Multiple independent deliverables or parallel/asynchronous agent executions are possible.
- Skip formal breakdown for trivial, single-step edits where planning adds no value.

## Planning Process

### 1. Ground in `workflow/SPEC.md`

1. Read `workflow/SPEC.md` (or `workflow/<change-slug>/SPEC.md` for scoped initiatives).
   - If `SPEC.md` does not exist yet for a non-trivial change, create and align on `SPEC.md` first.
2. Confirm goals, non-goals, constraints, and acceptance criteria are unambiguous. Surface open questions before committing to a plan.

### 2. Explore & Map Dependencies (Read-Only)

1. Inspect the relevant areas of the repository (preferring indexed context if `codebase-indexing` is active).
2. Identify affected components, shared boundaries, and external constraints.
3. Map the **dependency graph**: determine what blocks what, which steps must run sequentially, and which units are truly independent.

### 3. Author `workflow/PLAN.md`

Create or update `workflow/PLAN.md` (initializing `workflow/` if missing):

- Reference `SPEC.md` requirements rather than duplicating them.
- Order steps logically—tackle high-risk or high-uncertainty unknowns early.
- Define a concrete **Verification Strategy** (automated checks, validations, or manual verification) for each step and for the overall change.
- Note risks and rollback considerations.

### 4. Shard into `workflow/TASKS.md` (Conditional)

Create `workflow/TASKS.md` **only** when at least one `spec-driven-workflow` trigger applies:

1. `PLAN.md` is too large or comprehensive to execute cleanly in a single pass.
2. `PLAN.md` spans two or more distinct scopes, task types (`feature`, `bugfix`, `refactor`, `docs`), or independent deliverables that benefit from separate tracking.
3. Work can be split into independent units executed **in parallel or asynchronously** by different agents or contributors.

When creating `TASKS.md`, ensure every task has:

- **Unique ID & Type** (e.g., `T1`, `feature` | `bugfix` | `refactor` | `docs` | `chore`).
- **Explicit Dependencies**: Clearly state blocking task IDs (or `None`).
- **Disjoint Scope**: Assign non-overlapping files or modules to parallel tasks to prevent merge conflicts.
- **Objective Done Criteria**: Concrete, verifiable conditions that prove the task is complete.

## Quality Checklist

Before handing off `PLAN.md` (and `TASKS.md`) for execution:

1. Every requirement and acceptance criterion in `workflow/SPEC.md` is covered by at least one step or task.
2. No circular dependencies exist, and parallel tasks have non-overlapping scopes.
3. Every step/task is small enough to implement and verify in a single focused pass.
4. No implementation code has been written prematurely during the planning phase.
````

## File: .agents/skills/spec-driven-workflow/resources/PLAN.md
````markdown
# Execution Plan: <Short Title>

- **Spec**: [SPEC.md](./SPEC.md)
- **Status**: Draft | Ready | In Progress | Done

## Technical Approach

Summarize the chosen architecture, key design decisions, and any trade-offs.

## Affected Areas

- `path/to/module_a` — <what changes and why>
- `path/to/module_b` — <what changes and why>

## Execution Steps

1. **<Step 1 Title>**
   - Details of what to implement or modify.
   - Verification: <how to confirm this step works>
2. **<Step 2 Title>**
   - Details of what to implement or modify.
   - Verification: <how to confirm this step works>

## Verification Strategy

- Automated tests to add or update (unit, integration, e2e).
- Commands to run (`test`, `lint`, `build`, `typecheck`).

## Risks & Rollback

- Potential failure modes and how to mitigate or revert safely.
````

## File: .agents/skills/spec-driven-workflow/resources/REVIEW.md
````markdown
# Code Review: <Short Title>

- **Spec**: [SPEC.md](./SPEC.md)
- **Plan**: [PLAN.md](./PLAN.md)
- **Reviewer**: <human or agent>
- **Status**: Open | Changes Requested | Approved

## Summary

Brief overall assessment of correctness, spec alignment, maintainability, and test coverage.

## Findings

### Blockers

- **[R1]** `path/to/file.ext:L10-L25` — **Status**: `open`
  - **Issue**: Describe the bug, security risk, or broken requirement.
  - **Action**: Concrete fix required.

### Major

- **[R2]** `path/to/file.ext:L40` — **Status**: `open`
  - **Issue**: Describe architectural, edge-case, or test gap.
  - **Action**: Recommended change.

### Minor / Nits

- **[R3]** `path/to/file.ext` — **Status**: `open`
  - **Issue**: Style, naming, or small readability improvement.
  - **Action**: Optional or quick cleanup.

### Questions

- **[Q1]** `path/to/file.ext` — **Status**: `open`
  - **Question**: Clarification needed from the author/implementer.
````

## File: .agents/skills/spec-driven-workflow/resources/SPEC.md
````markdown
# Specification: <Short Title>

- **Type**: Feature | Bug Fix | Refactor | Chore
- **Status**: Draft | Approved | In Progress | Done
- **Owner**: <author or agent>

## Context & Problem Statement

Describe the current state, why this change is needed, and (for bug fixes) reproduction steps along with expected vs. actual behavior.

## Goals

- <Measurable outcome 1>
- <Measurable outcome 2>

## Non-Goals

- <Explicitly out-of-scope item 1>

## Requirements

### Functional Requirements

1. <Requirement 1>
2. <Requirement 2>

### Non-Functional Requirements & Constraints

- Performance, security, compatibility, or architectural constraints.

## Acceptance Criteria

- [ ] <Objective, testable criterion 1>
- [ ] <Objective, testable criterion 2>

## Open Questions

- [ ] <Unresolved question, if any>
````

## File: .agents/skills/spec-driven-workflow/resources/TASKS.md
````markdown
# Tasks: <Short Title>

- **Plan**: [PLAN.md](./PLAN.md)
- **Execution Mode**: Sequential | Parallel / Multi-Agent

> Use this file only when the plan is large enough to require sharding or when tasks can be executed asynchronously by separate agents.

## Task Board

| ID | Task | Type | Status | Owner / Agent | Dependencies | Scope (Files/Modules) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| T1 | <Short task title> | `feature` | `pending` | <agent-1> | None | `path/to/scope_a` |
| T2 | <Short task title> | `docs` | `pending` | <agent-2> | None | `path/to/scope_b` |
| T3 | <Integration / verification> | `chore` | `pending` | <agent-1> | T1, T2 | `tests/` |

## Task Details

### T1: <Short task title>

- **Status**: `pending` | `in_progress` | `blocked` | `done`
- **Dependencies**: None
- **Scope**: `path/to/scope_a`
- **Instructions**: Concise implementation instructions for the assigned agent.
- **Done Criteria**:
  - [ ] <Specific check or test passing>

### T2: <Short task title>

- **Status**: `pending` | `in_progress` | `blocked` | `done`
- **Dependencies**: None
- **Scope**: `path/to/scope_b`
- **Instructions**: Concise implementation instructions for the assigned agent.
- **Done Criteria**:
  - [ ] <Specific check or test passing>
````

## File: .agents/skills/spec-driven-workflow/SKILL.md
````markdown
---
name: spec-driven-workflow
description: >-
  Default software engineering workflow using a `workflow/` directory with
  `SPEC.md`, `PLAN.md`, `TASKS.md`, and `REVIEW.md`. Use this skill as the
  standard process whenever starting a feature, bug fix, refactoring,
  architecture change, or code review—to specify requirements, plan execution,
  coordinate parallel tasks, and track review findings.
---

# Spec-Driven Workflow

Adopt this workflow as the **standard software engineering process** for any non-trivial change. Do not jump straight into writing code; follow the gated lifecycle below using the `workflow/` directory to separate **what** needs to change (`SPEC.md`), **how** it will be built (`PLAN.md`), **who** executes independent pieces (`TASKS.md`), and **what** needs attention after implementation (`REVIEW.md`).

## Standard Operating Flow

Follow these phases in order:

1. **Specify (`SPEC.md`)** — Define the problem, scope, constraints, and acceptance criteria before designing or coding.
2. **Plan (`PLAN.md`)** — Map the technical approach, affected files, ordered steps, and verification strategy.
3. **Shard (`TASKS.md`, conditional)** — Break the plan into trackable tasks only when complexity, multi-scope work, or parallel execution warrants it.
4. **Implement** — Execute against `PLAN.md` (or `TASKS.md`), keeping artifact statuses current as work progresses.
5. **Review (`REVIEW.md`)** — Record code review findings (human or agent) and resolve blockers/major issues before completion.

> **Trivial changes exception**: Skip `workflow/` artifacts only for trivial, self-contained edits (e.g., typo fixes, single-line formatting, or minor comment updates) where specification and planning add no value.

## Directory Layout

By default, create artifacts at the repository root under `workflow/`:

```text
workflow/
├── SPEC.md      # Required for any non-trivial change
├── PLAN.md      # Required before implementation starts
├── TASKS.md     # Optional: only for large plans or parallel/async agent work
└── REVIEW.md    # Created during human or agent code review
```

If multiple independent initiatives run concurrently in the same repository, scope each one under `workflow/<change-slug>/` instead of overwriting root files.

If the `workflow/` directory or any required artifact does not exist yet, **create the directory and initialize the missing files automatically** using the templates in `./resources/`.

## Artifact Lifecycle

### 1. `workflow/SPEC.md` — Define the Change

Create `SPEC.md` first for any new feature, bug fix, or architectural change.

- **Purpose**: Align on scope, behavior, constraints, and acceptance criteria before writing code.
- **Template**: Start from [SPEC.md](./resources/SPEC.md).
- **Rules**:
  - State both **Goals** and **Non-Goals** to prevent scope creep.
  - Write testable **Acceptance Criteria** so completion is objective.
  - For bug fixes, document reproduction steps, expected vs. actual behavior, and root cause (once known).

### 2. `workflow/PLAN.md` — Map Execution Steps

Create `PLAN.md` once `SPEC.md` is clear.

- **Purpose**: Translate the specification into concrete, ordered engineering steps.
- **Template**: Start from [PLAN.md](./resources/PLAN.md).
- **Rules**:
  - Reference `SPEC.md` requirements; do not duplicate the full spec.
  - List affected files/modules, ordered implementation steps, and a concrete verification strategy (tests, linters, manual checks).
  - Highlight risks, migrations, or rollback considerations if applicable.

### 3. `workflow/TASKS.md` — Shard Large or Parallel Work (Conditional)

Create `TASKS.md` **only** when at least one of these conditions holds:

1. The `PLAN.md` is too large or comprehensive to execute cleanly in a single pass.
2. The `PLAN.md` spans two or more distinct project scopes (e.g., frontend, backend, infra, or multiple packages), task types (`feature`, `bugfix`, `refactor`, `docs`), or independent deliverables that benefit from separate tracking.
3. Work can be split into independent units executed **in parallel or asynchronously** by different agents or contributors.

- **Template**: Start from [TASKS.md](./resources/TASKS.md).
- **Rules**:
  - Skip `TASKS.md` for small, linear changes where `PLAN.md` is sufficient.
  - Every task must specify an ID, status (`pending`, `in_progress`, `blocked`, `done`), dependencies, owned files/scope (to avoid merge conflicts between parallel agents), and clear done criteria.
  - Keep task statuses updated as work progresses.

### 4. `workflow/REVIEW.md` — Record Code Review Findings

Create or update `REVIEW.md` when a human or reviewing agent inspects the implemented changes.

- **Purpose**: Centralize actionable review observations that require attention before merging.
- **Template**: Start from [REVIEW.md](./resources/REVIEW.md).
- **Rules**:
  - Categorize every observation by severity (`blocker`, `major`, `minor`, `question`).
  - Point to exact file paths, line ranges, or symbols, and explain *why* the issue matters.
  - Track resolution status (`open`, `resolved`, `wontfix`) so nothing is lost across review rounds.

## Verification & Cleanup

Before considering the workflow complete:

1. Every acceptance criterion in `workflow/SPEC.md` is satisfied and verified by tests or explicit checks.
2. All steps in `workflow/PLAN.md` (and `workflow/TASKS.md`, if used) are completed or explicitly deferred.
3. All `blocker` and `major` items in `workflow/REVIEW.md` are marked `resolved` (or `wontfix` with rationale).
4. **Ask the user for final sign-off and cleanup**: Once the plan, tasks (if any), and review are complete, explicitly ask the user if everything is ready and whether the `workflow/` artifacts can be cleaned up.
   - **Never delete** the root `workflow/` directory or its root files (`SPEC.md`, `PLAN.md`, `TASKS.md`, `REVIEW.md`).
   - When the user confirms cleanup, **clear/reset the contents** of the root files (e.g., emptying them or resetting them to their blank templates) while keeping the directory and files intact.
   - **Exception**: Subdirectories created inside `workflow/` by agents working in parallel on independent executions (e.g., `workflow/<change-slug>/`) **may be deleted** upon user confirmation.
````

## File: .agents/skills/systematic-debugging/SKILL.md
````markdown
---
name: systematic-debugging
description: >-
  Investigate bugs and failures through disciplined root-cause analysis before
  writing fixes. Use this skill when diagnosing failing tests, runtime errors,
  regressions, or unexpected behavior—before proposing or applying any code
  changes.
---

# Systematic Debugging

Find and prove the **root cause** before changing any production code. Never guess, apply shotgun patches, or silence errors to make symptoms disappear.

## Core Rule

**No fix without a confirmed root cause.** Every bug fix must follow: **Reproduce -> Isolate -> Prove Root Cause -> Regression Test -> Fix -> Verify**.

## Debugging Process

### 1. Reproduce Reliably

- Capture exact reproduction steps, inputs, environment conditions, and expected vs. actual behavior.
- If the failure cannot be reproduced yet, gather logs, traces, or state snapshots first—do not speculate.

### 2. Isolate & Form Hypotheses

- Narrow the failure boundary (recent changes via `git diff`/`git log`, failing inputs, or call paths via `codebase-indexing` if active).
- Form **one concrete, testable hypothesis** at a time about why the failure occurs.
- Test the hypothesis with targeted observation (logs, minimal reproduction, or debugger/test run).

### 3. Confirm & Document Root Cause

- Confirm the exact mechanism causing the bug with direct evidence.
- If `workflow/SPEC.md` is active for this bug fix, record the reproduction steps and confirmed root cause there before planning the fix.

### 4. Write a Failing Regression Test First

- Create an automated test (or reproducible check) that fails for the **exact** reason of the bug.
- Verify it fails before applying the fix so you know the test actually catches the regression.

### 5. Fix the Root Cause & Verify

- Apply the minimal, clean fix that addresses the root cause—not a workaround around the symptom.
- Run the regression test and the full relevant test suite to confirm no regressions were introduced.

## Anti-Patterns to Avoid

- **Shotgun debugging**: Changing multiple unrelated things at once hoping one works.
- **Symptom masking**: Catching and ignoring exceptions, adding arbitrary retries/sleeps, or loosening assertions to pass tests.
- **Speculative fixes**: Editing code before you can explain *why* it failed.
````

## File: .agents/skills/verification-and-testing/SKILL.md
````markdown
---
name: verification-and-testing
description: >-
  Enforce evidence-based verification and meaningful test coverage before
  claiming any task is complete. Use this skill when writing tests, validating
  `workflow/SPEC.md` acceptance criteria, or verifying builds, linters, and
  runtime behavior after code changes.
---

# Verification & Testing

Never claim a change works, passes, or is complete without **fresh, direct verification evidence** collected after the final edit.

## Core Rule

**Evidence before completion claims.** If you did not run a check after your last change and observe its output, do not report it as passing.

## 1. Align Verification with `workflow/SPEC.md`

- Map every acceptance criterion in `workflow/SPEC.md` and the verification strategy in `workflow/PLAN.md` to a concrete check (automated test, build, lint, typecheck, or explicit runtime check).
- Treat untested acceptance criteria as incomplete work.

## 2. Write Meaningful Tests

- **Test behavior, not implementation details**: Assert observable outputs, state transitions, and side effects so tests survive safe refactoring (`code-simplification`).
- **Cover the edges**: Include boundary values, empty/null inputs, invalid states, and error paths—not just the happy path.
- **Keep tests isolated and deterministic**: Avoid shared mutable state, real network calls, or time-dependent flakiness unless explicitly testing integration boundaries.
- **Never weaken assertions**: Do not relax, skip, or mock away the core behavior under test just to make a suite green.

## 3. Execution Gate After Final Edit

Before handing off work or moving to `workflow/REVIEW.md`:

1. Run the relevant unit/integration tests, linter, typechecker, and build commands.
2. Confirm **all** executed checks pass with zero skipped or relaxed assertions.
3. Report the exact scope of what was run (e.g., full suite vs. targeted subset, any environment limitations).
````

## File: skills/system/run-workflow/SKILL.md
````markdown
---
name: run-workflow
description: 'How to write and run a dynamic workflow script with the `run_workflow` tool: a Python script that orchestrates many agents with `agent`, `parallel`, `pipeline`, and `phase`. Use when a task splits into many independent or staged pieces of agent work (fan out over files, modules, bugs, or review angles, then aggregate), or when the user asks for a workflow. Don''t use for a single delegated task (use a subagent) or for legacy workflow files (see migrate-workflows).'
metadata:
    namespace: system
---
# Dynamic workflows with `run_workflow`

A workflow is a short Python script that the `run_workflow` tool executes. The
script decides which agents to start, in what order, and what to do with their
results. Use it instead of many manual subagent calls when the orchestration
itself is code: loops over a list, fan-out then aggregate, or staged pipelines.

## Steps

1.  Pass the script inline as `Script`, or write it to a file (for example in
    the conversation scratch directory) and pass its absolute path as
    `ScriptPath`. Set exactly one of them; a file is easier to fix and rerun.
2.  Call `run_workflow(Script="...", Description="...")` or
    `run_workflow(ScriptPath="/abs/path/workflow.py", Description="...")`.
    `Description` is a one-line goal shown in the UI.
    The workflow runs in the background, and you are notified when it ends.
    For a quick script, such as a `call_tool` fan-out, set
    `WaitMsBeforeAsync` (up to 10000) to get the result in the same turn if it
    finishes in time.
    To pass inputs, set `Args` to a JSON object; the script reads it as the
    `args` dict. When `ScriptPath` is a saved workflow's entry script, `Args`
    is validated against the args schema in its `workflow.json`.
3.  Read the tool result: it contains the `log()` output (`Logs:`) and what the
    script printed (`Output:`). Each agent is also linked from the workflow
    step, so the user can open its conversation.
4.  If the tool returns an error, fix the script at the reported line and run
    it again.

## Script rules

The script runs in its own `python3` process, which needs Python 3.8 or later
on `PATH`:

-   `await` works at the top level, and you can define `async def` helpers.
-   Installed library workflows are importable by name (`import <library>` or
    `from <library> import <name>`); library modules see the same primitives as
    the script.
-   What the script prints (`print()`, `stderr`, child-process output, and the
    `repr` of a trailing expression) is returned in the tool result's `Output:`
    section (and appended to the error when the workflow fails).
-   An uncaught exception stops the workflow and reports the script line.
-   `CONVERSATION_ID` and `STEP_INDEX` identify the `run_workflow` step.
    `WORKSPACES` is a tuple of the workspace directories, primary first (empty
    if there are none).
-   The working directory is `Cwd` if given, else `WORKSPACES[0]`, so relative
    paths resolve against it. Local modules are not importable.

## Primitives

| Primitive | Behavior |
| --- | --- |
| `log(*args)` | Adds a line to the workflow output and the UI. |
| `phase(name)` | Starts a named phase; later logs and agents group under it. |
| `agent(prompt=None, schema=None, role=None, type_name="self", workspace="inherit", model=None)` | Defines an agent; nothing runs yet. `await agent(prompt, schema)` runs it once and returns its result. `a = agent(...)` then `await a(prompt, schema)` runs one turn in a conversation kept across calls. |
| `parallel(items, fn)` | Promise that calls `fn(item)` for each item and awaits all results concurrently; results are in item order. If one fails, the rest are cancelled. |
| `pipeline(items, fn)` | Promise that calls and awaits `fn(item)` one item at a time; results are in item order. |
| `trajectory(last=None, types=None, tools=None, min_index=None, max_index=None)` | `await trajectory()` returns steps before this `run_workflow` call started, oldest first. `min_index` and `max_index` bound `step.index` (inclusive); `types` and `tools` filter by step type or tool name; `last` keeps the last N matching steps. |

Arguments:

-   `type_name`: the agent type to run. `"self"` uses the current agent's
    configuration; any available custom agent name also works.
-   `workspace`: `"inherit"` (the current workspace), `"branch"` (a new isolated
    clone, for agents that edit code in parallel), or `"share"` (a new workspace
    that shares the underlying repository). Other values are errors.
-   `schema` (required): a JSON schema (dict or string) for the agent's result.
    The agent returns the result by calling its `finish` tool, which checks it
    against the schema, and `await agent(...)` returns the parsed value. An
    agent that ends without calling `finish` fails the workflow. Use
    `{"type": "string"}` for a free-form answer.
-   `role`: an optional short title for the agent's card, such as
    `"Security reviewer"`.
-   `model`: the agent's model tier: `"inherit"` (default, your model),
    `"flash_lite"`, `"flash"`, or `"pro"`. Use a lighter tier for simple,
    high-fan-out work.
-   `fn`: usually a `lambda` that returns `agent(...)`, or an `async def`
    helper that awaits several agents. It must return something awaitable:
    an `agent()` or a call on one, a nested `parallel()` / `pipeline()`, or
    an `async def` call. Build per-item prompts and roles with f-strings.

Awaiting the same agent twice runs it once and returns the same result. An
`agent()` that is never awaited or called never runs, so always `await` it, or
pass it to `parallel` / `pipeline` and await that.

The workflow step shows one card per agent, in the order agents start, titled
with its `role`, or else the first line of its prompt, so set a role or start
each prompt with a short line that names the job.

## Agents that keep their context

When one agent should do several related turns, such as a reviewer that checks
the fixes for the bugs it found, call it instead of awaiting it. Each
`a(prompt, schema)` is lazy like an awaited `agent()` and returns that turn's
`finish` result; the agent's own `prompt`, if any, is its standing instructions
and leads the first turn. `schema` on a call defaults to the agent's. Turns on
one agent run one at a time, in the order they were started. A failed turn
raises, but the agent stays usable. An agent is either awaited or called, not
both. `del a` ends the agent, unless something else, such as a lambda, still
references it; every agent ends when the workflow ends.

```python
reviewer = agent("You review Go code for correctness.", role="Reviewer")
bugs = await reviewer("List the bugs in foo.go.", {"type": "array", "items": {"type": "string"}})
fixes = await parallel(bugs, lambda b: agent(f"Fix: {b}", {"type": "string"}))
ok = await reviewer(f"Fixes made: {fixes}. Are all your bugs fixed?", {"type": "boolean"})
del reviewer
```

## Calling tools from the script

Where the `run_workflow` tool description lists tools for `call_tool`, the
script can call them directly:

-   `call_tool(name, **args)` returns a promise like `agent()` does. Awaiting it
    runs the tool with the arguments you would pass to it directly and returns
    the tool's output as a `str`.
-   It raises `ToolError` (with `.tool` and `.message`) if the tool fails or
    the call is denied. `.denied` is `True` when a pre-tool hook or the
    permission check rejected the call before the tool ran, so a script can
    skip denied calls and still fail on real errors.
-   The user cannot be asked anything from a workflow: a call that needs user
    approval that has not already been granted is denied.
-   Tool outputs are not shown to you unless the script logs or prints them.

## Reading earlier conversation steps

Pass inputs you already have in `Args` (or inline in the script). Use
`await trajectory(...)` when the script needs to inspect steps from earlier in
this conversation—such as mining a failed `run_command` output without
rerunning it—and pass only the relevant slice into child `agent()` prompts.

Each returned `Step` is a `dict` that also supports attribute access (missing
fields return `None` as attributes):

-   `index` (`int`): 0-based step index.
-   `type` (`str`): step type, e.g. `"USER_INPUT"`, `"PLANNER_RESPONSE"`,
    `"SYSTEM_MESSAGE"`, or `"GENERIC"` (tool calls).
-   `status` (`str`): e.g. `"DONE"`, `"ERROR"`, or `"CLEARED"`.
-   Message steps set `text` (`str`); tool steps set `tool` (`str`), `args`
    (parsed `dict`), and `output` (`str`, truncated at 200k characters).

```python
steps = await trajectory(tools=["run_command"], last=20)
errors = [s.output for s in steps if s.status == "ERROR" and s.output]
log(f"Found {len(errors)} failed command(s)")
```

`trajectory()` only returns steps before the `run_workflow` call started (steps
added while the workflow runs in the background are not included). Older tool
steps evicted from memory have `status == "CLEARED"` and `output == None`; read
the conversation's `transcript.jsonl` / `transcript_full.jsonl` when you need
cleared tool outputs or steps added after the workflow started.

## Behavior to know

-   Workflow agents are main agents, not subagents. They are hidden from the
    conversation list and reachable from the workflow step. An awaited agent
    is single-use; a called agent lasts until deleted or the workflow ends.
-   `await agent(...)` returns when the agent's run ends, with the result it
    passed to `finish`.
-   If one agent in `parallel` fails, the whole call fails and the other agents
    in it are cancelled. Stopping the parent conversation stops all running
    workflow agents.
-   Agents do not see the script or each other. Put all the context an agent
    needs in its prompt, and ask for a short, well-defined output.

## Example

Fan out over a list that an agent produces:

```python
phase("Discover")
files = await agent(
    "List the Go files under pkg/foo that call Bar(). Paths only.",
    schema={"type": "array", "items": {"type": "string"}},
)

phase("Review")
reviews = await parallel(files, lambda f: agent(
    f"Review {f} for misuse of Bar(). Reply in 3 bullets or 'OK'.",
    schema={"type": "string"},
    role=f"Review {f}",
))
for r in reviews:
    log(r)
```
````

## File: .env.example
````
# Placeholder base URL for the project site until the official domain is active
AGENTS_MCP_SITE_URL=https://agents-mcp.dev
````

## File: .gitignore
````
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Diagnostic reports (https://nodejs.org/api/report.html)
report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Directory for instrumented libs generated by jscoverage/JSCover
lib-cov

# Coverage directory used by tools like istanbul
coverage
*.lcov

# nyc test coverage
.nyc_output

# Grunt intermediate storage (https://gruntjs.com/creating-plugins#storing-task-files)
.grunt

# Bower dependency directory (https://bower.io/)
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons (https://nodejs.org/api/addons.html)
build/Release

# Dependency directories
node_modules/
jspm_packages/

# Snowpack dependency directory (https://snowpack.dev/)
web_modules/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional stylelint cache
.stylelintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variable files
.env
.env.*
!.env.example

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next
out

# Nuxt.js build / generate output
.nuxt
dist
.output

# Gatsby files
.cache/
# Comment in the public line in if your project uses Gatsby and not Next.js
# https://nextjs.org/blog/next-9-1#public-directory-support
# public

# vuepress build output
.vuepress/dist

# vuepress v2.x temp directory
.temp

# Sveltekit cache directory
.svelte-kit/

# vitepress build output
**/.vitepress/dist

# vitepress cache directory
**/.vitepress/cache

# Docusaurus cache and generated files
.docusaurus

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# Firebase cache directory
.firebase/

# TernJS port file
.tern-port

# Stores Visual Studio Code versions used for testing Visual Studio Code extensions
.vscode-test

# pnpm
.pnpm-store

# yarn v3
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/sdks
!.yarn/versions

# Vite files
vite.config.js.timestamp-*
vite.config.ts.timestamp-*
.vite/

# Astro generated types
.astro/

# Turbo Repo
.turbo
````

## File: LICENSE
````
MIT License

Copyright (c) 2026 agents-mcp

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
````

## File: package.json
````json
{
  "name": "agents-mcp",
  "version": "0.0.0",
  "description": "One .agents/mcp.json to rule them all. A tool-agnostic specification and CLI compiler for managing Model Context Protocol (MCP) servers across any AI agent.",
  "keywords": [
    "mcp",
    "model-context-protocol",
    "mcp-server",
    "mcp-config",
    "ai-agents",
    "coding-agents",
    "agents",
    "claude-code",
    "cursor",
    "vscode",
    "opencode",
    "windsurf",
    "zed",
    "cli",
    "config-sync",
    "jsonc",
    "dotenv",
    "devtools"
  ],
  "homepage": "https://github.com/agents-mcp/cli#readme",
  "bugs": {
    "url": "https://github.com/agents-mcp/cli/issues"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/agents-mcp/cli.git"
  },
  "license": "MIT",
  "author": "Alex Bruno Cáceres <email@alexbruno.dev>",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "test": "echo 'not implemented'"
  }
}
````

## File: skills-lock.json
````json
{
  "version": 2,
  "skills": {
    "code-review": {
      "source": "alexbruno/dev-skills",
      "sourceType": "github",
      "skillPath": "skills/code-review/SKILL.md",
      "computedHash": "dd466725e8fc6f851d9d99c34c4a886f4998d7cf81067ca1fc2eb558369d5f6e"
    },
    "code-simplification": {
      "source": "alexbruno/dev-skills",
      "sourceType": "github",
      "skillPath": "skills/code-simplification/SKILL.md",
      "computedHash": "f205fcbebc44ce27c87923d98ac8d1047cde03a279a3841b0152e72e541121f7"
    },
    "codebase-indexing": {
      "source": "alexbruno/dev-skills",
      "sourceType": "github",
      "skillPath": "skills/codebase-indexing/SKILL.md",
      "computedHash": "3489cef9175a9f9ddf162110c85883c156196c35feb5a418702f0d8edc7fa42c"
    },
    "decision-records": {
      "source": "alexbruno/dev-skills",
      "sourceType": "github",
      "skillPath": "skills/decision-records/SKILL.md",
      "computedHash": "b5444c33f3bdabe39439915ede3f79eab44da1ef3528a10660c8d2fa143c0f54"
    },
    "environment-preflight": {
      "source": "alexbruno/dev-skills",
      "sourceType": "github",
      "skillPath": "skills/environment-preflight/SKILL.md",
      "computedHash": "a114e3cbdeccbc22a8d60318713c85b83d29edde173af0c644550182e3f2130f"
    },
    "incremental-implementation": {
      "source": "alexbruno/dev-skills",
      "sourceType": "github",
      "skillPath": "skills/incremental-implementation/SKILL.md",
      "computedHash": "85172018933c4e2b161e71063b60c7793f5c648220c2375098c27f75518dec30"
    },
    "planning-and-task-breakdown": {
      "source": "alexbruno/dev-skills",
      "sourceType": "github",
      "skillPath": "skills/planning-and-task-breakdown/SKILL.md",
      "computedHash": "ffb62667cc06cbede985c3569c53d015cc4ca579e3db7f98f0eb579f54f75d8d"
    },
    "spec-driven-workflow": {
      "source": "alexbruno/dev-skills",
      "sourceType": "github",
      "skillPath": "skills/spec-driven-workflow/SKILL.md",
      "computedHash": "f07c7dbbd9f8fe2af01b7d0862c3500b4e35bca706c016af4d7522c0fa5cfd18"
    },
    "systematic-debugging": {
      "source": "alexbruno/dev-skills",
      "sourceType": "github",
      "skillPath": "skills/systematic-debugging/SKILL.md",
      "computedHash": "1b9d917589d51319271f41c66ef10a290c3e478bdd07c9513942eeaa1a14464d"
    },
    "verification-and-testing": {
      "source": "alexbruno/dev-skills",
      "sourceType": "github",
      "skillPath": "skills/verification-and-testing/SKILL.md",
      "computedHash": "3ab04c649d7f79852cf8e5ca0b2bba7403340de41414ba68bacccd591128b8e3"
    }
  }
}
````

## File: spec/MATRIX.md
````markdown
# Agent Translation & Interoperability Matrix (`v0.1.0`)

This document defines the exact deterministic mapping between the canonical `.agents/mcp.json` specification and the native configuration formats required by supported AI coding agents.

---

## 1. Summary Mapping Table

| Agent (`id`) | Project Path | Global Path | Root Key | `stdio` Mapping | `http` / `sse` Mapping | Env Interpolation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`claude-code`** | `.mcp.json` | `~/.claude.json` | `mcpServers` | `{ "type": "stdio", "command", "args", "env" }` *(omit if `disabled: true`)* | `{ "type": "http"\|"sse", "url", "headers" }` | Native `${VAR}` / `${VAR:-default}` |
| **`cursor`** | `.cursor/mcp.json` | `~/.cursor/mcp.json` | `mcpServers` | `{ "command", "args", "env" }` *(omit if `disabled: true`)* | `{ "url", "headers" }` | Convert `${VAR}` -> `${env:VAR}` |
| **`vscode`** | `.vscode/mcp.json` | OS User Profile `mcp.json` | `servers` | `{ "type": "stdio", "command", "args", "env" }` *(omit if `disabled: true`)* | `{ "type": "http"\|"sse", "url", "headers" }` | Convert `${VAR}` -> `${env:VAR}` |
| **`opencode`** | `opencode.json` | `~/.config/opencode/opencode.json` | `mcp` | `{ "type": "local", "command": [command, ...args], "environment": env, "enabled": !disabled }` | `{ "type": "remote", "url", "headers", "enabled": !disabled }` | Convert `${VAR}` -> `{env:VAR}` |
| **`windsurf`** | *(Unsupported)* | `~/.codeium/windsurf/mcp_config.json` | `mcpServers` | `{ "command", "args", "env" }` *(omit if `disabled: true`)* | `{ "serverUrl": url, "headers" }` | Convert `${VAR}` -> `${env:VAR}` |
| **`zed`** | `.zed/settings.json` | `~/.config/zed/settings.json` | `context_servers` | `{ "command": { "path": command, "args", "env" } }` *(omit if `disabled: true`)* | `{ "url", "headers" }` | Native `${VAR}` *(discard `:-default`)* |

> **Notes on Optional Fields & Fallbacks:**
> - **`cwd` (`stdio`):** Optional working directory (defaults to the project root when omitted). Compilers pass `cwd` through when supported by the target agent's native schema, or omit it with a warning when unsupported.
> - **`${VAR:-default}`:** Preserved natively for `claude-code`. For agents without native default-value syntax (`cursor`, `vscode`, `opencode`, `windsurf`, `zed`), the `:-default` suffix is discarded when translating to `${env:VAR}`, `{env:VAR}`, or `${VAR}`, with a compiler warning.

---

## 2. Canonical Input Reference

All side-by-side outputs in Section 3 are compiled from this canonical `.agents/mcp.json`:

```json
{
  "$schema": "https://agents-mcp.dev/schema/v0.1.0/mcp.schema.json",
  "servers": {
    "github": {
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "postgres": {
      "transport": "stdio",
      "command": "uvx",
      "args": ["mcp-server-postgres", "${DATABASE_URL}"],
      "targets": ["claude-code", "opencode"],
      "disabled": false
    },
    "linear": {
      "transport": "http",
      "url": "https://mcp.linear.app/mcp",
      "headers": {
        "Authorization": "Bearer ${LINEAR_API_KEY}"
      }
    }
  }
}
```

## 3. Compiled Agent Outputs

### 3.1 Claude Code (`claude-code`)

-   **Target File:**  `.mcp.json` (project) / `~/.claude.json` (global)
-   **Notes:** Supports `${VAR}` and `${VAR:-default}` natively. Lacks an inline `disabled` flag in `.mcp.json`, so disabled servers are omitted during compilation. In global scope, `~/.claude.json` stores general Claude Code state (projects, history, flags, etc.) alongside `mcpServers`, so compilers MUST perform a non-destructive merge rather than overwriting the file.

```json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "linear": {
      "type": "http",
      "url": "https://mcp.linear.app/mcp",
      "headers": {
        "Authorization": "Bearer ${LINEAR_API_KEY}"
      }
    }
  }
}
```

### 3.2 Cursor (`cursor`)

-   **Target File:**  `.cursor/mcp.json` (project) / `~/.cursor/mcp.json` (global)
-   **Notes:** Requires `${env:VAR}` syntax for environment variable expansion. Omits `type` on `stdio` and `http` entries.

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${env:GITHUB_TOKEN}"
      }
    },
    "linear": {
      "url": "https://mcp.linear.app/mcp",
      "headers": {
        "Authorization": "Bearer ${env:LINEAR_API_KEY}"
      }
    }
  }
}
```

### 3.3 Visual Studio Code (`vscode`)

-   **Target File:**  `.vscode/mcp.json` (project) / OS User Profile `mcp.json` (global: `~/.config/Code/User/mcp.json` on Linux, `~/Library/Application Support/Code/User/mcp.json` on macOS, `%APPDATA%\Code\User\mcp.json` on Windows)
-   **Notes:** Uses `"servers"` as the root key instead of `"mcpServers"` and requires `${env:VAR}` syntax. Compilers MUST preserve existing `"inputs"` arrays and JSONC comments.

```json
{
  "servers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${env:GITHUB_TOKEN}"
      }
    },
    "linear": {
      "type": "http",
      "url": "https://mcp.linear.app/mcp",
      "headers": {
        "Authorization": "Bearer ${env:LINEAR_API_KEY}"
      }
    }
  }
}
```

### 3.4 OpenCode (`opencode`)

-   **Target File:**  `opencode.json` (project) / `~/.config/opencode/opencode.json` (global)
-   **Notes:** Uses `"mcp"` as root key, merges `command` and `args` into a single `command` array, renames `env` to `environment`, uses `"local"` / `"remote"` types, supports native `"enabled"` boolean, and uses `{env:VAR}` syntax (without `$`). Note: `<server-key>` below (illustrated by `disabled-example`) shows how a server with `"disabled": true` compiles to `"enabled": false`.

```json
{
  "mcp": {
    "github": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-github"],
      "environment": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "{env:GITHUB_TOKEN}"
      },
      "enabled": true
    },
    "postgres": {
      "type": "local",
      "command": ["uvx", "mcp-server-postgres", "{env:DATABASE_URL}"],
      "enabled": false
    },
    "linear": {
      "type": "remote",
      "url": "https://mcp.linear.app/mcp",
      "headers": {
        "Authorization": "Bearer {env:LINEAR_API_KEY}"
      },
      "enabled": true
    }
  }
}
```

### 3.5 Windsurf (`windsurf`)

-   **Target File:**  `~/.codeium/windsurf/mcp_config.json` (global scope only)
-   **Notes:** Uses `"serverUrl"` instead of `"url"` for remote endpoints and requires `${env:VAR}` interpolation.

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${env:GITHUB_TOKEN}"
      }
    },
    "linear": {
      "serverUrl": "https://mcp.linear.app/mcp",
      "headers": {
        "Authorization": "Bearer ${env:LINEAR_API_KEY}"
      }
    }
  }
}
```

### 3.6 Zed (`zed`)

-   **Target File:**  `.zed/settings.json` (project) / `~/.config/zed/settings.json` (global)
-   **Notes:** Nests `stdio` execution details inside a `"command": { "path", "args", "env" }` object under `"context_servers"`. Compilers MUST perform a non-destructive JSONC merge so editor settings in `settings.json` remain untouched.

```json
{
  "context_servers": {
    "github": {
      "command": {
        "path": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": {
          "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
        }
      }
    },
    "linear": {
      "url": "https://mcp.linear.app/mcp",
      "headers": {
        "Authorization": "Bearer ${LINEAR_API_KEY}"
      }
    }
  }
}
```
````

## File: spec/SPEC.md
````markdown
# Unified Agents MCP Configuration Specification (`v0.1.0`)

**Status:** Draft Specification  
**Schema URI:** `https://agents-mcp.dev/schema/v0.1.0/mcp.schema.json`  
**License:** CC0 1.0 Universal (Public Domain)

---

## 1. Abstract

The **Unified Agents MCP Configuration** (`.agents/mcp.json`) defines a standardized, tool-agnostic file format and directory convention for declaring **Model Context Protocol (MCP)** servers across AI coding agents, IDEs, and CLI assistants.

As developers increasingly use multiple AI coding agents within the same codebase (e.g., Claude Code, Cursor, VS Code Copilot, OpenCode, Windsurf, Zed), maintaining separate, divergent MCP configuration files creates configuration drift, duplicated effort, and accidental secret exposure.

Across the ecosystem, all major AI coding agents have already converged on the `.agents/` directory (notably `.agents/skills`) as the shared standard for agent capabilities. Adopting `.agents/mcp.json` within that same namespace is the natural architectural progression—consolidating skills and MCP tool definitions under one predictable, repository-friendly convention rather than introducing another fragmented root-level configuration file. This specification establishes `.agents/mcp.json` as the single source of truth for workspace and user-level MCP server definitions.

---

## 2. File Locations & Precedence

Conformant tools and compilers MUST resolve configuration files using the following conventions:

1. **Project Scope (Workspace):** `<project-root>/.agents/mcp.json`  
   Intended to be version-controlled in Git and shared across the engineering team.
2. **Global Scope (User):** `~/.agents/mcp.json`  
   Intended for personal MCP servers and user-wide credentials across all projects.

> **Why `.agents/`?** By co-locating `mcp.json` alongside `.agents/skills`, tools that already discover `.agents/` at the workspace and user levels can adopt `.agents/mcp.json` with minimal architectural overhead.

### 2.1 Resolution & Merging Rules
When both scopes exist, conformant tools SHOULD load `~/.agents/mcp.json` as the base layer and merge `<project-root>/.agents/mcp.json` on top. If a server key exists in both files, the project-level definition takes precedence over the global definition.

---

## 3. Document Structure

A valid configuration file MUST be a UTF-8 encoded JSON object conforming to the published JSON Schema (`Draft-07`).

### 3.1 Top-Level Properties

| Property | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `$schema` | `string` (URI) | **Yes** | MUST point to a valid specification schema URI (e.g., `https://agents-mcp.dev/schema/v0.1.0/mcp.schema.json`). Serves as both editor validation target and format version identifier. |
| `servers` | `object` | **Yes** | A map of unique logical server identifiers (keys) to server configuration objects (values). |

> **Note on Versioning:** A separate `version` property is intentionally omitted. Schema evolution is governed strictly by the `$schema` URI.

---

## 4. Server Definitions

Each entry inside `servers` is a discriminated union keyed by the required `transport` property.

### 4.1 Common Properties (All Transports)

| Property | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `transport` | `"stdio" \| "http" \| "sse"` | **Yes** | — | Explicitly defines the MCP transport protocol. |
| `disabled` | `boolean` | No | `false` | When `true`, the server is temporarily inactive and MUST NOT be loaded by target agents. |
| `targets` | `string[]` | No | *(All agents)* | Optional allowlist of canonical agent IDs (e.g., `["claude-code", "opencode"]`) that should load this server. When omitted, the server applies to all agents. |

### 4.2 Local Process Transport (`transport: "stdio"`)

Used for MCP servers spawned as local child processes communicating over standard input/output.

| Property | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `transport` | `"stdio"` | **Yes** | — | Discriminator for local process servers. |
| `command` | `string` | **Yes** | — | Executable binary or runtime command (e.g., `"npx"`, `"uvx"`, `"node"`, `"docker"`). |
| `args` | `string[]` | No | `[]` | Ordered list of command-line arguments passed to `command`. |
| `env` | `Record<string, string>` | No | `{}` | Key-value map of environment variables injected into the server process. |
| `cwd` | `string` | No | *(Project root)* | Optional working directory for the child process. |

### 4.3 Remote Network Transport (`transport: "http"` | `"sse"`)

Used for remote MCP servers accessed over Streamable HTTP (`"http"`) or legacy HTTP+SSE (`"sse"`).

| Property | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `transport` | `"http" \| "sse"` | **Yes** | — | Discriminator for remote network servers. |
| `url` | `string` (URI) | **Yes** | — | Full endpoint URL of the remote MCP server. |
| `headers` | `Record<string, string>` | No | `{}` | Key-value map of HTTP headers sent with requests (e.g., `Authorization`). |

---

## 5. Environment Variable Interpolation & Secret Hygiene

Because `.agents/mcp.json` is designed to be committed to version control, **plaintext secrets MUST NOT be stored inside the file**.

### 5.1 Placeholder Syntax
Conformant parsers and compilers MUST support POSIX-style variable interpolation inside string values of `args`, `env`, `url`, and `headers`:

* **Required variable:** `${VAR_NAME}`  
  Resolves to the value of `VAR_NAME` from the host environment or workspace `.env` file.
* **Variable with default fallback:** `${VAR_NAME:-default_value}`  
  Resolves to `VAR_NAME` if set and non-empty; otherwise evaluates to `default_value`.

### 5.2 Compilation to Target Agents
When projecting `.agents/mcp.json` into native agent files that use proprietary interpolation syntax, compilers MUST translate `${VAR_NAME}` into the target agent's native format (see [`MATRIX.md`](./MATRIX.md)):
- **Agents with native fallback support** (e.g., `claude-code`): preserve `${VAR_NAME:-default_value}` as-is.
- **Agents without native fallback syntax** (`cursor`, `vscode`, `opencode`, `windsurf`, `zed`): discard the `:-default_value` suffix when translating to `${env:VAR_NAME}`, `{env:VAR_NAME}`, or `${VAR_NAME}` and emit a warning so the user knows the fallback was dropped.

---

## 6. Canonical Agent Identifiers

To ensure interoperability across `targets` arrays and compiler adapters, the specification defines the following canonical agent identifiers:

* `claude-code` — Anthropic Claude Code CLI / IDE extension
* `cursor` — Cursor IDE
* `vscode` — Visual Studio Code (GitHub Copilot MCP)
* `opencode` — OpenCode CLI / Desktop
* `windsurf` — Windsurf IDE
* `zed` — Zed Editor

---

## 7. Complete Example

```json
{
  "$schema": "https://agents-mcp.dev/schema/v0.1.0/mcp.schema.json",
  "servers": {
    "github": {
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "postgres": {
      "transport": "stdio",
      "command": "uvx",
      "args": ["mcp-server-postgres", "${DATABASE_URL}"],
      "targets": ["claude-code", "opencode"],
      "disabled": false
    },
    "linear": {
      "transport": "http",
      "url": "https://mcp.linear.app/mcp",
      "headers": {
        "Authorization": "Bearer ${LINEAR_API_KEY}"
      }
    }
  }
}
```

## 8. Implementer Guidelines (For Agent Maintainers)

AI coding agent maintainers wishing to adopt native support for `.agents/mcp.json` SHOULD implement the following loading lifecycle:

1.  **Discovery:** Check for `<project-root>/.agents/mcp.json` and `~/.agents/mcp.json` during workspace initialization.
2.  **Filtering:** Ignore any server where `disabled === true`, or where `targets` is defined and does not include the agent's canonical ID.
3.  **Interpolation:** Resolve `${VAR_NAME}` and `${VAR_NAME:-fallback}` against process environment variables and workspace `.env` files prior to spawning processes or opening network connections.
4.  **Precedence:** If a user also maintains a legacy agent-specific file (e.g.,  `.cursor/mcp.json`), agent-specific overrides MAY take precedence over `.agents/mcp.json` for local experimentation while this spec is under adoption.
````

## File: PLAN.md
````markdown
# Technical Specification & Implementation Blueprint: `agents-mcp` (v0.1.0)

> **Target Audience:** AI Coding Agents (OpenCode, Claude Code, Cursor, Antigravity) & Human Contributors.
> **Goal:** Build the reference CLI (`agents-mcp` / `mcpx`) and formal JSON Schema specification for `.agents/mcp.json` — a single source of truth for Model Context Protocol (MCP) server configurations across multiple AI coding agents.

---

## 1. Vision & Architectural Philosophy

### 1.1 The Problem
Developers working across multiple AI coding tools (Claude Code, Cursor, VS Code Copilot, OpenCode, Windsurf, Zed) must maintain duplicated MCP server configurations across incompatible file locations and JSON/TOML schemas. While all major coding agents have already standardized on the `.agents/` directory for Agent Skills (`.agents/skills`), MCP configuration has lacked an equivalent canonical standard. Existing tools either configure a single agent or perform destructive fan-out writes without maintaining a canonical source of truth in Git.

### 1.2 The Solution (Hexagonal / Ports & Adapters Architecture)
1. **Core (Single Source of Truth):** A strict, opinionated canonical file at `.agents/mcp.json` (project scope) and `~/.agents/mcp.json` (global user scope). Co-locating MCP configuration inside the established `.agents/` convention—right alongside `.agents/skills`—eliminates root-directory clutter and aligns with how modern agents already discover shared capabilities. No legacy schemas (`mcpServers`) are allowed inside `.agents/mcp.json`.
2. **Input Edges (`sources/` & `import`):** Stateless resolvers that ingest MCP definitions from existing legacy agent configs (`import`), official MCP `server.json` manifests, GitHub repositories, npm/PyPI packages, or direct CLI flags (`add`).
3. **Output Edges (`adapters/`):** Non-destructive compilers that project `.agents/mcp.json` into each target agent's native configuration file, translating schemas, environment variable syntax, and transport types while preserving unrelated settings and JSONC comments.

---

## 2. Tech Stack & Project Setup

- **Language:** TypeScript 5.x (Strict mode enabled, ESM `"type": "module"`).
- **Runtime:** Node.js `>=20.0.0`.
- **Bundler:** `tsup` (bundles CLI into fast single-file ESM output with `#!/usr/bin/env node` banner for instant `npx` execution).
- **CLI Argument Parser:** `citty` (or `commander`).
- **Interactive TUI:** `@clack/prompts` (must gracefully bypass prompts when `--yes` / `-y` is passed or `CI=true`).
- **Schema & Validation:** `zod` + `zod-to-json-schema` (generates `spec/mcp.schema.json` directly from the TypeScript Zod schema so types and published schema never drift).
- **JSONC Manipulation:** `jsonc-parser` (mandatory for reading/modifying `.vscode/mcp.json`, `opencode.json`, and `.zed/settings.json` without stripping comments or formatting).
- **Testing:** `vitest` (unit tests for schema validation, env extraction, and every agent adapter).

### 2.1 `package.json` Requirements
- Package name: `agents-mcp`
- Binaries exposed:
	 ```json
  "bin": {
    "agents-mcp": "./dist/index.js",
    "mcpx": "./dist/index.js"
  }```
 - Scripts:   
	- `build`: `tsup src/index.ts --format esm --dts --clean --shims`  
	- `schema:gen`: `tsx scripts/generate-schema.ts` (outputs `spec/mcp.schema.json`)
  - `test`: `vitest run`

## 3. Directory Structure

```text
agents-mcp/
├── spec/
│   ├── SPEC.md                    # Formal human-readable specification of .agents/mcp.json
│   ├── MATRIX.md                  # Field-by-field translation matrix across agents
│   ├── mcp.schema.json            # Auto-generated JSON Schema from src/core/schema.ts
├── scripts/
│   └── generate-schema.ts         # Script to emit spec/mcp.schema.json from Zod
├── src/
│   ├── core/
│   │   ├── schema.ts              # Canonical Zod schema & TypeScript types
│   │   ├── store.ts               # Atomic read/write/validate for .agents/mcp.json & ~/.agents/mcp.json
│   │   ├── env.ts                 # ${VAR} extraction, secret scrubbing, and .env.example sync
│   │   └── gitignore.ts           # Safe management of derived agent files in .gitignore
│   ├── sources/
│   │   ├── types.ts               # SourceResolver interface & ResolvedServerPackage DTO
│   │   ├── direct.ts              # CLI flags resolver (--stdio, --http, --sse, --env, --header)
│   │   ├── github.ts              # Fetches server.json or package.json from GitHub repos (owner/repo)
│   │   └── registry.ts            # Queries official MCP Registry API / npm registry
│   ├── adapters/
│   │   ├── types.ts               # AgentAdapter interface & ConfigScope type
│   │   ├── claude-code.ts         # .mcp.json (project) & ~/.claude.json (global)
│   │   ├── cursor.ts              # .cursor/mcp.json (project) & ~/.cursor/mcp.json (global)
│   │   ├── vscode.ts              # .vscode/mcp.json (project) & user settings mcp.json (global)
│   │   ├── opencode.ts            # opencode.json (project) & ~/.config/opencode/opencode.json (global)
│   │   ├── windsurf.ts            # ~/.codeium/windsurf/mcp_config.json (global)
│   │   ├── zed.ts                 # .zed/settings.json (project) & ~/.config/zed/settings.json (global)
│   │   └── index.ts               # Adapter registry & auto-detection logic
│   ├── commands/
│   │   ├── init.ts                # Initialize .agents/mcp.json & configure .gitignore
│   │   ├── import.ts              # Migrate existing agent configs into .agents/mcp.json
│   │   ├── add.ts                 # Resolve source -> write to .agents/mcp.json -> sync
│   │   ├── sync.ts                # Compile .agents/mcp.json to selected/detected agents
│   │   ├── remove.ts              # Remove server from .agents/mcp.json & clean derived files
│   │   ├── list.ts                # Display configured servers, targets, and sync status
│   │   └── doctor.ts              # Validate schema, env vars, runtime binaries, and sync drift
│   ├── ui/
│   │   └── prompts.ts             # Wrapper around @clack/prompts supporting --yes / non-TTY
│   └── index.ts                   # CLI entrypoint
├── tests/
│   ├── core/
│   └── adapters/
├── package.json
└── tsconfig.json
```

## 4. Canonical Specification (v0.1.0)

### 4.1 Design Rules

1.  **File Paths:**
    -   Project scope: `<project-root>/.agents/mcp.json`
    -   Global scope: `~/.agents/mcp.json`
2.  **Mandatory `$schema`:** Every valid file MUST include `"$schema": "https://agents-mcp.dev/schema/v0.1.0/mcp.schema.json"`.
3.  **No `version` property:** Versioning is governed exclusively by the `$schema` URL.
4.  **Explicit `transport`:** Every server entry MUST declare `"transport": "stdio" | "http" | "sse"`.
5.  **Secret Interpolation:** Secrets MUST use POSIX-style placeholders (`${VAR_NAME}` or `${VAR_NAME:-default}`). Plaintext secrets detected during `import` or `add` MUST be extracted into `.env`/`.env.example` and replaced with `${VAR_NAME}`.
6.  **Agent Targeting (`targets`):** Optional array of canonical agent IDs (e.g., `["claude-code", "opencode"]`). If omitted, the server compiles to all active/detected agents.

### 4.2 Canonical Example

```json
{
  "$schema": "https://agents-mcp.dev/schema/v0.1.0/mcp.schema.json",
  "servers": {
    "github": {
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "postgres": {
      "transport": "stdio",
      "command": "uvx",
      "args": ["mcp-server-postgres", "${DATABASE_URL}"],
      "targets": ["claude-code", "opencode"],
      "disabled": false
    },
    "linear": {
      "transport": "http",
      "url": "https://mcp.linear.app/mcp",
      "headers": {
        "Authorization": "Bearer ${LINEAR_API_KEY}"
      }
    }
  }
}
```

### 4.3 `src/core/schema.ts` Implementation

```typescript
import { z } from 'zod';

// $ - alias configurado no tsconfig.json para a raiz do projeto
// Fazer assert json caso necessário para os padrões de tipagem
import pkg from '$/src/package.json'

export const SPEC_VERSION = pkg.version; // - O build deve ser executado antes da publicação.
export const SITE_URL = process.env.AGENTS_MCP_SITE_URL.replace(/\/+$/, '');
export const DEFAULT_SCHEMA_URL = `${SITE_URL}/schema/${SPEC_VERSION}/mcp.schema.json`;

export const AgentIdSchema = z.enum([
  'claude-code',
  'cursor',
  'vscode',
  'opencode',
  'windsurf',
  'zed',
]);

export type AgentId = z.infer<typeof AgentIdSchema>;

const BaseServerSchema = z.object({
  disabled: z.boolean().optional(),
  targets: z.array(AgentIdSchema).optional(),
});

export const StdioServerSchema = BaseServerSchema.extend({
  transport: z.literal('stdio'),
  command: z.string().min(1),
  args: z.array(z.string()).default([]),
  env: z.record(z.string(), z.string()).optional(),
  cwd: z.string().optional(),
});

export const RemoteServerSchema = BaseServerSchema.extend({
  transport: z.enum(['http', 'sse']),
  url: z.string().url(),
  headers: z.record(z.string(), z.string()).optional(),
});

export const CanonicalServerSchema = z.discriminatedUnion('transport', [
  StdioServerSchema,
  RemoteServerSchema,
]);

export const CanonicalMcpConfigSchema = z.object({
  $schema: z.string().url(),
  servers: z.record(z.string(), CanonicalServerSchema),
});

export type CanonicalServer = z.infer<typeof CanonicalServerSchema>;
export type CanonicalMcpConfig = z.infer<typeof CanonicalMcpConfigSchema>;
```

## 5. Agent Adapters & Compilation Matrix (`src/adapters/`)

### 5.1 `AgentAdapter` Interface (`src/adapters/types.ts`)

```typescript
import type { AgentId, CanonicalServer } from '../core/schema.js';

export type ConfigScope = 'project' | 'global';

export interface AgentAdapter {
  readonly id: AgentId;
  readonly displayName: string;
  readonly supportsProjectScope: boolean;
  readonly supportsGlobalScope: boolean;

  /** Returns the target file path for the given scope, or null if unsupported */
  getConfigPath(scope: ConfigScope, cwd: string): string | null;

  /** Heuristic detection: checks if agent config dir/file exists or binary is in PATH */
  detect(scope: ConfigScope, cwd: string): Promise<boolean>;

  /** Parses existing native config (JSON/JSONC) into canonical servers for `import` */
  extractServers(rawContent: string): Record<string, CanonicalServer>;

  /**
   * Non-destructively merges compiled servers into existing raw JSON/JSONC content.
   * - Respects `server.disabled`: omits server for agents without native disable flags,
   *   or maps to native flag (`enabled: false` in OpenCode).
   * - Respects `server.targets`: skips servers whose `targets` exclude `this.id`.
   * - Removes servers present in `previousManagedNames` that were deleted from canonical config.
   * - Preserves all unrelated keys and JSONC comments via `jsonc-parser` `modify()` + `applyEdits()`.
   */
  applyServers(
    existingRawContent: string | null,
    servers: Record<string, CanonicalServer>,
    previousManagedNames?: Set<string>
  ): string;
}
```

### 5.2 Exact Translation Rules per Agent

| Agent (`id`) | Project Path | Global Path | Root Key | `stdio` Mapping | `http` / `sse` Mapping | Env Interpolation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`claude-code`** | `.mcp.json` | `~/.claude.json` | `mcpServers` | `{ "type": "stdio", "command", "args", "env" }` (omit if `disabled: true`) | `{ "type": "http"\|"sse", "url", "headers" }` | Native `${VAR}` / `${VAR:-default}` |
| **`cursor`** | `.cursor/mcp.json` | `~/.cursor/mcp.json` | `mcpServers` | `{ "command", "args", "env" }` (omit if `disabled: true`) | `{ "url", "headers" }` | Convert `${VAR}` -> `${env:VAR}` |
| **`vscode`** | `.vscode/mcp.json` | OS User Profile `mcp.json` | `servers` | `{ "type": "stdio", "command", "args", "env" }` (omit if `disabled: true`) | `{ "type": "http"\|"sse", "url", "headers" }` | Convert `${VAR}` -> `${env:VAR}` |
| **`opencode`** | `opencode.json` | `~/.config/opencode/opencode.json` | `mcp` | `{ "type": "local", "command": [command, ...args], "environment": env, "enabled": !disabled }` | `{ "type": "remote", "url", "headers", "enabled": !disabled }` | Convert `${VAR}` -> `{env:VAR}` |
| **`windsurf`** | *(Unsupported)* | `~/.codeium/windsurf/mcp_config.json` | `mcpServers` | `{ "command", "args", "env" }` (omit if `disabled: true`) | `{ "serverUrl": url, "headers" }` | Convert `${VAR}` -> `${env:VAR}` |
| **`zed`** | `.zed/settings.json` | `~/.config/zed/settings.json` | `context_servers` | `{ "command": { "path": command, "args", "env" } }` (omit if `disabled: true`) | `{ "url", "headers" }` | Native `${VAR}` |

### 5.3 Critical Adapter Implementation Details

1.  **JSONC & Non-Destructive Preservation:** Every `applyServers` implementation MUST use `modify()` and `applyEdits()` from `jsonc-parser` with formatting options `{ tabSize: 2, insertSpaces: true }` instead of `JSON.stringify()` over the whole file. This prevents destroying user comments and unrelated settings in `.vscode/mcp.json`, `opencode.json`, `.zed/settings.json`, and especially global `~/.claude.json` (which stores general Claude Code state such as projects, history, and flags alongside `mcpServers`). For `vscode` global scope, resolve the OS-specific User Profile path (`~/.config/Code/User/mcp.json` on Linux, `~/Library/Application Support/Code/User/mcp.json` on macOS, `%APPDATA%\Code\User\mcp.json` on Windows).
    
2.  **State Tracking for Removals:** Store a lightweight local state file `.agents/.mcp-sync-state.json` (gitignored) listing which server names were last synced to each adapter. When a server is removed from `.agents/mcp.json` (or `disabled: true` is set for an agent that lacks native disable support), `sync` uses `.mcp-sync-state.json` to cleanly delete only managed entries without touching unmanaged manual entries in the user's native agent config.

3.  **Fallbacks (`${VAR:-default}`) & `cwd` Translation:** Preserve `${VAR:-default}` natively for agents that support it (`claude-code`); for agents without native fallback syntax (`cursor`, `vscode`, `opencode`, `windsurf`, `zed`), discard the `:-default` suffix during translation and emit a warning. Similarly, pass `cwd` through when supported by the target agent, or omit it with a warning when unsupported.
    

## 6. Source Resolvers (`src/sources/`)

The `add <source>` command resolves server definitions in the following order:

1.  **Direct Flags (`src/sources/direct.ts`):**
    -   Triggered when `--stdio` or `--http` / `--sse` is provided.
    -   Example: `agents-mcp add postgres --stdio "uvx mcp-server-postgres" --env DATABASE_URL`
    -   Splits command string safely into `command` and `args`.
2.  **Remote URL (`src/sources/direct.ts`):**
    -   Triggered when `<source>` starts with `http://` or `https://`.
    -   Defaults to `transport: "http"` (overridable via `--sse`). Derives `suggestedName` from hostname/path.
3.  **GitHub Repository (`src/sources/github.ts`):**
    -   Triggered when `<source>` matches `owner/repo` (or `https://github.com/owner/repo`).
    -   Fetches `https://raw.githubusercontent.com/<owner>/<repo>/main/server.json` (falling back to `master`).
    -   If `server.json` exists (official MCP manifest standard), parses `packages` (preferring `npm` $\rightarrow$ `npx -y <identifier>`, then `pypi` $\rightarrow$ `uvx <identifier>`, then `oci` $\rightarrow$ `docker run -i --rm <identifier>`) and extracts `environment_variables` where `is_required: true`.
    -   If `server.json` does not exist, falls back to inspecting `package.json` (`bin` / `name`) to construct an `npx -y` stdio entry.
4.  **Official MCP Registry & npm (`src/sources/registry.ts`):**
    -   Queries the official MCP Registry (`https://registry.modelcontextprotocol.io/v0/servers?search=<query>`) or npm registry (`https://registry.npmjs.org/<pkg>`) when `<source>` is a package name (e.g., `@modelcontextprotocol/server-github`).

## 7. CLI Commands Specification (`src/commands/`)

All commands accept global flags:

-   `--global` / `-g`: Operate on `~/.agents/mcp.json` and global agent paths instead of project scope.
-   `--yes` / `-y`: Skip all interactive prompts and accept defaults (essential for CI/scripts).
-   `--agents <list>`: Comma-separated target agents (e.g., `--agents claude-code,opencode`), overriding auto-detection.

### 7.1 `agents-mcp init`

1.  Checks if `.agents/mcp.json` already exists. If so, warns and exits unless `--force` is passed.
2.  Creates `.agents/mcp.json` with `$schema` and `"servers": {}`.
3.  Runs agent auto-detection across the workspace and machine; prompts user via `@clack/prompts` multiselect to confirm active agents.
4.  Prompts user: _"Add generated agent config files (e.g., .mcp.json, .cursor/mcp.json) to .gitignore so only .agents/mcp.json is tracked?"_ (Default: `Yes`). Appends a managed `# agents-mcp generated` block to `.gitignore` and adds `.agents/.mcp-sync-state.json`.

### 7.2 `agents-mcp import`

**Critical onboarding command for existing repositories.**

1.  Scans all supported agent config paths in the current scope (`claude-code`, `cursor`, `vscode`, `opencode`, `windsurf`, `zed`).
2.  Calls `extractServers()` on each discovered file.
    
3.  Deduplicates servers by name:
    -   If identical definitions exist across files, merges silently.
    -   If conflicting definitions exist for the same server name, prompts user to pick which version to keep (or picks first with warning under `--yes`).
        
4.  **Secret Hygiene:** Scans `env` values, `headers`, and sensitive arguments/URL query parameters for literal secrets (strings not already wrapped in `${...}`). Prompts to extract them into `.env` (gitignored) + `.env.example` (empty keys) and replaces values in `.agents/mcp.json` with `${VAR_NAME}`.
    
5.  Writes `.agents/mcp.json`.
    
6.  If `--clean` is passed (or confirmed interactively), deletes standalone legacy files (`.mcp.json`, `.cursor/mcp.json`, `.vscode/mcp.json`) or removes the MCP key from shared settings files (`opencode.json`, `.zed/settings.json`), then runs `sync` for active agents.

### 7.3 `agents-mcp add <source>`

1.  Resolves `<source>` via `src/sources/` into `ResolvedServerPackage`.
2.  Prompts for server alias (defaulting to `suggestedName`, overridable via `--name <alias>`).
3.  For `stdio` servers, prompts for the working directory (`cwd`), defaulting to the project root (omitting `cwd` when left as the default). In direct/non-interactive mode (`--yes` or direct CLI flags), defaults to the project root unless `--cwd <dir>` is explicitly passed.
4.  For each `requiredEnvVars` entry:
    -   Checks 2 levels: 1) local `.env` file, 2) host system environment (`process.env`).
    -   If not found (or when adding interactively), notifies the user and prompts for the value (masked input if `isSecret`), writes the actual value to `.env`, appends `KEY=` to `.env.example`, and stores `"${KEY}"` in `.agents/mcp.json`.
5.  Optionally prompts for `targets` (default: all agents).
6.  Writes server entry to `.agents/mcp.json` and automatically invokes `sync`.
    

### 7.4 `agents-mcp sync`

1.  Reads and validates `.agents/mcp.json` against `CanonicalMcpConfigSchema`.
2.  Determines target agents (`--agents` flag $\rightarrow$ previously synced agents in `.mcp-sync-state.json` $\rightarrow$ auto-detected agents).
3.  Compiles servers for each target agent via `adapter.applyServers()`, filtering by `server.targets` and handling `server.disabled`.
4.  Updates `.agents/.mcp-sync-state.json` and prints a concise summary table of synced files.

### 7.5 `agents-mcp remove <name>`

1.  Removes `<name>` from `servers` in `.agents/mcp.json`.
2.  Runs `sync` so all derived agent configs immediately drop `<name>`.

### 7.6 `agents-mcp list`

1.  Reads `.agents/mcp.json` (and optionally `~/.agents/mcp.json` with `--all`).
2.  Displays a clean terminal table showing: Server Name, Transport, Command/URL, Targets, Status (`enabled` / `disabled`), and Sync State across detected agents.

### 7.7 `agents-mcp doctor`

Runs diagnostic checks and exits with code `1` if errors are found:

1.  **Schema Check:** Validates `.agents/mcp.json` against `CanonicalMcpConfigSchema`.
2.  **Env Check:** Parses all `${VAR}` references; verifies every variable without a `:-default` fallback is defined in `.env` or `process.env`.
3.  **Runtime Check:** For `stdio` servers, verifies `command` (`npx`, `uvx`, `node`, `python`, `docker`, or local binary path) exists and is executable in `PATH`.
4.  **Drift Check:** Compares compiled output against actual files on disk for detected agents; flags any out-of-sync files and advises running `agents-mcp sync`.

## 8. Secret & Environment Management (`src/core/env.ts`)

1.  **Placeholder Regex:** `/\$\{([A-Z0-9_]+)(?::-([^}]*))?\}/g`
2.  **2-Level Variable Resolution:** Resolve `${VAR_NAME}` in 2 levels: (1) local `.env` file, then (2) host system environment variables (`process.env`). If a referenced variable without a `:-default` fallback is not found in either level, notify/warn the user.
3.  **Secret Detection Heuristic (during `import`):**
    -   Any `env` value, `Authorization`/`x-api-key` header value, or sensitive token/connection string in `args` / `url` that does **not** match `/^\$\{.+\}$/` and is non-empty is flagged as a potential hardcoded secret.
    -   Automatically derives a clean uppercase variable name (e.g., server `github` + key `GITHUB_PERSONAL_ACCESS_TOKEN` $\rightarrow$ `${GITHUB_PERSONAL_ACCESS_TOKEN}`).
4.  **`.env` & `.env.example` Sync:**
    -   Never overwrites existing keys in `.env`.
    -   Ensures `.env` is listed in `.gitignore` before writing any secret to disk.
    -   Appends missing keys to `.env.example` as `KEY=` so teammates know which environment variables are required after cloning.

## 9. Definition of Done for `v0.1.0`

-   [ ] `scripts/generate-schema.ts` generates a valid Draft-07 `spec/mcp.schema.json` matching `CanonicalMcpConfigSchema`.
-   [ ] All 6 adapters (`claude-code`, `cursor`, `vscode`, `opencode`, `windsurf`, `zed`) have unit tests covering both `extractServers()` and `applyServers()`, including JSONC comment preservation and env interpolation translation (`${VAR}` $\leftrightarrow$ `${env:VAR}` / `{env:VAR}`).
-   [ ] `init`, `import`, `add`, `sync`, `remove`, `list`, and `doctor` work in both interactive TTY mode and non-interactive `--yes` mode.
-   [ ] `tsup` builds cleanly into `dist/index.js` with zero runtime errors on Node 20+.
-   [ ] `spec/SPEC.md` and `spec/MATRIX.md` are complete and ready to deploy alongside `spec/mcp.schema.json` at `https://agents-mcp.dev/schema/v0.1.0/mcp.schema.json`.
````

## File: README.md
````markdown
# agents-mcp

**One `.agents/mcp.json` to rule them all.** 

A tool-agnostic specification and CLI compiler for managing Model Context Protocol (MCP) servers across Claude Code, Cursor, VS Code, OpenCode, Windsurf, and Zed.

[![npm version](https://img.shields.io/npm/v/agents-mcp.svg)](https://www.npmjs.com/package/agents-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Spec: v0.1.0](https://img.shields.io/badge/Spec-v0.1.0-emerald.svg)](./spec/SPEC.md)

---

## Why?

Modern software engineering is no longer tied to a single AI coding assistant. You might use **Claude Code** or **OpenCode** in the terminal, **Cursor** or **VS Code** in the editor, and **Zed** for quick edits—all inside the same repository.

The AI coding ecosystem has already reached broad consensus on **where** shared agent capabilities belong: all major coding agents have standardized on the `.agents/` directory (such as `.agents/skills`) and `AGENTS.md` for portable skills and instructions. Yet **MCP server configuration remains fragmented across incompatible, tool-specific files**:

- **Claude Code** expects `.mcp.json` with `"mcpServers"` and `${VAR}`
- **Cursor** expects `.cursor/mcp.json` with `"mcpServers"` and `${env:VAR}`
- **VS Code** expects `.vscode/mcp.json` with `"servers"` and `${env:VAR}`
- **OpenCode** expects `opencode.json` with `"mcp"`, `"command"` as an array, `"environment"`, and `{env:VAR}`
- **Zed** expects `.zed/settings.json` with `"context_servers"` and nested `"command": { "path", "args" }`

Every time you add an MCP server or rotate a token, you end up copy-pasting JSON across four different files, translating environment variable syntaxes by hand, and risking accidental secret leaks in Git.

Because the `.agents/` namespace is already the de facto industry standard for agent skills, extending that same convention to `.agents/mcp.json` is the most logical and cohesive step forward—keeping all shared agent context, skills, and tool integrations unified under a single, predictable directory without introducing another root-level dotfile.

**`agents-mcp` turns that convention into reality.**

---

## The Solution: Single Source of Truth + Non-Destructive Compiler

1. **Declare once in `.agents/mcp.json`:** A clean, schema-validated, tool-agnostic configuration file that lives alongside `.agents/skills` in your repository.
2. **Compile everywhere automatically:** `agents-mcp` translates and projects your canonical config into the exact native file format, root key, transport structure, and environment variable syntax each agent requires—preserving your existing comments and unrelated settings.

```text
                    ┌──────────────────────┐
                    │   .agents/mcp.json   │  ◄── Single Source of Truth (Git)
                    └──────────┬───────────┘
                               │
		              npx agents-mcp sync
                               │
      ┌──────────────┬─────────┴─────────┬──────────────┐ ◄── .gitignore
      ▼              ▼                   ▼              ▼
  .mcp.json   .cursor/mcp.json    .vscode/mcp.json   opencode.json
(Claude Code)     (Cursor)           (VS Code)        (OpenCode)
```

## Quick Start

### Already have MCPs scattered across your repo?

Migrate and unify everything in one command:

```bash
npx agents-mcp import --clean
```

This scans your workspace for existing agent configs (`.mcp.json`,  `.cursor/mcp.json`,  `.vscode/mcp.json`,  `opencode.json`,  `.zed/settings.json`), deduplicates servers, extracts hardcoded secrets into `.env` + `.env.example`, generates `.agents/mcp.json`, and keeps your active agents synced.

### Starting from scratch?

1. Initialize .agents/mcp.json and configure .gitignore for derived files:
`npx agents-mcp init`
2. Add an MCP server from GitHub, npm, MCP Registry, or direct flags
`npx agents-mcp add modelcontextprotocol/server-github`
3. Sync changes across all detected agents
`npx agents-mcp sync`

_Tip: Installing globally also exposes the short `mcpx` alias (`mcpx sync`)._

## Canonical Format (`.agents/mcp.json`)

Every `.agents/mcp.json` is backed by a strict JSON Schema (`https://agents-mcp.dev/schema/v0.1.0/mcp.schema.json`) for instant autocomplete and validation in modern editors.

Example:

```json
{
  "$schema": "https://agents-mcp.dev/schema/v0.1.0/mcp.schema.json",
  "servers": {
    "github": {
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "postgres": {
      "transport": "stdio",
      "command": "uvx",
      "args": ["mcp-server-postgres", "${DATABASE_URL}"],
      "targets": ["claude-code", "opencode"]
    },
    "linear": {
      "transport": "http",
      "url": "https://mcp.linear.app/mcp",
      "headers": {
        "Authorization": "Bearer ${LINEAR_API_KEY}"
      }
    }
  }
}
```

## Key Features

-   **Zero-Friction Onboarding (`import`):** Absorbs existing configurations from 6+ agents without manual rewriting.
-   **Non-Destructive JSONC Merging:** Uses AST-level edits (`jsonc-parser`) so comments and non-MCP settings in `opencode.json`,  `.vscode/mcp.json`, and `.zed/settings.json` are never wiped out.
-   **Secret Hygiene by Default:** Enforces `${VAR}` placeholders in versioned configs while syncing required keys to `.env` and `.env.example`.
-   **Per-Agent Targeting (`targets`):** Restrict heavy MCP servers to specific tools (e.g., UI servers only in Cursor/VS Code) to save context tokens elsewhere.
-   **Environment Diagnostics (`doctor`):** Validates schema compliance, checks missing `.env` variables, verifies local binaries (`npx`,  `uvx`,  `docker`), and detects configuration drift.
-   **Project & Global Scopes:** Works seamlessly at the repository level (`.agents/mcp.json`) or user level (`~/.agents/mcp.json` via `-g`).

## Supported Agents

| Agent | Project Config | Global Config | Env Syntax Translated |
| :--- | :--- | :--- | :--- |
| **Claude Code** | `.mcp.json` | `~/.claude.json` | `${VAR}` |
| **Cursor** | `.cursor/mcp.json` | `~/.cursor/mcp.json` | `${env:VAR}` |
| **VS Code** | `.vscode/mcp.json` | User Profile `mcp.json` | `${env:VAR}` |
| **OpenCode** | `opencode.json` | `~/.config/opencode/opencode.json` | `{env:VAR}` |
| **Windsurf** | *(Global only)* | `~/.codeium/windsurf/mcp_config.json` | `${env:VAR}` |
| **Zed** | `.zed/settings.json` | `~/.config/zed/settings.json` | `${VAR}` |

See the full field-by-field translation rules in [`spec/MATRIX.md`](./spec/MATRIX.md).

## CLI Reference

| Command | Description |
| :--- | :--- |
| `agents-mcp init` | Scaffold `.agents/mcp.json` and optionally gitignore derived agent files |
| `agents-mcp import` | Consolidate existing agent MCP configs into `.agents/mcp.json` |
| `agents-mcp add <source>` | Install an MCP server from GitHub, npm, MCP Registry, or CLI flags |
| `agents-mcp sync` | Compile `.agents/mcp.json` into all active agent config files |
| `agents-mcp remove <name>` | Remove a server and clean it from all derived agent configs |
| `agents-mcp list` | Inspect configured servers, targets, and sync state |
| `agents-mcp doctor` | Audit schema validity, env vars, runtime binaries, and drift |

_Tip: Installing globally also exposes the short `mcpx` alias (`mcpx sync`)._

## Open Specification

The `.agents/mcp.json` format is an open, public-domain specification ([CC0 1.0](./spec/SPEC.md)).

-   **Formal Specification:**  [`spec/SPEC.md`](./spec/SPEC.md)
-   **JSON Schema:**  [`spec/mcp.schema.json`](./spec/mcp.schema.json)
-   **Agent Translation Matrix:**  [`spec/MATRIX.md`](./spec/MATRIX.md)
    

**Are you an AI agent or editor maintainer?**

You don't need to depend on this CLI to support `.agents/mcp.json`. If your tool already reads `.agents/skills`, adding native fallback support for `.agents/mcp.json` is a natural extension—check the [Implementer Guidelines](./spec/SPEC.md#8-implementer-guidelines-for-agent-maintainers) to implement it in under 50 lines of code.

## Contributing & License

Contributions, new agent adapters, and spec feedback are welcome. Open an issue or submit a PR!

-   **CLI Source Code:** MIT License
-   **Specification (`spec/`):** CC0 1.0 Universal (Public Domain)
````
