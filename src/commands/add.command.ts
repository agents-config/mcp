/**
 * `add` command (§11) — direct-source variant (T9).
 *
 * Resolve direct flags (--command/--arg/--http/--env/--header/--cwd/--name),
 * prompt/accept `--name`, write canonical, then `runSync` unless `--no-sync`.
 * Idempotent: same name + same definition → exit 0, no write.
 * Conflict: same name + different definition → exit 1 with diff; `--force`
 * overwrites.
 * `--env KEY=VALUE` writes to `.env` and uses `${KEY}` in canonical.
 * `--env KEY` references only; warns when unresolved.
 */

import { defineCommand } from 'citty'
import { join } from 'node:path'
import {
  createUiAndCtx,
  configPath,
  persistCanonicalConfig,
  persistSyncState,
  isDryRun,
  parseAgentsFlag,
  statePath,
  formatDryRunActions,
} from '$/src/commands/util'
import { runSync } from '$/src/commands/sync'
import { collectInteractiveAddOptions } from '$/src/commands/add-interactive'
import { resolveDirect } from '$/src/sources/direct'
import { resolveSource } from '$/src/sources/index'
import type { Candidate } from '$/src/sources/types'
import { loadValidatedConfig, ConfigValidationError } from '$/src/core/store'
import { loadState, writeState } from '$/src/core/state'
import { DEFAULT_SCHEMA_URL, AGENT_ORDER } from '$/src/config'
import {
  appendToDotenv,
  applySecretExtraction,
  planSecretExtraction,
  syncEnvExample,
} from '$/src/core/env'
import type { CanonicalServer } from '$/src/core/schema'
import type { ConfigScope, RuntimeContext } from '$/src/core/context'
import { isUnmanagedPluginCollision } from '$/src/core/plugins'

function diffValues(a: unknown, b: unknown): string {
  const aStr = JSON.stringify(a, null, 2)
  const bStr = JSON.stringify(b, null, 2)
  if (aStr === bStr) {
    return ''
  }
  return `- ${aStr}\n+ ${bStr}`
}

/**
 * Coleta ocorrências de uma flag repetível (`--arg`, `--env`, `--header`)
 * diretamente de `rawArgs`.
 *
 * O `citty` (`parseArgs`) não acumula `type: 'string'` repetidas em um
 * array — sobrescreve com a última ocorrência (bloqueador [R53]). Esta
 * leitura direta preserva todas as ocorrências.
 *
 * Suporta:
 * - `--flag=valor` (o valor é tudo depois do primeiro `=`)
 * - `--flag valor` (o próximo token é o valor, mesmo começando com `-`,
 *   ex. `--arg -y`; um próximo token que começa com `--` não é consumido)
 */
function collectRepeatableFlags(rawArgs: string[], flag: string): string[] {
  const values: string[] = []
  const longFlag = `--${flag}`
  for (let i = 0; i < rawArgs.length; i++) {
    const token = rawArgs[i]
    if (token === undefined) continue
    if (token.startsWith(longFlag + '=')) {
      values.push(token.slice(longFlag.length + 1))
    } else if (token === longFlag) {
      const next = rawArgs[i + 1]
      if (next !== undefined && !next.startsWith('--')) {
        values.push(next)
        i++ // consome o valor do próximo token
      }
    }
  }
  return values
}

export const addCommand = defineCommand({
  meta: {
    name: 'add',
    description: 'Install an MCP server from direct flags',
  },
  args: {
    command: {
      type: 'string',
      description: 'Executable command for command-based MCP server',
    },
    arg: { type: 'string', description: 'Argument token (repeatable)' },
    http: { type: 'string' },
    sse: { type: 'string' },
    env: { type: 'string', description: 'KEY=VALUE (repeatable)' },
    header: { type: 'string', description: '"Name: Value" (repeatable)' },
    cwd: { type: 'string' },
    name: { type: 'string', description: 'Server name override' },
    'no-sync': {
      type: 'boolean',
      description: 'Skip agent sync; Agent Plugins files are still generated',
    },
    force: { type: 'boolean', alias: 'f' },
    'extract-secrets': {
      type: 'boolean',
      description: 'Write detected secrets to .env',
    },
  },
  run: async ({ args, rawArgs }) => {
    const { ctx, ui } = createUiAndCtx({ yes: args.yes === true })
    const scope = (args.global ? 'global' : 'project') as ConfigScope
    const path = configPath(scope, ctx)
    const dryRun = isDryRun(args)
    // `citty`/`mri` converte `--no-sync` em `args.sync === false`; a checagem
    // direta em `rawArgs` cobre subcomandos que não declaram `sync`.
    const noSync =
      args['no-sync'] === true ||
      (args as Record<string, unknown>).sync === false ||
      rawArgs.includes('--no-sync')
    const agentsFlag = parseAgentsFlag(args as Record<string, unknown>, rawArgs)
    const force = args.force === true
    const extractSecrets = args['extract-secrets'] === true

    // NOTE (R53): `citty`'s `parseArgs` does not accumulate repeated
    // `type: 'string'` flags into an array — it overwrites with the last
    // occurrence. Collect `--arg`, `--env` and `--header` directly from
    // `rawArgs` so every occurrence is preserved.
    const options = {
      command: args.command as string | undefined,
      arg: collectRepeatableFlags(rawArgs, 'arg'),
      http: args.http as string | undefined,
      sse: args.sse as string | undefined,
      env: collectRepeatableFlags(rawArgs, 'env'),
      header: collectRepeatableFlags(rawArgs, 'header'),
      cwd: args.cwd as string | undefined,
      name: args.name as string | undefined,
    }

    // Dispatch between flag-driven mode and the interactive wizard. A direct
    // source is any of --command/--http/--sse/--arg; without one, a positional
    // `<name>` alone is not enough to build a server.
    const positionalArgs = (args._ as string[] | undefined) ?? []
    const hasDirectSource =
      Boolean(options.command || options.http || options.sse) ||
      options.arg.length > 0
    const isInteractive =
      ctx.isTTY && ctx.env.CI !== 'true' && args.yes !== true

    /**
     * Determine if a positional argument looks like an external source reference
     * (GitHub URL, owner/repo, @scope/pkg, or npm package) rather than a
     * simple server name for the interactive wizard.
     */
    function isExternalSourceRef(arg: string): boolean {
      // Remote URL
      if (/^https?:\/\//.test(arg)) return true
      // GitHub owner/repo[#ref] or owner/repo format
      if (/^[\w-]+\/[\w.-]+(#.*)?$/.test(arg)) return true
      // npm scoped package @scope/pkg or bare package name with version @pkg@version
      if (/^@[\w-]+\/[\w.-]+(@.*)?$/.test(arg)) return true
      // Bare npm package (contains @ for version or is a known pattern)
      // We treat any arg with @ not at start as potentially a versioned package
      if (/^[\w-]+@[\w.-]+$/.test(arg)) return true
      return false
    }

    let validated: ReturnType<typeof loadValidatedConfig> | null = null
    try {
      validated = loadValidatedConfig(scope, ctx)
    } catch (err) {
      if (err instanceof ConfigValidationError) {
        ui.error(
          `Invalid config at ${err.path}: ${err.issues
            .map((i) => `${i.path || 'root'} — ${i.message}`)
            .join(
              '; ',
            )}. Run \`agents-mcp init --force\` or ensure \`mcpServers\` is defined in .agents/mcp.json.`,
        )
        process.exit(1)
        return
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

    // Carrega o estado de sincronizacao antecipadamente para verificacao de
    // colisao de plugin (gera ou nao o fluxo interativo).
    const stateResult = loadState(scope, ctx)
    const state = stateResult.state

    let resolved: ReturnType<typeof resolveDirect>
    let name: string
    let interactiveAdd = false

    // Determine source resolution mode:
    // 1. Direct flags (--command/--http/--sse/--arg) -> resolveDirect
    // 2. Positional <source> arg that looks like external ref -> resolveSource
    // 3. No source at all -> interactive wizard (TTY) or usage error
    const positionalSource = positionalArgs[0]?.trim()
    const positionalIsSource =
      positionalSource && isExternalSourceRef(positionalSource)

    if (hasDirectSource) {
      // Explicit flags take precedence
      resolved = resolveDirect(options)
      name = options.name ?? positionalArgs[0] ?? resolved.suggestedName
    } else if (positionalIsSource) {
      // Positional <source> argument (GitHub, npm, Registry, URL)
      resolved = await resolveSource(
        {
          source: positionalSource,
          name: options.name,
          env: options.env,
          header: options.header,
          cwd: options.cwd,
        },
        {
          fetch: globalThis.fetch,
          yes: args.yes === true,
          selectCandidate:
            isInteractive && !args.yes
              ? async (candidates: Candidate[]) => {
                  if (candidates.length === 0) return null
                  // Exact name match wins automatically
                  const exact = candidates.find(
                    (c: Candidate) =>
                      c.name.toLowerCase() === positionalSource.toLowerCase(),
                  )
                  if (exact) return exact
                  // Multiple candidates in TTY -> prompt user
                  const choice = await ui.select({
                    message: `Multiple candidates found for "${positionalSource}". Choose one:`,
                    options: candidates.map((c: Candidate) => ({
                      label: c.name,
                      value: c,
                      hint: c.ref,
                    })),
                  })
                  return choice ?? null
                }
              : undefined,
        },
      )
      name = options.name ?? resolved.suggestedName
    } else {
      // No source specified
      if (!isInteractive) {
        ui.error(
          'Usage: agents-mcp add <name> --command <cmd> [--arg <token>...] | --http <url>',
        )
        process.exit(2)
        return
      }
      const result = await collectInteractiveAddOptions({
        ui,
        initialName: options.name ?? positionalArgs[0],
        checkConflict: (candidate) => {
          if (candidate in canonical && !force) {
            return 'canonical'
          }
          // Unmanaged plugin collision: re-prompt for a different name.
          if (
            isUnmanagedPluginCollision(
              scope,
              ctx,
              candidate,
              state.managedPlugins,
            )
          ) {
            return 'unmanaged'
          }
          return false
        },
      })
      interactiveAdd = true
      name = result.name
      resolved = resolveDirect(result.options)
    }

    /**
     * Fase de plugins (+ agentes, quando aplicável) — única fonte via `runSync`.
     * `skipAgentSync: noSync` (`--no-sync` gera só plugin, sem mexer em agentes);
     * `allowEmptyTargets: true` permite `add` sem targets resolvidos.
     */
    const runPluginAndAgentSync = (skipAgentSync: boolean) =>
      runSync({
        scope,
        ctx,
        flag: agentsFlag,
        dryRun,
        yes: args.yes === true,
        quietErrors: true,
        skipAgentSync,
        allowEmptyTargets: true,
        onlyPluginNames: [name],
      })

    /** Reports partial plugin failure and exits with code 1. */
    const reportSyncFailures = (errors: string[]): void => {
      ui.error(
        `Server \`${name}\` added to .agents/mcp.json, but failed to generate ${errors.length} plugin(s).`,
      )
      for (const e of errors) {
        ui.error(e)
      }
      ui.note(
        '.agents/mcp.json was kept. Re-run `agents-mcp sync` after resolving the issues above.',
      )
      process.exit(1)
    }

    if (name in canonical && !force) {
      const same =
        JSON.stringify(canonical[name]) === JSON.stringify(resolved.definition)
      if (same) {
        // Definicao identica: nao grava nada de agente, mas garante os
        // arquivos base do plugin (e o registro em managedPlugins) mesmo
        // sem targets e sem sincronizacao de agentes.
        if (!dryRun) {
          const result = await runPluginAndAgentSync(true)
          if (result.errors.length > 0) {
            reportSyncFailures(result.errors)
            return
          }
        }
        ui.note(`Server \`${name}\` already present with identical definition.`)
        return
      }
      ui.error(
        `Conflicting definition for \`${name}\`:\n${diffValues(
          canonical[name],
          resolved.definition,
        )}Use --force to overwrite.`,
      )
      process.exit(1)
    }

    // Non-interactive: fail on unmanaged plugin collision (no auto-rename,
    // no overwrite).
    if (
      !interactiveAdd &&
      isUnmanagedPluginCollision(scope, ctx, name, state.managedPlugins)
    ) {
      ui.error(
        `The name \`${name}\` is already in use by an unmanaged plugin at .agents/plugins/${name}/. Pass a different --name.`,
      )
      process.exit(1)
    }

    // Secret extraction plan.
    const { writes, replacements, warnings } = planSecretExtraction(
      name,
      resolved.definition,
      { policy: extractSecrets ? 'extract' : 'warn' },
    )
    for (const w of warnings) {
      ui.warn(w)
    }

    // Apply secret extraction (pure, never mutates input). Only replaces when
    // extracting; warn-only leaves the definition unchanged.
    const definition = extractSecrets
      ? applySecretExtraction(resolved.definition, {
          writes,
          replacements,
          warnings,
        })
      : { ...resolved.definition }

    if (!dryRun && extractSecrets && writes.length > 0) {
      const dotenvPath =
        scope === 'project'
          ? join(ctx.cwd, '.env')
          : join(ctx.homeDir, '.agents', '.env')
      const examplePath =
        scope === 'project'
          ? join(ctx.cwd, '.env.example')
          : join(ctx.homeDir, '.agents', '.env.example')
      appendToDotenv(dotenvPath, writes)
      syncEnvExample(
        examplePath,
        writes.map((w) => w.key),
      )
    }

    canonical[name] = definition

    // Planned file operations for the --dry-run preview.
    const planned: { type: 'write' | 'remove'; path: string }[] = []

    if (!dryRun) {
      persistCanonicalConfig(scope, ctx, {
        $schema: schemaUrl,
        mcpServers: canonical,
      })
    } else {
      planned.push({ type: 'write', path })
    }

    if (!dryRun) {
      const nextState = {
        ...state,
        scope,
        targets: state.targets,
        agents: { ...state.agents },
      }
      writeState(scope, ctx, nextState)
    } else {
      planned.push({ type: 'write', path: statePath(scope, ctx) })
    }

    const syncResult = await runPluginAndAgentSync(noSync)
    if (syncResult.errors.length > 0) {
      reportSyncFailures(syncResult.errors)
      return
    }

    // --dry-run preview: show planned file operations, zero disk writes.
    if (dryRun && planned.length > 0) {
      ui.note(formatDryRunActions(planned))
    }

    if (!dryRun) {
      ui.note(`Added server \`${name}\``)
    }

    if (interactiveAdd && !dryRun) {
      ui.outro(`Server \`${name}\` added.`)
    }
  },
})
