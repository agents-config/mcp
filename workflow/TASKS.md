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
