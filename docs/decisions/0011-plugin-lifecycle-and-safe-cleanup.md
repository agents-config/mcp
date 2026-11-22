# ADR-0011: Ciclo de vida de plugins e limpeza segura

- **Status**: Accepted
- **Date**: 2026-11-21
- **Related Docs**: [`spec/SPEC.md`](../../spec/SPEC.md), [`ADR-0005`](./0005-local-sync-state.md), [`ADR-0006`](./0006-non-destructive-compilation.md), [`ADR-0010`](./0010-adopt-agent-plugins-mcp-schema.md)

## Context

A partir de B3/B5, a CLI gera artefatos próprios em `.agents/plugins/<nome>/`:
`plugin.json`, `mcp.json` e, quando `antigravity` está entre os targets,
`mcp_config.json`. Esses diretórios convivem com plugins e arquivos criados
manualmente pela pessoa usuária no mesmo caminho.

O `sync` era estritamente aditivo: escrevia/sobrescrevia, mas nunca removia. Como
consequência, remover um servidor (ou desselecionar `antigravity`) deixava
arquivos obsoletos que podiam fazer agentes continuarem carregando servidores já
removidos. Ao mesmo tempo, o princípio de compilação não destrutiva (ADR-0006)
proíbe tocar em arquivos nativos ou em conteúdo manual.

É necessário um critério explícito e conservador para decidir **o que a CLI pode
apagar**, sem depender de heurísticas de conteúdo e sem risco para arquivos da
pessoa usuária.

## Decision

1. **Propriedade declarada, não inferida.** `SyncState.managedPlugins`
   (`.agents/.mcp-sync-state.json`, por escopo) é a única fonte de verdade sobre
   quais plugins pertencem à CLI. Um diretório em `.agents/plugins/<nome>/` só é
   considerado gerenciado se `<nome>` constar em `managedPlugins`.

2. **Superfície de remoção fechada.** A CLI pode remover exclusivamente
   `plugin.json`, `mcp.json` e `mcp_config.json` de um plugin gerenciado. Qualquer
   outro arquivo ou subdiretório é preservado.

3. **Diretório só sai se vazio.** Após remover os arquivos gerenciados, o
   diretório é removido com `rmdir` não recursivo e somente se estiver vazio.
   Arquivos extras mantêm o diretório.

4. **Reconciliação no `sync`.** A cada sincronização real, o conjunto
   `managedPlugins − nomesCanônicos` é considerado obsoleto e tem os arquivos
   gerenciados removidos; `managedPlugins` é reduzido ao conjunto canônico mais
   os plugins gravados com sucesso. Isso cobre `remove`, edição manual do
   canônico e estado legado.

5. **`mcp_config.json` segue os targets ativos.** Quando uma sincronização real
   ocorre sem `antigravity` entre os targets, `mcp_config.json` é removido de
   todos os plugins gerenciados, preservando `plugin.json` e `mcp.json`.
   `add --no-sync` cria o arquivo quando `antigravity` está ativo, mas **não**
   poda plugins existentes (escopo de escrita restrito ao servidor adicionado —
   ver B8).

6. **Falhas são visíveis.** Erros de I/O na limpeza são capturados por arquivo,
   reportados ao usuário e resultam em exit code `1`. Em `remove --no-sync`, o
   nome permanece em `managedPlugins` para que o próximo `sync` tente novamente.

7. **`--dry-run` é absoluto.** Nenhuma primitiva de limpeza toca no disco em
   dry-run; ela apenas relata o que seria removido.

## Alternatives Considered

- **Inferir propriedade pelo conteúdo de `plugin.json`** (ex.: descrição
  `managed by agents-mcp`): rejeitado. Cria segundo critério de verdade,
  duplica estado e ainda exigiria parsing tolerante a edições manuais.
- **Apagar o diretório recursivamente** quando o nome é gerenciado: rejeitado.
  Viola a proteção de arquivos manuais e amplia o raio de destruição.
- **Não remover nada e apenas avisar** (status quo): rejeitado. Mantém agentes
  carregando servidores removidos e não cumpre o ciclo de vida esperado.
- **Poda apenas dentro do `remove`**: rejeitado. Não cobre edição manual do
  canônico nem desseleção de `antigravity` via `sync`.

## Consequences

- **Positive**: ciclo de vida completo e previsível; workspace limpo; nenhum
  arquivo manual é apagado; `--dry-run` continua seguro; erros não são
  mascarados.
- **Negative / Trade-offs**: projetos cujo estado local não registra
  `managedPlugins` (estado legado ou removido) mantêm diretórios órfãos até
  limpeza manual — escolha deliberada em favor da segurança.
- **Follow-up**: B7 (ausência de targets em `init`/`import`/`remove`) e B8
  (regeneração granular no `add`) permanecem fora deste ADR. O mesmo defeito de
  `--no-sync` em `import` deve ser corrigido em item próprio.
