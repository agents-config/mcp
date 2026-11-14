/**
 * `add` command (§11) — direct-source variant (T9).
 *
 * Resolve direct flags (--stdio/--arg/--http/--env/--header/--cwd/--name),
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
} from '$/src/commands/util'
import { runSync } from '$/src/commands/sync'
import { resolveDirect } from '$/src/sources/direct'
import { loadValidatedConfig } from '$/src/core/store'
import { loadState, writeState } from '$/src/core/state'
import { DEFAULT_SCHEMA_URL } from '$/src/config'
import {
  appendToDotenv,
  planSecretExtraction,
  syncEnvExample,
} from '$/src/core/env'
import type { CanonicalServer } from '$/src/core/schema'
import type { ConfigScope, RuntimeContext } from '$/src/core/context'

function diffValues(a: unknown, b: unknown): string {
  const aStr = JSON.stringify(a, null, 2)
  const bStr = JSON.stringify(b, null, 2)
  if (aStr === bStr) {
    return ''
  }
  return `- ${aStr}\n+ ${bStr}`
}

export const addCommand = defineCommand({
  meta: {
    name: 'add',
    description: 'Install an MCP server from direct flags',
  },
  args: {
    stdio: { type: 'string' },
    arg: { type: 'string', description: 'Argument token (repeatable)' },
    http: { type: 'string' },
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
  run: async ({ args }) => {
    const { ctx, ui } = createUiAndCtx({ yes: args.yes === true })
    const scope = (args.global ? 'global' : 'project') as ConfigScope
    const path = configPath(scope, ctx)
    const dryRun = isDryRun(args)
    const noSync = args['no-sync'] === true
    const force = args.force === true
    const extractSecrets = args['extract-secrets'] === true

    const options = {
      stdio: args.stdio as string | undefined,
      arg: (Array.isArray(args.arg)
        ? args.arg
        : args.arg
          ? [String(args.arg)]
          : []) as string[],
      http: args.http as string | undefined,
      env: (Array.isArray(args.env)
        ? args.env
        : args.env
          ? [String(args.env)]
          : []) as string[],
      header: (Array.isArray(args.header)
        ? args.header
        : args.header
          ? [String(args.header)]
          : []) as string[],
      cwd: args.cwd as string | undefined,
      name: args.name as string | undefined,
    }

    const resolved = resolveDirect(options)
    const name = options.name ?? resolved.suggestedName

    const validated = loadValidatedConfig(scope, ctx)
    let canonical: Record<string, CanonicalServer> = {}
    let schemaUrl = DEFAULT_SCHEMA_URL
    if (validated) {
      schemaUrl = validated.config.$schema
      canonical = {
        ...(validated.config.servers as Record<string, CanonicalServer>),
      }
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
      if (definition.transport === 'stdio') {
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
        servers: canonical,
      })

      const stateResult = loadState(scope, ctx)
      const state = stateResult.state
      const nextState = {
        ...state,
        scope,
        targets: state.targets,
        agents: { ...state.agents },
      }
      writeState(scope, ctx, nextState)
    }

    ui.note(`Added server \`${name}\``)

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
