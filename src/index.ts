/**
 * CLI entrypoint (§11).
 *
 * Creates the `RuntimeContext` once, selects the `PromptUi` (Clack on TTY,
 * Auto on `--yes`/`CI`), and runs the `citty` app with global flags and the
 * subcommands registered below. T8/T9 add subcommands (init, import, sync,
 * remove, list, add, doctor) additively to the `subCommands` record.
 */

import { defineCommand, runCommand, showUsage } from 'citty'
import { realpathSync } from 'node:fs'
import pkg from '$/package.json' with { type: 'json' }
import { createRuntimeContext, type RuntimeContext } from '$/src/core/context'
import { createClackUi, type PromptUi } from '$/src/ui/prompts'
import { createAutoUi } from '$/src/ui/auto'
import { syncCommand } from '$/src/commands/sync.command'
import { initCommand } from '$/src/commands/init.command'
import { removeCommand } from '$/src/commands/remove.command'
import { listCommand } from '$/src/commands/list.command'
import { importCommand } from '$/src/commands/import.command'
import { addCommand } from '$/src/commands/add.command'
import { doctorCommand } from '$/src/commands/doctor.command'

/** Global flags available on every command (§11). */
const globalFlags = {
  global: {
    type: 'boolean',
    alias: 'g',
    description:
      'Operate on the global agent configuration (~/.agents/mcp.json)',
  },
  yes: {
    type: 'boolean',
    alias: 'y',
    description: 'Run non-interactively, accepting recommended defaults',
  },
  agents: {
    type: 'string',
    description: 'Comma-separated target agents to sync (e.g. cursor,vscode)',
  },
  'dry-run': {
    type: 'boolean',
    description: 'Simulate operations without writing to disk or state',
  },
} as const

const app = defineCommand({
  meta: {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
  },
  args: globalFlags,
  subCommands: {
    sync: syncCommand,
    init: initCommand,
    remove: removeCommand,
    list: listCommand,
    import: importCommand,
    add: addCommand,
    doctor: doctorCommand,
  },
})

const SUBCOMMANDS = [
  'sync',
  'init',
  'remove',
  'list',
  'import',
  'add',
  'doctor',
]

/**
 * Normaliza flags globais com valor separado por espaço para a forma
 * `--flag=<valor>`.
 *
 * O `citty` não repassa `args` globais para os subcomandos: sem isso,
 * `--agents antigravity` vira `agents: true` + posicional `antigravity`,
 * quebrando `sync`/`init`/`add`. A forma com `=` é parseada como string por
 * qualquer subcomando (mesmo os que não declaram `agents`).
 *
 * Tokens após `--` são preservados literalmente.
 */
export function normalizeGlobalArgs(rawArgs: readonly string[]): string[] {
  const normalized: string[] = []
  let literal = false

  for (let i = 0; i < rawArgs.length; i++) {
    const token = rawArgs[i]
    if (token === undefined) continue

    if (token === '--') {
      literal = true
      normalized.push(token)
      continue
    }

    if (!literal && token === '--agents') {
      const next = rawArgs[i + 1]
      if (next !== undefined && !next.startsWith('-')) {
        normalized.push(`--agents=${next}`)
        i++
        continue
      }
    }

    normalized.push(token)
  }

  return normalized
}

/**
 * CLI entry point. Runs the citty app with `process.argv`.
 * Only executes when this module is run directly (not when imported by tests).
 */
export async function main(): Promise<void> {
  const rawArgs = normalizeGlobalArgs(process.argv.slice(2))

  // Handle --version / -v at root level → exit 0.
  if (rawArgs.includes('--version') || rawArgs.includes('-v')) {
    console.log(pkg.version)
    return
  }

  // Handle --help / -h at root level (no subcommand specified) → exit 0.
  const hasSubcommand = rawArgs.some((a) => SUBCOMMANDS.includes(a))
  if (
    !hasSubcommand &&
    (rawArgs.includes('--help') || rawArgs.includes('-h'))
  ) {
    await showUsage(app)
    return
  }

  // Handle --help / -h with a subcommand → show subcommand help → exit 0.
  const subcmd = rawArgs.find((a) => SUBCOMMANDS.includes(a))
  if (subcmd && (rawArgs.includes('--help') || rawArgs.includes('-h'))) {
    const subCommandDef = (app.subCommands as Record<string, unknown>)[subcmd]
    if (subCommandDef) {
      await showUsage(subCommandDef, app)
      return
    }
  }

  try {
    await runCommand(app, { rawArgs })
  } catch (err) {
    // Never swallow errors silently: surface them on stderr before exiting.
    const message = err instanceof Error ? err.message : String(err)
    console.error(message)
    // citty throws CLIError (E_UNKNOWN_COMMAND / E_INVALID_ARG / E_NO_COMMAND)
    // for usage problems → exit 2. Runtime errors from commands → exit 1.
    if ((err as Error)?.name === 'CLIError') {
      process.exit(2)
    } else {
      process.exit(1)
    }
  }
}

/**
 * True when this file is executed directly (e.g. `node dist/index.js`), not
 * when imported as a module by tests. Uses argv[1] basename instead of
 * import.meta.url comparison, which breaks with symlinks (e.g. `npx`).
 */
/**
 * True when this file is executed directly (e.g. `node dist/index.js`), not
 * when imported as a module by tests. Resolves symlinks via `realpathSync`
 * so invoking `agents-mcp` through an installed bin symlink executes
 * `main()` instead of exiting silently. Guarded against `VITEST` and
 * invalid/unreadable paths.
 */
if (process.argv[1] && !process.env.VITEST) {
  try {
    const resolved = realpathSync(process.argv[1])
    if (resolved.endsWith('index.js')) {
      void main()
    }
  } catch {
    // Unreadable/missing argv[1] (e.g. under some test runners): fall back
    // to the literal basename check.
    if (process.argv[1].endsWith('index.js')) {
      void main()
    }
  }
}

/**
 * Build the `RuntimeContext` and `PromptUi` for the current process. Called
 * once by each command (`src/commands/*.ts`). The UI choice (TTY vs
 * `--yes`/`CI`) is consistent across all commands.
 */
export function createUi({ yes = false }: { yes?: boolean } = {}): {
  ctx: RuntimeContext
  ui: PromptUi
} {
  const ctx = createRuntimeContext()
  const isAuto = !ctx.isTTY || ctx.env.CI === 'true' || yes
  const ui: PromptUi = isAuto
    ? createAutoUi({ defaults: {}, log: undefined })
    : createClackUi()
  return { ctx, ui }
}
