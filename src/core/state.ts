import { z } from 'zod'
import { AgentIdSchema } from '$/src/core/schema'
import { AGENTS_DIR, STATE_FILE, STATE_VERSION } from '$/src/config'
import { readTextFile, writeFileAtomic } from '$/src/core/fs-atomic'
import type { RuntimeContext } from '$/src/core/context'

export type AgentId = z.infer<typeof AgentIdSchema>

export interface SyncStateAgent {
  path: string
  names: string[]
  updatedAt: string // ISO-8601
}

export interface SyncState {
  version: 1
  scope: 'project' | 'global'
  targets: AgentId[]
  agents: Partial<Record<AgentId, SyncStateAgent>>
}

export interface EmptySyncState {
  version: 1
  scope: 'project' | 'global'
  targets: []
  agents: {}
}

export const EMPTY_STATE: EmptySyncState = {
  version: STATE_VERSION,
  scope: 'project',
  targets: [],
  agents: {},
}

export interface LoadStateResult {
  state: SyncState
  warnings: string[]
}

export function getStatePath(
  scope: 'project' | 'global',
  ctx: RuntimeContext,
): string {
  const base = scope === 'project' ? ctx.cwd : ctx.homeDir
  return `${base}/${AGENTS_DIR}/${STATE_FILE}`
}

/**
 * Load the sync state. Missing file → empty state, no warning.
 * Corrupt / unknown-version file → warn, treat as empty.
 */
export function loadState(
  scope: 'project' | 'global',
  ctx: RuntimeContext,
): LoadStateResult {
  const path = getStatePath(scope, ctx)
  const raw = readTextFile(path)
  if (raw === null) {
    return { state: emptyState(scope), warnings: [] }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {
      state: emptyState(scope),
      warnings: [`Corrupt sync state at ${path}; treating as empty`],
    }
  }

  if (!isValidState(parsed)) {
    return {
      state: emptyState(scope),
      warnings: [`Unknown sync state version at ${path}; treating as empty`],
    }
  }

  return { state: parsed as SyncState, warnings: [] }
}

function emptyState(scope: 'project' | 'global'): SyncState {
  return {
    version: STATE_VERSION,
    scope,
    targets: [],
    agents: {},
  }
}

function isValidState(value: unknown): value is SyncState {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const obj = value as Record<string, unknown>
  if (obj.version !== STATE_VERSION) {
    return false
  }
  if (obj.scope !== 'project' && obj.scope !== 'global') {
    return false
  }
  if (!Array.isArray(obj.targets)) {
    return false
  }
  if (obj.agents && typeof obj.agents !== 'object') {
    return false
  }
  return true
}

/**
 * Write the sync state atomically.
 */
export function writeState(
  scope: 'project' | 'global',
  ctx: RuntimeContext,
  state: SyncState,
): void {
  const path = getStatePath(scope, ctx)
  const next = { ...state, updatedAt: new Date().toISOString() }
  writeFileAtomic(path, JSON.stringify(next, null, 2) + '\n')
}

/**
 * Merge `names` into the per-agent record for `agentId`, creating the record if
 * needed. Used by `import` to seed managed names (even with `--no-sync`).
 */
export function seedAgentNames(
  state: SyncState,
  agentId: AgentId,
  names: string[],
  configPath: string,
): SyncState {
  const existing = state.agents[agentId]
  const merged = existing
    ? { ...existing, names: [...new Set([...existing.names, ...names])] }
    : { path: configPath, names, updatedAt: new Date().toISOString() }
  return {
    ...state,
    agents: { ...state.agents, [agentId]: merged },
  }
}

/**
 * Prune names no longer present in `currentNames` for `agentId`. Used by
 * `remove` and `sync` to keep state consistent without touching manual entries.
 */
export function pruneAgentNames(
  state: SyncState,
  agentId: AgentId,
  currentNames: string[],
): SyncState {
  const existing = state.agents[agentId]
  if (!existing) {
    return state
  }
  const kept = existing.names.filter((name) => currentNames.includes(name))
  return {
    ...state,
    agents: {
      ...state.agents,
      [agentId]: {
        ...existing,
        names: kept,
        updatedAt: new Date().toISOString(),
      },
    },
  }
}
