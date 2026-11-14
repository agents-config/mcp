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
} from '$/src/commands/util'
import { runSync } from '$/src/commands/sync'
import { loadValidatedConfig } from '$/src/core/store'

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
  run: async ({ args }) => {
    const { ctx, ui } = createUiAndCtx({ yes: args.yes === true })
    const scope = args.global ? 'global' : 'project'
    const path = configPath(scope, ctx)
    const dryRun = isDryRun(args)
    const noSync = args['no-sync'] === true
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

    const servers = { ...(validated.config.servers as Record<string, unknown>) }
    if (!(name in servers)) {
      ui.error(`Unknown server \`${name}\`. Not found in canonical config.`)
      process.exit(1)
    }

    delete servers[name]

    if (!dryRun) {
      persistCanonicalConfig(scope, ctx, {
        $schema: validated.config.$schema,
        servers,
      })
    }

    ui.note(`Removed server \`${name}\` from canonical config`)

    if (!noSync && !dryRun) {
      await runSync({
        scope,
        ctx,
        flag: undefined,
        dryRun: false,
        yes: args.yes === true,
      })
    }
  },
})
