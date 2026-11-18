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
} from '$/src/commands/util'
import { runSync } from '$/src/commands/sync'
import { collectInteractiveAddOptions } from '$/src/commands/add-interactive'
import { resolveDirect } from '$/src/sources/direct'
import { loadValidatedConfig, ConfigValidationError } from '$/src/core/store'
import { loadState, writeState } from '$/src/core/state'
import { DEFAULT_SCHEMA_URL, AGENT_ORDER } from '$/src/config'
import {
  appendToDotenv,
  planSecretExtraction,
  syncEnvExample,
} from '$/src/core/env'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer } from '$/src/core/schema'
import type { ConfigScope, RuntimeContext } from '$/src/core/context'
import { syncPluginFiles, isUnmanagedPluginCollision } from '$/src/core/plugins'

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
    'no-sync': { type: 'boolean' },
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

    let validated: ReturnType<typeof loadValidatedConfig> | null = null
    try {
      validated = loadValidatedConfig(scope, ctx)
    } catch (err) {
      if (err instanceof ConfigValidationError) {
        ui.error(
          `Configuração inválida em ${err.path}: ${err.issues
            .map((i) => `${i.path || 'raiz'} — ${i.message}`)
            .join(
              '; ',
            )}. Execute \`agents-mcp init --force\` ou garanta que \`mcpServers\` esteja definido em .agents/mcp.json.`,
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

    if (!hasDirectSource) {
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
            ui.error(
              `Server \`${candidate}\` already exists. Use --force to overwrite.`,
            )
            process.exit(1)
            return
          }
          // Colisao com plugin nao gerenciado: solicita outro nome (re-prompt).
          if (
            isUnmanagedPluginCollision(
              scope,
              ctx,
              candidate,
              state.managedPlugins,
            )
          ) {
            return true
          }
          return undefined
        },
      })
      interactiveAdd = true
      name = result.name
      resolved = resolveDirect(result.options)
    } else {
      resolved = resolveDirect(options)
      name = options.name ?? positionalArgs[0] ?? resolved.suggestedName
    }

    if (name in canonical && !force) {
      const same =
        JSON.stringify(canonical[name]) === JSON.stringify(resolved.definition)
      if (same) {
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

    // Nao-interativo: falha em colisao com plugin nao gerenciado (sem
    // auto-renomear nem sobrescrever).
    if (
      !interactiveAdd &&
      isUnmanagedPluginCollision(scope, ctx, name, state.managedPlugins)
    ) {
      ui.error(
        `O nome \`${name}\` ja esta em uso por um plugin nao gerenciado em .agents/plugins/${name}/. Passe um --name diferente.`,
      )
      process.exit(1)
    }

    // Secret extraction plan.
    const { writes, warnings } = planSecretExtraction(resolved.definition, {
      policy: extractSecrets ? 'extract' : 'warn',
    })
    for (const w of warnings) {
      ui.warn(w)
    }

    // Replace literal secret values with ${KEY} placeholders in canonical.
    const definition = { ...resolved.definition }
    for (const w of writes) {
      if (isStdioServer(definition)) {
        if (definition.env) {
          for (const [key, value] of Object.entries(definition.env)) {
            if (value === w.value) {
              definition.env[key] = `\${${w.key}}`
            }
          }
        }
      } else {
        if (definition.headers) {
          for (const [key, value] of Object.entries(definition.headers)) {
            if (value === w.value) {
              definition.headers[key] = `\${${w.key}}`
            }
          }
        }
        if (definition.url === w.value) {
          definition.url = `\${${w.key}}`
        }
      }
    }

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

    if (!dryRun) {
      persistCanonicalConfig(scope, ctx, {
        $schema: schemaUrl,
        mcpServers: canonical,
      })

      const nextState = {
        ...state,
        scope,
        targets: state.targets,
        agents: { ...state.agents },
      }
      writeState(scope, ctx, nextState)
    }

    // Gera arquivos de plugin quando --no-sync (runSync nao e chamado).
    let pluginErrors: string[] = []
    if (!dryRun && noSync) {
      const includeAntigravity = Boolean(
        agentsFlag?.includes('antigravity') ||
        state.targets.includes('antigravity'),
      )
      const result = syncPluginFiles({
        name,
        server: definition,
        scope,
        ctx,
        includeAntigravity,
        dryRun: false,
      })
      if (result.ok) {
        const stateAfter = loadState(scope, ctx)
        const updatedState = {
          ...stateAfter.state,
          scope,
          targets: stateAfter.state.targets,
          agents: { ...stateAfter.state.agents },
          managedPlugins: [
            ...new Set([...stateAfter.state.managedPlugins, name]),
          ],
        }
        writeState(scope, ctx, updatedState)
      } else {
        pluginErrors = result.errors
      }
    }

    // runSync tambem gera plugins (incluindo mcp_config.json quando
    // antigravity esta nos targets) e reporta suas proprias falhas.
    let syncErrors: string[] = []
    if (!noSync && !dryRun) {
      const syncResult = await runSync({
        scope,
        ctx,
        flag: agentsFlag,
        dryRun: false,
        yes: args.yes === true,
        quietErrors: true,
      })
      syncErrors = syncResult.errors
    }

    const allErrors = [...pluginErrors, ...syncErrors]

    if (allErrors.length > 0) {
      ui.error(
        `Servidor \`${name}\` adicionado ao .agents/mcp.json, mas falha ao gerar ${allErrors.length} plugin(es).`,
      )
      for (const e of allErrors) {
        ui.error(e)
      }
      ui.note(
        '.agents/mcp.json foi mantido. Reexecute `agents-mcp sync` apos resolver os problemas acima.',
      )
      process.exit(1)
    } else {
      ui.note(`Added server \`${name}\``)
    }

    if (interactiveAdd && !dryRun) {
      ui.outro(`Server \`${name}\` added.`)
    }
  },
})
