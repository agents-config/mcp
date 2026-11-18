// Antigravity adapter (B3).
//
// Antigravity consumes mcp_config.json files written per-plugin under
// <scopeBase>/.agents/plugins/<name>/mcp_config.json, not a single monolithic
// agent file. Accordingly:
//   - getConfigPath returns null (no single native config path).
//   - compile produces Antigravity's entry format: stdio -> { command, args?,
//     env? }; streamable-http/sse -> { serverUrl, headers? }.
//   - applyServers is a no-op passthrough (plugin files are written by
//     syncPluginFiles in the command layer, not by per-adapter file writes).
//   - detect looks for any .agents/plugins/*/mcp_config.json.
//
// Implements the adapter contract (BLUEPRINT 9.1) + B3 spec section 2.

import { join } from 'node:path'
import { readdirSync, statSync } from 'node:fs'
import { readTextFile } from '$/src/core/fs-atomic'
import type { RuntimeContext, ConfigScope } from '$/src/core/context'
import type { CanonicalServer } from '$/src/core/schema'
import type {
  AgentId,
  AdapterCapabilities,
  AgentAdapter,
  CompileResult,
  ExtractResult,
  Warning,
  AdapterContext,
} from '$/src/adapters/types'
import { compileAntigravityMcpConfig } from '$/src/core/plugins'

export const id: AgentId = 'antigravity'
export const displayName = 'Antigravity'

export const capabilities: AdapterCapabilities = {
  scopes: ['project', 'global'],
  format: 'json',
  envSyntax: 'posix',
  nativeDefault: false,
  nativeDisabled: false,
  cwd: false,
}

export function getConfigPath(
  scope: ConfigScope,
  ctx: RuntimeContext,
): string | null {
  return null
}

export async function detect(
  scope: ConfigScope,
  ctx: RuntimeContext,
): Promise<boolean> {
  const base = scope === 'project' ? ctx.cwd : ctx.homeDir
  const pluginsDir = join(base, '.agents', 'plugins')
  let entries: string[]
  try {
    entries = readdirSync(pluginsDir)
  } catch {
    return false
  }
  for (const entry of entries) {
    const mcpConfigPath = join(pluginsDir, entry, 'mcp_config.json')
    try {
      if (statSync(mcpConfigPath).isFile()) {
        return true
      }
    } catch {
      // ignore
    }
  }
  return false
}

export function compile(server: CanonicalServer): {
  entry: unknown | null
  warnings: readonly Warning[]
} {
  const warnings: Warning[] = []
  const config = compileAntigravityMcpConfig('server', server)
  const entry = (config.mcpServers as Record<string, unknown>)['server']
  return { entry: entry ?? null, warnings }
}

export function extractServers(
  rawContent: string,
  scope: ConfigScope,
): ExtractResult {
  const warnings: Warning[] = []
  const resultServers: Record<string, CanonicalServer> = {}

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(rawContent) as Record<string, unknown>
  } catch {
    return { servers: {}, warnings }
  }

  const mcpServers = parsed.mcpServers
  if (
    !mcpServers ||
    typeof mcpServers !== 'object' ||
    Array.isArray(mcpServers)
  ) {
    return { servers: {}, warnings }
  }

  for (const [name, rawEntry] of Object.entries(
    mcpServers as Record<string, unknown>,
  )) {
    const entry = rawEntry as Record<string, unknown> | null
    if (!entry || typeof entry !== 'object') {
      continue
    }

    const command = entry.command
    const serverUrl = entry.serverUrl

    const hasCommand = typeof command === 'string' && command.length > 0
    const hasServerUrl = typeof serverUrl === 'string' && serverUrl.length > 0

    if (hasCommand) {
      const server: CanonicalServer = {
        type: 'stdio',
        command,
        args: [],
      }
      if (entry.args && Array.isArray(entry.args)) {
        server.args = entry.args.filter(
          (a): a is string => typeof a === 'string',
        )
      }
      if (
        entry.env &&
        typeof entry.env === 'object' &&
        !Array.isArray(entry.env)
      ) {
        server.env = {}
        for (const [k, v] of Object.entries(
          entry.env as Record<string, unknown>,
        )) {
          if (typeof v === 'string') {
            server.env[k] = v
          }
        }
      }
      resultServers[name] = server
      continue
    }

    if (hasServerUrl) {
      const server: CanonicalServer = {
        type: 'streamable-http',
        url: serverUrl,
      }
      if (
        entry.headers &&
        typeof entry.headers === 'object' &&
        !Array.isArray(entry.headers)
      ) {
        server.headers = {}
        for (const [k, v] of Object.entries(
          entry.headers as Record<string, unknown>,
        )) {
          if (typeof v === 'string') {
            server.headers[k] = v
          }
        }
      }
      resultServers[name] = server
      continue
    }

    warnings.push({
      code: 'UNKNOWN_FIELD_DROPPED',
      agent: 'antigravity',
      server: name,
      message: 'No command or serverUrl for `' + name + '`; entry dropped',
    })
  }

  return { servers: resultServers, warnings }
}

export function applyServers(
  existingRawContent: string | null,
  servers: Record<string, CanonicalServer>,
  ctx: AdapterContext,
): CompileResult {
  const managed = Object.keys(servers)
  return {
    content: existingRawContent ?? '',
    managedNames: managed,
    warnings: [],
  }
}
