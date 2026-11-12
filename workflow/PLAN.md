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
