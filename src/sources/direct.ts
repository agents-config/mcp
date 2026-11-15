/**
 * Direct source resolver (§10.2).
 *
 * Parses CLI flags (--command, --arg, --http, --env, --header, --cwd, --name)
 * into a `ResolvedServerPackage`.
 */

import parseArgv from 'string-argv'
import type { ResolvedServerPackage, RequiredEnvVar } from '$/src/sources/types'
import { SERVER_NAME_PATTERN } from '$/src/config'
import type { CanonicalServer, StdioServer } from '$/src/core/schema'
import { collectRequiredVars } from '$/src/core/placeholder'
import { isSecretValue } from '$/src/core/env'
import { isStdioServer, isHttpServer } from '$/src/core/schema'

export interface DirectOptions {
  command?: string
  arg?: string[]
  http?: string
  sse?: string
  env?: string[]
  header?: string[]
  cwd?: string
  name?: string
}

export function resolveDirect(options: DirectOptions): ResolvedServerPackage {
  let command: string | undefined
  let args: string[] = []

  if (options.command) {
    if (options.arg && options.arg.length > 0) {
      command = options.command
      args = [...options.arg]
    } else {
      const tokens = parseArgv(options.command)
      if (tokens.length === 0) {
        throw new Error('--command requires a non-empty command')
      }
      command = tokens[0]
      args = tokens.slice(1)
    }
  }

  let type: 'stdio' | 'streamable-http' | 'sse' = 'stdio'
  let url: string | undefined
  const headers: Record<string, string> = {}
  const env: Record<string, string> = {}

  if (options.sse) {
    type = 'sse'
    url = options.sse
  } else if (options.http) {
    type = 'streamable-http'
    url = options.http
  }

  if (options.env) {
    for (const item of options.env) {
      const sep = item.indexOf('=')
      if (sep === -1) {
        // Reference only: KEY (warn if unresolved — handled by caller)
        env[item] = `\${${item}}`
      } else {
        env[item.slice(0, sep)] = item.slice(sep + 1)
      }
    }
  }

  if (options.header) {
    for (const item of options.header) {
      const sep = item.indexOf(':')
      if (sep === -1) {
        throw new Error(`--header must be "Name: Value", got: ${item}`)
      }
      headers[item.slice(0, sep).trim()] = item.slice(sep + 1).trim()
    }
  }

  const definition: CanonicalServer =
    type === 'stdio'
      ? {
          type: 'stdio',
          command: command as string,
          args: args.length > 0 ? args : [],
          env: Object.keys(env).length > 0 ? env : undefined,
        }
      : {
          type,
          url: url as string,
          headers: Object.keys(headers).length > 0 ? headers : undefined,
        }

  if (options.cwd && type === 'stdio') {
    ;(definition as StdioServer).cwd = options.cwd
  }

  const suggestedName = options.name ?? suggestName(definition)

  return {
    suggestedName,
    definition,
    requiredEnv: collectRequiredVars(definition),
    source: { type: 'direct', ref: suggestedName },
  }
}

function suggestName(def: CanonicalServer): string {
  if (isHttpServer(def) && def.url) {
    try {
      const u = new URL(def.url)
      const base = u.hostname.replace(/[^a-z0-9]/g, '-')
      const first = u.pathname.split('/').filter(Boolean)[0] ?? ''
      const name = [base, first].filter(Boolean).join('-') || base
      return sanitize(name)
    } catch {
      return sanitize(def.url)
    }
  }
  if (isStdioServer(def) && def.command) {
    return sanitize((def.command as string).split(/[ /]/)[0] ?? '')
  }
  return 'server'
}

function sanitize(name: string): string {
  const cleaned = name.toLowerCase().replace(/[^a-z0-9._-]/g, '-')
  if (!SERVER_NAME_PATTERN.test(cleaned)) {
    return 'server'
  }
  return cleaned
}
