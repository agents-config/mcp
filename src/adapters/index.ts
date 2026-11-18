/**
 * Adapter registry (§9.5): all six adapters in `AGENT_ORDER`, plus lookup,
 * detection, and target resolution.
 *
 * `resolveTargets` implements the precedence: `--agents` flag → persisted
 * `state.targets` → auto-detection. Unknown ids are a usage error.
 */

import { z } from 'zod'
import type { AgentIdSchema } from '$/src/core/schema'
import { AGENT_ORDER } from '$/src/config'
import type { RuntimeContext, ConfigScope } from '$/src/core/context'
import type { SyncState } from '$/src/core/state'
import type {
  AgentAdapter,
  AdapterCapabilities,
  AdapterContext,
  CompileResult,
  ExtractResult,
  Warning,
  WarningCode,
  EnvSyntax,
} from '$/src/adapters/types'
import { makeWarning } from '$/src/adapters/types'
import * as claudeCode from '$/src/adapters/claude-code'
import * as cursor from '$/src/adapters/cursor'
import * as vscode from '$/src/adapters/vscode'
import * as opencode from '$/src/adapters/opencode'
import * as zed from '$/src/adapters/zed'
import * as windsurf from '$/src/adapters/windsurf'
import * as antigravity from '$/src/adapters/antigravity'

export type AgentId = z.infer<typeof AgentIdSchema>

/** Re-export the adapter contract types and warning factory. */
export type {
  AgentAdapter,
  AdapterCapabilities,
  AdapterContext,
  CompileResult,
  ExtractResult,
  Warning,
  WarningCode,
  EnvSyntax,
}
export { makeWarning }

function buildAdapter(
  id: AgentId,
  displayName: string,
  capabilities: AdapterCapabilities,
  getConfigPath: (scope: ConfigScope, ctx: RuntimeContext) => string | null,
  detect: (scope: ConfigScope, ctx: RuntimeContext) => Promise<boolean>,
  compile: AgentAdapter['compile'],
  extractServers: AgentAdapter['extractServers'],
  applyServers: AgentAdapter['applyServers'],
): AgentAdapter {
  return {
    id,
    displayName,
    capabilities,
    getConfigPath,
    detect,
    compile,
    extractServers,
    applyServers,
  }
}

/**
 * Validate `--agents` flag values against known agent ids. Throws a usage
 * error for unknown ids. Shared by `resolveTargets` and `resolveTargetsAsync`.
 */
export function validateAgentFlag(flag: readonly string[]): AgentId[] {
  const valid = new Set(AGENT_ORDER)
  const unknown = flag.filter((id) => !valid.has(id as AgentId))
  if (unknown.length > 0) {
    throw new Error(
      `Unknown agent id(s) in --agents: ${unknown.join(', ')}. Valid: ${AGENT_ORDER.join(', ')}`,
    )
  }
  return flag as AgentId[]
}

/** All six adapters, in deterministic `AGENT_ORDER`. */
export const adapters: readonly AgentAdapter[] = [
  buildAdapter(
    claudeCode.id,
    claudeCode.displayName,
    claudeCode.capabilities,
    claudeCode.getConfigPath,
    claudeCode.detect,
    claudeCode.compile,
    claudeCode.extractServers,
    claudeCode.applyServers,
  ),
  buildAdapter(
    cursor.id,
    cursor.displayName,
    cursor.capabilities,
    cursor.getConfigPath,
    cursor.detect,
    cursor.compile,
    cursor.extractServers,
    cursor.applyServers,
  ),
  buildAdapter(
    vscode.id,
    vscode.displayName,
    vscode.capabilities,
    vscode.getConfigPath,
    vscode.detect,
    vscode.compile,
    vscode.extractServers,
    vscode.applyServers,
  ),
  buildAdapter(
    opencode.id,
    opencode.displayName,
    opencode.capabilities,
    opencode.getConfigPath,
    opencode.detect,
    opencode.compile,
    opencode.extractServers,
    opencode.applyServers,
  ),
  buildAdapter(
    zed.id,
    zed.displayName,
    zed.capabilities,
    zed.getConfigPath,
    zed.detect,
    zed.compile,
    zed.extractServers,
    zed.applyServers,
  ),
  buildAdapter(
    windsurf.id,
    windsurf.displayName,
    windsurf.capabilities,
    windsurf.getConfigPath,
    windsurf.detect,
    windsurf.compile,
    windsurf.extractServers,
    windsurf.applyServers,
  ),
  buildAdapter(
    antigravity.id,
    antigravity.displayName,
    antigravity.capabilities,
    antigravity.getConfigPath,
    antigravity.detect,
    antigravity.compile,
    antigravity.extractServers,
    antigravity.applyServers,
  ),
] as const

/** Map of agent id → adapter, in `AGENT_ORDER`. */
export const adapterMap: ReadonlyMap<AgentId, AgentAdapter> = new Map(
  adapters.map((a) => [a.id, a]),
)

/** Lookup an adapter by id. Throws a usage error for unknown ids. */
export function getAdapter(id: string): AgentAdapter {
  const adapter = adapterMap.get(id as AgentId)
  if (!adapter) {
    const valid = Array.from(adapterMap.keys()).join(', ')
    throw new Error(
      `Unknown agent id \`${id}\`. Valid agent ids: ${valid}. Pass --agents to select.`,
    )
  }
  return adapter
}

export function getAdapters(ids?: readonly string[]): AgentAdapter[] {
  if (!ids || ids.length === 0) {
    return [...adapters]
  }
  return ids.map((id) => getAdapter(id))
}

/**
 * Detect which agents are configured for `scope`. For project scope, an agent
 * counts as detected when its config path exists or its containing directory
 * exists; for global scope, when its config path exists.
 */
export async function detectAgents(
  scope: ConfigScope,
  ctx: RuntimeContext,
): Promise<AgentId[]> {
  const detected: AgentId[] = []
  const { existsSync, statSync } = await import('node:fs')
  const { dirname } = await import('node:path')

  for (const adapter of adapters) {
    const path = adapter.getConfigPath(scope, ctx)
    if (path === null) {
      continue
    }
    let found = false
    try {
      found = await adapter.detect(scope, ctx)
    } catch {
      found = false
    }
    if (!found && scope === 'project') {
      // Only fall back to directory-existence when the config's parent dir is
      // not cwd itself (otherwise every project "has" claude-code/opencode).
      const parent = dirname(path)
      if (parent !== ctx.cwd) {
        try {
          found = statSync(parent).isDirectory()
        } catch {
          found = false
        }
      }
    }
    if (found) {
      detected.push(adapter.id)
    }
  }

  return detected
}

/**
 * Resolve the target agents with precedence: `--agents` flag → persisted
 * `state.targets` → auto-detection. Unknown ids are a usage error.
 * Returns an empty array when nothing is resolvable (caller decides whether
 * that is an error).
 */
export function resolveTargets({
  flag,
  state,
  ctx,
}: {
  flag: readonly string[] | undefined
  state: SyncState
  ctx: RuntimeContext
}): AgentId[] {
  if (flag && flag.length > 0) {
    return validateAgentFlag(flag)
  }

  if (state.targets && state.targets.length > 0) {
    return [...state.targets]
  }

  return []
}

/**
 * Async variant of resolveTargets that falls back to detection when neither
 * flag nor state targets are available.
 */
export async function resolveTargetsAsync({
  flag,
  state,
  ctx,
}: {
  flag: readonly string[] | undefined
  state: SyncState
  ctx: RuntimeContext
}): Promise<AgentId[]> {
  if (flag && flag.length > 0) {
    return validateAgentFlag(flag)
  }
  if (state.targets && state.targets.length > 0) {
    return [...state.targets]
  }
  return detectAgents(state.scope, ctx)
}
