/**
 * Zed adapter.
 *
 * Project: `.zed/settings.json`. Global: `~/.config/zed/settings.json`.
 * Root key: `context_servers`. Format: JSONC. Env syntax: `${VAR}` (posix),
 * native `:-default` NOT supported. Disabled servers omitted.
 * Nests stdio execution inside `command: { path, args, env }`.
 *
 * Implements MATRIX.md §1, §2, §3, §7.6.
 */

import { join } from 'node:path'
import { parse } from 'jsonc-parser'
import { readTextFile } from '$/src/core/fs-atomic'
import type { RuntimeContext, ConfigScope } from '$/src/core/context'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer, isHttpServer } from '$/src/core/schema'
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

export const id: AgentId = 'zed'
export const displayName = 'Zed'

export const capabilities: AdapterCapabilities = {
  scopes: ['project', 'global'],
  format: 'jsonc',
  envSyntax: 'posix' as const,
  nativeDefault: false,
  nativeDisabled: false,
  cwd: false,
}

export function getConfigPath(
  scope: ConfigScope,
  ctx: RuntimeContext,
): string | null {
  return scope === 'project'
    ? join(ctx.cwd, '.zed', 'settings.json')
    : join(ctx.homeDir, '.config', 'zed', 'settings.json')
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

function translateField(
  value: string,
  field: string,
): { value: string; warnings: Warning[] } {
  const result = translate(value, 'posix', { nativeDefault: false })
  return {
    value: result.value,
    warnings: result.warnings.map((w): Warning => ({
      code: w.code,
      agent: 'zed',
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

  if (isStdioServer(server)) {
    if (server.cwd !== undefined && server.cwd !== '') {
      warnings.push({
        code: 'CWD_UNSUPPORTED',
        agent: 'zed',
        field: 'cwd',
        message: 'cwd cannot be represented natively for zed',
      })
    }
    const commandEntry: Record<string, unknown> = { path: server.command }
    if (server.args && server.args.length > 0) {
      commandEntry.args = server.args
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
      commandEntry.env = env
    }
    const entry: Record<string, unknown> = { command: commandEntry }
    return { entry, warnings }
  }

  const { value: translatedUrl, warnings: urlWarnings } = translateField(
    server.url,
    'url',
  )
  warnings.push(...urlWarnings)
  const entry: Record<string, unknown> = { url: translatedUrl }
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

  const contextServers = parsed.context_servers
  if (
    !contextServers ||
    typeof contextServers !== 'object' ||
    Array.isArray(contextServers)
  ) {
    return { servers: {}, warnings }
  }

  for (const [name, rawEntry] of Object.entries(
    contextServers as Record<string, unknown>,
  )) {
    const entry = rawEntry as Record<string, unknown> | null
    if (!entry || typeof entry !== 'object') {
      continue
    }

    const url = entry.url
    const command = entry.command as Record<string, unknown> | undefined

    const hasUrl = typeof url === 'string' && url.length > 0
    const commandPath =
      command && typeof command.path === 'string' && command.path.length > 0
        ? (command.path as string)
        : undefined
    const hasCommand = !!commandPath

    if (hasCommand && hasUrl) {
      warnings.push({
        code: 'AMBIGUOUS_ENTRY',
        agent: 'zed',
        server: name,
        message: `Both command and url present for \`${name}\`; url wins`,
      })
    }

    if (hasUrl) {
      const resolvedUrl = url as string
      // Zed nativo não distingue streamable-http de sse: emite
      // 'streamable-http' para entradas remotas.
      const server: CanonicalServer = {
        type: 'streamable-http',
        url: resolvedUrl,
      }
      // Zed http entries have no `type` field, so they are inferred.
      warnings.push({
        code: 'TRANSPORT_INFERRED',
        agent: 'zed',
        server: name,
        message: `Transport inferred as streamable-http for \`${name}\``,
      })
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

    if (hasCommand && command) {
      const server: CanonicalServer = {
        type: 'stdio',
        command: commandPath,
        args: [],
      }
      if (command.args && Array.isArray(command.args)) {
        server.args = command.args.filter(
          (a): a is string => typeof a === 'string',
        )
      }
      if (
        command.env &&
        typeof command.env === 'object' &&
        !Array.isArray(command.env)
      ) {
        server.env = {}
        for (const [k, v] of Object.entries(
          command.env as Record<string, unknown>,
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
      agent: 'zed',
      server: name,
      field: 'command',
      message: `No command.path or url for \`${name}\`; entry dropped`,
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
    'context_servers',
    entries,
    {
      managed,
      previous: ctx.previousManagedNames,
      format: capabilities.format,
    },
  )

  return { content, managedNames: managed, warnings }
}
