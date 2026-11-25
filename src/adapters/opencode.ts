/**
 * OpenCode adapter.
 *
 * Project: `opencode.json`. Global: `~/.config/opencode/opencode.json`.
 * Root key: `mcp`. Format: JSONC. Env syntax: `{env:VAR}` (brace-env),
 * native `:-default` NOT supported. Native `enabled` flag supported.
 * Merges `command` + `args` into one array; renames `env` to `environment`.
 *
 * Implements MATRIX.md §1, §2, §3, §7.4.
 */

import { posix, win32 } from 'node:path'
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

export const id: AgentId = 'opencode'
export const displayName = 'OpenCode'

export const capabilities: AdapterCapabilities = {
  scopes: ['project', 'global'],
  format: 'jsonc',
  envSyntax: 'brace-env' as const,
  nativeDefault: false,
  nativeDisabled: true,
  cwd: false,
  layout: 'single-file' as const,
  rootKey: 'mcp',
}

function pjoin(ctx: RuntimeContext, ...paths: string[]): string {
  return ctx.platform === 'win32' ? win32.join(...paths) : posix.join(...paths)
}

export function getConfigPath(
  scope: ConfigScope,
  ctx: RuntimeContext,
): string | null {
  if (scope === 'project') {
    return pjoin(ctx, ctx.cwd, 'opencode.json')
  }
  let base: string
  if (ctx.platform === 'win32') {
    base = pjoin(
      ctx,
      ctx.env.APPDATA || pjoin(ctx, ctx.homeDir, 'AppData', 'Roaming'),
    )
  } else if (ctx.platform === 'darwin') {
    // macOS uses ~/.config directly (does not honor XDG_CONFIG_HOME).
    base = pjoin(ctx, ctx.homeDir, '.config')
  } else {
    // linux
    base = pjoin(
      ctx,
      ctx.env.XDG_CONFIG_HOME || pjoin(ctx, ctx.homeDir, '.config'),
    )
  }
  return pjoin(ctx, base, 'opencode', 'opencode.json')
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
  const result = translate(value, 'brace-env', { nativeDefault: false })
  return {
    value: result.value,
    warnings: result.warnings.map((w): Warning => ({
      code: w.code,
      agent: 'opencode',
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
        agent: 'opencode',
        field: 'cwd',
        message: 'cwd cannot be represented natively for opencode',
      })
    }
    const commandArray: unknown[] = []
    const { value: translatedCmd, warnings: cmdWarnings } = translateField(
      server.command,
      'command',
    )
    commandArray.push(translatedCmd)
    warnings.push(...cmdWarnings)
    if (server.args && server.args.length > 0) {
      for (const arg of server.args) {
        const { value: translated, warnings: fieldWarnings } = translateField(
          arg,
          'args',
        )
        commandArray.push(translated)
        warnings.push(...fieldWarnings)
      }
    }
    const entry: Record<string, unknown> = {
      type: 'local',
      command: commandArray,
    }
    if (server.env) {
      const environment: Record<string, string> = {}
      for (const [key, value] of Object.entries(server.env)) {
        const { value: translated, warnings: fieldWarnings } = translateField(
          value,
          key,
        )
        environment[key] = translated
        warnings.push(...fieldWarnings)
      }
      entry.environment = environment
    }
    return { entry, warnings }
  }

  const { value: translatedUrl, warnings: urlWarnings } = translateField(
    server.url,
    'url',
  )
  warnings.push(...urlWarnings)
  const entry: Record<string, unknown> = {
    type: 'remote',
    url: translatedUrl,
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

  const mcp = parsed.mcp
  if (!mcp || typeof mcp !== 'object' || Array.isArray(mcp)) {
    return { servers: {}, warnings }
  }

  for (const [name, rawEntry] of Object.entries(
    mcp as Record<string, unknown>,
  )) {
    const entry = rawEntry as Record<string, unknown> | null
    if (!entry || typeof entry !== 'object') {
      continue
    }

    const type = entry.type
    const command = entry.command
    const url = entry.url
    const serverUrl = entry.serverUrl

    const hasCommand = Array.isArray(command) && command.length > 0
    const hasUrl = typeof url === 'string' && url.length > 0
    const hasServerUrl = typeof serverUrl === 'string' && serverUrl.length > 0
    const isLocal = type === 'local' || hasCommand
    const isRemote = type === 'remote' || hasUrl || hasServerUrl

    if (isLocal && isRemote) {
      warnings.push({
        code: 'AMBIGUOUS_ENTRY',
        agent: 'opencode',
        server: name,
        message: `Both command and url present for \`${name}\`; url wins`,
      })
    }

    if (isRemote) {
      const resolvedUrl = hasUrl ? (url as string) : (serverUrl as string)
      // OpenCode nativo não distingue streamable-http de sse: emite
      // 'streamable-http' para entradas remotas.
      const server: CanonicalServer = {
        type: 'streamable-http',
        url: resolvedUrl,
      }
      // URL/serverUrl-only (ou non-explicit remote) → inferred transport.
      if ((hasUrl || hasServerUrl) && type !== 'remote') {
        warnings.push({
          code: 'TRANSPORT_INFERRED',
          agent: 'opencode',
          server: name,
          message: `Transport inferred as streamable-http for \`${name}\``,
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

    if (isLocal) {
      const cmdArray = command as unknown[]
      const serverCommand =
        typeof cmdArray[0] === 'string' ? (cmdArray[0] as string) : ''
      const server: CanonicalServer = {
        type: 'stdio',
        command: serverCommand,
        args: [],
      }
      if (cmdArray.length > 1) {
        server.args = cmdArray
          .slice(1)
          .filter((a): a is string => typeof a === 'string')
      }
      if (
        entry.environment &&
        typeof entry.environment === 'object' &&
        !Array.isArray(entry.environment)
      ) {
        server.env = {}
        for (const [k, v] of Object.entries(
          entry.environment as Record<string, unknown>,
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
      agent: 'opencode',
      server: name,
      field: 'type',
      message: `No local/remote entry for \`${name}\`; entry dropped`,
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

  const { content } = applyServerEntries(existingRawContent, 'mcp', entries, {
    managed,
    previous: ctx.previousManagedNames,
    format: capabilities.format,
  })

  return { content, managedNames: managed, warnings }
}
