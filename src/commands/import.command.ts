/**
 * `import` command (§11).
 *
 * Scan every adapter for the active scope, extract, normalize, deduplicate /
 * conflict-resolve, apply the secret policy, merge into canonical (existing
 * entries win unless `--force`), seed state names for all scanned agents, then
 * `sync` unless `--no-sync`. Native files are never deleted.
 */

import { defineCommand } from 'citty'
import { join } from 'node:path'
import { readdirSync, statSync } from 'node:fs'
import {
  createUiAndCtx,
  configPath,
  persistCanonicalConfig,
  persistSyncState,
  isDryRun,
  isGlobalFlag,
  isNoSyncFlag,
  isYesFlag,
  parseAgentsFlag,
  formatConfigValidationError,
  formatDryRunActions,
} from '$/src/commands/util'
import { runSync } from '$/src/commands/sync'
import { resolveTargetsAsync, adapters } from '$/src/adapters/index'
import { DEFAULT_SCHEMA_URL, AGENT_ORDER } from '$/src/config'
import { loadValidatedConfig, ConfigValidationError } from '$/src/core/store'
import { loadState, type SyncState } from '$/src/core/state'
import {
  planSecretExtraction,
  applySecretExtraction,
  appendToDotenv,
  syncEnvExample,
} from '$/src/core/env'
import { readTextFile } from '$/src/core/fs-atomic'
import type { AgentId } from '$/src/adapters/types'
import type { CanonicalServer } from '$/src/core/schema'
import type { ConfigScope, RuntimeContext } from '$/src/core/context'
import * as antigravity from '$/src/adapters/antigravity'

export const importCommand = defineCommand({
  meta: {
    name: 'import',
    description: 'Consolidate existing agent MCP configs into .agents/mcp.json',
  },
  args: {
    'no-sync': {
      type: 'boolean',
      description: 'Import into canonical without running sync afterwards',
    },
    force: {
      type: 'boolean',
      alias: 'f',
      description: 'Overwrite conflicting canonical entries',
    },
    'extract-secrets': {
      type: 'boolean',
      description: 'Write detected secrets to .env (warn-only by default)',
    },
  },
  run: async ({ args, rawArgs }) => {
    const { ctx, ui } = createUiAndCtx({ yes: isYesFlag(args) })
    const scope = (isGlobalFlag(args) ? 'global' : 'project') as ConfigScope
    const path = configPath(scope, ctx)
    const dryRun = isDryRun(args)
    const noSync = isNoSyncFlag(args, rawArgs)
    const force = args.force === true
    const extractSecrets = args['extract-secrets'] === true
    const yes = isYesFlag(args)
    const agentsFlag = parseAgentsFlag(args, rawArgs)

    // Load + validate canonical config. A missing config is tolerated (import
    // creates it); an invalid one is reported as a structured error.
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
    let canonical: Record<string, CanonicalServer> = {}
    let schemaUrl = DEFAULT_SCHEMA_URL
    if (validated) {
      schemaUrl = validated.config.$schema ?? DEFAULT_SCHEMA_URL
      canonical = {
        ...(validated.config.mcpServers as Record<string, CanonicalServer>),
      }
    }

    const stateResult = loadState(scope, ctx)
    const state = stateResult.state

    const allWarnings: string[] = []
    // name -> [{agentId, server}] so cross-agent conflicts can be detected.
    const candidates: Map<
      string,
      Array<{ agentId: AgentId; server: CanonicalServer }>
    > = new Map()
    const extractedByAgent: Record<AgentId, string[]> = {} as Record<
      AgentId,
      string[]
    >
    const scannedAgents: AgentId[] = []
    // Planned file operations for the --dry-run preview.
    const plannedWrites: { type: 'write' | 'remove'; path: string }[] = []

    function addCandidate(
      agentId: AgentId,
      name: string,
      server: CanonicalServer,
    ): void {
      const arr = candidates.get(name) ?? []
      arr.push({ agentId, server })
      candidates.set(name, arr)
    }

    // 1. Scan every non-antigravity adapter (single native config file).
    for (const adapter of adapters) {
      // antigravity is per-plugin: handled separately below.
      if (adapter.id === 'antigravity') continue

      const nativePath = adapter.getConfigPath(scope, ctx)
      if (nativePath === null) continue
      const exists = await adapter.detect(scope, ctx)
      if (!exists) continue
      scannedAgents.push(adapter.id as AgentId)

      const existing = readTextFile(nativePath)
      if (existing === null) continue

      const { servers, warnings } = adapter.extractServers(existing, scope)
      allWarnings.push(...warnings.map((w) => w.message))
      for (const [name, server] of Object.entries(servers)) {
        addCandidate(adapter.id as AgentId, name, server)
      }
    }

    // 1b. Antigravity (layout === 'per-plugin'): scan
    // <base>/.agents/plugins/*/mcp_config.json and call antigravity.extractServers().
    const base = scope === 'project' ? ctx.cwd : ctx.homeDir
    const pluginsDir = join(base, '.agents', 'plugins')
    let antigravityEntries: string[] = []
    try {
      antigravityEntries = readdirSync(pluginsDir)
    } catch {
      antigravityEntries = []
    }
    for (const entry of antigravityEntries) {
      const mcpConfigPath = join(pluginsDir, entry, 'mcp_config.json')
      let isFile = false
      try {
        isFile = statSync(mcpConfigPath).isFile()
      } catch {
        isFile = false
      }
      if (!isFile) continue
      const existing = readTextFile(mcpConfigPath)
      if (existing === null) continue
      const { servers, warnings } = antigravity.extractServers(existing, scope)
      allWarnings.push(...warnings.map((w) => w.message))
      for (const [name, server] of Object.entries(servers)) {
        addCandidate('antigravity', name, server)
      }
      scannedAgents.push('antigravity')
    }

    // 2. Resolve cross-agent server conflicts.
    const extracted: Record<string, CanonicalServer> = {}
    for (const [name, defs] of candidates) {
      const uniqueServers = [
        ...new Map(
          defs.map((d) => [JSON.stringify(d.server), d] as const),
        ).values(),
      ]
      if (uniqueServers.length === 1) {
        const winner = uniqueServers[0]!
        extracted[name] = winner.server
        extractedByAgent[winner.agentId] = [
          ...(extractedByAgent[winner.agentId] ?? []),
          name,
        ]
        continue
      }

      // Conflict: multiple agents define the same server differently.
      defs.sort(
        (a, b) =>
          AGENT_ORDER.indexOf(a.agentId) - AGENT_ORDER.indexOf(b.agentId),
      )
      const winner = defs[0]!
      const losers = defs.slice(1).map((d) => d.agentId)

      if (yes || !ctx.isTTY) {
        // Non-interactive (--yes / CI): deterministic AGENT_ORDER winner +
        // warning naming both agents and the server.
        allWarnings.push(
          `Server \`${name}\` is defined by multiple agents (${losers.join(
            ', ',
          )}, ${winner.agentId}) with differing definitions; keeping ${winner.agentId}'s definition (AGENT_ORDER).`,
        )
        extracted[name] = winner.server
        extractedByAgent[winner.agentId] = [
          ...(extractedByAgent[winner.agentId] ?? []),
          name,
        ]
      } else {
        // Interactive TTY: prompt the user to choose which definition wins (or skip).
        const options: Array<{
          label: string
          value: AgentId | '__skip__'
        }> = defs.map((d) => ({
          label: `${d.agentId}: ${JSON.stringify(d.server)}`,
          value: d.agentId,
        }))
        options.push({ label: 'Skip this server', value: '__skip__' })
        const chosen = await ui.select<AgentId | '__skip__'>({
          message: `Conflict for server \`${name}\`: multiple agents define it differently. Choose which definition wins:`,
          options,
        })
        if (chosen === '__skip__') {
          continue
        }
        const pick = defs.find((d) => d.agentId === chosen)
        if (!pick) continue
        extracted[name] = pick.server
        extractedByAgent[chosen] = [...(extractedByAgent[chosen] ?? []), name]
      }
    }

    // Secret policy: plan extraction and optionally write to .env + .env.example.
    const allWrites: Array<{ key: string; value: string }> = []
    const allKeys: string[] = []
    const extractedCanonical: Record<string, CanonicalServer> = {}
    for (const [name, server] of Object.entries(extracted)) {
      const { writes, replacements, warnings } = planSecretExtraction(
        name,
        server,
        { policy: extractSecrets ? 'extract' : 'warn' },
      )
      allWarnings.push(...warnings)
      for (const w of writes) {
        allWrites.push(w)
        allKeys.push(w.key)
      }
      extractedCanonical[name] = extractSecrets
        ? applySecretExtraction(server, { writes, replacements, warnings })
        : server
    }
    canonical = { ...canonical, ...extractedCanonical }

    if (!dryRun && extractSecrets && allWrites.length > 0) {
      // Project: <cwd>/.env ; Global: <homeDir>/.agents/.env
      const dotenvPath =
        scope === 'project'
          ? join(ctx.cwd, '.env')
          : join(ctx.homeDir, '.agents', '.env')
      const examplePath =
        scope === 'project'
          ? join(ctx.cwd, '.env.example')
          : join(ctx.homeDir, '.agents', '.env.example')
      appendToDotenv(dotenvPath, allWrites)
      syncEnvExample(examplePath, allKeys)
    }

    // Persist canonical config (B7: tolerate zero resolvable targets — still
    // persist .agents/mcp.json and plugins, warn, hint sync instead of exit 1).
    plannedWrites.push({ type: 'write', path })
    if (!dryRun) {
      persistCanonicalConfig(scope, ctx, {
        $schema: schemaUrl,
        mcpServers: canonical,
      })

      const nextState: SyncState = {
        ...state,
        scope,
        targets: state.targets,
        agents: { ...state.agents },
      }
      for (const agentId of scannedAgents) {
        // Store the adapter's native path (not the canonical path).
        const nativePath =
          agentId === 'antigravity'
            ? join(base, '.agents', 'plugins')
            : (adapters
                .find((a) => a.id === agentId)!
                .getConfigPath(scope, ctx) ?? path)
        nextState.agents[agentId] = {
          path: nativePath,
          names: extractedByAgent[agentId] ?? [],
          updatedAt: new Date().toISOString(),
        }
      }
      persistSyncState(scope, ctx, nextState)
    }

    if (!noSync && !dryRun) {
      await runSync({
        scope,
        ctx,
        flag: agentsFlag,
        dryRun: false,
        yes,
        allowEmptyTargets: true,
      })
    } else if (!noSync && dryRun) {
      await runSync({
        scope,
        ctx,
        flag: agentsFlag,
        dryRun: true,
        yes,
        allowEmptyTargets: true,
      })
    }

    // Dry-run preview of planned file operations (zero disk writes).
    if (dryRun && plannedWrites.length > 0) {
      ui.note(formatDryRunActions(plannedWrites))
    }

    ui.note(
      `Imported ${Object.keys(extracted).length} server(s) from ${scannedAgents.length} agent(s)`,
    )
    for (const w of allWarnings) {
      ui.warn(w)
    }
  },
})
