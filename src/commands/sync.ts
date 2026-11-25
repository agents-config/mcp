/**
 * `sync` command (§11).
 *
 * Validate canonical config → resolve targets → compile per adapter → write
 * native files → update sync state → print summary. Byte-idempotent: a second
 * run produces no byte changes. Exports `runSync` for reuse by `add`/`remove`.
 */

import { join } from 'node:path'
import {
  createUiAndCtx,
  configPath,
  formatConfigValidationError,
  formatDryRunActions,
  writeFileAtomic,
  persistSyncState,
  loadSyncState,
} from '$/src/commands/util'
import { resolveTargetsAsync, getAdapter } from '$/src/adapters/index'
import type { AgentId } from '$/src/adapters/types'
import { AGENTS_DIR } from '$/src/config'
import type { CanonicalServer } from '$/src/core/schema'
import type { ConfigScope, RuntimeContext } from '$/src/core/context'
import { loadValidatedConfig, ConfigValidationError } from '$/src/core/store'
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
   * When `true`, does not print the plugin error block. Used by `add`,
   * which reports the same failures once in its own summary.
   */
  quietErrors?: boolean
  /**
   * `add --no-sync`: generates only the plugin; does not resolve or write agents.
   * `state.targets` and `state.agents` are preserved.
   */
  skipAgentSync?: boolean
  /**
   * `add`: allows zero resolvable targets; keeps generating plugins.
   * Without it, zero targets keeps current behavior (error + exit 1).
   */
  allowEmptyTargets?: boolean
  /**
   * B8: when defined, `sync` writes/validates only plugins whose names are in
   * this list. Used by `add` to never fail because of an unmanaged unrelated
   * plugin.
   */
  onlyPluginNames?: readonly string[]
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
    onlyPluginNames = undefined,
  } = options
  const { ui } = createUiAndCtx({ yes })

  // 1. Load + validate canonical config.
  let validated
  try {
    validated = loadValidatedConfig(scope, ctx)
  } catch (err) {
    if (err instanceof ConfigValidationError) {
      ui.error(formatConfigValidationError(err))
      process.exit(1)
    }
    throw err
  }
  if (!validated) {
    ui.note(
      `No canonical config at ${configPath(scope, ctx)}. Nothing to sync.`,
    )
    return { scope, targets: [], written: [], warnings: [], errors: [] }
  }
  const { config, warnings: configWarnings } = validated

  // 2. Resolve targets: flag → state → detection.
  // In `skipAgentSync` (`add --no-sync`) there is no agent resolution: the
  // plugin phase still runs, but without native files and without touching
  // agent state.
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
  // Planned file operations for the --dry-run preview (zero disk writes).
  const planned: { type: 'write' | 'remove'; path: string }[] = []
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

    planned.push({ type: 'write', path: nativePath })
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
  /** Canonical names whose plugin (including `mcp_config.json` when antigravity
   * is targeted) was written successfully this run. */
  const syncedPluginNames = new Set<string>()
  for (const [name, server] of Object.entries(config.mcpServers)) {
    // B8: when `onlyPluginNames` is set, generate only the requested plugins
    // requested (e.g. `add` writes only the plugin for the newly added server).
    if (onlyPluginNames && !onlyPluginNames.includes(name)) {
      continue
    }
    if (isUnmanagedPluginCollision(scope, ctx, name, state.managedPlugins)) {
      allWarnings.push({
        code: 'PLUGIN_UNMANAGED',
        agent: undefined,
        message: `.agents/plugins/${name}/ pre-exists and is not managed by the CLI; skipped in sync. Use a different name.`,
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
      syncedPluginNames.add(name)
      if (!dryRun) {
        written.push(...result.written)
      } else {
        for (const p of result.written) {
          planned.push({ type: 'write', path: p })
        }
      }
    } else {
      allWarnings.push({
        code: 'PLUGIN_WRITE_ERROR',
        agent: undefined,
        message: `Failed to generate plugin \`${name}\`: ${result.errors.join('; ')}`,
      })
    }
  }

  // Prune stale plugins: servers that left the canonical (removed by `remove`
  // or manually) clean their managed files and leave the managed-plugins state.
  // Manual files and non-empty directories are preserved by `removeManagedPlugin`.
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
      // Cleanup failure (e.g. plugin.json became a directory -> EISDIR): keep
      // the name in nextManagedPlugins so the next `sync` retries, instead of
      // dropping the plugin from state and leaving the directory orphaned without
      // reprocessing. The error is already in allWarnings and will be reported
      // in summary.errors (and exit 1 via sync.command).
      nextManagedPlugins.add(name)
      allWarnings.push({
        code: 'PLUGIN_CLEANUP_ERROR',
        agent: undefined,
        message: `Failed to remove plugin \`${name}\`: ${result.errors.join('; ')}`,
      })
    } else {
      for (const p of result.removed) {
        planned.push({ type: 'remove', path: p })
      }
    }
  }

  // When antigravity is no longer targeted, remove mcp_config.json from managed
  // plugins (preserving plugin.json and mcp.json). In skipAgentSync
  // (`add --no-sync`) existing mcp_config.json is not touched.
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
          message: `Failed to remove mcp_config.json of \`${name}\`: ${result.errors.join('; ')}`,
        })
      } else {
        for (const p of result.removed) {
          planned.push({ type: 'remove', path: p })
        }
      }
    }
  }

  // 4a. Antigravity agent-state lifecycle: record `state.agents.antigravity`
  // when antigravity is targeted (path = .agents/plugins dir, names = plugins
  // whose sync succeeded this run); delete it when antigravity is deselected
  // (its mcp_config.json files were cleaned up in the block above).
  if (!skipAgentSync) {
    const base = scope === 'project' ? ctx.cwd : ctx.homeDir
    const antigravityPath = join(base, AGENTS_DIR, 'plugins')
    if (targets.includes('antigravity')) {
      const existing = state.agents['antigravity']
      const names = [...syncedPluginNames]
      const namesChanged =
        !existing ||
        existing.path !== antigravityPath ||
        existing.names.length !== names.length ||
        names.some((n) => !existing.names.includes(n))
      nextAgents['antigravity'] = {
        path: antigravityPath,
        names,
        updatedAt: namesChanged ? now : (existing?.updatedAt ?? now),
      }
    } else {
      delete nextAgents['antigravity']
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

  // --dry-run preview: show planned file operations, zero disk writes.
  if (dryRun && planned.length > 0) {
    ui.note(formatDryRunActions(planned))
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
        `Partial sync completed with failures: ${pluginErrors.length} plugin(s) could not be synced.`,
      )
      for (const e of pluginErrors) {
        ui.error(e)
      }
      ui.note(
        'Re-run `agents-mcp sync` after resolving the issues above. .agents/mcp.json was kept.',
      )
    }
  } else if (skipAgentSync) {
    // `add --no-sync`: agents were not synced, only plugins.
    ui.note(
      'Agent sync skipped (--no-sync): plugin files were updated in .agents/plugins/ and no agent was synced.',
    )
  } else if (targets.length === 0 && allowEmptyTargets) {
    // `add` without targets: completed with default plugin, no target agents.
    ui.note(
      'No target agents configured or detected: the default Agent Plugins plugin was generated in .agents/plugins/, but no agent was synced. To sync later, run `agents-mcp sync --agents <list>` (e.g. `--agents cursor,vscode`).',
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
