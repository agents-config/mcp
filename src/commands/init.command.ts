/**
 * `init` command (§11).
 *
 * Scaffold `<scope>/.agents/mcp.json` (`$schema`, `mcpServers: {}`), select agents
 * (multi-select; `--agents` bypasses), persist `targets` in state. Existing
 * file → exit `1` unless `--force` (writes a `.bak.<timestamp>` first). Never
 * touches `.gitignore`. Non-interactive targets come from `--agents` or
 * detection; none → exit `1` with a hint.
 */

import { defineCommand } from 'citty'
import { existsSync } from 'node:fs'
import {
  createUiAndCtx,
  configPath,
  persistSyncState,
  persistCanonicalConfig,
  isDryRun,
} from '$/src/commands/util'
import { resolveTargetsAsync, adapters } from '$/src/adapters/index'
import { backupFile } from '$/src/core/fs-atomic'
import { loadState } from '$/src/core/state'
import { DEFAULT_SCHEMA_URL } from '$/src/config'
import type { AgentId } from '$/src/adapters/types'
import type { ConfigScope, RuntimeContext } from '$/src/core/context'
export const initCommand = defineCommand({
  meta: {
    name: 'init',
    description: 'Scaffold .agents/mcp.json and select target agents',
  },
  args: {
    force: {
      type: 'boolean',
      alias: 'f',
      description:
        'Overwrite an existing canonical config (writes a .bak first)',
    },
  },
  run: async ({ args }) => {
    const { ctx, ui } = createUiAndCtx({ yes: args.yes === true })
    const scope = (args.global ? 'global' : 'project') as ConfigScope
    const path = configPath(scope, ctx)
    const dryRun = isDryRun(args)
    const force = args.force === true
    const flag = args.agents ? String(args.agents).split(',') : undefined

    if (existsSync(path) && !force) {
      ui.error(
        `Canonical config already exists at ${path}. Use --force to overwrite.`,
      )
      process.exit(1)
    }

    if (existsSync(path) && force && !dryRun) {
      backupFile(path)
    }

    const stateResult = loadState(scope, ctx)
    const state = stateResult.state

    let targets: AgentId[]
    if (flag) {
      targets = await resolveTargetsAsync({ flag, state, ctx })
    } else if (args.yes === true || !ctx.isTTY || ctx.env.CI === 'true') {
      targets = await resolveTargetsAsync({ flag: undefined, state, ctx })
    } else {
      // Interactive: multi-select agents.
      const options = adapters.map((a) => ({
        label: a.displayName,
        value: a.id,
      }))
      const selected = await ui.multiselect<AgentId>({
        message: 'Select target agents',
        options,
        initialValues: [],
      })
      targets = selected
    }

    if (targets.length === 0) {
      ui.error(
        'No resolvable target agents. Pass --agents <list> (e.g. --agents cursor,vscode).',
      )
      process.exit(1)
    }

    if (!dryRun) {
      persistCanonicalConfig(scope, ctx, {
        $schema: DEFAULT_SCHEMA_URL,
        mcpServers: {},
      })
      const nextState = {
        ...state,
        scope,
        targets,
        agents: { ...state.agents },
      }
      persistSyncState(scope, ctx, nextState)
    }

    ui.note(`Initialized ${scope} canonical config at ${path}`)
    ui.note(`Targets: ${targets.join(', ')}`)
  },
})
