/**
 * Windsurf adapter (global-only).
 *
 * Global: `~/.codeium/windsurf/mcp_config.json`.
 * Root key: `mcpServers`. Format: JSON. Env syntax: `${env:VAR}` (env-colon),
 * native `:-default` NOT supported. Disabled servers omitted.
 * Uses `serverUrl` for remote endpoints. Project scope is unsupported.
 *
 * Implements MATRIX.md §1, §2, §3, §7.5.
 */

import { join } from 'node:path'
import { parse } from 'jsonc-parser'
import { readTextFile } from '$/src/core/fs-atomic'
import type { RuntimeContext, ConfigScope } from '$/src/core/context'
import type { CanonicalServer } from '$/src/core/schema'
import { translate } from '$/src/core/placeholder'
import type {
  AgentId,
  AdapterCapabilities,
  AgentAdapter,
  CompileResult,
  ExtractResult,
  Warning,
  AdapterContext,
} from '$/src/adapters/types'
import { applyServerEntries } from '$/src/adapters/shared'

export const id: AgentId = 'windsurf'
export const displayName = 'Windsurf'

export const capabilities: AdapterCapabilities = {
  scopes: ['global'],
  format: 'json',
  envSyntax: 'env-colon' as const,
  nativeDefault: false,
  nativeDisabled: false,
  cwd: false,
}

export function getConfigPath(
  scope: ConfigScope,
  ctx: RuntimeContext,
): string | null {
  // Windsurf is global-only (§7.5): project scope returns null.
  return scope === 'global'
    ? join(ctx.homeDir, '.codeium', 'windsurf', 'mcp_config.json')
    : null
}

export async function detect(
  scope: ConfigScope,
  ctx: RuntimeContext,
): Promise<boolean> {
  const path = getConfigPath(scope, ctx)
  if (path === null) {
    return false
  }
  return readTextFile(path) !== null
}

function isStdioServer(
  server: CanonicalServer,
): server is Extract<CanonicalServer, { transport: 'stdio' }> {
  return server.transport === 'stdio'
}

function translateField(
  value: string,
  field: string,
): { value: string; warnings: Warning[] } {
  const result = translate(value, 'env-colon', { nativeDefault: false })
  return {
    value: result.value,
    warnings: result.warnings.map((w): Warning => ({
      code: w.code,
      agent: 'windsurf',
      field,
      message: w.message,
    })),
  }
}

export function compile(server: CanonicalServer): {
  entry: unknown | null
  warnings: readonly Warning[]
} {
  const warnings: Warning[] = []

  if (server.disabled) {
    return { entry: null, warnings }
  }

  if (isStdioServer(server)) {
    if (server.cwd !== undefined && server.cwd !== '') {
      warnings.push({
        code: 'CWD_UNSUPPORTED',
        agent: 'windsurf',
        field: 'cwd',
        message: 'cwd cannot be represented natively for windsurf',
      })
    }
    const entry: Record<string, unknown> = {
      command: server.command,
      enabled: !server.disabled,
    }
    if (server.args && server.args.length > 0) {
      const translatedArgs: string[] = []
      for (const arg of server.args) {
        const { value: translated, warnings: fieldWarnings } = translateField(
          arg,
          'args',
        )
        translatedArgs.push(translated)
        warnings.push(...fieldWarnings)
      }
      entry.args = translatedArgs
    }
    if (server.env) {
      const env: Record<string, string> = {}
      for (const [key, value] of Object.entries(server.env)) {
        const { value: translated, warnings: fieldWarnings } = translateField(
          value,
          key,
        )
        env[key] = translated
        warnings.push(...fieldWarnings)
      }
      entry.env = env
    }
    return { entry, warnings }
  }

  const { value: translatedUrl, warnings: urlWarnings } = translateField(
    server.url,
    'url',
  )
  warnings.push(...urlWarnings)
  const entry: Record<string, unknown> = {
    serverUrl: translatedUrl,
    enabled: !server.disabled,
  }
  if (server.headers) {
    const headers: Record<string, string> = {}
    for (const [key, value] of Object.entries(server.headers)) {
      const { value: translated, warnings: fieldWarnings } = translateField(
        value,
        key,
      )
      headers[key] = translated
      warnings.push(...fieldWarnings)
    }
    entry.headers = headers
  }
  return { entry, warnings }
}

export function extractServers(
  rawContent: string,
  scope: ConfigScope,
): ExtractResult {
  const warnings: Warning[] = []
  const resultServers: Record<string, CanonicalServer> = {}

  let parsed: Record<string, unknown>
  try {
    const errors: Array<{ error: number; offset: number; length: number }> = []
    parsed = parse(rawContent, errors) as Record<string, unknown>
    if (errors.length > 0) {
      return { servers: {}, warnings }
    }
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
    const url = entry.url
    const serverUrl = entry.serverUrl

    const hasCommand = typeof command === 'string' && command.length > 0
    const hasUrl = typeof url === 'string' && url.length > 0
    const hasServerUrl = typeof serverUrl === 'string' && serverUrl.length > 0
    const isHttp = hasUrl || hasServerUrl
    const isStdio = hasCommand && !isHttp

    if (isHttp && isStdio) {
      warnings.push({
        code: 'AMBIGUOUS_ENTRY',
        agent: 'windsurf',
        server: name,
        message: `Both command and url present for \`${name}\`; url wins`,
      })
    }

    if (isHttp) {
      const resolvedUrl = hasUrl ? (url as string) : (serverUrl as string)
      const server: CanonicalServer = { transport: 'http', url: resolvedUrl }
      if ((hasUrl || hasServerUrl) && !hasCommand) {
        // Windsurf http entries have no `type` field → inferred.
        warnings.push({
          code: 'TRANSPORT_INFERRED',
          agent: 'windsurf',
          server: name,
          message: `Transport inferred as http for \`${name}\``,
        })
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

    if (isStdio) {
      const server: CanonicalServer = {
        transport: 'stdio',
        command: command as string,
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

    warnings.push({
      code: 'UNKNOWN_FIELD_DROPPED',
      agent: 'windsurf',
      server: name,
      field: 'command',
      message: `No command or serverUrl/url for \`${name}\`; entry dropped`,
    })
  }

  return { servers: resultServers, warnings }
}

export function applyServers(
  existingRawContent: string | null,
  servers: Record<string, CanonicalServer>,
  ctx: AdapterContext,
): CompileResult {
  const warnings: Warning[] = []

  // Windsurf is global-only: in project scope, skip all servers.
  if (ctx.scope === 'project') {
    warnings.push({
      code: 'SCOPE_UNSUPPORTED',
      agent: 'windsurf',
      message:
        'windsurf supports global scope only; project-scope compilation skipped',
    })
    return { content: existingRawContent ?? '', managedNames: [], warnings }
  }

  const entries: Record<string, unknown> = {}
  const managed: string[] = []
  for (const [name, server] of Object.entries(servers)) {
    const { entry, warnings: fieldWarnings } = compile(server)
    if (entry !== null) {
      entries[name] = entry
      managed.push(name)
      warnings.push(...fieldWarnings)
    }
  }

  const { content } = applyServerEntries(
    existingRawContent,
    'mcpServers',
    entries,
    {
      managed,
      previous: ctx.previousManagedNames,
      format: capabilities.format,
    },
  )

  return { content, managedNames: managed, warnings }
}
