/**
 * `import` command (§11).
 *
 * Scan every adapter for the active scope, extract, normalize, deduplicate /
 * conflict-resolve, apply the secret policy, merge into canonical (existing
 * entries win unless `--force`), seed state names for all scanned agents, then
 * `sync` unless `--no-sync`. Native files are never deleted.
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
import { resolveTargetsAsync, adapters } from '$/src/adapters/index'
import { DEFAULT_SCHEMA_URL } from '$/src/config'
import { loadValidatedConfig } from '$/src/core/store'
import { loadState, type SyncState } from '$/src/core/state'
import {
  planSecretExtraction,
  appendToDotenv,
  syncEnvExample,
} from '$/src/core/env'
import { readTextFile } from '$/src/core/fs-atomic'
import type { AgentId } from '$/src/adapters/types'
import type { CanonicalServer } from '$/src/core/schema'
import type { ConfigScope, RuntimeContext } from '$/src/core/context'

export const importCommand = defineCommand({
  meta: {
    name: 'import',
    description: 'Consolidate existing agent MCP configs into .agents/mcp.json',
  },
  args: {
    'no-sync': {
      type: 'boolean',
      description: 'Import into canonical without running sync afterwards',
    },
    force: {
      type: 'boolean',
      alias: 'f',
      description: 'Overwrite conflicting canonical entries',
    },
    'extract-secrets': {
      type: 'boolean',
      description: 'Write detected secrets to .env (warn-only by default)',
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

    const validated = loadValidatedConfig(scope, ctx)
    let canonical: Record<string, CanonicalServer> = {}
    let schemaUrl = DEFAULT_SCHEMA_URL
    if (validated) {
      schemaUrl = validated.config.$schema
      canonical = {
        ...(validated.config.servers as Record<string, CanonicalServer>),
      }
    }

    const stateResult = loadState(scope, ctx)
    const state = stateResult.state

    const allWarnings: string[] = []
    const extracted: Record<string, CanonicalServer> = {}
    // Track which servers were extracted from each agent (for seeding state).
    const extractedByAgent: Record<AgentId, string[]> = {} as Record<
      AgentId,
      string[]
    >
    const scannedAgents: AgentId[] = []

    for (const adapter of adapters) {
      const nativePath = adapter.getConfigPath(scope, ctx)
      if (nativePath === null) continue
      const exists = await adapter.detect(scope, ctx)
      if (!exists) continue
      scannedAgents.push(adapter.id as AgentId)

      const existing = readTextFile(nativePath)
      if (existing === null) continue

      const { servers, warnings } = adapter.extractServers(existing, scope)
      allWarnings.push(...warnings.map((w) => w.message))
      const names: string[] = []
      for (const [name, server] of Object.entries(servers)) {
        names.push(name)
        if (!(name in extracted)) {
          extracted[name] = server
        }
      }
      extractedByAgent[adapter.id as AgentId] = names
    }

    let merged = false
    for (const [name, server] of Object.entries(extracted)) {
      if (name in canonical) {
        if (force) {
          canonical[name] = server
          merged = true
        }
        // existing wins: skip
      } else {
        canonical[name] = server
        merged = true
      }
    }

    // Secret policy: plan extraction and optionally write to .env + .env.example.
    const allWrites: Array<{ key: string; value: string }> = []
    const allKeys: string[] = []
    for (const server of Object.values(canonical)) {
      const { writes, warnings } = planSecretExtraction(server, {
        policy: extractSecrets ? 'extract' : 'warn',
      })
      allWarnings.push(...warnings)
      for (const w of writes) {
        allWrites.push(w)
        allKeys.push(w.key)
      }
    }

    // Replace literal secret values in canonical with ${KEY} placeholders so
    // secrets never reach versioned files (§13).
    for (const server of Object.values(canonical)) {
      if (server.transport === 'stdio') {
        if (server.env) {
          for (const [key, value] of Object.entries(server.env)) {
            const write = allWrites.find((w) => w.value === value)
            if (write) {
              server.env[key] = `\${${write.key}}`
            }
          }
        }
      } else {
        if (server.headers) {
          for (const [key, value] of Object.entries(server.headers)) {
            const write = allWrites.find((w) => w.value === value)
            if (write) {
              server.headers[key] = `\${${write.key}}`
            }
          }
        }
        if (server.url) {
          const write = allWrites.find((w) => w.value === server.url)
          if (write) {
            server.url = `\${${write.key}}`
          }
        }
      }
    }

    if (!dryRun && extractSecrets && allWrites.length > 0) {
      // Project: <cwd>/.env ; Global: <homeDir>/.agents/.env
      const dotenvPath =
        scope === 'project'
          ? join(ctx.cwd, '.env')
          : join(ctx.homeDir, '.agents', '.env')
      const examplePath =
        scope === 'project'
          ? join(ctx.cwd, '.env.example')
          : join(ctx.homeDir, '.agents', '.env.example')
      appendToDotenv(dotenvPath, allWrites)
      syncEnvExample(examplePath, allKeys)
    }

    if (!dryRun) {
      persistCanonicalConfig(scope, ctx, {
        $schema: schemaUrl,
        servers: canonical,
      })

      const nextState: SyncState = {
        ...state,
        scope: (args.global ? 'global' : 'project') as ConfigScope,
        targets: state.targets,
        agents: { ...state.agents },
      }
      for (const agentId of scannedAgents) {
        nextState.agents[agentId] = {
          path,
          names: extractedByAgent[agentId] ?? [],
          updatedAt: new Date().toISOString(),
        }
      }
      persistSyncState(scope, ctx, nextState)
    }

    if (!noSync && !dryRun) {
      await runSync({
        scope,
        ctx,
        flag: undefined,
        dryRun: false,
        yes: args.yes === true,
      })
    }

    ui.note(
      `Imported ${Object.keys(extracted).length} server(s) from ${scannedAgents.length} agent(s)`,
    )
    for (const w of allWarnings) {
      ui.warn(w)
    }
  },
})
