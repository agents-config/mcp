/**
 * Visual Studio Code adapter.
 *
 * Project: `.vscode/mcp.json`. Global: OS User Profile `mcp.json`.
 * Root key: `servers`. Format: JSONC. Env syntax: `${env:VAR}` (env-colon),
 * native `:-default` NOT supported. Disabled servers omitted.
 * Preserves `inputs` array and JSONC comments (non-destructive merge).
 *
 * Implements MATRIX.md §1, §2, §3, §7.3.
 */

import { posix, win32 } from 'node:path'
import { existsSync } from 'node:fs'
import { parse } from 'jsonc-parser'
import { readTextFile } from '$/src/core/fs-atomic'
import type { RuntimeContext, ConfigScope } from '$/src/core/context'
import type { CanonicalServer } from '$/src/core/schema'
import {
  isStdioServer,
  isHttpServer,
  type StreamableHttpServer,
  type SseServer,
} from '$/src/core/schema'
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

export const id: AgentId = 'vscode'
export const displayName = 'Visual Studio Code'

export const capabilities: AdapterCapabilities = {
  scopes: ['project', 'global'],
  format: 'jsonc',
  envSyntax: 'env-colon' as const,
  nativeDefault: false,
  nativeDisabled: false,
  cwd: false,
  layout: 'single-file' as const,
  rootKey: 'servers',
}

/**
 * VS Code channel probing order per `spec/MATRIX.md` §1.1. The first channel
 * whose `<base>/<channel>/User` profile directory exists wins; falls back to
 * the stable `Code` channel when none exist.
 */
export const VSCODE_CHANNELS = ['Code', 'Code - Insiders', 'VSCodium'] as const

function pjoin(ctx: RuntimeContext, ...paths: string[]): string {
  return ctx.platform === 'win32' ? win32.join(...paths) : posix.join(...paths)
}

function vscodeGlobalBase(ctx: RuntimeContext): string {
  if (ctx.platform === 'win32') {
    return pjoin(
      ctx,
      ctx.env.APPDATA || pjoin(ctx, ctx.homeDir, 'AppData', 'Roaming'),
    )
  }
  if (ctx.platform === 'darwin') {
    return pjoin(ctx, ctx.homeDir, 'Library', 'Application Support')
  }
  // linux
  return pjoin(
    ctx,
    ctx.env.XDG_CONFIG_HOME || pjoin(ctx, ctx.homeDir, '.config'),
  )
}

export function getConfigPath(
  scope: ConfigScope,
  ctx: RuntimeContext,
): string | null {
  if (scope === 'project') {
    return pjoin(ctx, ctx.cwd, '.vscode', 'mcp.json')
  }
  const base = vscodeGlobalBase(ctx)
  let channel = 'Code'
  for (const candidate of VSCODE_CHANNELS) {
    if (existsSync(pjoin(ctx, base, candidate, 'User'))) {
      channel = candidate
      break
    }
  }
  return pjoin(ctx, base, channel, 'User', 'mcp.json')
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
  const result = translate(value, 'env-colon', { nativeDefault: false })
  return {
    value: result.value,
    warnings: result.warnings.map((w): Warning => ({
      code: w.code,
      agent: 'vscode',
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
        agent: 'vscode',
        field: 'cwd',
        message: 'cwd cannot be represented natively for vscode',
      })
    }
    const entry: Record<string, unknown> = {
      type: 'stdio',
      command: server.command,
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

  // streamable-http → 'http', sse → 'sse' (vscode preserva ambos nativamente)
  const nativeType = server.type === 'sse' ? 'sse' : 'http'
  const { value: translatedUrl, warnings: urlWarnings } = translateField(
    server.url,
    'url',
  )
  warnings.push(...urlWarnings)
  const entry: Record<string, unknown> = {
    type: nativeType,
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

  const servers = parsed.servers
  if (!servers || typeof servers !== 'object' || Array.isArray(servers)) {
    return { servers: {}, warnings }
  }

  for (const [name, rawEntry] of Object.entries(
    servers as Record<string, unknown>,
  )) {
    const entry = rawEntry as Record<string, unknown> | null
    if (!entry || typeof entry !== 'object') {
      continue
    }

    const type = entry.type
    const command = entry.command
    const url = entry.url

    const hasCommand = typeof command === 'string' && command.length > 0
    const hasUrl = typeof url === 'string' && url.length > 0
    const isHttp =
      type === 'http' || type === 'streamable-http' || type === 'sse' || hasUrl
    const isStdio = type === 'stdio' || (hasCommand && !hasUrl)

    if (isHttp && isStdio) {
      warnings.push({
        code: 'AMBIGUOUS_ENTRY',
        agent: 'vscode',
        server: name,
        message: `Both command and url present for \`${name}\`; url wins`,
      })
    }

    if (isHttp) {
      const resolvedUrl = url as string
      // Determina o tipo canônico: 'sse' preservado do nativo, caso contrário
      // 'streamable-http' (incluindo o legado 'http' e a inferência por URL).
      let canonicalType: 'streamable-http' | 'sse' = 'streamable-http'
      let inferred = false
      if (type === 'sse') {
        canonicalType = 'sse'
      } else if (type === 'streamable-http') {
        canonicalType = 'streamable-http'
      } else if (type === 'http') {
        canonicalType = 'streamable-http'
      } else if (hasUrl) {
        inferred = true
        canonicalType = 'streamable-http'
      }
      const server: StreamableHttpServer | SseServer = {
        type: canonicalType,
        url: resolvedUrl,
      }
      // URL-only (ou tipo não explícito) → transporte inferido.
      if (inferred) {
        warnings.push({
          code: 'TRANSPORT_INFERRED',
          agent: 'vscode',
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

    if (isStdio) {
      const server: CanonicalServer = {
        type: 'stdio',
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
      agent: 'vscode',
      server: name,
      field: 'type',
      message: `No command/http entry for \`${name}\`; entry dropped`,
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
    'servers',
    entries,
    {
      managed,
      previous: ctx.previousManagedNames,
      format: capabilities.format,
    },
  )

  return { content, managedNames: managed, warnings }
}
