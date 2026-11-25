/**
 * `list` command (§11).
 *
 * Read-only table: name, type, command/URL, per-agent sync status. `--all`
 * includes the global scope and marks shadowed entries (project wins).
 */

import { defineCommand } from 'citty'
import {
  createUiAndCtx,
  configPath,
  isDryRun,
  isGlobalFlag,
  isYesFlag,
  loadCanonicalOrExit,
} from '$/src/commands/util'
import { loadState } from '$/src/core/state'
import type { ConfigScope } from '$/src/core/context'
import type { AgentId } from '$/src/adapters/types'

export const listCommand = defineCommand({
  meta: {
    name: 'list',
    description: 'Inspect configured servers, targets, and sync state',
  },
  args: {
    all: {
      type: 'boolean',
      alias: 'a',
      description: 'Include global scope and mark shadowed entries',
    },
    global: {
      type: 'boolean',
      alias: 'g',
      description: 'Operate on the global scope only',
    },
  },
  run: async ({ args }) => {
    const { ctx, ui } = createUiAndCtx({ yes: isYesFlag(args) })
    const includeAll = args.all === true
    const scopes: ConfigScope[] = includeAll
      ? ['project', 'global']
      : isGlobalFlag(args)
        ? ['global']
        : ['project']

    // Collect all server names from project scope first (for shadow detection).
    const projectNames = new Set<string>()
    const scopeData: Array<{
      scope: ConfigScope
      servers: Record<string, unknown>
      state: Awaited<ReturnType<typeof loadState>>['state']
    }> = []

    for (const scope of scopes) {
      const config = loadCanonicalOrExit(scope, ctx, ui)
      const stateResult = loadState(scope, ctx)
      const state = stateResult.state
      const servers = config.mcpServers ?? {}
      scopeData.push({ scope, servers, state })
      if (scope === 'project') {
        for (const name of Object.keys(servers)) {
          projectNames.add(name)
        }
      }
    }

    for (const { scope, servers, state } of scopeData) {
      const names = Object.keys(servers) as string[]

      for (const name of names) {
        const server = servers[name] as {
          type?: string
          command?: string
          url?: string
        }
        const type = server.type ?? (server.url ? 'streamable-http' : 'stdio')
        const displayType =
          type === 'stdio'
            ? 'command'
            : type === 'streamable-http'
              ? 'http'
              : type
        const isHttp = type === 'streamable-http' || type === 'sse'
        const target = isHttp ? (server.url ?? '') : (server.command ?? '')

        // Per-agent sync status: list which agents have this server synced.
        const syncedAgents: string[] = []
        for (const agentId of Object.keys(state.agents)) {
          const agent = state.agents[agentId as AgentId]
          if (agent?.names.includes(name)) {
            syncedAgents.push(agentId)
          }
        }
        const syncStatus =
          syncedAgents.length > 0
            ? `synced (${syncedAgents.join(', ')})`
            : 'not-synced'

        const shadowed =
          includeAll && scope === 'global' && projectNames.has(name)
            ? ' (shadowed)'
            : ''

        ui.note(
          `${name.padEnd(14)} ${displayType.padEnd(8)} ${target.padEnd(24)} ${syncStatus}${shadowed}`,
        )
      }
    }

    const totalNames = new Set(scopeData.flatMap((d) => Object.keys(d.servers)))
      .size
    if (totalNames === 0) {
      ui.note('No servers configured.')
    }
  },
})
