/**
 * `sync` command definition for citty (§11).
 *
 * Reuses `runSync` from `./sync` and wires citty args into `SyncOptions`.
 */

import { defineCommand } from 'citty'
import { runSync, type SyncOptions } from './sync'
import { createUiAndCtx, parseAgentsFlag } from '$/src/commands/util'

export const syncCommand = defineCommand({
  meta: {
    name: 'sync',
    description:
      'Compile .agents/mcp.json into all targeted agent config files',
  },
  args: {},
  run: async ({ args, rawArgs }) => {
    const { ctx, ui } = createUiAndCtx({ yes: args.yes === true })
    const scope = args.global ? 'global' : 'project'
    const flag = parseAgentsFlag(args, rawArgs)
    const dryRun = args['dry-run'] === true

    // Fail fast on positional arguments instead of silently falling back to
    // stale state.targets (e.g. `npm run cli sync --agents cursor` without
    // `--` makes npm consume the flag and pass a bare positional value).
    if (Array.isArray(args._) && args._.length > 0) {
      ui.error(
        `Unexpected positional argument(s) for \`sync\`: ${args._.join(' ')}. To select agents, pass \`--agents <list>\` (when using \`npm run\`, add \`--\` before flags).`,
      )
      process.exit(2)
      return
    }

    const summary = await runSync({
      scope,
      ctx,
      flag,
      dryRun,
      yes: args.yes === true,
    })

    if (summary.errors.length > 0 && !dryRun) {
      process.exit(1)
    }
  },
})
