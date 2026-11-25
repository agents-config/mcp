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
  parseAgentsFlag,
  formatConfigValidationError,
  formatDryRunActions,
} from '$/src/commands/util'
import { runSync } from '$/src/commands/sync'
import { loadValidatedConfig, ConfigValidationError } from '$/src/core/store'
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
    const yes = args.yes === true
    const agentsFlag = parseAgentsFlag(args, rawArgs)
    const name = args._?.[0] as string | undefined

    if (!name) {
      ui.error('Usage: agents-mcp remove <name>')
      process.exit(2)
    }

    // Load + validate canonical config, reporting ConfigValidationError cleanly.
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
      ui.error(`No canonical config at ${path}. Run 'agents-mcp init' first.`)
      process.exit(1)
    }

    const servers = {
      ...(validated.config.mcpServers as Record<string, unknown>),
    }
    if (!(name in servers)) {
      ui.error(`Unknown server \`${name}\`. Not found in canonical config.`)
      process.exit(1)
    }

    // Load the state before changing the canonical config.
    const stateResult = loadSyncState(scope, ctx)
    const state = stateResult.state

    delete servers[name]

    // Planned file operations for the --dry-run preview (zero disk writes).
    const planned: { type: 'write' | 'remove'; path: string }[] = []
    planned.push({ type: 'write', path })

    if (!dryRun) {
      persistCanonicalConfig(scope, ctx, {
        $schema: validated.config.$schema,
        mcpServers: servers,
      })
    }

    ui.note(`Removed server \`${name}\` from canonical config`)

    if (dryRun) {
      // Dry-run preview of planned file operations (zero disk writes).
      ui.note(formatDryRunActions(planned))
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
            `Agent sync skipped (--no-sync): the managed plugin of \`${name}\` was cleaned. Run \`agents-mcp sync\` to sync agents later.`,
          )
        }
      } else {
        for (const err of removal.errors) {
          ui.error(err)
        }
        ui.note(
          `Server \`${name}\` was removed from canonical, but plugin files remain and will be reprocessed on the next \`sync\`.`,
        )
        process.exit(1)
        return
      }
    } else {
      const summary = await runSync({
        scope,
        ctx,
        flag: agentsFlag,
        dryRun: false,
        yes,
        // B7: removing a server in a project without targets succeeds and
        // cleans up the managed plugin.
        allowEmptyTargets: true,
      })
      if (summary.errors.length > 0) {
        process.exit(1)
      }
    }
  },
})
