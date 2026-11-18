/**
 * Adapter contract for compiling and extracting MCP server configurations
 * to/from each agent's native file.
 *
 * Implements BLUEPRINT §9.1. All adapters are pure with respect to the
 * filesystem: they never print or write files; file I/O stays in the command
 * layer. Warnings and managed names are carried in the result.
 */

import { z } from 'zod'
import type { RuntimeContext, ConfigScope } from '$/src/core/context'
import type { CanonicalServer, AgentIdSchema } from '$/src/core/schema'

export type AgentId = z.infer<typeof AgentIdSchema>

export type EnvSyntax = 'posix' | 'env-colon' | 'brace-env'

export type WarningCode =
  | 'DEFAULT_DROPPED'
  | 'CWD_UNSUPPORTED'
  | 'TARGETS_NOT_NATIVE'
  | 'SCOPE_UNSUPPORTED'
  | 'TRANSPORT_INFERRED'
  | 'UNKNOWN_FIELD_DROPPED'
  | 'AMBIGUOUS_ENTRY'
  | 'UNKNOWN_PLACEHOLDER'
  | 'DISABLE_UNSUPPORTED'
  | 'MANUAL_ENTRY_PRESERVED'

export interface Warning {
  code: WarningCode
  agent: AgentId
  server?: string
  field?: string
  message: string
}

export interface AdapterCapabilities {
  readonly scopes: readonly ConfigScope[]
  readonly format: 'json' | 'jsonc'
  readonly envSyntax: EnvSyntax
  readonly nativeDefault: boolean
  readonly nativeDisabled: boolean
  readonly cwd: boolean
}

export interface AdapterContext extends RuntimeContext {
  readonly scope: ConfigScope
  readonly previousManagedNames: ReadonlySet<string>
}

export interface CompileResult {
  readonly content: string
  readonly managedNames: readonly string[]
  readonly warnings: readonly Warning[]
}

export interface ExtractResult {
  readonly servers: Record<string, CanonicalServer>
  readonly warnings: readonly Warning[]
}

export interface AgentAdapter {
  readonly id: AgentId
  readonly displayName: string
  readonly capabilities: AdapterCapabilities

  getConfigPath(scope: ConfigScope, ctx: RuntimeContext): string | null
  detect(scope: ConfigScope, ctx: RuntimeContext): Promise<boolean>

  /** Pure: canonical server -> native object (null when not applicable). */
  compile(server: CanonicalServer): {
    entry: unknown | null
    warnings: readonly Warning[]
  }

  extractServers(rawContent: string, scope: ConfigScope): ExtractResult
  applyServers(
    existingRawContent: string | null,
    servers: Record<string, CanonicalServer>,
    ctx: AdapterContext,
  ): CompileResult
}

export function makeWarning(
  agent: AgentId,
  code: WarningCode,
  message: string,
  meta?: { server?: string; field?: string },
): Warning {
  return {
    code,
    agent,
    message,
    ...(meta?.server !== undefined ? { server: meta.server } : {}),
    ...(meta?.field !== undefined ? { field: meta.field } : {}),
  }
}
