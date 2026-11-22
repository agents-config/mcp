/**
 * `remove` command (§11).
 *
 * Remove a server from the canonical config and sync unless `--no-sync`.
 * Unknown name → exit `1`.
 */

import { defineCommand } from 'citty'
import {
  createUiAndCtx,
  configPath,
  persistCanonicalConfig,
  isDryRun,
  loadSyncState,
  persistSyncState,
  isNoSyncFlag,
} from '$/src/commands/util'
import { runSync } from '$/src/commands/sync'
import { loadValidatedConfig } from '$/src/core/store'
import type { ConfigScope } from '$/src/core/context'
import { removeManagedPlugin } from '$/src/core/plugins'

export const removeCommand = defineCommand({
  meta: {
    name: 'remove',
    description: 'Remove a server and clean it from managed agent configs',
  },
  args: {
    'no-sync': {
      type: 'boolean',
      description: 'Remove from canonical without running sync afterwards',
    },
  },
  run: async ({ args, rawArgs }) => {
    const { ctx, ui } = createUiAndCtx({ yes: args.yes === true })
    const scope = (args.global ? 'global' : 'project') as ConfigScope
    const path = configPath(scope, ctx)
    const dryRun = isDryRun(args)
    const noSync = isNoSyncFlag(args, rawArgs)
    const name = args._?.[0] as string | undefined

    if (!name) {
      ui.error('Usage: agents-mcp remove <name>')
      process.exit(2)
    }

    const validated = loadValidatedConfig(scope, ctx)
    if (!validated) {
      ui.error(`No canonical config at ${path}. Run 'agents-mcp init' first.`)
      process.exit(1)
    }

    // Carrega o estado antes de alterar o canônico.
    const stateResult = loadSyncState(scope, ctx)
    const state = stateResult.state

    const servers = {
      ...(validated.config.mcpServers as Record<string, unknown>),
    }
    if (!(name in servers)) {
      ui.error(`Unknown server \`${name}\`. Not found in canonical config.`)
      process.exit(1)
    }

    delete servers[name]

    if (!dryRun) {
      persistCanonicalConfig(scope, ctx, {
        $schema: validated.config.$schema,
        mcpServers: servers,
      })
    }

    ui.note(`Removed server \`${name}\` from canonical config`)

    if (dryRun) {
      return
    }

    if (noSync) {
      const removal = removeManagedPlugin({
        scope,
        ctx,
        name,
        managedPlugins: state.managedPlugins,
        dryRun: false,
      })

      if (removal.ok) {
        const nextState = {
          ...state,
          scope,
          targets: state.targets,
          agents: { ...state.agents },
          managedPlugins: state.managedPlugins.filter((n) => n !== name),
        }
        persistSyncState(scope, ctx, nextState)
        if (removal.removed.length > 0) {
          ui.note(
            `Sincronizacao de agentes ignorada (--no-sync): o plugin gerenciado de \`${name}\` foi limpo. Execute \`agents-mcp sync\` para sincronizar os agentes depois.`,
          )
        }
      } else {
        for (const err of removal.errors) {
          ui.error(err)
        }
        ui.note(
          `O servidor \`${name}\` foi removido do canônico, mas os arquivos de plugin permanecem e serão reprocessados no próximo \`sync\`.`,
        )
        process.exit(1)
        return
      }
    } else {
      const summary = await runSync({
        scope,
        ctx,
        flag: undefined,
        dryRun: false,
        yes: args.yes === true,
      })
      if (summary.errors.length > 0) {
        process.exit(1)
      }
    }
  },
})
