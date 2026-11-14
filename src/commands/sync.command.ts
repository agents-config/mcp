/**
 * `sync` command definition for citty (§11).
 *
 * Reuses `runSync` from `./sync` and wires citty args into `SyncOptions`.
 */

import { defineCommand } from 'citty'
import { runSync, type SyncOptions } from './sync'
import { createUiAndCtx } from '$/src/commands/util'

export const syncCommand = defineCommand({
  meta: {
    name: 'sync',
    description:
      'Compile .agents/mcp.json into all targeted agent config files',
  },
  args: {},
  run: async ({ args }) => {
    const { ctx, ui } = createUiAndCtx({ yes: args.yes === true })
    const scope = args.global ? 'global' : 'project'
    const flag = args.agents ? String(args.agents).split(',') : undefined
    const dryRun = args['dry-run'] === true

    await runSync({ scope, ctx, flag, dryRun, yes: args.yes === true })
  },
})
