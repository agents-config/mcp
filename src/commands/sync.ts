/**
 * `sync` command (§11).
 *
 * Validate canonical config → resolve targets → compile per adapter → write
 * native files → update sync state → print summary. Byte-idempotent: a second
 * run produces no byte changes. Exports `runSync` for reuse by `add`/`remove`.
 */

import {
  createUiAndCtx,
  configPath,
  writeFileAtomic,
  persistSyncState,
  loadSyncState,
} from '$/src/commands/util'
import { resolveTargetsAsync, getAdapter } from '$/src/adapters/index'
import type { AgentId } from '$/src/adapters/types'
import type { CanonicalServer } from '$/src/core/schema'
import type { ConfigScope, RuntimeContext } from '$/src/core/context'
import { loadValidatedConfig } from '$/src/core/store'
import { readTextFile } from '$/src/core/fs-atomic'
import {
  syncPluginFiles,
  isUnmanagedPluginCollision,
  removeManagedPlugin,
  removeAntigravityPluginConfig,
} from '$/src/core/plugins'

export interface SyncOptions {
  scope: ConfigScope
  ctx: RuntimeContext
  flag: readonly string[] | undefined
  dryRun: boolean
  yes: boolean
  /**
   * Quando `true`, não imprime o bloco de erro de plugins. Usado pelo `add`,
   * que reporta as mesmas falhas uma única vez no seu próprio resumo.
   */
  quietErrors?: boolean
  /**
   * `add --no-sync`: gera apenas plugin; não resolve nem grava agentes.
   * `state.targets` e `state.agents` são preservados.
   */
  skipAgentSync?: boolean
  /**
   * `add`: permite zero targets resolvidos; segue gerando plugins.
   * Sem ele, zero targets mantém o comportamento atual (erro + exit 1).
   */
  allowEmptyTargets?: boolean
}

export interface SyncSummary {
  scope: ConfigScope
  targets: AgentId[]
  written: string[]
  warnings: string[]
  errors: string[]
}

export async function runSync(options: SyncOptions): Promise<SyncSummary> {
  const {
    scope,
    ctx,
    flag,
    dryRun,
    yes,
    quietErrors = false,
    skipAgentSync = false,
    allowEmptyTargets = false,
  } = options
  const { ui } = createUiAndCtx({ yes })

  // 1. Load + validate canonical config.
  const validated = loadValidatedConfig(scope, ctx)
  if (!validated) {
    ui.note(
      `No canonical config at ${configPath(scope, ctx)}. Nothing to sync.`,
    )
    return { scope, targets: [], written: [], warnings: [], errors: [] }
  }
  const { config, warnings: configWarnings } = validated

  // 2. Resolve targets: flag → state → detection.
  // Em `skipAgentSync` (`add --no-sync`) não há resolução de agentes: a
  // fase de plugins ainda roda, mas sem arquivos nativos e sem mexer no
  // estado de agentes.
  const stateResult = loadSyncState(scope, ctx)
  const state = stateResult.state
  const targets = skipAgentSync
    ? []
    : await resolveTargetsAsync({ flag, state, ctx })

  if (!skipAgentSync && targets.length === 0 && !allowEmptyTargets) {
    // Comportamento atual inalterado para `sync`/`remove`/`import`.
    ui.error(
      'No resolvable target agents. Pass --agents <list> (e.g. --agents cursor,vscode).',
    )
    process.exit(1)
  }

  const allWarnings: Array<{ code: string; agent?: string; message: string }> =
    [
      ...configWarnings.map((w) => ({
        code: 'SCHEMA',
        agent: undefined,
        message: w,
      })),
    ]

  // 3. Compile + write per target adapter.
  const written: string[] = []
  // Preserve existing agent records; only overwrite the agents being synced.
  const nextAgents: Record<
    string,
    { path: string; names: string[]; updatedAt: string }
  > = { ...state.agents }
  const now = new Date().toISOString()

  for (const agentId of targets) {
    const adapter = getAdapter(agentId)
    const nativePath = adapter.getConfigPath(scope, ctx)
    if (nativePath === null) {
      // antigravity writes per-plugin files (no single native config path);
      // it is handled by the plugin sync phase below, not here.
      if (agentId !== 'antigravity') {
        allWarnings.push({
          code: 'SCOPE_UNSUPPORTED',
          agent: agentId,
          message: `${agentId} does not support ${scope} scope`,
        })
      }
      continue
    }

    const serversForAgent: Record<string, CanonicalServer> = {}
    for (const [name, server] of Object.entries(config.mcpServers)) {
      serversForAgent[name] = server
    }

    const previous = new Set<string>(state.agents[agentId]?.names ?? [])
    const existing = readTextFile(nativePath)

    const { content, managedNames, warnings } = adapter.applyServers(
      existing,
      serversForAgent,
      {
        ...ctx,
        scope,
        previousManagedNames: previous,
      },
    )
    allWarnings.push(...warnings)

    if (!dryRun) {
      writeFileAtomic(nativePath, content)
      written.push(nativePath)
    }

    const existingAgent = state.agents[agentId]
    const namesChanged =
      !existingAgent ||
      existingAgent.path !== nativePath ||
      existingAgent.names.length !== managedNames.length ||
      managedNames.some((n) => !existingAgent.names.includes(n))
    // Refresh per-agent updatedAt only when names/path actually change
    // (byte-idempotence of state).
    nextAgents[agentId] = {
      path: nativePath,
      names: [...managedNames],
      updatedAt: namesChanged ? now : (existingAgent?.updatedAt ?? now),
    }
  }

  // 3b. Plugin sync: generate .agents/plugins/<name>/ for every canonical
  // server (plugin.json + mcp.json always; mcp_config.json when antigravity
  // is targeted). Skip unmanaged pre-existing plugin dirs.
  const includeAntigravity = skipAgentSync
    ? Boolean(
        flag?.includes('antigravity') || state.targets.includes('antigravity'),
      )
    : targets.includes('antigravity')
  const canonicalNames = Object.keys(config.mcpServers)
  const nextManagedPlugins = new Set<string>(
    state.managedPlugins.filter((n) => canonicalNames.includes(n)),
  )
  for (const [name, server] of Object.entries(config.mcpServers)) {
    if (isUnmanagedPluginCollision(scope, ctx, name, state.managedPlugins)) {
      allWarnings.push({
        code: 'PLUGIN_UNMANAGED',
        agent: undefined,
        message: `.agents/plugins/${name}/ pre-existe e nao e gerenciado pela CLI; ignorado em sync. Use um nome diferente.`,
      })
      continue
    }

    const result = syncPluginFiles({
      name,
      server,
      scope,
      ctx,
      includeAntigravity,
      dryRun,
    })

    if (result.ok) {
      nextManagedPlugins.add(name)
      if (!dryRun) {
        written.push(...result.written)
      }
    } else {
      allWarnings.push({
        code: 'PLUGIN_WRITE_ERROR',
        agent: undefined,
        message: `Falha ao gerar plugin \`${name}\`: ${result.errors.join('; ')}`,
      })
    }
  }

  // Poda de plugins obsoletos: servidores que sairam do canônico (removidos
  // pelo `remove` ou manualmente) limpam seus arquivos gerenciados e saem do
  // estado de plugins gerenciados. Arquivos manuais e diretorios nao vazios
  // sao preservados por `removeManagedPlugin`.
  const stalePlugins = state.managedPlugins.filter(
    (n) => !canonicalNames.includes(n),
  )
  for (const name of stalePlugins) {
    const result = removeManagedPlugin({
      scope,
      ctx,
      name,
      managedPlugins: state.managedPlugins,
      dryRun,
    })
    if (!result.ok) {
      // Falha de limpeza (ex.: plugin.json virou diretorio -> EISDIR): mantem o
      // nome em nextManagedPlugins para que o proximo `sync` tente novamente,
      // em vez de descartar o plugin do estado e deixar o diretorio orfao sem
      // reprocessamento. O erro ja esta em allWarnings e sera reportado em
      // summary.errors (e exit 1 via sync.command).
      nextManagedPlugins.add(name)
      allWarnings.push({
        code: 'PLUGIN_CLEANUP_ERROR',
        agent: undefined,
        message: `Falha ao remover plugin \`${name}\`: ${result.errors.join('; ')}`,
      })
    }
  }

  // Quando antigravity nao eh mais alvo, remova mcp_config.json dos plugins
  // gerenciados (preservando plugin.json e mcp.json). Em skipAgentSync
  // (`add --no-sync`) nao se toca em mcp_config.json existente.
  if (!skipAgentSync && !includeAntigravity) {
    for (const name of nextManagedPlugins) {
      const result = removeAntigravityPluginConfig({
        scope,
        ctx,
        name,
        managedPlugins: [...nextManagedPlugins],
        dryRun,
      })
      if (!result.ok) {
        allWarnings.push({
          code: 'PLUGIN_CLEANUP_ERROR',
          agent: undefined,
          message: `Falha ao remover mcp_config.json de \`${name}\`: ${result.errors.join('; ')}`,
        })
      }
    }
  }

  // 4. Update sync state (persist targets + per-agent managed names + plugins).
  const nextState = {
    ...state,
    scope,
    targets: skipAgentSync ? state.targets : targets,
    agents: nextAgents,
    managedPlugins: [...nextManagedPlugins],
  }
  if (!dryRun) {
    persistSyncState(scope, ctx, nextState)
  }

  // 5. Print summary.
  const isPluginError = (code: string): boolean =>
    code === 'PLUGIN_WRITE_ERROR' ||
    code === 'PLUGIN_UNMANAGED' ||
    code === 'PLUGIN_CLEANUP_ERROR'
  const pluginErrors = allWarnings
    .filter((w) => isPluginError(w.code))
    .map((w) => w.message)
  const summaryWarnings = allWarnings
    .filter((w) => !isPluginError(w.code))
    .map((w) => w.message)

  if (pluginErrors.length > 0) {
    if (!quietErrors) {
      ui.error(
        `Sincronizacao parcial concluida com falhas: ${pluginErrors.length} plugin(es) nao puderam ser sincronizados.`,
      )
      for (const e of pluginErrors) {
        ui.error(e)
      }
      ui.note(
        'Reexecute `agents-mcp sync` apos resolver os problemas acima. .agents/mcp.json foi mantido.',
      )
    }
  } else if (skipAgentSync) {
    // `add --no-sync`: agentes não foram sincronizados, apenas plugins.
    ui.note(
      'Sincronizacao de agentes ignorada (--no-sync): os arquivos de plugin foram atualizados em .agents/plugins/ e nenhum agente foi sincronizado.',
    )
  } else if (targets.length === 0 && allowEmptyTargets) {
    // `add` sem targets: concluído com plugin padrão, sem agentes alvo.
    ui.note(
      'Nenhum agente alvo configurado ou detectado: o plugin padrao Agent Plugins foi gerado em .agents/plugins/, mas nenhum agente foi sincronizado. Para sincronizar depois, execute `agents-mcp sync --agents <lista>` (ex.: `--agents cursor,vscode`).',
    )
  } else {
    ui.note(
      `Synced ${targets.length} target(s) across ${written.length} file(s)`,
    )
  }
  for (const w of summaryWarnings) {
    ui.warn(w)
  }

  return {
    scope,
    targets,
    written,
    warnings: summaryWarnings,
    errors: pluginErrors,
  }
}
